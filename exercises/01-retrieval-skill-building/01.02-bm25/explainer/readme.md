You might think we're going to start with embeddings for retrieval. They've been fashionable for the last couple of years, and many people associate them with LLM retrieval.

Instead, we're going to start with something much simpler and incredibly useful: [BM25](/PLACEHOLDER/bm25-algorithm). It's a keyword search algorithm that's been running in production search engines for years.

BM25 is cheaper to run than embeddings and more practical for many retrieval tasks. It's the perfect foundation before moving to more complex approaches.

## Steps To Complete

### Understanding BM25

- [ ] Learn what BM25 is and why it's useful for retrieval

[BM25](/PLACEHOLDER/bm25-algorithm) is a keyword search algorithm that balances simplicity with effectiveness. Unlike embedding-based approaches, it requires no model training and runs with minimal overhead.

- [ ] Understand the three factors that BM25 uses to score documents

![How Does BM25 Work?](./how-does-bm25-work.png)

BM25 evaluates documents using three key metrics:

| Factor                               | Purpose                                 | Impact                                               |
| ------------------------------------ | --------------------------------------- | ---------------------------------------------------- |
| **Term Frequency**                   | How often keywords appear in a document | Documents with more keyword matches score higher     |
| **Inverse Document Frequency (IDF)** | Rarity of the keyword across the corpus | Rare terms score higher than common terms            |
| **Length Normalization**             | Adjusts for document length             | Prevents longer documents from automatically winning |

- [ ] Understand Term Frequency

Term Frequency measures how often your keywords appear in a document. A document mentioning "mortgage" five times scores higher than one mentioning it once.

Very common words can dominate across the entire corpus, which is why IDF is needed.

- [ ] Understand Inverse Document Frequency (IDF)

IDF prevents common terms from dominating the scoring. A keyword appearing in only a few documents is more meaningful than one appearing everywhere.

"The" appears in nearly every document and scores low. "Mortgage" appears in fewer documents and scores high.

- [ ] Understand Length Normalization

Length Normalization prevents longer documents from automatically scoring higher just because they contain more words.

Without this, a 10,000-word document would almost always rank above a 100-word document, regardless of relevance.

### Exploring the BM25 Playground

- [ ] Start the dev server by running `pnpm dev` and select this exercise

- [ ] Review the dataset in the playground

The playground contains 150 curated emails. Each email has a subject line and body text that can be searched.

- [ ] Test basic keyword searches

Try searching for "David mortgage" (two separate keywords). Observe how emails are ranked by their [BM25](/PLACEHOLDER/bm25-algorithm) scores.

Email #1 might score 5.5, Email #2 might score 4.8, and so on. Higher scores mean more relevant matches.

- [ ] Test different search queries to understand BM25 behavior

Search for "survey reports" and observe the results. Try other keyword combinations to see how they're ranked.

Notice which emails rank at the top and which fall to the bottom. Patterns will emerge about what [BM25](/PLACEHOLDER/bm25-algorithm) considers relevant.

- [ ] Identify weaknesses in BM25

Search for the word "home" and observe if results include semantically similar words like "house".

[BM25](/PLACEHOLDER/bm25-algorithm) only matches exact keywords, not synonyms or related terms. This is its biggest limitation compared to embeddings-based approaches.

### Understanding the Implementation

- [ ] Examine the `explainer/api/emails.ts` file to see how BM25 is implemented

The `searchEmails` function demonstrates the core algorithm:

```ts
const searchEmails = (
  emails: Email[],
  keywords: string[],
): { email: Email; score: number }[] => {
  const scores: number[] = (BM25 as any)(
    emails.map((email) =>
      `${email.subject} ${email.body}`.toLowerCase(),
    ),
    keywords.map((k) => k.toLowerCase()),
  );

  return scores
    .map((score, index) => ({
      score,
      email: emails[index]!,
    }))
    .sort((a, b) => b.score - a.score);
};
```

This function combines the `subject` and `body`, converts everything to lowercase, and passes both the documents and keywords to the [BM25](/PLACEHOLDER/bm25-algorithm) implementation.

- [ ] Note how the implementation combines email subject and body

Content is converted to lowercase before being passed to [BM25](/PLACEHOLDER/bm25-algorithm). Keywords are also normalized to lowercase.

Results are sorted by score in descending order, so the most relevant emails appear first.

- [ ] Review how the API endpoint uses the search function

The `GET` route shows the complete flow from search query to response:

```ts
export const GET = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const search = url.searchParams.get('search') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = 20;

  const emails = await loadEmails();
  let emailsWithScores: { email: Email; score: number }[] = [];

  if (search) {
    // Perform BM25 search
    const keywords = search.split(' ').map((s) => s.trim());
    emailsWithScores = searchEmails(emails, keywords);
  } else {
    // Return all emails with zero scores
    emailsWithScores = emails.map((email) => ({
      email,
      score: 0,
    }));
  }
  // ... rest of pagination and response handling
};
```

- [ ] Observe how search queries are parsed into keywords

The search query is split by spaces into individual keywords, then each is trimmed of whitespace.

All keywords are passed together to [BM25](/PLACEHOLDER/bm25-algorithm), which scores each document against all of them simultaneously.

- [ ] Spend time experimenting with the playground to build intuition

Try various searches to see how different queries perform. Notice patterns in what scores highly.

Pay attention to where [BM25](/PLACEHOLDER/bm25-algorithm) excels (exact keyword matching) and where it falls short (synonyms, semantic understanding, typos).
