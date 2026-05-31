// ─── Knowledge Base Service — pgvector primary, BM25+RRF re-rank ──────────────

import OpenAI from 'openai';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

let _openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

export async function embedText(text: string): Promise<number[]> {
  const res = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  });
  return res.data[0].embedding;
}

// ─── Write embedding_vec after every article create/update ────────────────────
export async function upsertEmbeddingVec(articleId: string, embedding: number[]): Promise<void> {
  const vec = `[${embedding.join(',')}]`;
  await prisma.$executeRaw`
    UPDATE knowledge_base_articles SET embedding_vec = ${vec}::vector WHERE id = ${articleId}
  `;
}

// ─── BM25 scorer ─────────────────────────────────────────────────────────────
const BM25_K1 = 1.2;
const BM25_B  = 0.75;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function bm25Score(
  queryTerms: string[],
  docTokens: string[],
  avgDocLen: number,
  idf: Map<string, number>,
): number {
  const docLen = docTokens.length;
  const tf = new Map<string, number>();
  for (const t of docTokens) tf.set(t, (tf.get(t) ?? 0) + 1);

  let score = 0;
  for (const term of queryTerms) {
    const f = tf.get(term) ?? 0;
    if (f === 0) continue;
    const termIdf = idf.get(term) ?? 0;
    const numerator = f * (BM25_K1 + 1);
    const denominator = f + BM25_K1 * (1 - BM25_B + BM25_B * (docLen / avgDocLen));
    score += termIdf * (numerator / denominator);
  }
  return score;
}

function buildIdf(queryTerms: string[], corpus: string[][]): Map<string, number> {
  const N = corpus.length;
  const idf = new Map<string, number>();
  for (const term of queryTerms) {
    const docsWithTerm = corpus.filter((doc) => doc.includes(term)).length;
    idf.set(term, Math.log((N - docsWithTerm + 0.5) / (docsWithTerm + 0.5) + 1));
  }
  return idf;
}

// ─── Reciprocal Rank Fusion ───────────────────────────────────────────────────
const RRF_K = 60;

function rrfCombine(
  vectorRanks: Map<string, number>,
  bm25Ranks: Map<string, number>,
): Map<string, number> {
  const scores = new Map<string, number>();
  const allIds = new Set([...vectorRanks.keys(), ...bm25Ranks.keys()]);
  for (const id of allIds) {
    const vRank = vectorRanks.get(id) ?? Infinity;
    const bRank = bm25Ranks.get(id) ?? Infinity;
    scores.set(id, 1 / (RRF_K + vRank) + 1 / (RRF_K + bRank));
  }
  return scores;
}

function toRankMap(sortedIds: string[]): Map<string, number> {
  const m = new Map<string, number>();
  sortedIds.forEach((id, i) => m.set(id, i + 1));
  return m;
}

export interface KBResult {
  title: string;
  content: string;
  score: number;
}

// ─── pgvector row shape ───────────────────────────────────────────────────────
type PgVecRow = {
  id: string;
  title: string;
  content: string;
  page_url_pattern: string | null;
  vector_score: number;
};

/**
 * Hybrid search: pgvector for vector recall → BM25 re-rank → RRF combine.
 * Falls back to legacy in-memory cosine when embedding_vec column has no data.
 */
