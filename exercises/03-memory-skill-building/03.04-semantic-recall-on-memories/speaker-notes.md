# Semantic Recall on Memories

## Explainer

### Intro

- Current system loads entire memory DB into LLM
- Not scalable - will hit context limits as memories grow
- Need to retrieve only most relevant memories for current conversation
- Already learned BM25 + semantic search - now combine both for memory retrieval
- Scale from loading all memories to loading top 10-50 most relevant

### Implementation Overview

Files: [`api/chat.ts`](./explainer/api/chat.ts), [`api/search.ts`](./explainer/api/search.ts), [`api/embeddings.ts`](./explainer/api/embeddings.ts), [`api/utils.ts`](./explainer/api/utils.ts)

#### Phase 1: Query Rewriting

- Before searching memories, generate search terms from conversation
- Use `generateObject` to create keywords + searchQuery from conversation history
- Keywords: exact terminology, specific terms (for BM25)
- searchQuery: broader semantic intent (for embeddings)
- LLM analyzes conversation context to generate optimal search terms

```ts
const queryRewriterResult = await generateObject({
  model: google('gemini-2.0-flash-001'),
  schema: z.object({
    keywords: z.array(z.string()),
    searchQuery: z.string(),
  }),
  prompt: `Conversation history: ${formatMessageHistory(messages)}`,
});
```

#### Phase 2: Dual Search Strategy

File: [`api/search.ts`](./explainer/api/search.ts)

- Load all memories from persistence
- Run two parallel searches:
  - BM25 with keywords (keyword matching)
  - Embeddings with searchQuery (semantic similarity)
- Merge results using Reciprocal Rank Fusion (RRF)
- RRF combines rankings from both methods, balancing precision + recall

```ts
const embeddingsResults = await searchViaEmbeddings(memories, searchQuery);
const bm25Results = await searchViaBM25(memories, keywordsForBM25);
const rrfResults = reciprocalRankFusion([embeddingsResults, bm25Results]);
```

#### Phase 3: Top-N Selection

File: [`api/chat.ts`](./explainer/api/chat.ts) lines 88-91

- Slice top 10 memories from merged results
- Format each memory (content, ID, createdAt)
- Inject formatted memories into system prompt
- Can scale to 30-50 memories without impacting context much

#### Phase 4: Embedding Creation

Files: [`api/embeddings.ts`](./explainer/api/embeddings.ts), [`api/chat.ts`](./explainer/api/chat.ts) lines 211-220

- When saving new memories, create embeddings immediately
- Use `embedMemory` function with Google's text-embedding-004 model
- Store embeddings alongside memories in persistence layer
- Updates also regenerate embeddings for modified memories

```ts
saveMemories(
  await Promise.all(
    additions.map(async (addition) => ({
      id: generateId(),
      memory: addition,
      createdAt: new Date().toISOString(),
      embedding: await embedMemory(addition),
    })),
  ),
);
```

### Testing

- Run exercise locally, have conversations with LLM
- Check console logs to see query rewriter output
- Observe which memories get retrieved vs full memory set
- Verify semantic relevance of retrieved memories

### Next Up

Memory system complete - can add, update, delete, and semantically retrieve memories at scale
