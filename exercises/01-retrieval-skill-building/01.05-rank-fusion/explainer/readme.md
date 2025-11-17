Search algorithms have different strengths. BM25 excels at exact keyword matching. Embeddings are great at semantic, meaning-based matching. But they can't be combined directly.

The problem is that BM25 returns large numbers like 4.5 or 6, while semantic search returns values between 0 and 1. If you combined them directly, BM25 would dominate the results completely.

Reciprocal Rank Fusion solves this by normalizing scores from different ranking systems into a coherent combined rank. This playground lets you explore how the three approaches compare.

## Steps To Complete

### Understanding Rank Fusion

- [ ] Learn why BM25 and semantic search scores can't be directly combined

BM25 returns larger numbers like 4.5 or 6. Semantic search returns numbers between 0 and 1. Combined directly, BM25 dominates.

| Algorithm | Score Range | Issue                    |
| --------- | ----------- | ------------------------ |
| BM25      | 2-8+        | Large values dominate    |
| Semantic  | 0-1         | Small values get ignored |

- [ ] Review the `reciprocalRankFusion` function in `api/utils.ts`

This function takes multiple ranking systems and produces a single normalized ranking:

```ts
const RRF_K = 60;

export function reciprocalRankFusion(
  rankings: { email: Email; score: number }[][],
): { email: Email; score: number }[] {
  const rrfScores = new Map<string, number>();
  const documentMap = new Map<
    string,
    { email: Email; score: number }
  >();

  rankings.forEach((ranking) => {
    ranking.forEach((doc, rank) => {
      const currentScore = rrfScores.get(doc.email.id) || 0;
      const contribution = 1 / (RRF_K + rank);
      rrfScores.set(doc.email.id, currentScore + contribution);
      documentMap.set(doc.email.id, doc);
    });
  });

  return Array.from(rrfScores.entries())
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([emailId, score]) => ({
      email: documentMap.get(emailId)!.email,
      score,
    }));
}
```

- [ ] Understand the `RRF_K` constant

The `RRF_K` constant controls how aggressively each ranking system influences the final result:

| K Value     | Behavior                                            | Use Case                       |
| ----------- | --------------------------------------------------- | ------------------------------ |
| Higher (60) | Forgiving - algorithms contribute less aggressively | Default, balanced approach     |
| Lower (30)  | Aggressive - algorithms contribute more heavily     | When you want stronger signals |

The value 60 is the [commonly used default](/PLACEHOLDER/reciprocal-rank-fusion-tuning) for [reciprocal rank fusion](/PLACEHOLDER/reciprocal-rank-fusion).

### Testing the Playground

- [ ] Start the dev server

```bash
pnpm run dev
```

- [ ] Open `localhost:3000` and search for "mortgage application"

You'll see emails with BM25, semantic, and RRF scores displayed on each result card.

- [ ] Compare results by clicking different ordering buttons

Each button shows how different algorithms rank the same results:

- Click "BM25" to see exact keyword matching
- Click "Semantic" to see meaning-based matching
- Click "RRF" to see the combined ranking

- [ ] Search for "encouraging message from mum"

Notice how the algorithms rank these results differently:

- **Semantic search** ranks emotionally related emails higher (house hunting setback thread appears at ~63%)
- **BM25** struggles with this type of query, focusing on literal keyword matches
- **RRF** creates a balanced result combining both approaches

- [ ] Experiment with different queries to discover patterns

Test various search types to see which algorithms excel:

- Keyword-heavy searches: BM25 excels
- Meaning-based searches: Semantic search excels
- Mixed queries: RRF balances both approaches

Notice how certain phrases work better in certain ranking systems than others.

### Verify the Implementation

- [ ] Check how `searchEmails` combines both algorithms in `api/search.ts`

The search function calls both ranking systems and fuses them together:

```ts
export const searchEmails = async (opts: {
  keywordsForBM25: string[];
  embeddingsQuery: string;
}): Promise<EmailWithScores[]> => {
  const bm25SearchResults = await searchEmailsViaBM25(
    opts.keywordsForBM25,
  );

  const embeddingsSearchResults =
    await searchEmailsViaEmbeddings(opts.embeddingsQuery);

  const rrfResults = reciprocalRankFusion([
    bm25SearchResults,
    embeddingsSearchResults,
  ]);

  // ... rest of function
};
```

- [ ] Verify RRF scoring by examining email cards

Each card displays all three scores so you can see how they balance:

- Check that the RRF score falls between the BM25 and semantic scores
- Try different queries and verify the results make sense
- Notice how RRF stabilizes outliers where one algorithm ranks something unusually high or low
