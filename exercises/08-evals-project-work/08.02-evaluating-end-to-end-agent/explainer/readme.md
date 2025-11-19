So far, we've tested individual pieces of our system in isolation. But that's only part of the picture.

What really matters is how the entire system performs when working together. Does it retrieve the right information? Does it give accurate answers based on what we've provided?

In this section, we're going to evaluate the most critical aspect: whether our agent tells the truth or hallucinate. We'll run the complete system end-to-end, track what summaries it generates and what tools it calls, and score how correct its answers actually are.

## Moving the agent into its own file

<!-- VIDEO -->

Let's extract the agent logic into its own file to make it evaluatable separately from the rest of the system.

Recommendation: hand-code this commit. This uses `Experimental_Agent` from the `ai` package, which will likely be stable come v6.

### Steps To Complete

#### Importing Experimental_Agent in agent.ts

- [ ] Create a new file `src/app/api/chat/agent.ts` and import `Experimental_Agent as Agent` from the `ai` package. This uses the experimental agent API which allows us to evaluate agents separately from the system.

```typescript
// src/app/api/chat/agent.ts
import {
  Experimental_Agent as Agent,
  LanguageModel,
  StopCondition,
  UIMessage,
} from 'ai';
```

#### Creating the getTools function

- [ ] Export the `getTools` function that creates all three email tools. This keeps tool definitions organized.

<Spoiler>

```typescript
// src/app/api/chat/agent.ts
import { MyMessage } from './route';
import { searchTool } from './search-tool';
import { filterEmailsTool } from './filter-tool';
import { getEmailsTool } from './get-emails-tool';

export const getTools = (messages: UIMessage[]) => ({
  search: searchTool(messages),
  filterEmails: filterEmailsTool,
  getEmails: getEmailsTool,
});
```

</Spoiler>

#### Creating the createAgent function

- [ ] Export the `createAgent` function that instantiates a new `Agent` with the model, tools, stop condition, and system prompt. This function accepts options for messages, model, stopWhen, memories, and relatedChats.

<Spoiler>

```typescript
// src/app/api/chat/agent.ts
import { DB } from '@/lib/persistence-layer';
import { chatToText } from '@/app/utils';
import { memoryToText } from '@/app/memory-search';

const USER_FIRST_NAME = 'Sarah';
const USER_LAST_NAME = 'Chen';

export const createAgent = (opts: {
  messages: MyMessage[];
  model: LanguageModel;
  stopWhen: StopCondition<any>;
  memories: DB.Memory[];
  relatedChats: DB.Chat[];
}) =>
  new Agent({
    model: opts.model,
    tools: getTools(opts.messages),
    stopWhen: opts.stopWhen,
    system: `
<task-context>
You are a personal assistant to ${USER_FIRST_NAME} ${USER_LAST_NAME}. You help with general tasks, questions, and can access ${USER_FIRST_NAME}'s email when needed.
</task-context>

<rules>
- You have THREE email tools available: 'search', 'filterEmails', and 'getEmails'
- Use these tools ONLY when the user explicitly asks about emails or information likely contained in emails
- For general questions, conversations, or tasks unrelated to email, respond naturally without using tools
- When you do need to access emails, follow this multi-step workflow for token efficiency:

  STEP 1 - Browse metadata:
  USE 'filterEmails' when the user wants to:
  - Find emails from/to specific people (e.g., "emails from John", "emails to sarah@example.com")
  - Filter by date ranges (e.g., "emails before January 2024", "emails after last week")
  - Find emails containing exact text (e.g., "emails containing 'invoice'")
  - Any combination of precise filtering criteria

  USE 'search' when the user wants to:
  - Find information semantically (e.g., "emails about the project deadline")
  - Search by concepts or topics (e.g., "discussions about budget")
  - Find answers to questions (e.g., "what did John say about the meeting?")
  - Any query requiring understanding of meaning/context
  - Find people by name or description (e.g., "Mike's biggest client")

  NOTE: 'search' and 'filterEmails' return metadata with snippets only (id, threadId, subject, from, to, timestamp, snippet)

  STEP 2 - Review and select:
  - Review the subjects, metadata, and snippets from search/filter results
  - Identify which specific emails need full content to answer the user's question
  - If snippets contain enough info, answer directly without fetching full content

  STEP 3 - Fetch full content:
  USE 'getEmails' to retrieve full email bodies:
  - Pass array of email IDs you need to read completely
  - Set includeThread=true if you need conversation context (replies, full thread)
  - Set includeThread=false for individual emails

