/**
 * kb.ts — Knowledge Base routes (JWT-protected, dashboard only)
 *
 * GET    /api/v1/kb                  — list articles (no embedding returned)
 * POST   /api/v1/kb/ingest-url       — crawl a URL → auto-embed → save
 * POST   /api/v1/kb/ingest-file      — upload plaintext/markdown file → auto-embed → save
 * POST   /api/v1/kb                  — create article manually with title+content
 * PUT    /api/v1/kb/:id              — update article (re-embeds if content changed)
 * DELETE /api/v1/kb/:id              — delete article
 * POST   /api/v1/kb/:id/sync        — re-crawl a URL source
 *
 * GET    /api/v1/kb/search           — hybrid search (used by agent; API-key auth)
 *   ?q=<query>&page=<currentPageUrl>&limit=<n>
 */

import { Router, Response, Request } from 'express';
import multer from 'multer';
import { prisma } from '../utils/prisma';
import { authenticateJWT, authenticateApiKey } from '../middleware/auth';
import { embedText, upsertEmbeddingVec, searchKnowledgeBase } from '../services/knowledge';
import { crawlUrl, validatePublicUrl } from '../services/crawl';
import { AuthenticatedRequest } from '../types';

const router = Router();

// ─── Multer — in-memory, 5 MB limit, text files only ─────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = ['text/plain', 'text/markdown', 'text/x-markdown', 'application/octet-stream'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(txt|md|mdx|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt, .md, .csv files are supported'));
    }
  },
});

// ─── Page-scope matcher ───────────────────────────────────────────────────────
// Returns true if the article's pattern matches the current page URL.
// Empty/null pattern = matches all pages.
function matchesPageScope(pattern: string | null | undefined, pageUrl: string | undefined): boolean {
  if (!pattern) return true; // no restriction
  if (!pageUrl) return true; // no page context — include everything
  return pageUrl.toLowerCase().includes(pattern.toLowerCase());
}

// ─── Public search endpoint (API-key auth — used by widget/agent) ─────────────
router.get('/search', authenticateApiKey, async (req: Request, res: Response) => {
  const orgId = (req as AuthenticatedRequest).organization?.id;
  if (!orgId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const query = (req.query.q as string)?.trim();
  const pageUrl = (req.query.page as string)?.trim();
  const limit = Math.min(parseInt(req.query.limit as string) || 3, 10);

  if (!query) { res.json({ results: [] }); return; }

  try {
    const results = await searchKnowledgeBase(orgId, query, limit, 0.25, pageUrl);
    res.json({ results });
  } catch (err) {
    console.error('[kb/search] error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// All routes below require JWT
router.use(authenticateJWT);

// ─── GET /api/v1/kb ───────────────────────────────────────────────────────────
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const articles = await prisma.knowledgeBaseArticle.findMany({
    where: { organizationId: req.user!.organizationId },
    select: {
      id: true, title: true, tags: true,
      sourceType: true, sourceUrl: true,
      pageUrlPattern: true, syncStatus: true, syncedAt: true,
      wordCount: true, createdAt: true, updatedAt: true,
      // omit content + embedding for list view
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ articles });
});

// ─── GET /api/v1/kb/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const article = await prisma.knowledgeBaseArticle.findFirst({
    where: { id: req.params.id, organizationId: req.user!.organizationId },
    select: {
      id: true, title: true, content: true, tags: true,
      sourceType: true, sourceUrl: true,
      pageUrlPattern: true, syncStatus: true, syncedAt: true,
      wordCount: true, createdAt: true, updatedAt: true,
    },
  });
  if (!article) { res.status(404).json({ error: 'Not found' }); return; }
  res.json({ article });
});

