BM25 is purely keyword-based matching. It can't understand meaning. If a document mentions "total solar eclipse" but a user searches for "sun blocked by moon", BM25 returns nothing.

Embeddings solve this problem by capturing semantic meaning. They convert text into vectors - long arrays of numbers that represent how an LLM understands the text. Two semantically similar phrases will have similar embeddings, even if they share no keywords.

To search with embeddings, we compare one embedding to another using [cosine similarity](/PLACEHOLDER/cosine-similarity). This mathematical function tells us how close two embeddings are in vector space, giving us a score that represents how similar the search text is to each document.

This is fundamentally different from BM25. Keywords and term frequency don't matter. Only the meaning behind the words.

## Steps To Complete

### Creating And Scoring Embeddings

- [ ] Understand the difference between BM25 and embeddings

BM25 matches exact keywords. Embeddings understand meaning. Review this comparison:

| Approach   | Search Term           | Document              | Match? |
| ---------- | --------------------- | --------------------- | ------ |
| BM25       | "sun blocked by moon" | "total solar eclipse" | ❌ No  |
| Embeddings | "sun blocked by moon" | "total solar eclipse" | ✅ Yes |

- [ ] Review the [Embeddings Overview](/PLACEHOLDER/embeddings-overview) to understand how embeddings work in the AI SDK

- [ ] Navigate to `api/create-embeddings.ts` and locate the `embedLotsOfText` function

This function takes multiple emails and creates an embedding for each one.

```ts
const embedLotsOfText = async (
  emails: Email[],
): Promise<
  {
    id: string;
    embedding: number[];
  }[]
> => {
  // TODO: Implement this function by using the embedMany function
  throw new Error('Not implemented');
};
```

- [ ] Use the [`embedMany`](/PLACEHOLDER/embed-many) function from the AI SDK to create embeddings for multiple emails at once

Pass these parameters:

- `myEmbeddingModel` as the model (or choose a different one)
- An array of strings as `values` - combine each email's `subject` and `body`
- `maxRetries` set to `0` (this helps us catch embedding failures early)

- [ ] Map the results to return objects with each email's `id` and `embedding`

This will be used to look up the embedding for each email later.

- [ ] Locate the `embedOnePieceOfText` function in `api/create-embeddings.ts`

This function embeds the search query itself.

```ts
const embedOnePieceOfText = async (
  text: string,
): Promise<number[]> => {
  // TODO: Implement this function by using the embed function
};
```

- [ ] Use the [`embed`](/PLACEHOLDER/embed) function from the AI SDK to create an embedding for a single piece of text

Pass these parameters:

- `myEmbeddingModel` as the `model`
- The `text` parameter as `value`
- Return the `embedding` from the result

- [ ] Locate the `calculateScore` function in `api/create-embeddings.ts`

This function compares the search query embedding against each email's embedding.

```ts
const calculateScore = (
  queryEmbedding: number[],
  embedding: number[],
): number => {
  // TODO: Implement this function by using the cosineSimilarity function
};
```

- [ ] Use the [`cosineSimilarity`](/PLACEHOLDER/cosine-similarity) function from the AI SDK to compare the two embeddings

Pass `queryEmbedding` first, then `embedding`. Return the similarity score.

### Integrating Into Chat

- [ ] Navigate to `api/chat.ts` and locate the first TODO comment

```ts
// TODO: call the searchEmails function with the
// conversation history to get the search results
const searchResults = TODO;
```

- [ ] Call the `searchEmails` function with the formatted message history

Use `formatMessageHistory(messages)` to convert the [messages](/PLACEHOLDER/messages) array into a string query. This embeds the entire conversation and searches for relevant emails.

- [ ] Locate the second TODO comment

```ts
// TODO: take the top X search results
const topSearchResults = TODO;
```

- [ ] Use the `.slice()` method to get the top 5 search results from the `searchResults` array

### Testing Your Implementation

- [ ] Run the application using `pnpm run dev`

The server will embed all emails on first run. Watch for these messages in the terminal:

```txt
Embedding Emails
Embedding complete
```

- [ ] Open your browser to `localhost:3000`

- [ ] Test the default query "What was Sarah looking for in a house?"

Check the browser console to see which emails were returned. Verify that relevant emails about Sarah's house search appear in the results.

- [ ] Add console logs to see the search results and their scores

```ts
console.log(
  topSearchResults.map(
    (result) => `${result.email.subject} (${result.score})`,
  ),
);
```

- [ ] Try different queries to test semantic search capabilities

Test queries that don't use exact keywords from the emails. Verify that semantically similar emails are returned even without keyword matches. For example:

- Try "looking for a new place to live" for emails about house hunting
- Try "property features" for emails about home specifications
- Try "moving to a new location" for emails about relocation
