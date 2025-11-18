Right now, the search page in your app has a very basic search algorithm. It just checks if the `subject`, `from`, or `content` includes the query text. No ranking, no intelligence, nothing fancy.

But search is one of the most important features in any application. A dumb search makes users frustrated. A smart search makes them happy.

Over the next few exercises, you're going to transform this basic search into something powerful. You'll implement [BM25](/PLACEHOLDER/bm25-algorithm), [embeddings](/PLACEHOLDER/embeddings-concept), and [re-ranking](/PLACEHOLDER/reranking-concept) to make the search truly intelligent.

## Adding BM25 Search

<!-- VIDEO -->

Let's start by adding BM25 search to the search page.

### Steps To Complete

#### Adding the `okapibm25` package

- [ ] Add the `okapibm25` package to the project

```bash
pnpm add okapibm25
```

#### Creating the `searchWithBM25` function

- [ ] Next, create a new file called `search.ts` in the `src/app` directory, with a `searchWithBM25` function that takes a list of keywords and a list of emails.

<Spoiler>

```typescript
// src/app/search.ts
export async function searchWithBM25(keywords: string[], emails: Email[]) {
  // Combine subject + body for richer text corpus
  const corpus = emails.map((email) => `${email.subject} ${email.body}`);

  // BM25 returns score array matching corpus order
  const scores: number[] = (BM25 as any)(corpus, keywords);

  // Map scores to emails, sort descending
  return scores
    .map((score, idx) => ({ score, email: emails[idx] }))
    .sort((a, b) => b.score - a.score);
+}
```

</Spoiler>

#### Colocating the Search Functionality

- [ ] Let's take the existing `loadEmails` function, and the `Email` interface, and move them to the `search.ts` file.

<Spoiler>

```typescript
// src/app/search.ts

export async function loadEmails(): Promise<Email[]> {
  const filePath = path.join(
    process.cwd(),
    'data',
    'emails.json',
  );
  const fileContent = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

interface Email {
  id: string;
  threadId: string;
  from: string;
  to: string | string[];
  cc?: string[];
  subject: string;
  body: string;
  timestamp: string;
  inReplyTo?: string;
  references?: string[];
  labels?: string[];
  arcId?: string;
  phaseId?: number;
}
```

</Spoiler>

#### Updating the Search Page

- [ ] Let's update the search page to use the new `searchWithBM25` function. First, we'll need to import the `loadEmails` function and the `searchWithBM25` function.

```typescript
// src/app/search/page.tsx

import { loadEmails, searchWithBM25 } from '../search';
```

- [ ] Next, let's update the search page to use the new `searchWithBM25` function. We'll need to call the function with the query and the list of emails.

<Spoiler>

```typescript
// src/app/search/page.tsx

const emailsWithScores = await searchWithBM25(
  query.toLowerCase().split(' '),
  allEmails,
);
```

</Spoiler>

- [ ] Next, we'll need to change some code in `transformedEmails` to use the new `emailsWithScores` array:

<Spoiler>

```typescript
const transformedEmails = emailsWithScores.map(
  ({ email, score }) => ({
    id: email.id,
    from: email.from,
    subject: email.subject,
    preview: email.body.substring(0, 100) + '...',
    content: email.body,
    date: email.timestamp,
    score: score,
  }),
);
```

</Spoiler>

- [ ] We'll also need to sort them by score, not date:

<Spoiler>

```typescript
const transformedEmails = emailsWithScores
  .map(({ email, score }) => ({
    id: email.id,
    from: email.from,
    subject: email.subject,
    preview: email.body.substring(0, 100) + '...',
    content: email.body,
    date: email.timestamp,
    score: score,
  }))
  // Sorted by score, descending
  .sort((a, b) => b.score - a.score);
```

</Spoiler>

- [ ] Finally, we'll need to remove the existing filtering, and just filter on the score:

<Spoiler>

```typescript
const filteredEmails = query
  ? transformedEmails.filter((email) => email.score > 0)
  : transformedEmails;
```

</Spoiler>

#### Testing

- [ ] You should be able to test the search page by running the development server and searching for a query.

```bash
pnpm dev
```

- [ ] You should see the search results sorted by score, descending!

## Embeddings Cache

<!-- VIDEO -->

