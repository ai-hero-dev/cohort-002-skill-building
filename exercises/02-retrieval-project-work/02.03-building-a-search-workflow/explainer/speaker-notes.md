# Building a Search Workflow

## Intro

- Section 01: learned retrieval components isolated (BM25, embeddings, reranking, query rewriting)
- Section 02.02: built combined search algorithm
- Now: integrate conversational agent with RAG
- Real-world: standalone search → production chat system
- Critical: formatting impacts tokens 30-50%
- Flow: query rewrite → search → rerank → answer w/ citations

## Steps to Complete

### Phase 1: Chat API Foundation

[`notes.md` - Step 1](notes.md)

- Chat endpoint: `createUIMessageStream` for streaming
- `MyMessage` type: custom data parts (`search-results`)
- Progressive UI: sources before answer
- `maxDuration: 30`: embeddings + reranking latency

### Phase 2: Query Rewriting

[`notes.md` - Step 2](notes.md)

- Lesson 01.05 pattern: `generateObject` → keywords + query
- System prompt: BM25 keywords (exact) + semantic query (broader)
- `convertToModelMessages`: conversation history context
- Zod schema: `keywords` array + `searchQuery` string

### Phase 3: Search Integration

[`notes.md` - Step 3](notes.md)

- Import `searchEmails` from 02.02 (BM25 + embeddings + RRF)
- Pass keywords + query → rank fusion
- Results: email + RRF score, sorted

### Phase 4: Reranking

[`notes.md` - Step 4](notes.md)

- Lesson 01.06 pattern: top 30 → reranker → IDs only
- Token optimization: IDs not content
- Map lookup: prevents hallucination
- Filters ~30 → ~5-10 most relevant
- Trade: latency for precision

### Phase 5: Stream Search Results

[`notes.md` - Step 5](notes.md)

- `data-search-results` before answer generation
- Frontend: immediate source display
- Type safety via `MyMessage`
- Separate stream: independent UI render

### Phase 6: Formatting Experiments

[`notes.md` - Step 6](notes.md)

- **Critical**: formatting = 30-50% token variance
- A: Verbose markdown (headers, bullets, emoji)
- B: Minimal (stripped, compact)
- C: JSON (structured, syntax overhead)
- `await result.usage`: measure tokens
- Example: A=3,500 tokens, B=2,200 tokens
- No universal winner: model/data dependent
- Always test formats with real data

### Phase 7: Stream Answer

[`notes.md` - Step 7](notes.md)

- Choose format based on usage experiments
- `streamText`: answer + email context
- System prompt: cite sources w/ markdown
- `writer.merge()`: data parts + text stream
- Citations: source verification

## Complete Flow

- User → Query rewriter (keywords + semantic)
- Search → Rank fusion (BM25 + embeddings)
- Reranker → Top 5-10
- Data part → Sources to frontend
- LLM → Answer + citations
- Full RAG: retrieval → augmentation → generation

## Production Notes

- Cache query rewrites for similar queries
- Monitor reranking: may need tuning
- Track tokens: detect format inefficiencies
- Model preferences: markdown vs JSON
- Format tradeoff: readability vs cost

## Key Takeaways

- Formatting: 30-50% token impact = cost/latency critical
- `result.usage`: mandatory measurement
- Custom data parts: progressive UI
- Multi-step orchestration improves quality
- Section 01 → production RAG
- Token monitoring: mandatory for production

## Next Up

02.04: automatic RAG → agent tool orchestration. Agent decides when to search/filter/get emails. Semantic search vs filtering, metadata vs full content patterns.
