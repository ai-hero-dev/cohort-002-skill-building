<!-- AI Generated, review carefully -->

BM25 (Best Match 25) is a keyword-based search algorithm that ranks documents based on term frequency and document length normalization.

It's the foundation for many search engines and retrieval systems, working well when you need to match specific keywords or phrases.

## How BM25 Works

BM25 scores documents by:

1. **Term Frequency**: How often keywords appear in a document
2. **Inverse Document Frequency**: How rare keywords are across all documents (rare terms score higher)
3. **Document Length Normalization**: Prevents longer documents from being unfairly favored

The algorithm returns a score for each document. Higher scores indicate better matches.

## The Code

In [`main.ts`](./main.ts), we load emails and use the `okapibm25` package to score them:

```ts
const searchEmails = (emails: Email[], keywords: string[]) => {
  const scores: number[] = (BM25.default as any)(
    emails.map((email) => `${email.subject} ${email.body}`),
    keywords,
  );

  return scores
    .map((score, index) => ({
      score,
      email: emails[index]!,
    }))
    .sort((a, b) => b.score - a.score);
};
```

We combine subject and body text, pass keywords to BM25, and get back scores for ranking.

## Try It Out

The playground includes different keyword combinations you can test:

```ts
// TODO: Try different keyword combinations:
//
// ['mortgage', 'pre-approval']
// ['house', 'Chorlton', 'Victorian']
// ['freelance', 'consulting', 'income']
// ['offer', 'property', 'accepted']
const keywords = ['mortgage', 'pre-approval'];
```

Change the `keywords` array and see how results change. Notice:

- Exact keyword matches score highest
- Documents with multiple keywords rank better
- Documents without any keywords score zero and are filtered out

## Strengths and Limitations

**Strengths:**

- Fast and efficient
- Works well for exact keyword matching
- No external API calls or embeddings needed
- Deterministic results

**Limitations:**

- Doesn't understand semantic meaning (e.g., "home" vs "house")
- Requires exact or similar keywords to find relevant results
- Can't handle synonyms or related concepts

Later exercises will explore semantic search (embeddings) and hybrid approaches (rank fusion) that address these limitations.

## Steps To Complete

- [ ] Run the explainer and observe the top results for the default keywords

- [ ] Try each of the suggested keyword combinations in the TODO comment

- [ ] Experiment with your own keyword combinations to search the email dataset

- [ ] Notice which emails score zero and get filtered out

- [ ] Compare how different combinations of keywords affect the ranking
