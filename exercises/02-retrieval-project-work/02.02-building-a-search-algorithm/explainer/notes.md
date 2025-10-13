# Building a Search Algorithm

## Learning Goals

Apply Section 01 retrieval skills to real project codebase. Replace simple string search in `/search` page with production-ready retrieval pipeline combining BM25 keyword search, embedding-based semantic search, and rank fusion. Implement file-system embedding cache to avoid regenerating vectors on every search (critical for large dataset). Learn practical patterns that scale: incremental testing, cache strategies, and production alternatives like pgvector.

## Steps To Complete

### 1. Setup BM25 Search

Replace simple string matching with BM25 keyword ranking.

**Implementation:**

```ts
import BM25 from 'okapibm25';

async function searchWithBM25(query: string, emails: Email[]) {
  // Combine subject + body for richer text corpus
  const corpus = emails.map(email => `${email.subject} ${email.body}`);

  // Split query into keywords
  const keywords = query.toLowerCase().split(' ');

  // BM25 returns score array matching corpus order
  const scores: number[] = (BM25 as any)(corpus, keywords);

  // Map scores to emails, sort descending
  return scores
    .map((score, idx) => ({ score, email: emails[idx] }))
    .sort((a, b) => b.score - a.score);
}
```

**Notes:**
- Install `okapibm25` package first
- Test with keyword-heavy queries ("meeting", "invoice") to verify ranking
- Console log top 5 results to inspect relevance before moving forward

### 2. Implement Embedding Cache System

Build file-system cache to persist embeddings between searches. Critical for large dataset performance.

**Cache structure:**

```
data/
  embeddings/
    email-123.json    -> { "id": "email-123", "embedding": [0.123, 0.456, ...] }
    email-456.json
```

**Implementation:**

```ts
import fs from 'fs/promises';
import path from 'path';
import { embedMany } from 'ai';
import { google } from '@ai-sdk/google';

const CACHE_DIR = path.join(process.cwd(), 'data', 'embeddings');

async function loadOrGenerateEmbeddings(emails: Email[]) {
  // Ensure cache directory exists
  await fs.mkdir(CACHE_DIR, { recursive: true });

  const results = [];
  const uncachedEmails = [];

  // Check cache for each email
  for (const email of emails) {
    const cachePath = path.join(CACHE_DIR, `${email.id}.json`);
    try {
      const cached = await fs.readFile(cachePath, 'utf-8');
      const data = JSON.parse(cached);
      results.push({ id: email.id, embedding: data.embedding });
    } catch {
      // Cache miss - need to generate
      uncachedEmails.push(email);
    }
  }

  // Generate embeddings for uncached emails
  if (uncachedEmails.length > 0) {
    const { embeddings } = await embedMany({
      model: google.textEmbeddingModel('text-embedding-004'),
      values: uncachedEmails.map(e => `${e.subject} ${e.body}`),
    });

    // Write to cache
    for (let i = 0; i < uncachedEmails.length; i++) {
      const email = uncachedEmails[i];
      const embedding = embeddings[i];
      const cachePath = path.join(CACHE_DIR, `${email.id}.json`);

      await fs.writeFile(
        cachePath,
        JSON.stringify({ id: email.id, embedding })
      );

      results.push({ id: email.id, embedding });
    }
  }

  return results;
}
```

**Notes:**
- Cache persists across server restarts - only generate once per email
- For 547 email dataset, first run takes ~30s, subsequent searches instant
- Cache invalidation: delete cached file if email content changes
- Production alternative: pgvector in Postgres stores embeddings directly on row

### 3. Add Semantic Search

Compare query embedding against cached email embeddings using cosine similarity.

**Implementation:**

