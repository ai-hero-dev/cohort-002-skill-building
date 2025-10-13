# Agent-Controlled Search Tools + Context Engineering

## Learning Goals

Convert automatic RAG to agent-driven search orchestration. Agent autonomy over: semantic vs filtered search, metadata vs full content vs full threads, result limits, sender/keyword filters. Apply Anthropic prompt template (task context → background data → rules → ask) for structured system prompts.

## Steps To Complete

### 1. Convert to Tool-Based Agent with Multi-Step Support

Refactor lesson 2.3's automatic flow into tool-calling agent.

**Implementation:**

```ts
import { google } from '@ai-sdk/google';
import { createUIMessageStream, stepCountIs } from 'ai';

const stream = createUIMessageStream<MyMessage>({
  execute: async ({ writer }) => {
    const result = await streamText({
      model: google('gemini-2.0-flash-001'),
      system: getSystemPrompt(), // Context engineering applied later
      messages: convertToModelMessages(messages),
      tools: {
        searchSemanticEmails,
        filterEmails,
        getEmailById,
      },
      stopWhen: stepCountIs(5), // Allow multi-tool workflows
    });

    writer.merge(result.toUIMessageStream());
  },
});
```

**Notes:**

- `stopWhen: stepCountIs(5)` enables agent to chain tool calls
- Agent decides which tools to use based on query
- No automatic query rewriting - agent controls strategy

### 2. Build `searchSemanticEmails` Tool

Refactor lesson 2.3 automatic semantic search into tool.

**Implementation:**

```ts
import { tool } from 'ai';
import { z } from 'zod';

const searchSemanticEmails = tool({
  description: `
    Semantic search using embeddings and keyword matching.
    Returns email metadata only (id, subject, from, to, timestamp).
    Use this for broad conceptual searches.
  `,
  parameters: z.object({
    query: z.string().describe('Search query for semantic matching'),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe('Max results to return'),
  }),
  execute: async ({ query, limit }) => {
    // Query rewriting
    const keywords = await generateObject({
      model: google('gemini-2.0-flash-001'),
      system: `Generate keywords and search query for email search.`,
      schema: z.object({
        keywords: z.array(z.string()),
        searchQuery: z.string(),
      }),
      prompt: query,
    });

    // BM25 + embeddings + RRF from lesson 2.2
    const searchResults = await searchWithRankFusion({
      keywordsForBM25: keywords.object.keywords,
      embeddingsQuery: keywords.object.searchQuery,
    });

    // Reranking from lesson 2.3
    const reranked = await rerank({
      query: keywords.object.searchQuery,
      results: searchResults.slice(0, limit),
    });

    // Return metadata only
    return reranked.slice(0, limit).map((result) => ({
      id: result.email.id,
      subject: result.email.subject,
      from: result.email.from,
      to: result.email.to,
      timestamp: result.email.timestamp,
    }));
  },
});
```

**Notes:**

- Encapsulates entire lesson 2.3 semantic search pipeline
- Returns metadata only - agent must use `getEmailById` for content
- Query rewriting happens inside tool
- Reranking filters top 30 → most relevant

### 3. Build `filterEmails` Tool

Traditional filtering with structured parameters.

**Implementation:**

```ts
const filterEmails = tool({
  description: `
    Filter emails by sender, keywords, or other criteria.
    Returns results based on contentLevel parameter.
    Use this for precise filtering by known attributes.
  `,
  parameters: z.object({
    from: z.string().optional().describe('Filter by sender email'),
    contains: z
      .string()
      .optional()
      .describe('Filter by keyword in subject or body'),
    limit: z.number().optional().default(10).describe('Max results'),
    contentLevel: z
      .enum(['subjectOnly', 'fullContent', 'fullThread'])
      .default('subjectOnly')
      .describe(
        'subjectOnly: just metadata, fullContent: include body, fullThread: entire email thread',
      ),
  }),
  execute: async ({ from, contains, limit, contentLevel }) => {
    const allEmails = await loadEmails();

    // Apply filters
    let filtered = allEmails;

    if (from) {
      filtered = filtered.filter((email) =>
        email.from.toLowerCase().includes(from.toLowerCase()),
      );
    }

    if (contains) {
      const term = contains.toLowerCase();
      filtered = filtered.filter(
        (email) =>
          email.subject.toLowerCase().includes(term) ||
          email.body.toLowerCase().includes(term),
      );
    }

    filtered = filtered.slice(0, limit);

    // Format based on contentLevel
    if (contentLevel === 'subjectOnly') {
      return filtered.map((email) => ({
        id: email.id,
        subject: email.subject,
        from: email.from,
        to: email.to,
        timestamp: email.timestamp,
      }));
    }

    if (contentLevel === 'fullContent') {
      return filtered.map((email) => ({
        id: email.id,
        subject: email.subject,
        from: email.from,
        to: email.to,
        timestamp: email.timestamp,
        body: email.body,
      }));
    }

    if (contentLevel === 'fullThread') {
      // Fetch entire threads for matched emails
      return filtered.map((email) => {
        const thread = getThreadForEmail(email, allEmails);
        return {
          id: email.id,
          subject: email.subject,
          from: email.from,
          to: email.to,
          timestamp: email.timestamp,
          body: email.body,
          thread: thread.map((threadEmail) => ({
            id: threadEmail.id,
            subject: threadEmail.subject,
            from: threadEmail.from,
            timestamp: threadEmail.timestamp,
            body: threadEmail.body,
          })),
        };
      });
    }
  },
});

function getThreadForEmail(email: Email, allEmails: Email[]) {
  if (!email.threadId) return [email];

  return allEmails
    .filter((e) => e.threadId === email.threadId)
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
}
```