Let's implement a system for generating and caching embeddings so we don't regenerate them unnecessarily.

### Steps To Complete

#### Creating the embedding cache infrastructure

- [ ] Add imports to `src/app/search.ts` for the embedding functionality:

```typescript
// src/app/search.ts
import { embedMany } from 'ai';
import { google } from '@ai-sdk/google';
```

#### Setting up cache constants and helpers

- [ ] Add cache configuration constants and a helper function to get the embedding file path:

<Spoiler>

```typescript
// src/app/search.ts

const CACHE_DIR = path.join(process.cwd(), 'data', 'embeddings');

const CACHE_KEY = 'google-text-embedding-004';

const getEmbeddingFilePath = (id: string) =>
  path.join(CACHE_DIR, `${CACHE_KEY}-${id}.json`);
```

</Spoiler>

#### Implementing the `loadOrGenerateEmbeddings` function

- [ ] Create the `loadOrGenerateEmbeddings` function that loads cached embeddings or generates new ones. It should take in a list of emails and return a list of email IDs and their embeddings.

<Spoiler>

```typescript
// src/app/search.ts

export async function loadOrGenerateEmbeddings(
  emails: Email[],
): Promise<{ id: string; embedding: number[] }[]> {
  // Ensure cache directory exists
  await fs.mkdir(CACHE_DIR, { recursive: true });

  const results: { id: string; embedding: number[] }[] = [];
  const uncachedEmails: Email[] = [];

  // Check cache for each email
  for (const email of emails) {
    try {
      const cached = await fs.readFile(
        getEmbeddingFilePath(email.id),
        'utf-8',
      );
      const data = JSON.parse(cached);
      results.push({ id: email.id, embedding: data.embedding });
    } catch {
      // Cache miss - need to generate
      uncachedEmails.push(email);
    }
  }

  // Generate embeddings for uncached emails in batches of 99
  if (uncachedEmails.length > 0) {
    console.log(
      `Generating embeddings for ${uncachedEmails.length} emails`,
    );

    const BATCH_SIZE = 99;
    for (let i = 0; i < uncachedEmails.length; i += BATCH_SIZE) {
      const batch = uncachedEmails.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
          uncachedEmails.length / BATCH_SIZE,
        )}`,
      );

      const { embeddings } = await embedMany({
        model: google.textEmbeddingModel('text-embedding-004'),
        values: batch.map((e) => `${e.subject} ${e.body}`),
      });

      // Write batch to cache
      for (let j = 0; j < batch.length; j++) {
        const email = batch[j];
        const embedding = embeddings[j];

        await fs.writeFile(
          getEmbeddingFilePath(email.id),
          JSON.stringify({ id: email.id, embedding }),
        );

        results.push({ id: email.id, embedding });
      }
    }
  }

  return results;
}
```

</Spoiler>

#### Updating the search page to use embeddings

- [ ] Update the imports in `src/app/search/page.tsx`:

```typescript
// src/app/search/page.tsx
import {
  loadEmails,
  loadOrGenerateEmbeddings,
  searchWithBM25,
} from '../search';
```

- [ ] Call `loadOrGenerateEmbeddings` on page load to generate and cache embeddings:

<Spoiler>

```typescript
// src/app/search/page.tsx

const allEmails = await loadEmails();

const embeddings = await loadOrGenerateEmbeddings(allEmails);

