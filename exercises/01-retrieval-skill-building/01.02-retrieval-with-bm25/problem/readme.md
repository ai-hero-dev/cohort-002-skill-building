How do we get an LLM to answer questions based on data that isn't in its training set?

This is a really common problem when building anything with LLMs. You might want to create a question-answering bot that searches internal company docs and provides accurate answers.

For public information, it's easy - just call an API like Brave's or Tavily's that performs a Google search, scrape some websites, and you have what you need.

But what about private information?

In this exercise, we'll implement a simple and cost-effective approach to this problem. Then in later exercises, we'll refine and improve it.

## The Setup

We're building an email search assistant that will:

1. Generate keywords from user questions
2. Search emails using those keywords using the BM25 algorithm
3. Feed the most relevant emails to the LLM to produce accurate answers

Let's examine our setup. We have a POST route handler that receives messages from the user:

```ts
export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: UIMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // TODO: Implement keyword generator
      const keywords = TODO;

      // TODO: Get top search results
      const topSearchResults = TODO;

      // Stream text response based on search results
      // ...
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
```

Our first task is implementing a keyword generator. We need to extract relevant search terms from the conversation history. This is where we'll use `streamObject` from the AI SDK.

For search functionality, we'll use the [BM25 algorithm](https://www.elastic.co/blog/practical-bm25-part-2-the-bm25-algorithm-and-its-variables) (Best Match 25), which ranks documents based on keyword relevance. The system loads emails from the repo's root at `datasets/emails.json` using the [`loadEmails`](./api/bm25.ts) function:

```ts
export const loadEmails = async () => {
  const EMAILS_LOCATION = path.resolve(
    import.meta.dirname,
    '../../../../../datasets/emails.json',
  );

  const content = await readFile(EMAILS_LOCATION, 'utf8');
  const emails: Email[] = JSON.parse(content);

  return emails;
};
```

This function reads all the emails from the dataset and returns an array of email objects containing fields like from, to, subject, body, and more.

The [`searchEmails`](./api/bm25.ts) function then uses these emails for keyword searching:

```ts
export const searchEmails = async (keywords: string[]) => {
  const emails = await loadEmails();

  const scores: number[] = (BM25 as any)(
    emails.map((email) => `${email.subject} ${email.body}`),
    keywords,
  );

  return scores
    .map((score, index) => ({
      score,
      email: emails[index],
    }))
    .sort((a, b) => b.score - a.score);
};
```

This function calculates relevance scores for each email based on our keywords, combining both subject and body content for searching, and returns a sorted list with the most relevant emails first.

After getting search results, we need to select the top X most relevant emails to feed into our LLM. There are many emails, so we need to be selective about how many we pass to the model.

Finally, we'll use these selected emails as context for the LLM to generate an informative response that cites sources from the email threads.

BM25 is a simple starting point for this task - not perfect, but effective for getting started. In future exercises, we'll explore more sophisticated approaches.

## Steps To Complete

- [ ] Implement the keyword generator using `generateObject` with the Google Gemini model
  - Use the provided `KEYWORD_GENERATOR_SYSTEM_PROMPT`
  - Define a schema using Zod that specifies an array of strings for keywords
  - Pass the formatted message history to the prompt

- [ ] Use the `searchEmails` function with the generated keywords
  - Wait for the complete keywords object to be available
  - Select the top most relevant search results (decide how many - 5 to 10 is typical)
  - Use array slicing to get the top results

- [ ] Test your implementation by running the local dev server
  - Try asking different questions about emails to see if the assistant returns relevant emails
  - Verify that the responses include citations from email subjects
  - **Debugging tip**: Use `console.log()` to view the generated keywords in your terminal - this helps you understand what search terms the LLM is creating

## Crash Course Links

- [01.09 - Streaming Objects](../../../../../internal/LESSON_LEARNINGS.md#0109---streaming-objects) - `streamObject()` for structured keyword generation
- [01.06 - Stream Text to UI](../../../../../internal/LESSON_LEARNINGS.md#0106---stream-text-to-ui) - `streamText()` and `createUIMessageStreamResponse()`
- [07.01 - Custom Data Parts](../../../../../internal/LESSON_LEARNINGS.md#0701---custom-data-parts) - `createUIMessageStream()` patterns