**Notes:**

- `contentLevel` union provides granular control over data returned
- `subjectOnly` - metadata scan, minimal tokens
- `fullContent` - include email body for context
- `fullThread` - entire conversation thread via `threadId` matching
- Traditional filters (`from`, `contains`) complement semantic search
- No embeddings/reranking - direct filtering only

### 4. Build `getEmailById` Tool

Fetch individual email by ID after metadata scan.

**Implementation:**

```ts
const getEmailById = tool({
  description: `
    Fetch full email content by ID.
    Use after scanning metadata to get specific email details.
  `,
  parameters: z.object({
    emailId: z.string().describe('Email ID to fetch'),
    includeThread: z
      .boolean()
      .optional()
      .default(false)
      .describe('Include entire email thread if available'),
  }),
  execute: async ({ emailId, includeThread }) => {
    const allEmails = await loadEmails();
    const email = allEmails.find((e) => e.id === emailId);

    if (!email) {
      return { error: 'Email not found' };
    }

    if (!includeThread) {
      return {
        id: email.id,
        subject: email.subject,
        from: email.from,
        to: email.to,
        timestamp: email.timestamp,
        body: email.body,
      };
    }

    // Include thread if requested
    const thread = getThreadForEmail(email, allEmails);
    return {
      id: email.id,
      subject: email.subject,
      from: email.from,
      to: email.to,
      timestamp: email.timestamp,
      body: email.body,
      thread: thread
        .filter((e) => e.id !== email.id) // Exclude main email from thread
        .map((threadEmail) => ({
          id: threadEmail.id,
          subject: threadEmail.subject,
          from: threadEmail.from,
          timestamp: threadEmail.timestamp,
          body: threadEmail.body,
        })),
    };
  },
});
```

**Notes:**

- Targeted retrieval after metadata scan
- `includeThread` option fetches related emails
- Error handling for missing IDs
- Pattern: scan metadata → identify relevant → fetch full content

### 5. Apply Anthropic Prompt Template

Structure system prompt using context engineering pattern.

**Implementation:**

```ts
function getSystemPrompt() {
  return `
<task-context>
You are an email assistant helping users search and understand their email archive. You have access to tools for semantic search, filtering, and retrieving email content. Your goal is to help users find relevant emails and answer questions about their correspondence.
</task-context>

<background-data>
You have access to an email corpus with the following structure:
- id: unique identifier
- subject: email subject line
- from: sender email
- to: recipient email
- timestamp: when email was sent
- body: email content
- threadId: conversation thread identifier (if part of thread)
</background-data>

<rules>
- Use searchSemanticEmails for broad conceptual queries ("vacation plans", "project updates")
- Use filterEmails for precise filtering by sender or keywords
- Start with metadata-only searches (subjectOnly) before fetching full content
- Use getEmailById to fetch specific emails after metadata scan
- Use fullThread contentLevel or includeThread when context from conversation is needed
- Always cite email subjects when referencing specific emails
- If no results found, suggest alternative search strategies
</rules>

<the-ask>
Help the user search their emails and answer their questions using the available tools. Choose the most appropriate search strategy based on their query.
</the-ask>
`.trim();
}
```

**Notes:**

- **Task context** - defines role and capabilities
- **Background data** - email schema for agent understanding
- **Rules** - search strategy guidance (when to use each tool)
- **The ask** - clear instruction to help user
- Template structure leverages LLM's beginning/end bias
- Agent learns when to use semantic vs filter vs targeted retrieval

## Additional Notes

**Agent Decision Making:**

Agent now controls search strategy:

- Semantic search for conceptual queries
- Filtering for known attributes (sender, keywords)
- Metadata scan → targeted retrieval workflow
- Thread fetching when conversation context needed

**Tool Composition Patterns:**

1. `searchSemanticEmails` → identify candidates → `getEmailById` for details
2. `filterEmails` with `subjectOnly` → scan → `getEmailById` for relevant ones
3. `filterEmails` with `fullThread` → get entire conversation at once
4. Multi-step: semantic search → filter results → fetch specific emails

**Context Engineering Benefits:**

- Structured prompts improve tool selection
- Clear rules guide agent behavior
- Background data provides schema understanding
- Template scales to more complex agents