- For email-related queries, NEVER answer from your training data - always use tools first
- If the first query doesn't find enough information, try different approaches or tools
- Only after using tools should you formulate your answer based on the results
</rules>

<memories>
Here are some memories that may be relevant to the conversation:

${opts.memories
  .map((memory) => [
    `<memory id="${memory.id}">`,
    memoryToText(memory),
    '</memory>',
  ])
  .join('\n')}
</memories>

<related-chats>
Here are some related chats that may be relevant to the conversation:

${opts.relatedChats
  .map((chat) => ['<chat>', chatToText(chat), '</chat>'])
  .join('\n')}
</related-chats>

<the-ask>
Here is the user's request. For general questions and conversations, respond naturally. For email-related queries, use the tools and multi-step workflow above.
</the-ask>
        `,
  });
```

</Spoiler>

#### Updating route.ts imports

- [ ] Update `src/app/api/chat/route.ts` to import the agent creation functions from the new agent file and reorganize other imports.

```typescript
// src/app/api/chat/route.ts
import { searchMemories } from '@/app/memory-search';
import { searchMessages } from '@/app/message-search';
import { reflectOnChat } from '@/app/reflect-on-chat';
import { searchForRelatedChats } from '@/app/search-for-related-chats';
import {
  appendToChatMessages,
  createChat,
  getChat,
  updateChatTitle,
} from '@/lib/persistence-layer';
import { google } from '@ai-sdk/google';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  InferUITools,
  safeValidateUIMessages,
  stepCountIs,
  UIMessage,
} from 'ai';
// ADDED: Import agent creation from new agent file
import { createAgent, getTools } from './agent';
import { extractAndUpdateMemories } from './extract-memories';
import { generateTitleForChat } from './generate-title';
```

#### Removing old tool definitions and streamText

- [ ] Remove the `getTools` function definition from `route.ts` since it's now in `agent.ts`. Also remove the `streamText` import since we'll use `agent.stream` instead.

<Spoiler>

```typescript
// DELETED: Remove unused imports
// import { streamText } from "ai";
// import { searchTool } from "./search-tool";
// import { filterEmailsTool } from "./filter-tool";
// import { getEmailsTool } from "./get-emails-tool";

// DELETED: Remove getTools function definition from route.ts
```

</Spoiler>

#### Replacing streamText with agent.stream

- [ ] In the `POST` function, replace the `streamText` call with `createAgent` followed by `agent.stream`. Pass the agent options separately from the stream call.

<Spoiler>

```typescript
// CHANGED: Create agent first
const agent = createAgent({
  memories: memories.map((memory) => memory.item),
  relatedChats: relatedChats.map((chat) => chat.item),
  messages: messageHistoryForLLM,
  model: google('gemini-2.5-flash'),
  stopWhen: stepCountIs(10),
});

// CHANGED: Call agent.stream instead of streamText
const result = agent.stream({
  messages: convertToModelMessages(messageHistoryForLLM),
});
```

</Spoiler>

#### Testing the refactored code

- [ ] Start the development server and send a test message to verify the chat still works as expected.

```bash
pnpm dev
```

- [ ] Test both a general question (to ensure non-email queries still work) and an email-related query (to ensure tool calling still functions). The behavior should be identical to before the refactor.

## Scaffolding the eval

<!-- VIDEO -->

