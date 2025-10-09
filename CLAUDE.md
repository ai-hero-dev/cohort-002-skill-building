# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI SDK v5 crash course repository - educational material for learning AI app development with TypeScript. Contains exercises on retrieval techniques (BM25, embeddings, rank fusion, query rewriting, reranking) with problem/solution/explainer structure.

## Development Commands

### Run exercises interactively

```bash
pnpm dev
# or
pnpm exercise
```

### Jump to specific exercise

```bash
pnpm exercise <exercise-number>
```

### Install dependencies

```bash
pnpm install
```

## Architecture

### Exercise Structure

Exercises organized in topic folders (e.g., `exercises/01-retrieval/`). Each uses numeric naming:

- Format: `XX.YY-topic-name` (e.g., `01.01-retrieval-with-bm25`, `01.00-bm25`)
- Lower numbers (`.00`, `.01`) come before higher numbers

Each exercise has up to 3 variants:

- `problem/` - Student workspace with TODOs to implement
- `solution/` - Reference implementation
- `explainer/` - Conceptual material/playground (no TODOs)

Standard structure within each variant:

- `main.ts` - Entry point (runs dev server or standalone)
- `api/` - Backend routes (Hono handlers)
- `client/` - Frontend React code
- `readme.md` - Exercise instructions

Simple playgrounds may have only `main.ts` for console exploration.

### Dev Server Setup

Exercises use a custom dev server (`shared/run-local-dev-server.ts`) that:

- Runs Vite frontend on port 3000
- Runs Hono API server on port 3001
- API routes map to `./api/*.ts` files in each exercise dir
- Client code lives in `./client` subdirectories
- Auto-proxies `/api` requests from frontend to backend

To run an exercise: execute `main.ts` in problem/solution/explainer folder (calls `runLocalDevServer`)

### Tech Stack

- **AI SDK v5** (`ai` package) - Core AI functionality
- **Providers**: OpenAI, Anthropic, Google (via `@ai-sdk/*` packages)
- **Frontend**: React 19, Vite, TailwindCSS, React Router
- **Backend**: Hono server framework
- **Retrieval**: BM25 (okapibm25), embeddings, semantic search
- **TypeScript**: Strict mode, NodeNext modules

### Module System

- Uses `"type": "module"` - ESM only
- Path alias: `#shared/*` maps to `./shared/*`
- Must use `.ts` extensions in imports when `allowImportingTsExtensions: true`

## API Keys

Required environment variables in `.env` (copy from `.env.example`):

- `GOOGLE_GENERATIVE_AI_API_KEY` - Google Gemini models
- `ANTHROPIC_API_KEY` - Claude models (optional)
- `OPENAI_API_KEY` - GPT models (optional)

## Datasets

Located in `datasets/` directory:

- `emails.json` - Email dataset for personal assistant exercises
- `ts-docs.json` - TypeScript documentation for retrieval exercises

Loading pattern from exercises:

```typescript
const LOCATION = path.resolve(
  import.meta.dirname,
  '../../../../../datasets/emails.json', // Adjust depth
);
const content = await readFile(LOCATION, 'utf8');
const data = JSON.parse(content);
```

## Retrieval Exercise Patterns

### BM25 (01.00, 01.01)

- Keyword-based search using `okapibm25` package
- Load dataset (emails or TS docs)
- Score documents: `BM25(documents, keywords)` returns scores array
- Sort by score descending for ranked results

### Embeddings (01.02)

- Semantic search using `embed` and `embedMany` from AI SDK
- `google.textEmbeddingModel()` for embedding generation
- `cosineSimilarity()` for scoring relevance

### Message Streaming

- Use `createUIMessageStream` for streaming responses
- Custom data parts like `data-queries` for metadata
- Use stable IDs when upserting data parts

## Code Formatting

Prettier config in package.json:

- Single quotes
- Semicolons
- 65 char line width
- 2 space indentation
