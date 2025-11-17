## Steps To Complete

- [ ] Understand what BM25 is and why it's useful for retrieval
  - BM25 is a keyword search algorithm that has been used in production search engines for years
  - It's simpler and more practical than embeddings for many retrieval tasks
  - It's extremely cheap to run computationally

### How BM25 Works

- [ ] Learn the three factors that BM25 uses to score documents

![How Does BM25 Work?](./explainer/how-does-bm25-work.png)

- [ ] Understand **Term Frequency**
  - This measures how often keywords appear in a document
  - Documents with more keyword matches score higher

- [ ] Understand **Inverse Document Frequency (IDF)**
  - This prevents common terms from dominating the scoring
  - Rare terms across the entire corpus score higher than common terms
  - A keyword that appears in only a few documents is more meaningful than one that appears everywhere

- [ ] Understand **Length Normalization**
  - This prevents longer documents from automatically scoring higher
  - Without this, larger documents would dominate simply because they contain more words

### Exploring The BM25 Playground

- [ ] Start the dev server by running `pnpm dev` and select this exercise

- [ ] Review the dataset in the playground
  - The playground contains 150 emails from a larger dataset
  - You can search these emails using keywords

- [ ] Test basic keyword searches
  - Try searching for "David mortgage" (two separate keywords)
  - Observe how emails are ranked by their BM25 scores
  - Note that higher scores indicate more relevant matches

- [ ] Test different search queries to understand BM25's behavior
  - Search for "survey reports" and observe the results
  - Try other keyword combinations to see how they're ranked

- [ ] Identify weaknesses in BM25
  - Search for a word like "home" and note if results don't include synonyms like "house"
  - BM25 only matches exact keywords, not semantically similar terms

### Understanding The Implementation

- [ ] Examine the `explainer/api/emails.ts` file to see how BM25 is implemented

The `searchEmails` function shows how the algorithm works:

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

- [ ] Note how the implementation combines email subject and body
  - The content is converted to lowercase before being passed to BM25
  - Keywords are also converted to lowercase
  - Results are sorted by score in descending order

- [ ] Review how the API endpoint uses the search function in `api/emails.ts`

The `GET` route shows the full flow:

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

- [ ] Observe that the search query is split into individual keywords by spaces
  - Each keyword is trimmed of whitespace
  - All keywords are passed to the BM25 algorithm together

- [ ] Spend time experimenting with the playground to build intuition
  - Try various searches to see how different queries perform
  - Notice patterns in what scores highly
  - Understand where BM25 excels and where it falls short