console.log('Email embeddings loaded:', embeddings.length);
```

</Spoiler>

#### Testing

- [ ] Run the development server and navigate to `/search`:

```bash
pnpm dev
```

- [ ] You should see embeddings being generated for all emails on first load, with console logs showing batch progress.

- [ ] Refresh the page—embeddings should now load from cache instantly without regenerating.

## Embeddings Search

<!-- VIDEO -->

Let's implement semantic search using embeddings and cosine similarity.

### Steps To Complete

#### Updating imports in `search.ts`

- [ ] Update the imports in `src/app/search.ts` to include `embed` and `cosineSimilarity` from the `ai` package

```typescript
import { embed, embedMany, cosineSimilarity } from 'ai';
```

#### Creating the `searchWithEmbeddings` function

- [ ] Add a new `searchWithEmbeddings` function to `src/app/search.ts` that takes a query string and list of emails

<Spoiler>

```typescript
export async function searchWithEmbeddings(
  query: string,
  emails: Email[],
) {
  // Load cached embeddings
  const emailEmbeddings = await loadOrGenerateEmbeddings(emails);

  // Generate query embedding
  const { embedding: queryEmbedding } = await embed({
    model: google.textEmbeddingModel('text-embedding-004'),
    value: query,
  });

  // Calculate similarity scores
  const results = emailEmbeddings.map(({ id, embedding }) => {
    const email = emails.find((e) => e.id === id)!;
    const score = cosineSimilarity(queryEmbedding, embedding);
    return { score, email };
  });

  console.log('Results:', results.length);

  // Sort by similarity descending
  return results.sort((a, b) => b.score - a.score);
}
```

</Spoiler>

#### Updating the search page

- [ ] Update the imports in `src/app/search/page.tsx` to import `searchWithEmbeddings` instead of `searchWithBM25`

```typescript
import { loadEmails, searchWithEmbeddings } from '../search';
```

- [ ] Remove the line that loads embeddings manually and replace the BM25 search call with `searchWithEmbeddings`

<Spoiler>

```typescript
const emailsWithScores = await searchWithEmbeddings(
  query,
  allEmails,
);
```

</Spoiler>

#### Testing semantic search

- [ ] Run the development server and test with semantic queries like "really nice email about climbing"

```bash
pnpm dev
```

- [ ] You should see emails ranked by semantic relevance, even if they don't contain exact keyword matches

## Adding RRF Search

<!-- VIDEO -->

Let's implement Reciprocal Rank Fusion (RRF), a rank fusion algorithm that combines BM25 and embeddings search results using position-based scoring.

### Steps To Complete

#### Creating the Reciprocal Rank Fusion function

- [ ] In `src/app/search.ts`, add a constant for the RRF parameter and implement the `reciprocalRankFusion` function that combines multiple ranking lists using position-based scoring.

<Spoiler>

```typescript
const RRF_K = 60;

export function reciprocalRankFusion(
  rankings: { email: Email; score: number }[][],
): { email: Email; score: number }[] {
  const rrfScores = new Map<string, number>();
  const emailMap = new Map<string, Email>();

  // Process each ranking list (BM25 and embeddings)
  rankings.forEach((ranking) => {
    ranking.forEach((item, rank) => {
      const currentScore = rrfScores.get(item.email.id) || 0;

      // Position-based scoring: 1/(k+rank)
      const contribution = 1 / (RRF_K + rank);
      rrfScores.set(item.email.id, currentScore + contribution);

      emailMap.set(item.email.id, item.email);
    });
  });

  // Sort by combined RRF score descending
  return Array.from(rrfScores.entries())
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([emailId, score]) => ({
      score,
      email: emailMap.get(emailId)!,
    }));
}
```

</Spoiler>

#### Creating the `searchWithRRF` function

- [ ] In `src/app/search.ts`, add a `searchWithRRF` function that combines BM25 and embeddings rankings using reciprocal rank fusion.

<Spoiler>

```typescript
export const searchWithRRF = async (
  query: string,
  emails: Email[],
) => {
  const bm25Ranking = await searchWithBM25(
    query.toLowerCase().split(' '),
    emails,
  );
  const embeddingsRanking = await searchWithEmbeddings(
    query,
    emails,
  );
  const rrfRanking = reciprocalRankFusion([
    bm25Ranking,
    embeddingsRanking,
  ]);
  return rrfRanking;
};
```

</Spoiler>

#### Updating the search page import

- [ ] In `src/app/search/page.tsx`, update the import to include the new `searchWithRRF` function.

```typescript
import {
  loadEmails,
  searchWithEmbeddings,
  searchWithRRF,
} from '../search';
```

#### Using RRF in the search page

- [ ] In `src/app/search/page.tsx`, replace the call to `searchWithEmbeddings` with `searchWithRRF`.

<Spoiler>

```typescript
const emailsWithScores = await searchWithRRF(query, allEmails);
```

</Spoiler>

#### Testing

- [ ] Start the development server to test your changes.

```bash
pnpm dev
```

- [ ] Navigate to the search page and try searching for a query (like "climbing").

- [ ] Verify that results now combine both BM25 and embeddings rankings, producing a fused set of results that leverage both search methods.