Let's scaffold an end-to-end eval for testing the agent's ability to retrieve information.

Recommendation: hand-code this commit. Understanding the difference between `agent.stream` and `agent.generate` is important.

### Steps To Complete

#### Increasing the test timeout

- [ ] Update `evalite.config.ts` to increase the test timeout to 2 minutes (120,000 milliseconds). The default 30 seconds is too short for testing long-running agents.

<Spoiler>

```typescript
// evalite.config.ts
import { defineConfig } from 'evalite';
import config from './vitest.config';

export default defineConfig({
  viteConfig: config,
  testTimeout: 120_000, // ADDED: 2 minutes for agent testing
});
```

</Spoiler>

#### Creating the e2e-retrieval eval

- [ ] Create a new file `evals/e2e-retrieval.eval.ts` that sets up an eval for testing agent retrieval capabilities.

- [ ] Import the necessary dependencies: `createAgent`, `MyMessage`, the Gemini model, `convertToModelMessages`, `stepCountIs` from `ai`, and `createUIMessageFixture`.

```typescript
import { createAgent } from '@/app/api/chat/agent';
import { MyMessage } from '@/app/api/chat/route';
import { google } from '@ai-sdk/google';
import { convertToModelMessages, stepCountIs } from 'ai';
import { evalite } from 'evalite';
import { createUIMessageFixture } from './create-ui-message-fixture';
```

- [ ] Set up the eval with a test case asking "Which house did I buy? What is its address?" with an expected output. Test against Gemini 2.5 Flash. Use `agent.generate` instead of `agent.stream` to produce a text output.

<Spoiler>

```typescript
// evals/e2e-retrieval.eval.ts
evalite.each([
  {
    name: 'Gemini 2.5 Flash',
    input: google('gemini-2.5-flash'),
  },
])('Search for information', {
  data: [
    {
      input: createUIMessageFixture<MyMessage>(
        'Which house did I buy? What is its address?',
      ),
      expected:
        'You bought a house at 42 Victoria Grove, Chorlton, Manchester M21 9EH.',
    },
  ],
  task: async (input, model) => {
    const agent = createAgent({
      memories: [],
      messages: input,
      model: model,
      stopWhen: stepCountIs(10),
      relatedChats: [],
    });

    const result = await agent.generate({
      messages: convertToModelMessages(input),
    });

    return {
      text: result.text,
      toolCalls: result.steps.flatMap((step) => step.toolCalls),
    };
  },
});
```

</Spoiler>

- [ ] Note: Use `result.steps.flatMap((step) => step.toolCalls)` to collect all tool calls across all steps, not just the last one. Accessing `result.toolCalls` directly only gives you the final step's tool calls.

- [ ] Run the eval to verify it works:

```bash
pnpm dev:eval e2e-retrieval
```

## Customizing the UI

<!-- VIDEO -->

The default UI shows the output as a single object, which is hard to read visually. Let's customize the columns displayed in the eval to show a clean, organized layout with separate columns for input, summary, tool calls, and expected output.

Recommendation: hand-code this commit. Customizing Evalite's UI is a powerful way to make your evals more readable and useful.

### Steps To Complete

#### Adding Custom Columns to the Eval Task

- [ ] Open the `evals/e2e-retrieval.eval.ts` file and locate the `task` function in the eval definition.

- [ ] After the `task` function closes (after the `return` statement), add a new `columns` property that defines how the output should be displayed. This function receives `input`, `output`, and `expected`, and returns an array of column definitions.

<Spoiler>