```ts
import { embed, cosineSimilarity } from 'ai';

async function searchWithEmbeddings(query: string, emails: Email[]) {
  // Load cached embeddings
  const emailEmbeddings = await loadOrGenerateEmbeddings(emails);

  // Generate query embedding
  const { embedding: queryEmbedding } = await embed({
    model: google.textEmbeddingModel('text-embedding-004'),
    value: query,
  });

  // Calculate similarity scores
  const results = emailEmbeddings.map(({ id, embedding }) => {
    const email = emails.find(e => e.id === id)!;
    const score = cosineSimilarity(queryEmbedding, embedding);
    return { score, email };
  });

  // Sort by similarity descending
  return results.sort((a, b) => b.score - a.score);
}
```

**Notes:**
- Semantic search finds conceptual matches even without exact keywords
- Try query "vacation planning" - finds travel emails without word "vacation"
- Compare BM25 vs embedding results side-by-side to see differences
- Embeddings excel at broad semantic queries, BM25 better for specific keywords

### 4. Implement Rank Fusion

Combine BM25 + embedding rankings using reciprocal rank fusion algorithm.

**Implementation:**

```ts
const RRF_K = 60;

function reciprocalRankFusion(
  rankings: { email: Email; score: number }[][]
): { email: Email; score: number }[] {
  const rrfScores = new Map<string, number>();
  const emailMap = new Map<string, Email>();

  // Process each ranking list (BM25 and embeddings)
  rankings.forEach(ranking => {
    ranking.forEach((item, rank) => {
      const currentScore = rrfScores.get(item.email.id) || 0;

      // Position-based scoring: 1/(k+rank)
      const contribution = 1 / (RRF_K + rank);
      rrfScores.set(item.email.id, currentScore + contribution);

      emailMap.set(item.email.id, item.email);
    });
  });

  // Sort by combined RRF score descending
  return Array.from(rrfScores.entries())
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([emailId, score]) => ({
      score,
      email: emailMap.get(emailId)!
    }));
}

async function searchWithRankFusion(query: string, emails: Email[]) {
  const [bm25Results, embeddingResults] = await Promise.all([
    searchWithBM25(query, emails),
    searchWithEmbeddings(query, emails),
  ]);

  return reciprocalRankFusion([bm25Results, embeddingResults]);
}
```

**Notes:**
- RRF handles different scoring scales (BM25 vs cosine similarity)
- Position-based scoring means rank matters more than absolute score
- K=60 is standard constant, can tune but usually works well
- Combined results leverage strengths of both methods

### 5. Update Search Page

Replace simple string filter with new retrieval pipeline.

**Current code (line 58-63 in `src/app/search/page.tsx`):**

```ts
const filteredEmails = query
  ? transformedEmails.filter(
      (email) =>
        email.subject.toLowerCase().includes(query.toLowerCase()) ||
        email.from.toLowerCase().includes(query.toLowerCase()) ||
        email.content.toLowerCase().includes(query.toLowerCase())
    )
  : transformedEmails;
```

**Replace with:**

```ts
const filteredEmails = query
  ? await searchWithRankFusion(query, allEmails)
  : transformedEmails;
```

**Notes:**
- Keep search async - already supported by Next.js server components
- Maintain pagination logic - works with new results
- Results now ranked by relevance instead of date
- Query rewriting and reranking covered in lesson 2.3

## Additional Notes

**Performance:**
- File-system cache makes 547 email dataset searchable with <1s response after initial generation
- First search per email generates embedding (~30s for full corpus)
- Subsequent searches instant - only query embedding generated

**Cache Invalidation:**
- If email content changes, delete corresponding cache file in `data/embeddings/`
- Simple strategy: delete entire cache directory when dataset updated
- Production: store embedding timestamp, regenerate if email modified_at newer

**Production Alternative:**
- Use pgvector extension in Postgres
- Store embeddings directly on email rows as `vector(768)` column
- Query with `ORDER BY embedding <=> query_embedding LIMIT 10`
- No file-system management, scales to millions of documents

**Incremental Build Strategy:**
- Test BM25 alone first - verify keyword ranking works
- Add embeddings next - compare semantic vs keyword results
- Finally combine with RRF - observe how hybrid improves both