export async function searchKnowledgeBase(
  orgId: string,
  query: string,
  topK = 3,
  minVectorScore = 0.25,
  pageUrl?: string,
): Promise<KBResult[]> {
  const queryEmbedding = await embedText(query.slice(0, 500));
  const vectorStr = `[${queryEmbedding.join(',')}]`;

  // ── pgvector: ordered by cosine distance, HNSW index used automatically ─────
  const pgRows = await prisma.$queryRaw<PgVecRow[]>(
    Prisma.sql`
      SELECT id, title, content, page_url_pattern,
             (1 - (embedding_vec <=> ${vectorStr}::vector))::float8 AS vector_score
      FROM knowledge_base_articles
      WHERE organization_id = ${orgId}
        AND embedding_vec IS NOT NULL
      ORDER BY embedding_vec <=> ${vectorStr}::vector
      LIMIT ${topK * 4}
    `,
  );

  // ── Fall back to in-memory cosine when column has no data yet ────────────────
  if (pgRows.length === 0) {
    return legacySearch(orgId, queryEmbedding, query, topK, minVectorScore, pageUrl);
  }

  // ── Page-level scoping + min-score filter ────────────────────────────────────
  const articles = pgRows.filter(
    (a) =>
      a.vector_score >= minVectorScore &&
      (!a.page_url_pattern ||
        !pageUrl ||
        pageUrl.toLowerCase().includes(a.page_url_pattern.toLowerCase())),
  );

  if (articles.length === 0) return [];
  if (articles.length === 1) {
    return [{ title: articles[0].title, content: articles[0].content, score: articles[0].vector_score }];
  }

  // ── BM25 re-rank on the pgvector candidates ───────────────────────────────────
  const queryTerms = tokenize(query);
  const corpus = articles.map((a) => tokenize(`${a.title} ${a.content}`));
  const avgDocLen = corpus.reduce((s, d) => s + d.length, 0) / corpus.length;
  const idf = buildIdf(queryTerms, corpus);

  const bm25Scored = articles.map((a, i) => ({
    id: a.id,
    bm25Score: bm25Score(queryTerms, corpus[i], avgDocLen, idf),
  }));

  const vectorRanks = toRankMap(articles.map((a) => a.id));
  const bm25Sorted  = [...bm25Scored]
    .filter((a) => a.bm25Score > 0)
    .sort((a, b) => b.bm25Score - a.bm25Score);
  const bm25Ranks = toRankMap(bm25Sorted.map((a) => a.id));

  const rrfScores = rrfCombine(vectorRanks, bm25Ranks);
  const articleMap = new Map(articles.map((a) => [a.id, a]));

  return [...rrfScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([id, score]) => {
      const a = articleMap.get(id)!;
      return { title: a.title, content: a.content, score };
    });
}

// ─── Legacy in-memory search (fallback when embedding_vec is not populated) ───
async function legacySearch(
  orgId: string,
  queryEmbedding: number[],
  query: string,
  topK: number,
  minVectorScore: number,
  pageUrl?: string,
): Promise<KBResult[]> {
  const allArticles = await prisma.knowledgeBaseArticle.findMany({
    where: { organizationId: orgId },
    select: { id: true, title: true, content: true, embedding: true, pageUrlPattern: true },
    take: 500,
  });

  const articles = pageUrl
    ? allArticles.filter((a) => {
        if (!a.pageUrlPattern) return true;
        return pageUrl.toLowerCase().includes(a.pageUrlPattern.toLowerCase());
      })
    : allArticles;

  if (articles.length === 0) return [];

  const vectorScored = articles.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    vectorScore: cosineSimilarity(queryEmbedding, a.embedding as number[]),
  }));

  const vectorFiltered = vectorScored.filter((a) => a.vectorScore >= minVectorScore);
  if (vectorFiltered.length === 0) return [];

  const vectorSorted = [...vectorFiltered].sort((a, b) => b.vectorScore - a.vectorScore);
  const vectorRanks  = toRankMap(vectorSorted.map((a) => a.id));

  if (articles.length === 1) {
    return vectorSorted.slice(0, topK).map((a) => ({ title: a.title, content: a.content, score: a.vectorScore }));
  }

  const queryTerms = tokenize(query);
  const corpus = articles.map((a) => tokenize(`${a.title} ${a.content}`));
  const avgDocLen = corpus.reduce((s, d) => s + d.length, 0) / corpus.length;
  const idf = buildIdf(queryTerms, corpus);

  const bm25Scored = articles.map((a, i) => ({
    id: a.id,
    bm25Score: bm25Score(queryTerms, corpus[i], avgDocLen, idf),
  }));

  const bm25Sorted = [...bm25Scored]
    .filter((a) => a.bm25Score > 0)
    .sort((a, b) => b.bm25Score - a.bm25Score);
  const bm25Ranks = toRankMap(bm25Sorted.map((a) => a.id));

  const rrfScores = rrfCombine(vectorRanks, bm25Ranks);
  const articleMap = new Map(vectorScored.map((a) => [a.id, a]));

  return [...rrfScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([id, score]) => {
      const a = articleMap.get(id)!;
      return { title: a.title, content: a.content, score };
    });
}

// ─── In-memory cosine (used only by legacySearch) ────────────────────────────
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
