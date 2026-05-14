# Pivot 6 — Knowledge Base Auto-Refresh

## Status Audit: Feature 01 "Connect your knowledge base"

### What's fully shipped
- URL crawl → clean-text extraction (cheerio) → text-embedding-3-small embed → stored in `knowledge_base_articles`
- File upload (`.txt / .md / .csv`, 5 MB) → embed → store
- Manual article write → embed → store
- Hybrid BM25 + vector search with Reciprocal Rank Fusion — `knowledge.ts`
- Page-level scoping via `pageUrlPattern` (substring match at search time)
- Agent injects top-3 KB results as `kbSection` in the system prompt on every turn — `agent.ts:524-526`
- Dashboard UI: URL / File / Manual tabs, sync-status badges, page scope, preview, edit, delete — `knowledge/page.tsx`
- Per-article manual "Sync" button → `POST /api/v1/kb/:id/sync` re-crawls a URL source

### The gap
**Auto-refresh when your docs change** — the product copy makes this a first-class promise. What ships is operator-triggered only. If a help center article changes, nothing happens until someone clicks Sync. This is fine for launch but creates silent staleness for URL sources.

---

## Pivot 6 Plan: Scheduled Auto-Refresh for URL Sources

### Goal
Background job that periodically re-crawls all `sourceType = 'url'` articles whose content is stale, without operator action.

### Scope
Backend only — no schema migration required in Phase A. Phase B adds a per-article config.

---

## Phase A — Server-side cron (no UI, no migration)

**Files touched:** `apps/backend/src/index.ts`, new `apps/backend/src/jobs/kbRefresh.ts`

### `kbRefresh.ts`

```typescript
// Runs on server startup cron. Re-crawls URL sources older than REFRESH_INTERVAL_MS.
// Skips articles already `syncing`. Fires at most MAX_CONCURRENT at a time to avoid
// hammering external sites.

const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 h default
const MAX_CONCURRENT = 3;

export async function runKbRefresh(): Promise<void> {
  const cutoff = new Date(Date.now() - REFRESH_INTERVAL_MS);

  const stale = await prisma.knowledgeBaseArticle.findMany({
    where: {
      sourceType: 'url',
      sourceUrl: { not: null },
      syncStatus: 'idle',
      OR: [
        { syncedAt: null },
        { syncedAt: { lt: cutoff } },
      ],
    },
    select: { id: true, sourceUrl: true, organizationId: true },
    take: MAX_CONCURRENT,
    orderBy: { syncedAt: 'asc' }, // oldest first
  });

  if (stale.length === 0) return;

  await Promise.allSettled(stale.map(async (article) => {
    await prisma.knowledgeBaseArticle.update({
      where: { id: article.id },
      data: { syncStatus: 'syncing' },
    });
    try {
      const { title, text, wordCount } = await crawlUrl(article.sourceUrl!);
      const embedding = await embedText(`${title}\n\n${text}`);
      await prisma.knowledgeBaseArticle.update({
        where: { id: article.id },
        data: { title, content: text, embedding, wordCount, syncStatus: 'idle', syncedAt: new Date() },
      });
    } catch (err) {
      console.error(`[kb-refresh] failed ${article.sourceUrl}:`, err);
      await prisma.knowledgeBaseArticle.update({
        where: { id: article.id },
        data: { syncStatus: 'error' },
      }).catch(() => {});
    }
  }));
}
```

**Wire in `index.ts`** alongside the existing cron block:
```typescript
import { runKbRefresh } from './jobs/kbRefresh';

// ── KB auto-refresh cron (every 6h, staggers across MAX_CONCURRENT) ──────────
const KB_CRON_MS = 6 * 60 * 60 * 1000;
setTimeout(() => {
  runKbRefresh().catch((e) => console.error('[kb-refresh] startup run error:', e));
  setInterval(() => {
    runKbRefresh().catch((e) => console.error('[kb-refresh] cron error:', e));
  }, KB_CRON_MS);
}, 60_000); // wait 60s after server boot before first run
```

Running every 6h with a 24h staleness threshold means each article refreshes ~once per day. The 60s boot delay avoids competing with startup work.

### Acceptance criteria
- [ ] `kbRefresh.ts` job exists and is wired in `index.ts`
- [ ] Only `sourceType = 'url'` articles with `syncStatus = 'idle'` and `syncedAt < 24h ago` are targeted
- [ ] At most 3 concurrent crawls per run (no thundering herd)
- [ ] Errors set `syncStatus = 'error'`; they are skipped on next run until operator clears via Sync button
- [ ] Log line emitted per article refreshed: `[kb-refresh] refreshed <orgId>/<id> <url>`

---

## Phase B — Per-article refresh interval (follow-up, requires migration)

**Why defer:** Phase A covers the promise. Phase B is a product nicety for power users with frequently-changing docs.

### Schema addition
```prisma
refreshIntervalHours  Int?  @map("refresh_interval_hours") // null = use server default
```

### Dashboard addition
Add a "Refresh every" dropdown (Never / 6h / 12h / 24h / 7d) in the Edit modal for URL sources.

### Logic change in `kbRefresh.ts`
Replace the hard-coded `REFRESH_INTERVAL_MS` cutoff with a per-article check:
```
const intervalMs = (article.refreshIntervalHours ?? 24) * 3600 * 1000;
const stale = syncedAt < Date.now() - intervalMs;
```

---

## Out of scope for this pivot
- Webhook-triggered refresh (URL → Ahaget endpoint → re-crawl). Deferred — requires a public inbound webhook URL and per-org secrets management.
- Sitemap ingestion (crawl all pages from a sitemap.xml). High ROI but separate feature.
- Diff-aware updates (only re-embed if content changed). Optimization; adds complexity for modest gain at current scale.

---

## Execution order
1. Create `apps/backend/src/jobs/kbRefresh.ts` (new file)
2. Wire cron in `apps/backend/src/index.ts` (5-line change)
3. Test: seed a stale URL article → `runKbRefresh()` → verify content + embedding updated
4. Ship Phase B (migration + UI edit) in a follow-on PR once Phase A is stable in prod
