In the previous exercise, we discussed how different search algorithms need different inputs to work best.

The process of transforming user input into optimized queries for each algorithm is called query rewriting. In this exercise, we're going to implement this in a chat application that searches emails.

Instead of just generating keywords, we'll also generate a search query. This gives us a targeted search term for semantic search instead of passing the entire conversation history, which can be too diffuse.

## Steps To Complete

### Implementing Query Rewriting

- [ ] Understand the difference between keywords and search queries

Keywords work well for exact terminology in [BM25](/PLACEHOLDER/bm25-search). Search queries work better for [semantic search](/PLACEHOLDER/semantic-search) because they can be more general and conceptual. The same user question needs to be rewritten differently for each search method.

- [ ] Navigate to `api/chat.ts` and locate the [`generateObject`](/PLACEHOLDER/generate-object) call with the TODO comment

This is where we generate keywords for [BM25](/PLACEHOLDER/bm25-search). We're going to expand this to also generate a search query.

```ts
// TODO: Change the generateObject call so that it generates a search query in
// addition to the keywords. This will be used for semantic search, which will be a
// big improvement over passing the entire conversation history.
const keywords = await generateObject({
  model: google('gemini-2.5-flash'),
  system: `You are a helpful email assistant, able to search emails for information.
    Your job is to generate a list of keywords which will be used to search the emails.
  `,
  schema: z.object({
    keywords: z
      .array(z.string())
      .describe(
        'A list of keywords to search the emails with. Use these for exact terminology.',
      ),
  }),
  messages: convertToModelMessages(messages),
});
```

- [ ] Update the system prompt to explain that the LLM should generate both keywords and a search query

Add information about generating a search query for semantic search. Explain that the search query can be more general than the keywords because it will be used with embeddings rather than keyword matching.

- [ ] Add a `searchQuery` field to the [schema](/PLACEHOLDER/zod-schema) object

```ts
schema: z.object({
  keywords: z
    .array(z.string())
    .describe(
      'A list of keywords to search the emails with. Use these for exact terminology.',
    ),
  // Add searchQuery field here
}),
```

- [ ] Define the `searchQuery` field using [`z.string()`](/PLACEHOLDER/zod-string)

- [ ] Add a [`.describe()`](/PLACEHOLDER/zod-describe) call to explain that this query will be used for semantic search

Explain that it can use broader terms compared to the exact keywords. This helps the LLM understand when and how to use this field.

- [ ] Locate the `searchEmails` function call in `api/chat.ts`

```ts
const searchResults = await searchEmails({
  keywordsForBM25: keywords.object.keywords,
  embeddingsQuery: TODO,
});
```

This function combines results from both search methods using the RRF algorithm.

- [ ] Pass `keywords.object.searchQuery` as the `embeddingsQuery` parameter

```ts
const searchResults = await searchEmails({
  keywordsForBM25: keywords.object.keywords,
  embeddingsQuery: keywords.object.searchQuery,
});
```

This sends the generated search query to the semantic search algorithm. The keywords go to BM25, while the search query goes to embeddings.

### Testing Your Implementation

- [ ] Run the application using `pnpm run dev`

Wait for "Embedding Emails" and "Embedding complete" messages. The server will start on `localhost:3000`.

- [ ] Test with the default query

Try "What did David say about the mortgage application?"

- [ ] Check the browser console to see the generated keywords and search query

Look for the logged `keywords.object` which will show both fields:

```ts
console.log('Keywords:', keywords.object.keywords);
console.log('Search Query:', keywords.object.searchQuery);
```

Verify that the keywords are specific terms from the conversation. Verify that the search query is a broader, more semantic version.

- [ ] Check which email IDs were returned in the console

The top 5 results should be relevant to David and mortgage applications. The combination of BM25 and semantic search should provide better results than either alone.

- [ ] Try different queries to test the query rewriting

Test with:

- "What properties was Sarah interested in?"
- "Tell me about the house hunting process"

Observe how the LLM generates different keywords versus search queries for each scenario.

- [ ] Verify that the AI assistant answers questions accurately using the retrieved emails

Check that sources are cited using markdown links to email subjects. Confirm that the answers are based on the retrieved email content rather than the model's training data.
