import { prisma } from '../lib/prisma';
import { crawlUrl } from '../services/crawl';
import { embedText } from '../services/knowledge';

const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 h
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
    orderBy: { syncedAt: 'asc' },
  });

  if (stale.length === 0) return;

  await Promise.allSettled(
    stale.map(async (article) => {
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
        console.log(`[kb-refresh] refreshed ${article.organizationId}/${article.id} ${article.sourceUrl}`);
      } catch (err) {
        console.error(`[kb-refresh] failed ${article.sourceUrl}:`, err);
        await prisma.knowledgeBaseArticle.update({
          where: { id: article.id },
          data: { syncStatus: 'error' },
        }).catch(() => {});
      }
    }),
  );
}
