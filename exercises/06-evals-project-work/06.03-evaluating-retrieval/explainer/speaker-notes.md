# Evaluating Retrieval

## Explainer

### Intro

- Evals aren't just for agent output - retrieval mechanism needs testing too
- Production dataset = realistic evaluation environment
- Manual curation identifies factual emails with clear retrieval signals
- Graduated scoring: 1.0 top result, 0.5 positions 2-5, 0 otherwise
- Quantify search quality, catch regressions when changing implementation
- Real-world value: tune BM25/embeddings/reranking params confidently

### Why This Matters

- Retrieval quality directly impacts agent accuracy
- Bad retrieval = correct agent with wrong context = wrong answers
- Test mechanism in isolation, not end-to-end agent behavior
- Faster iteration: skip agent variability, focus on search
- Jeff Huber (Chroma): evaluate chunks retrieved, not just final answers
- Foundation for comparing search approaches (lesson 6.4)

### Steps To Complete

#### Phase 1: Manual Dataset Analysis

[`datasets/emails.json`](../../../../../datasets/emails.json)

- Read through production dataset
- Identify 8-10 key factual emails with clear retrieval signals
- Good candidates:
  - Mortgage pre-approval amount/date
  - Property offer details
  - Gazumping notification
  - Seller counter-offers
  - Sarah's job/consulting income
  - Specific transaction details
- Look for emails answerable by natural queries
- Note email IDs for test cases

#### Phase 2: Define Test Cases

[`notes.md`](./notes.md) lines 29-39

- Create array: `{ query: string, expectedEmailId: string }`
- Diverse question types: amounts, dates, reasons, people, locations
- Natural language queries users would actually ask
- Each query maps to single most relevant email
- Example: "How much was mortgage pre-approved for?" → email with £350k
- Edge cases: synonyms, partial info, multi-hop reasoning

#### Phase 3: Import Search Algorithm

- Import search from project work (lesson 2.2)
- Or copy BM25 + embeddings + RRF implementation
- Search returns: `Array<{ email: Email; score: number }>` sorted by relevance
- Same algorithm powering actual assistant
- Testing what users experience

#### Phase 4: Build Evalite Suite

[`notes.md`](./notes.md) lines 59-79

- `data: async () => testCases` - loads test array
- `task: async (testCase) => await search(testCase.query)` - runs search
- Scorer finds position of expected email in results
- Graduated scoring rewards near-misses:
  - Position 0 = 1.0 (perfect)
  - Positions 1-4 = 0.5 (close)
  - Not in top 5 = 0.0 (miss)
- Position-based better than binary: recognizes partial success

#### Phase 5: Customize UI Columns

[`notes.md`](./notes.md) lines 81-124

- `columns` function customizes Evalite display
- Show: query, expected email ID, actual position
- Quick debugging: see which queries failing
- Example: "Position: #3" = 0.5 score, retrievable but not optimal
- https://www.evalite.dev/guides/customizing-the-ui

#### Phase 6: Run & Analyze

```bash
pnpm evalite
```

- View results in Evalite UI
- Per-query scores + overall accuracy
- Identify patterns:
  - Which question types fail?
  - Keyword vs semantic queries?
  - Amount/date extraction vs reasoning queries?
- Tune search params based on failures
- Re-run after changes, verify improvement

### Production Benefits

- Catch retrieval regressions before users notice
- Benchmark different search approaches objectively
- Tune k (top N results) confidently
- Test BM25 vs embeddings vs RRF variations
- Validate reranking effectiveness
- Document search quality for stakeholders
- Foundation for A/B testing search changes

### Next Up

Lesson 6.4: comparing semantic search vs agentic search using same eval framework. Test answer quality, not just retrieval mechanism.
