# Query Rewriting

## Problem

### Intro

- Current system embeds entire conversation history for semantic search
- Long conversations dilute recent/relevant context in embeddings
- Dramatic issue w/ conversation turns: 9 msgs about mortgages, 1 about bookings = 9/10 mortgage embedding
- Embedding gets bigger as conversation grows, end content has less impact on retrieval
- Need query rewriter: LLM converts long conversation into focused, refined search query
- Pre-retrieval optimization step before semantic search
- Already doing this partially w/ BM25 keyword generation
- Real-world problem: semantic search precision degrades w/ conversation length

### Steps To Complete

#### Phase 1: Extend Schema

[`problem/api/chat.ts`](/home/mattpocock/repos/ai/personal-assistant-in-typescript/exercises/01-retrieval-skill-building/01.05-query-rewriting/problem/api/chat.ts)

- Modify `generateObject` schema to include `searchQuery` field alongside `keywords`
- Add `.describe()` explaining search query used for broader semantic search terms
- Update system prompt to explain search query purpose vs keywords
- Keywords = exact terminology for BM25
- Search query = broader terms for embeddings

#### Phase 2: Wire It Up

[`problem/api/chat.ts`](/home/mattpocock/repos/ai/personal-assistant-in-typescript/exercises/01-retrieval-skill-building/01.05-query-rewriting/problem/api/chat.ts)

- Replace `TODO` w/ `keywords.object.searchQuery`
- Pass to `searchEmails` as `embeddingsQuery` param
- Test w/ dev server: check console logs for generated keywords + query
- Try follow-up questions to verify conversation context handling
- Verify search results more relevant to current question

## Solution

### Steps To Complete

#### Phase 1: Schema Update

[`solution/api/chat.ts`](/home/mattpocock/repos/ai/personal-assistant-in-typescript/exercises/01-retrieval-skill-building/01.05-query-rewriting/solution/api/chat.ts)

- Schema now has `searchQuery: z.string().describe('A search query which will be used to search the emails. Use this for broader terms.')`
- System prompt updated: "You should also generate a search query which will be used to search the emails. This will be used for semantic search, so can be more general."
- Single `generateObject` call produces both keywords (BM25) and search query (embeddings)
- Efficient: one LLM call handles both retrieval methods

#### Phase 2: Implementation

[`solution/api/chat.ts`](/home/mattpocock/repos/ai/personal-assistant-in-typescript/exercises/01-retrieval-skill-building/01.05-query-rewriting/solution/api/chat.ts)

- `embeddingsQuery: keywords.object.searchQuery` passed to `searchEmails()`
- [`search.ts`](/home/mattpocock/repos/ai/personal-assistant-in-typescript/exercises/01-retrieval-skill-building/01.05-query-rewriting/problem/api/search.ts) combines BM25 + embeddings via RRF
- Query rewriter prevents conversation dilution in embeddings
- Recent context now properly weighted in semantic search
- Handles conversation turns w/ focused queries

### Next Up

Next: post-retrieval optimization. Retrieved 30 docs but only 5 relevant? Reranking uses LLM to filter top results, returning only relevant IDs. Trade latency for precision.
