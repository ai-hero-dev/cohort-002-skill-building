# BM25 Search Algorithm

## Explainer

### Intro

- BM25 = keyword-based search algorithm. Foundation of modern search engines
- Ranks docs by term frequency, rarity, length normalization
- Works great when users search specific keywords/phrases
- Starting point before diving into semantic search
- Real world use: production search systems everywhere

### Steps To Complete

#### Phase 1: Understanding BM25

- Three scoring factors:
  - Term frequency: how often keywords appear
  - IDF: rare terms score higher across corpus
  - Length normalization: prevents long docs dominating
- Returns numeric score per doc. Higher = better match
- Deeper dive: [Elastic's practical BM25 guide](https://www.elastic.co/blog/practical-bm25-part-2-the-bm25-algorithm-and-its-variables)
- See [`main.ts`](./explainer/main.ts) for implementation

#### Phase 2: Experimenting with Keywords

- Run playground with default keywords `['mortgage', 'pre-approval']`
- Try suggested combos:
  - `['house', 'Chorlton', 'Victorian']` - location + type search
  - `['freelance', 'consulting', 'income']` - multi-keyword income search
  - `['offer', 'property', 'accepted']` - transaction keywords
- Notice: exact matches rank highest, multi-keyword docs better, zero-score filtered

#### Phase 3: Understanding Limitations

- Strengths: fast, deterministic, no API calls, works for exact matching
- Limitations: no semantic understanding
  - "home" vs "house" = different keywords
  - Can't handle synonyms or related concepts
  - Requires knowing exact terms upfront
- Sets up need for embeddings (next lesson)

### Next Up

BM25 great for keyword matching but struggles with meaning. Next: retrieval with BM25 in real chat system - generating keywords from conversations.