```typescript
// evals/e2e-retrieval.eval.ts

evalite.each([
  {
    name: 'Gemini 2.5 Flash',
    input: google('gemini-2.5-flash'),
  },
])('Search for information', {
  data: [
    {
      input: createUIMessageFixture<MyMessage>(
        'Which house did I buy? What is its address?',
      ),
      expected:
        'You bought a house at 42 Victoria Grove, Chorlton, Manchester M21 9EH.',
    },
  ],
  task: async (input, model) => {
    const agent = createAgent({
      memories: [],
      messages: input,
      model: model,
      stopWhen: stepCountIs(10),
      relatedChats: [],
    });

    const result = await agent.generate({
      messages: convertToModelMessages(input),
    });

    return {
      text: result.text,
      toolCalls: result.steps.flatMap((step) => step.toolCalls),
    };
  },
  // ADDED: Custom columns configuration for cleaner UI
  columns: ({ input, output, expected }) => [
    {
      label: 'Input',
      value: input,
    },
    {
      label: 'Summary',
      value: output.text,
    },
    {
      label: 'Tool Calls',
      value: output.toolCalls,
    },
    {
      label: 'Expected',
      value: expected,
    },
  ],
});
```

</Spoiler>

- [ ] Run your evals and verify that the UI now displays four clean columns instead of a cluttered object view. The data should be much easier to scan visually.

## Adding the answerCorrectness scorer

<!-- VIDEO -->

Let's add the `answerCorrectness` scorer to evaluate how well our agent answers questions by comparing against expected answers.

Recommendation: hand-code this commit. This is where `answerCorrectness` shines - and we also adjust our dataset to include more test cases.

### Steps To Complete

#### Adding imports

- [ ] Import the `messageToText` utility and the `answerCorrectness` scorer from Evalite

```typescript
import { messageToText } from '@/app/utils';
import { answerCorrectness } from 'evalite/scorers';
```

#### Adding test data

- [ ] Add two new data points to the eval to test mentoring and relationship questions

<Spoiler>

```typescript
{
  // ADDED: New data points for mentoring and relationship questions
  input: createUIMessageFixture<MyMessage>(
    "What was the name of the person I was mentoring, and what was I mentoring them about?"
  ),
  expected: "You were mentoring Elena Kovac on the subject of climbing.",
},
{
  // ADDED: New data point for relationship question
  input: createUIMessageFixture<MyMessage>("Am I married? If so, who to?"),
  expected: "You are not married. Your partner is Alex Chen.",
},
```

</Spoiler>

#### Adding the scorer

- [ ] Add a `scorers` array to the evalite config. The scorer will use the `answerCorrectness` function from Evalite to compare the agent's output against the expected answer using semantic embeddings and an LLM judge.

<Spoiler>

```typescript
scorers: [
  {
    scorer: ({ output, expected, input }) => {
      // ADDED: Use answerCorrectness to compare the agent's output against the expected answer
      return answerCorrectness({
        question: input.map(messageToText).join("\n"),
        answer: output.text,
        reference: expected,
        embeddingModel: google.textEmbeddingModel("text-embedding-004"),
        model: google("gemini-2.5-flash-lite"),
      });
    },
  },
],
```

</Spoiler>

#### Testing the scorer

- [ ] Run the eval to see the `answerCorrectness` scores for each test case

```bash
pnpm dev:eval e2e-retrieval
```

- [ ] You should see scores displayed for each data point, showing how well the agent's answers match the expected responses semantically.

## Adding multi-hop and filtering queries

<!-- VIDEO -->

Let's expand the eval test cases with multi-hop queries (requiring multiple steps to answer) and filtering queries (testing specific data retrieval) to better test the system's capabilities.

Recommendation: hand-code this commit. You can never have too much practice writing test cases.

### Steps To Complete

#### Understanding the New Query Types

- [ ] Review the two new categories of test cases being added:
  - **Multi-hop queries**: Questions requiring the agent to find and connect information across multiple emails
  - **Filtering queries**: Questions testing specific data retrieval with date ranges or counts

These increase test coverage and stress-test different behaviors of the system.

#### Adding Multi-hop Query Test Cases

- [ ] Add seven multi-hop query test cases to the `data` array in `evals/e2e-retrieval.eval.ts`. These should require connecting information across multiple emails:

<Spoiler>

