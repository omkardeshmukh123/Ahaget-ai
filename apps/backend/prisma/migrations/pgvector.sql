-- Enable pgvector extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add native vector column alongside the legacy JSON column
ALTER TABLE knowledge_base_articles
  ADD COLUMN IF NOT EXISTS embedding_vec vector(1536);

-- Back-fill from existing JSON embeddings.
-- The JSON is stored as '[0.1, 0.2, ...]' which pgvector accepts directly.
-- Only migrate rows that have a full 1536-dimension vector.
UPDATE knowledge_base_articles
SET embedding_vec = embedding::text::vector(1536)
WHERE embedding_vec IS NULL
  AND embedding::text <> '[]'
  AND embedding::text <> 'null'
  AND jsonb_array_length(embedding::jsonb) = 1536;

-- HNSW index for sub-millisecond approximate nearest-neighbour search.
-- m=16 ef_construction=64 are standard defaults for 1536-dim vectors.
CREATE INDEX IF NOT EXISTS kb_articles_embedding_vec_hnsw_idx
  ON knowledge_base_articles
  USING hnsw (embedding_vec vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
