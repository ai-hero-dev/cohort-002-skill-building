# Building a Search Agent

## Learning Goals

Connect search algorithm to conversational agent in personal assistant project. Transform standalone search function into chat-integrated retrieval system using query rewriting, reranking, and custom data parts streaming. Learn critical formatting decisions: explore different email context formats (JSON/markdown/minimal) and monitor token usage impact via `result.usage`. Apply Section 01 retrieval patterns (query optimization, reranking) to production agent flow.

## Steps To Complete

### 1. Create Chat API Route Foundation

Build agent endpoint with `createUIMessageStream` for retrieval-augmented generation.

**Implementation (`src/app/api/chat/route.ts` in project repo):**

```ts
import { google } from '@ai-sdk/google';
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from 'ai';

export const maxDuration = 30;

export type MyMessage = UIMessage<
  unknown,
  {
    'search-results': Array<{
      id: string;
      subject: string;
      from: string;
    }>;
  }
>;

export async function POST(req: Request) {
  const body: { messages: UIMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream<MyMessage>({
    execute: async ({ writer }) => {
      // Query rewriting, search, reranking, and response generation here
    },
  });

  return createUIMessageStreamResponse({ stream });
}
```

**Notes:**

- Custom data part `search-results` streams retrieved emails to frontend before answer
- `MyMessage` type declares available custom parts - maps to `data-search-results` when writing
- `maxDuration: 30` allows time for embedding generation + reranking

### 2. Add Query Rewriting

Generate keywords (BM25) + search query (embeddings) from conversation history using `generateObject`.

**Implementation:**

```ts
import { generateObject, convertToModelMessages } from 'ai';
import { z } from 'zod';

const keywords = await generateObject({
  model: google('gemini-2.0-flash-001'),
  system: `You are a helpful email assistant, able to search emails for information.
    Your job is to generate a list of keywords which will be used to search emails.
    You should also generate a search query for semantic search - can be more general.
  `,
  schema: z.object({
    keywords: z
      .array(z.string())
      .describe('Keywords for exact terminology (BM25 search)'),
    searchQuery: z
      .string()
      .describe('Broader search query for semantic search'),
  }),
  messages: convertToModelMessages(messages),
});

console.dir(keywords.object, { depth: null });
```

**Notes:**

- Based on exercise 01.05 query rewriting pattern
- Generates both keyword array + semantic query in single call
- Console log helps debug query generation quality
- Conversation formatting provides full context to rewriter

### 3. Integrate Search Algorithm

Call search function from lesson 2.2 with generated keywords + query.

**Implementation:**

```ts
import { searchEmails } from './search'; // From lesson 2.2

const searchResults = await searchEmails({
  keywordsForBM25: keywords.object.keywords,
  embeddingsQuery: keywords.object.searchQuery,
});

console.log(
  `Retrieved ${searchResults.length} results from rank fusion`,
);
```

**Notes:**

- `searchEmails` returns rank fusion results (BM25 + embeddings combined)
- Results include email object + RRF score
- Top results typically most relevant, but reranking improves precision

### 4. Add Reranking Step

Pass top 30 results to reranker LLM, return most relevant email IDs only.

**Implementation:**

```ts
const topSearchResultsWithId = searchResults
  .slice(0, 30)
  .map((result, i) => ({
    ...result,
    id: i,
  }));

const topSearchResultsAsMap = new Map(
  topSearchResultsWithId.map((result) => [result.id, result]),
);

const rerankedSearchResults = await generateObject({
  model: google('gemini-2.0-flash-001'),
  system: `You are a search result reranker. Your job is to analyze a list of emails and return only the IDs of the most relevant emails for answering the user's question.

Given a list of emails with their IDs and content, you should:
1. Evaluate how relevant each email is to the user's question
2. Return only the IDs of the most relevant emails

You should be selective and only include emails that are genuinely helpful for answering the question. If an email is only tangentially related or not relevant, exclude its ID.

Return the IDs as a simple array of numbers.`,
  schema: z.object({
    resultIds: z
      .array(z.number())
      .describe('Array of IDs for the most relevant emails'),
  }),
  prompt: `
    Search query:
    ${keywords.object.searchQuery}

    Available emails:
    ${topSearchResultsWithId
      .map((result) =>
        [
          `## ID: ${result.id}`,
          `### From: ${result.email.from}`,
          `### To: ${result.email.to}`,
          `### Subject: ${result.email.subject}`,
          `<content>`,
          result.email.body,
          `</content>`,
        ].join('\n\n'),
      )
      .join('\n\n')}

    Return only the IDs of the most relevant emails for answering the user's question.
  `,
});

const topSearchResults = rerankedSearchResults.object.resultIds
  .map((id) => topSearchResultsAsMap.get(id))
  .filter((result) => result !== undefined);

console.dir(
  topSearchResults.map((result) => result.email.subject),
  { depth: null },
);
```

**Notes:**

- Based on exercise 01.06 reranking pattern
- Token optimization: return IDs not full content (saves output tokens)
- Reranker filters top 30 down to ~5-10 most relevant
- Map-based lookup prevents ID hallucination issues
- LLM reranking trades latency for relevance

### 5. Stream Search Results as Custom Data Part

Write retrieved emails to frontend before generating answer.

**Implementation:**

```ts
writer.write({
  type: 'data-search-results',
  data: topSearchResults.map((result) => ({
    id: result.email.id,
    subject: result.email.subject,
    from: result.email.from,
  })),
});
```

**Notes:**