```typescript
// evals/e2e-retrieval.eval.ts

// ADDED: Multi-hop queries that require finding and connecting multiple pieces of information
{
  input: createUIMessageFixture<MyMessage>(
    "What price reduction did I negotiate on the Chorlton house after the survey, and who recommended asking for it?"
  ),
  expected:
    "You negotiated a £5,500 price reduction. Jennifer Lawson recommended requesting £6,000 based on the survey report showing damp issues requiring £7,000-£8,000 in treatment.",
},
{
  input: createUIMessageFixture<MyMessage>(
    "Who is Tom Richardson and what day rate did I quote him?"
  ),
  expected:
    "Tom Richardson is a Senior Product Manager at Hartley & Co. You quoted him a day rate of £1,250 for a 3-week design systems consulting engagement.",
},
{
  input: createUIMessageFixture<MyMessage>(
    "What photography equipment advice did Martin Hughes offer for my New Zealand trip?"
  ),
  expected:
    "Martin Hughes recommended upgrading your lens for the New Zealand trip. He mentioned he did a NZ trip 3 years ago and offered to bring location recommendations to a coffee meetup.",
},
{
  input: createUIMessageFixture<MyMessage>(
    "What was the final purchase price of my house at 42 Victoria Grove?"
  ),
  expected:
    "The final purchase price was £437,500 after a £5,500 reduction from the original asking price.",
},
{
  input: createUIMessageFixture<MyMessage>(
    "What climbing locations did Chris Dalton suggest for my progression to 5.11, and what specific areas?"
  ),
  expected:
    "Chris Dalton suggested gritstone routes near Stanage Edge, specifically the Plantation and Upper Tier areas with technical 5.11a routes.",
},
{
  input: createUIMessageFixture<MyMessage>(
    "Who is Katie Zhang and why did I want to connect with her during New Zealand trip planning?"
  ),
  expected:
    "Katie Zhang is your old colleague who moved to Auckland, New Zealand. You wanted to connect with her to get local insider recommendations for climbing and photography spots.",
},
{
  input: createUIMessageFixture<MyMessage>(
    "Tell me about Tom from my consulting emails"
  ),
  expected:
    "Tom Richardson from Hartley & Co contacted you about design systems consulting work. You quoted him £1,250/day for a 3-week engagement totaling £18,750.",
},
{
  input: createUIMessageFixture<MyMessage>("Tell me about Emma"),
  expected:
    "There are multiple people named Emma in your emails: Emma Chen (Lead Product Designer at Hartley & Co), and others in your wedding planning and photography contexts. Could you be more specific about which Emma you're asking about?",
},
```

</Spoiler>

#### Adding Filtering Query Test Cases

- [ ] Add two filtering query test cases that test the `Filter Emails` tool with date ranges and counts:

<Spoiler>

```typescript
// evals/e2e-retrieval.eval.ts

// ADDED: Filtering queries that test date ranges and email counts
{
  input: createUIMessageFixture<MyMessage>(
    "How many emails did I receive from David Xu between June 1-15, 2024?"
  ),
  expected: "You received 5 emails from David Xu between June 1-15, 2024.",
},
{
  input: createUIMessageFixture<MyMessage>(
    "How many emails did I exchange with Alex about the New Zealand trip in phase 1?"
  ),
  expected:
    "You exchanged 1 email from Alex about the New Zealand trip in phase 1.",
},
```

</Spoiler>

#### Running the Eval Suite

- [ ] Run the eval suite to see how your agent performs on the new test cases:

```bash
pnpm dev:eval e2e-retrieval
```

- [ ] Review the eval output dashboard to see:
  - Which queries your agent answers correctly
  - Which ones fail and why (check the tool calls to see if it's using the right tools)
  - The `answerCorrectness` scorer results for each test case

- [ ] After running the evals, identify which test cases are failing. Use these as signals to improve your agent's retrieval logic or tool usage.

- [ ] The goal is to iterate on your system using these evals as feedback until you achieve better scores across all test categories.
