# Comparing Semantic Search with Agentic Search

## Intro

- Experiment-driven testing: eval as comparative experiment not pass/fail test
- Theory: can agents with diverse tools (BM25, semantic, filter, getById) outperform upfront RAG?
- Expose retrieval internals to LLM: search by sender, subject, link threads, etc
- Identify boundaries: when agents excel vs when RAG sufficient
- Manual inspection this lesson, LLM-as-judge scorer next lesson

Links: [notes.md](./notes.md), [readme.md](./readme.md), [main.ts](./main.ts)

## Steps To Complete

### Phase 1: Create Test Dataset

- 8-10 test cases: natural questions + expected answers from email dataset
- Include edge cases exposing approach boundaries:
  - Multi-hop: "Who sent email about X and what did they say about Y?"
  - Filtering: "Emails from Jennifer after August 1st?"
  - Thread following: "What was Sarah's gazumping situation?"
  - Simple facts: "What's the mortgage interest rate?"
- Edge cases reveal where agents excel (multi-step) vs RAG sufficient (lookups)

### Phase 2: Implement Semantic Search Variant

- Upfront retrieval: get context first, then answer
- Generate keywords + searchQuery via `generateObject`
- Import search from lesson 2.2: BM25 + embeddings + RRF
- Retrieve top 10, answer with formatted context
- Single-shot approach: no iterative refinement

Links: Lesson [02.02](../../02-retrieval-project-work/02.02-building-a-search-algorithm/explainer/notes.md)

### Phase 3: Implement Agentic Search Variant

- Tool-based approach: LLM decides which tools, when
- Tools from lesson 2.4:
  - `searchSemanticEmails`: BM25 + embeddings, returns metadata only
  - `filterEmails`: traditional filtering (from, after, contains)
  - `getEmailById`: targeted retrieval, optional includeThread
- Agent autonomy: metadata scan → targeted retrieval pattern
- `stopWhen: stepCountIs(5)` for multi-tool workflows

Links: Lesson [02.04](../../02-retrieval-project-work/02.04-agent-controlled-search-tools/explainer/notes.md)

### Phase 4: Setup evalite.each Comparison

- `evalite.each` runs same test case through both variants
- Variant array: `[{ name: "semantic", variant: "semantic" }, ...]`
- Task function branches on variant param
- Enables direct side-by-side answer comparison

### Phase 5: Run & Manually Inspect

- Execute: `pnpm evalite`
- Manual inspection process:
  - Review output table: both answers per test case
  - Compare vs expected answers
  - Note correctness per variant
- Identify patterns:
  - Agents excel: multi-hop, filtering, thread following
  - RAG sufficient: simple facts, single-document lookups
  - Edge cases: when each approach fails
- Example observations:
  - Simple "What's mortgage amount?" → both work, RAG faster
  - Multi-hop chaining → agent better
  - Filtering operations → agent better (dedicated tool)
  - Thread context → agent better (includeThread param)
- Experimental mindset: discover boundaries not judge correctness
- Real insight: agents add value for complex queries; RAG works for simple
- Tradeoff: agents slower/pricier but more capable

## Next Up

Manual inspection doesn't scale. Next lesson: LLM-as-judge scorer automates correctness evaluation, enabling larger test datasets.