// ─── POST /api/v1/kb/ingest-url ───────────────────────────────────────────────
router.post('/ingest-url', async (req: AuthenticatedRequest, res: Response) => {
  const { url, pageUrlPattern, tags } = req.body as {
    url: string;
    pageUrlPattern?: string;
    tags?: string[];
  };

  if (!url?.trim()) { res.status(400).json({ error: 'url is required' }); return; }

  // SSRF check
  let parsed: URL;
  try {
    parsed = validatePublicUrl(url.trim());
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid URL' });
    return;
  }

  // Create a placeholder record first so the UI can show "syncing"
  const placeholder = await prisma.knowledgeBaseArticle.create({
    data: {
      organizationId: req.user!.organizationId,
      title: parsed.hostname,
      content: '',
      embedding: [],
      sourceType: 'url',
      sourceUrl: parsed.toString(),
      pageUrlPattern: pageUrlPattern?.trim() || null,
      tags: tags ?? [],
      syncStatus: 'syncing',
      wordCount: 0,
    },
    select: { id: true, title: true, syncStatus: true, createdAt: true },
  });

  res.status(202).json({ article: placeholder, message: 'Crawl started' });

  // Crawl + embed async (don't block the HTTP response)
  setImmediate(async () => {
    try {
      const { title, text, wordCount } = await crawlUrl(parsed.toString());
      const embedding = await embedText(`${title}\n\n${text}`);

      await prisma.knowledgeBaseArticle.update({
        where: { id: placeholder.id },
        data: {
          title,
          content: text,
          embedding,
          wordCount,
          syncStatus: 'idle',
          syncedAt: new Date(),
        },
      });
      upsertEmbeddingVec(placeholder.id, embedding).catch(() => {});
    } catch (err) {
      console.error(`[kb/ingest-url] crawl failed for ${parsed.toString()}:`, err);
      await prisma.knowledgeBaseArticle.update({
        where: { id: placeholder.id },
        data: { syncStatus: 'error' },
      }).catch(() => {}); // best-effort
    }
  });
});

// ─── POST /api/v1/kb/ingest-file ──────────────────────────────────────────────
router.post('/ingest-file', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }

  const text = req.file.buffer.toString('utf-8').slice(0, 40_000);
  const title = (req.body.title as string)?.trim()
    || req.file.originalname.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
    || 'Uploaded document';
  const pageUrlPattern = (req.body.pageUrlPattern as string)?.trim() || null;
  const tags: string[] = req.body.tags ? JSON.parse(req.body.tags) : [];
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  const embedding = await embedText(`${title}\n\n${text}`);

  const article = await prisma.knowledgeBaseArticle.create({
    data: {
      organizationId: req.user!.organizationId,
      title,
      content: text,
      embedding,
      sourceType: 'file',
      sourceUrl: null,
      pageUrlPattern,
      tags,
      wordCount,
      syncStatus: 'idle',
      syncedAt: new Date(),
    },
    select: {
      id: true, title: true, tags: true,
      sourceType: true, wordCount: true, createdAt: true,
      pageUrlPattern: true, syncStatus: true,
    },
  });

  upsertEmbeddingVec(article.id, embedding).catch(() => {});
  res.status(201).json({ article });
});

// ─── POST /api/v1/kb (manual) ─────────────────────────────────────────────────
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const { title, content, tags, pageUrlPattern } = req.body as {
    title: string;
    content: string;
    tags?: string[];
    pageUrlPattern?: string;
  };

  if (!title?.trim() || !content?.trim()) {
    res.status(400).json({ error: 'title and content required' });
    return;
  }

  const embedding = await embedText(`${title.trim()}\n\n${content.trim()}`);
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  const article = await prisma.knowledgeBaseArticle.create({
    data: {
      organizationId: req.user!.organizationId,
      title: title.trim(),
      content: content.trim(),
      tags: tags ?? [],
      embedding,
      sourceType: 'manual',
      pageUrlPattern: pageUrlPattern?.trim() || null,
      wordCount,
      syncStatus: 'idle',
      syncedAt: new Date(),
    },
    select: {
      id: true, title: true, tags: true,
      sourceType: true, wordCount: true, createdAt: true,
      pageUrlPattern: true, syncStatus: true,
    },
  });

  upsertEmbeddingVec(article.id, embedding).catch(() => {});
  res.status(201).json({ article });
});

