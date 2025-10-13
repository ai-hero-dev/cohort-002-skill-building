# Rank Fusion

## Explainer

### Intro

- BM25 + embeddings have complementary strengths
- BM25: keyword matching (exact terms)
- Embeddings: semantic meaning (broader connections)
- Combining both = best retrieval results
- Real-world problem: single approach misses relevant docs

### The Scoring Problem

- Can't just merge scores from different systems
- Ranking systems use different scales
- Example: System A scores 0.9-0.95, System B scores 0.2-0.4
- Naive merge = first system dominates results
- See table in [`readme.md`](./readme.md) lines 22-27

### Reciprocal Rank Fusion (RRF)

- Position-based, not score-based
- Formula: `1/(k+rank)` where k=60
- Each doc gets contribution from each ranking list
- Contributions summed across all systems
- Best docs float to top regardless of score scale
- Implementation in [`api/utils.ts`](./api/utils.ts) lines 31-61

### Code Walkthrough

#### Search Integration

[`api/search.ts`](./api/search.ts)

- Calls both BM25 + embeddings in parallel
- Passes both result arrays to `reciprocalRankFusion`
- Returns unified ranked list
- See lines 9-23

#### RRF Algorithm

[`api/utils.ts`](./api/utils.ts) lines 33-61

- Map tracks accumulated RRF scores per doc ID
- Loops through each ranking list
- For each doc: calculates `1/(60+rank)` contribution
- Adds contribution to existing score
- Sorts final map by total RRF score
- Returns sorted docs

#### Usage in Chat

[`api/chat.ts`](./api/chat.ts)

- Generates keywords via LLM (line 34-46)
- Calls `searchEmails` with keywords + query (line 50-53)
- Takes top 5 results (line 55)
- Passes to LLM with context (line 61-92)

### Steps To Complete

- Run dev server, test various queries
- Compare results with BM25-only (01.02) and embeddings-only (01.03)
- Look for queries where fusion outperforms single methods
- Example edge cases:
  - Exact keyword + semantic context needed
  - One system ranks highly, other misses
  - Keywords present but wrong semantic meaning
- Check console logs to see which docs retrieved
- Note how RRF balances both approaches

### Next Up

- Query rewriting: converting messy conversation history into focused search queries
- Pre-retrieval optimization to improve both BM25 + embeddings results
