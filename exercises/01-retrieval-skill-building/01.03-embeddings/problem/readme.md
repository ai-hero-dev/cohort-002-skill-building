In the previous exercise, we looked at BM25 as a technique for retrieving documents. While it works fine with keywords, it has limitations. What we ideally want is to take the conversation history and use the LLM's knowledge to figure out what emails are relevant.

This might sound impossible, but it exists - it's called semantic search, and it works via embeddings.

## Semantic Search

An embedding is an LLM's understanding of what a word, phrase, or document means. It's represented as an array of numbers that captures the semantic meaning of text.

You can then compare embeddings against each other to check their relevance. And by doing that, you can find the most relevant emails for a given query.

Our process will work like this:

1. Create embeddings for all emails in your corpus
2. Create an embedding for your query (conversation history)
3. Compare the query embedding against all email embeddings
4. Rank emails by how similar they are (`cosineSimilarity`)

This gives us a more sophisticated search algorithm that leverages the LLM's own understanding of text to find related patterns.

The AI SDK provides helpful functions like [`embed`](https://ai-sdk.dev/docs/reference/ai-sdk-core/embed) and [`embedMany`](https://ai-sdk.dev/docs/reference/ai-sdk-core/embed-many), and allows us to use embedding models with `google.textEmbeddingModel`.

## The Problem

In [`create-embeddings.ts`](./api/create-embeddings.ts), there are three functions we need to implement:

First, we need to implement `embedLotsOfText`. This function will take a list of emails and return a list of embeddings for each email.

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

Then, we need to implement `embedOnePieceOfText`:

```ts
const embedOnePieceOfText = async (
  text: string,
): Promise<number[]> => {
  // TODO: Implement this function by using the embed function
};
```

And finally, `calculateScore`. The [`cosineSimilarity`](https://ai-sdk.dev/docs/reference/ai-sdk-core/cosine-similarity) function from `ai` will be very helpful here.

```ts
const calculateScore = (
  queryEmbedding: number[],
  embedding: number[],
): number => {
  // TODO: Implement this function by using the cosineSimilarity function from 'ai'
};
```

The `searchEmails` function uses these implementations to take a query, create an embedding from it, and calculate scores by comparing it against email embeddings.

## The `/api/chat` Endpoint

Once those are implemented, we need to update the chat route. In [`chat.ts`](./api/chat.ts), we need to modify this section:

```ts
export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: UIMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // TODO: call the searchEmails function with the
      // conversation history to get the search results
      const searchResults = TODO;

      // TODO: take the top X search results
      const topSearchResults = TODO;

      const answer = streamText({
        model: google('gemini-2.0-flash-001'),
        system: `You are a helpful email assistant that answers questions based on email content.
          You should use the provided emails to answer questions accurately.
          ALWAYS cite sources using markdown formatting with the email subject as the source.
          Be concise but thorough in your explanations.
        `,
        prompt: [
          '## Conversation History',
          formatMessageHistory(messages),
          '## Emails',
          // Content continues...
```

You'll need to call the `searchEmails` function with the conversation history, then slice the results to get the top results (let's say top 5).

I recommend logging out the search results to see which emails are being fetched. Once that's done, we should get similar performance to what we had before, except probably a little bit improved.

Good luck with the implementation!

## Steps To Complete

- [ ] Implement the `embedLotsOfText` function in [`create-embeddings.ts`](./api/create-embeddings.ts) using the `embedMany` function from the AI SDK

- [ ] Implement the `embedOnePieceOfText` function using the `embed` function from the AI SDK

- [ ] Implement the `calculateScore` function using the `cosineSimilarity` function from `ai`

- [ ] In [`chat.ts`](./api/chat.ts), call the `searchEmails` function with the conversation history

- [ ] Slice the results to get the top 5 (or another number of your choosing) search results

- [ ] Add a `console.log` to see which emails are being fetched

- [ ] Test your implementation by running the local dev server and asking questions about emails in the chat interface.

- [ ] Observe the console logs to see which emails are being retrieved for your queries - and notice whether the results are better or worse than the BM25 results.

## Crash Course Links

- [01.02 - Choosing Your Model](../../../../../internal/LESSON_LEARNINGS.md#0102---choosing-your-model) - `google.textEmbeddingModel()` usage
- [01.03 - Generating Text](../../../../../internal/LESSON_LEARNINGS.md#0103---generating-text) - AI SDK basics
