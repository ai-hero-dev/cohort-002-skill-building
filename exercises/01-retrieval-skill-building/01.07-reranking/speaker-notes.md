# Reranking

## Problem

### Intro

- Post-retrieval optimization - one more step after rank fusion
- Take top 30 results, pass to reranker LLM, filter to truly relevant only
- Why? BM25+embeddings+RRF still returns noise - need intelligent filter
- Reranker reads full content, evaluates against actual query, drops tangential matches
- Real world: Critical when retrieved set includes semi-relevant docs that poison final answer
- Trade: Added latency for precision - worth it when accuracy matters

### Steps To Complete

#### Phase 1: Slice and ID the Results

[`/exercises/01-retrieval-skill-building/01.06-reranking/problem/api/chat.ts`](/exercises/01-retrieval-skill-building/01.06-reranking/problem/api/chat.ts)

- After `searchEmails` returns rank-fused results, slice to top 30
- Add numeric ID to each using array index
- Format as text: ID first, then metadata (from/to/subject), then body in XML tags
- IDs are reference system - reranker returns IDs, not full content (token efficient)

#### Phase 2: Build the Reranker Call

[`/exercises/01-retrieval-skill-building/01.06-reranking/problem/api/chat.ts`](/exercises/01-retrieval-skill-building/01.06-reranking/problem/api/chat.ts)

- Use `generateObject` with `RERANKER_SYSTEM_PROMPT`
- Pass: search query + formatted search results with IDs
- Schema: `{ resultIds: z.array(z.number()) }` - IDs only, not content
- Why IDs only? Don't waste tokens returning what you already have
- Map returned IDs back to actual email objects using ID→email map
- Filter hallucinated IDs - LLM might invent non-existent IDs

#### Phase 3: Test Impact

- Run locally, ask email questions
- Console logs show which emails reranker selected
- Monitor latency - extra LLM call adds delay
- Compare answer quality - should see fewer irrelevant citations
- Evaluate tradeoff: Is quality improvement worth latency cost?

## Solution

### Steps To Complete

#### Phase 1: Slice and Add IDs

[`/exercises/01-retrieval-skill-building/01.06-reranking/solution/api/chat.ts`](/exercises/01-retrieval-skill-building/01.06-reranking/solution/api/chat.ts#L65-L70)

- `searchResults.slice(0, 30).map((result, i) => ({ ...result, id: i }))`
- Simple index-based ID assignment
- Top 30 balances: enough options for reranker, not overwhelming token count

#### Phase 2: Implement Reranker

[`/exercises/01-retrieval-skill-building/01.06-reranking/solution/api/chat.ts`](/exercises/01-retrieval-skill-building/01.06-reranking/solution/api/chat.ts#L79-L118)

- `generateObject` with reranker prompt
- Pass `keywords.object.searchQuery` + formatted emails with IDs
- Schema returns `resultIds` array only
- Map IDs back: `topSearchResultsAsMap.get(id)`
- Filter undefined for hallucinated IDs

#### Phase 3: Handle Results

[`/exercises/01-retrieval-skill-building/01.06-reranking/solution/api/chat.ts`](/exercises/01-retrieval-skill-building/01.06-reranking/solution/api/chat.ts#L120-L123)

- Map reranked IDs to actual email objects
- Filter out hallucinations
- Pass filtered set to final answer generation
- Console log shows which subjects made final cut

### Next Up

Section 01 complete - you've built full retrieval pipeline: keyword search (BM25), semantic search (embeddings), rank fusion, query rewriting, reranking.

Next: Section 02 - apply these skills to build real search algorithm with your own dataset, create chat workflow, move to agent-controlled tools.
