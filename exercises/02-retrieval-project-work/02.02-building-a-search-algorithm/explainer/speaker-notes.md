# Building a Search Algorithm

## Intro

- Apply Section 01 retrieval skills to real project
- Replace string search with production-ready retrieval
- BM25 keyword + embeddings semantic + rank fusion
- File-system embedding cache critical for performance
- Learn patterns that scale to production

## Phase 1: Setup BM25 Search

[`notes.md`](./notes.md#1-setup-bm25-search)

- Install `okapibm25` package
- Combine subject + body for corpus
- Split query into keywords
- Score array maps to corpus order
- Sort descending by score
- Test keyword-heavy queries ("meeting", "invoice")
- Console log top 5 before moving forward

## Phase 2: Implement Embedding Cache

[`notes.md`](./notes.md#2-implement-embedding-cache-system)

- File-system cache persists embeddings between searches
- Critical for 547 email dataset performance
- Structure: `data/embeddings/{email-id}.json`
- Each file stores ID + embedding vector
- Check cache first, generate only on miss
- First run ~30s, subsequent instant
- Production alternative: pgvector in Postgres stores on rows

## Phase 3: Add Semantic Search

[`notes.md`](./notes.md#3-add-semantic-search)

- Load cached embeddings
- Generate query embedding via `embed`
- Calculate `cosineSimilarity` for each email
- Sort by similarity descending
- Finds conceptual matches without exact keywords
- Try "vacation planning" - finds travel emails without "vacation"
- Compare BM25 vs embeddings side-by-side

## Phase 4: Implement Rank Fusion

[`notes.md`](./notes.md#4-implement-rank-fusion)

- Reciprocal rank fusion combines both rankings
- Formula: `1/(k+rank)` where k=60
- Position-based scoring handles different scales
- Run BM25 + embeddings in parallel
- Map scores by email ID
- Sort by combined RRF score
- Leverages strengths of both methods

## Phase 5: Update Search Page

[`notes.md`](./notes.md#5-update-search-page)

- Replace string filter with `searchWithRankFusion`
- Keep async - already supported
- Maintain pagination logic
- Results now ranked by relevance not date
- Query rewriting + reranking in lesson 2.3

## Key Takeaways

- Incremental build strategy: test BM25 → embeddings → RRF
- Cache invalidation: delete file if email changes
- Performance: <1s response after initial generation
- Production: pgvector scales to millions of documents
- Foundation for lesson 2.3 search workflow

## Next Up

Build chat API route with conversational retrieval - generate keywords/query from history, integrate this search algorithm, add mandatory reranking, stream results as custom data parts, format emails efficiently for token optimization.