// ─── PUT /api/v1/kb/:id ───────────────────────────────────────────────────────
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const { title, content, tags, pageUrlPattern } = req.body as {
    title?: string;
    content?: string;
    tags?: string[];
    pageUrlPattern?: string;
  };

  const existing = await prisma.knowledgeBaseArticle.findFirst({
    where: { id: req.params.id, organizationId: req.user!.organizationId },
  });

  if (!existing) { res.status(404).json({ error: 'Article not found' }); return; }

  const newTitle = title?.trim() ?? existing.title;
  const newContent = content?.trim() ?? existing.content;
  const contentChanged = newTitle !== existing.title || newContent !== existing.content;
  const embedding = contentChanged
    ? await embedText(`${newTitle}\n\n${newContent}`)
    : (existing.embedding as number[]);
  const wordCount = contentChanged
    ? newContent.split(/\s+/).filter(Boolean).length
    : existing.wordCount;

  const article = await prisma.knowledgeBaseArticle.update({
    where: { id: req.params.id },
    data: {
      title: newTitle,
      content: newContent,
      tags: tags ?? existing.tags,
      embedding,
      wordCount,
      pageUrlPattern: pageUrlPattern !== undefined ? (pageUrlPattern.trim() || null) : existing.pageUrlPattern,
    },
    select: {
      id: true, title: true, tags: true,
      sourceType: true, wordCount: true, updatedAt: true,
      pageUrlPattern: true, syncStatus: true,
    },
  });

  if (contentChanged) upsertEmbeddingVec(req.params.id, embedding as number[]).catch(() => {});
  res.json({ article });
});

// ─── POST /api/v1/kb/:id/sync ─────────────────────────────────────────────────
// Re-crawl a URL source article
router.post('/:id/sync', async (req: AuthenticatedRequest, res: Response) => {
  const existing = await prisma.knowledgeBaseArticle.findFirst({
    where: { id: req.params.id, organizationId: req.user!.organizationId },
  });

  if (!existing) { res.status(404).json({ error: 'Not found' }); return; }
  if (existing.sourceType !== 'url' || !existing.sourceUrl) {
    res.status(400).json({ error: 'Only URL sources can be re-synced' });
    return;
  }

  await prisma.knowledgeBaseArticle.update({
    where: { id: req.params.id },
    data: { syncStatus: 'syncing' },
  });

  res.json({ syncing: true });

  setImmediate(async () => {
    try {
      const { title, text, wordCount } = await crawlUrl(existing.sourceUrl!);
      const embedding = await embedText(`${title}\n\n${text}`);
      await prisma.knowledgeBaseArticle.update({
        where: { id: existing.id },
        data: { title, content: text, embedding, wordCount, syncStatus: 'idle', syncedAt: new Date() },
      });
      upsertEmbeddingVec(existing.id, embedding).catch(() => {});
    } catch (err) {
      console.error(`[kb/sync] failed for ${existing.sourceUrl}:`, err);
      await prisma.knowledgeBaseArticle.update({
        where: { id: existing.id },
        data: { syncStatus: 'error' },
      }).catch(() => {});
    }
  });
});

// ─── DELETE /api/v1/kb/:id ────────────────────────────────────────────────────
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const existing = await prisma.knowledgeBaseArticle.findFirst({
    where: { id: req.params.id, organizationId: req.user!.organizationId },
  });

  if (!existing) { res.status(404).json({ error: 'Article not found' }); return; }

  await prisma.knowledgeBaseArticle.delete({ where: { id: req.params.id } });
  res.json({ deleted: true });
});

export { matchesPageScope };
export default router;