- Custom data parts enable frontend to display retrieved sources immediately
- Separate from text response - can render in UI independently
- Type safety via `MyMessage` type declaration
- Data streams before LLM generates answer

### 6. Experiment with Email Formatting + Monitor Token Usage

Critical step: test different context formats and observe token consumption.

**Experiment A - Verbose Markdown Format:**

```ts
const answerA = streamText({
  model: google('gemini-2.0-flash-001'),
  system: `You are a helpful email assistant that answers questions based on email content.
    You should use the provided emails to answer questions accurately.
    ALWAYS cite sources using markdown formatting with the email subject as the source.
    Be concise but thorough in your explanations.
  `,
  prompt: [
    '## Conversation History',
    formatMessageHistory(messages),
    '## Email Snippets',
    ...topSearchResults.map((result, i) => {
      const from = result.email?.from || 'unknown';
      const to = result.email?.to || 'unknown';
      const subject = result.email?.subject || `email-${i + 1}`;
      const body = result.email?.body || '';

      return [
        `### 📧 Email ${i + 1}: [${subject}](#${subject.replace(/[^a-zA-Z0-9]/g, '-')})`,
        `**From:** ${from}`,
        `**To:** ${to}`,
        body,
        '---',
      ].join('\n\n');
    }),
    '## Instructions',
    "Based on the emails above, please answer the user's question. Always cite your sources using the email subject in markdown format.",
  ].join('\n\n'),
});

console.log('Format A (Verbose Markdown) usage:');
console.log(await answerA.usage);
```

**Experiment B - Minimal Format:**

```ts
const answerB = streamText({
  model: google('gemini-2.0-flash-001'),
  system: `Email assistant. Answer using provided emails. Cite sources.`,
  prompt: [
    'History:',
    formatMessageHistory(messages),
    'Emails:',
    ...topSearchResults.map((result, i) => {
      return `${i + 1}. From: ${result.email.from} | Subject: ${result.email.subject}\n${result.email.body}`;
    }),
  ].join('\n'),
});

console.log('Format B (Minimal) usage:');
console.log(await answerB.usage);
```

**Experiment C - JSON Format:**

```ts
const answerC = streamText({
  model: google('gemini-2.0-flash-001'),
  system: `Email assistant. Answer using provided emails. Cite sources.`,
  prompt: [
    'Conversation:',
    JSON.stringify(messages, null, 2),
    'Retrieved Emails:',
    JSON.stringify(
      topSearchResults.map((r) => ({
        from: r.email.from,
        subject: r.email.subject,
        body: r.email.body,
      })),
      null,
      2,
    ),
  ].join('\n'),
});

console.log('Format C (JSON) usage:');
console.log(await answerC.usage);
```

**Notes:**

- **Critical insight**: Formatting massively impacts token usage
- `result.usage` shows `{ promptTokens, completionTokens, totalTokens }`
- Verbose markdown: more readable but higher token cost
- Minimal format: saves tokens but may reduce LLM comprehension
- JSON: structured but often highest token count due to syntax overhead
- No universal best format - depends on model, data, and accuracy requirements
- Monitor usage in production to optimize cost vs quality tradeoff
- Example output: Format A might use 3,500 tokens, Format B 2,200 tokens
- For 547 email dataset with 5 retrieved emails, difference can be 30-40%

### 7. Stream Final Answer

Merge chosen format's stream into response with citations.

**Implementation:**

```ts
// After choosing optimal format based on usage experiments
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
    ...topSearchResults.map((result, i) => {
      const from = result.email?.from || 'unknown';
      const to = result.email?.to || 'unknown';
      const subject = result.email?.subject || `email-${i + 1}`;
      const body = result.email?.body || '';

      return [
        `### 📧 Email ${i + 1}: [${subject}](#${subject.replace(/[^a-zA-Z0-9]/g, '-')})`,
        `**From:** ${from}`,
        `**To:** ${to}`,
        body,
        '---',
      ].join('\n\n');
    }),
    '## Instructions',
    "Based on the emails above, please answer the user's question. Always cite your sources using the email subject in markdown format.",
  ].join('\n\n'),
});

writer.merge(answer.toUIMessageStream());
```

**Notes:**

- `writer.merge()` combines custom data parts + text stream
- LLM generates answer with email context in system prompt
- Citations enable source verification
- Answer streams after search results already displayed

## Additional Notes

**Complete Flow:**

1. User sends message
2. Query rewriter generates keywords + search query
3. Search algorithm returns rank fusion results
4. Reranker filters to most relevant emails
5. Search results stream to frontend via custom data part
6. LLM generates answer with email context
7. Answer streams to frontend with citations

**Formatting Importance:**

- Token usage directly impacts cost and latency
- Different formats can vary by 30-50% token count
- Test multiple formats with real data before production
- Use `await result.usage` to measure impact
- Consider model-specific formatting preferences (some models parse markdown better, others prefer JSON)

**Production Considerations:**

- Cache query rewriting results for identical/similar queries
- Monitor reranking quality - may need fine-tuning or prompt adjustments
- Custom data parts enable progressive UI updates (show sources immediately)
- Consider streaming retrieved emails incrementally if search is slow
- Track token usage in production to detect format inefficiencies

**Comparison to Section 01:**

- 01.05: Standalone query rewriting exercise → now integrated in agent flow
- 01.06: Standalone reranking exercise → now part of RAG pipeline
- New: Custom data parts for frontend streaming
- New: Formatting experiments with token usage monitoring
- New: Multi-step agent orchestration (rewrite → search → rerank → answer)
