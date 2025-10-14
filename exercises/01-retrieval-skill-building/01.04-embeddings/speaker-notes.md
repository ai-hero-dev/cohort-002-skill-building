# Embeddings

## Problem

### Intro

- BM25 limitation: keyword matching, no semantic understanding
- Real problem: "total solar eclipse" won't match "sun blocked by moon"
- Embeddings = LLM's numeric understanding of text meaning
- Vector space: similar meaning = close vectors
- Why matters: search like LLM thinks, not regex
- Production use: every semantic search, RAG, recommendation engine

### Steps To Complete

#### Phase 1: Implement embedMany

[`create-embeddings.ts`](./problem/api/create-embeddings.ts)

- `embedLotsOfText`: creates embeddings for corpus
- Use `embedMany` from AI SDK with `google.textEmbeddingModel('text-embedding-004')`
- Batch 99 emails (API limit)
- Map: combine subject + body
- Returns `{id, embedding}[]`
- Embedding = number array = semantic meaning

#### Phase 2: Implement embed and cosineSimilarity

[`create-embeddings.ts`](./problem/api/create-embeddings.ts)

- `embedOnePieceOfText`: embeds query via `embed`
- `calculateScore`: uses `cosineSimilarity(queryEmbedding, embedding)`
- Cosine similarity: -1 to 1, higher = more relevant
- `searchEmails` ranks all emails by relevance

#### Phase 3: Integrate chat endpoint

[`chat.ts`](./problem/api/chat.ts)

- Call `searchEmails(formatMessageHistory(messages))`
- Slice top 5: `searchResults.slice(0, 5)`
- Add console.log to inspect retrieval
- LLM answers using semantically relevant emails

## Solution

### Steps To Complete

#### Phase 1: embedMany implementation

[`create-embeddings.ts`](./solution/api/create-embeddings.ts) lines 152-162

- `embedMany` takes model + values array
- Map emails: `${email.subject} ${email.body}`
- Returns `{embeddings}[]`
- Combine with IDs for lookup

#### Phase 2: embed and cosineSimilarity

[`create-embeddings.ts`](./solution/api/create-embeddings.ts) lines 164-178

- `embed` single value, extract `result.embedding`
- `cosineSimilarity(queryEmbedding, embedding)` direct call
- Simple wrappers around AI SDK

#### Phase 3: Chat integration

[`chat.ts`](./solution/api/chat.ts) lines 32-43

- `searchEmails` with formatted history
- Slice top 5, log subjects + scores
- Scores typically 0.3-0.9
- Compare semantic vs keyword in console

### Next Up

Embeddings = semantic understanding. BM25 = keywords. Why choose? Next: rank fusion combines both strengths for better retrieval than either alone.
