# 01.02 - Retrieval with BM25

## Problem

### Intro

- Real-world challenge: LLMs don't know your private data (emails, docs, internal systems)
- Public info easy: call Brave/Tavily API, scrape websites
- Private info requires different approach: retrieval-augmented generation (RAG)
- Building email search assistant: keyword generation → BM25 search → LLM answers with context
- Foundation pattern for personal assistant - retrieve relevant data, feed to LLM for accurate answers
- BM25 = simple, cost-effective starting point (refine later in course)

### Steps To Complete

#### Phase 1: Generate Keywords with `generateObject`

Files: [`problem/api/chat.ts`](./problem/api/chat.ts)

- Use `generateObject` with Google Gemini to extract search keywords from conversation
- Define Zod schema: `z.object({ keywords: z.array(z.string()) })`
- Pass `formatMessageHistory(messages)` to prompt for full context
- System prompt already provided: `KEYWORD_GENERATOR_SYSTEM_PROMPT`
- `await` the result - need complete keywords before searching
- Debug tip: `console.log` keywords to see what LLM generates

#### Phase 2: Search Emails with BM25

Files: [`problem/api/chat.ts`](./problem/api/chat.ts), [`problem/api/bm25.ts`](./problem/api/bm25.ts)

- Call `searchEmails(keywords.object.keywords)` with generated keywords
- BM25 algorithm scores emails by keyword relevance (subject + body)
- Returns sorted array: highest scores first
- Slice top 5-10 results: `searchResults.slice(0, 10)`
- Balance: enough context for LLM vs token limits
- [`searchEmails`](./problem/api/bm25.ts) combines subject + body for scoring

#### Phase 3: Test and Verify

- Run dev server: ask questions about emails
- Check LLM cites email subjects in markdown format
- Terminal shows generated keywords - reveals LLM's search strategy
- Experiment: try different question types, observe keyword extraction patterns

## Solution

### Steps To Complete

#### Phase 1: Keyword Generation Implementation

Files: [`solution/api/chat.ts`](./solution/api/chat.ts#L34-L46)

- Import `generateObject` from `ai` and `z` from `zod`
- Define schema with `keywords: z.array(z.string())`
- Pass formatted message history to prompt
- `await` full result before proceeding to search
- Extract keywords array: `keywords.object.keywords`
- Console log for debugging keyword generation

#### Phase 2: Search and Retrieve

Files: [`solution/api/chat.ts`](./solution/api/chat.ts#L48-L54)

- Import `searchEmails` from `./bm25.ts`
- Call with all keywords: `await searchEmails(allKeywords)`
- Slice top 10 results for LLM context
- Remaining code formats emails with metadata (from, to, score) for LLM prompt
- LLM gets structured email snippets with relevance scores

#### Phase 3: Pattern Recognition

- Core RAG pattern: extract query info → search private data → provide context to LLM
- Three-step workflow: keyword generation → BM25 retrieval → answer generation
- LLM acts twice: once for extraction, once for answering
- Formatted email context includes metadata for transparency
- Foundation for more sophisticated retrieval (embeddings, rank fusion, reranking coming next)

### Next Up

BM25 works but has limits: requires exact keyword matches, no semantic understanding. Next lesson explores semantic search with embeddings - handles meaning, not just keywords.
