We've built some really cool memory extraction functionality, but we haven't actually tested it yet. Does it work? Does it work well? We have no idea.

In this section, we're going to systematically evaluate and test the pieces we've scaffolded so far. We'll start by making our code testable, create helper functions for test fixtures, build a dataset of test cases, and use an LLM as a judge to score our results.

This is the foundation for understanding whether our AI system actually works the way we want it to.

## Making extractMemories testable

<!-- VIDEO -->

We're refactoring `extractAndUpdateMemories` to separate the core logic from database operations. This makes the function testable and allows us to swap different models.

Recommendation: hand-code this commit. This is an important maneuver to make your code evaluatable.

### Steps To Complete

#### Creating the `extractMemoriesInner` function

- [ ] Extract the memory extraction logic into a new `extractMemoriesInner` function that takes `messages`, `memories`, and a `model` parameter. This function should contain all the AI logic but no database operations.

<Spoiler>

```typescript
// src/app/api/chat/extract-memories.ts

// ADDED: Import LanguageModel type
import {
  convertToModelMessages,
  generateObject,
  LanguageModel,
} from 'ai';

// ADDED: New inner function that handles memory extraction logic without DB operations
export const extractMemoriesInner = async (opts: {
  messages: MyMessage[];
  memories: DB.Memory[];
  model: LanguageModel;
}) => {
  // Only include user and assistant messages, not tool calls
  // This is a cost-saving measure
  const filteredMessages = opts.messages.filter(
    (message) =>
      message.role === 'user' || message.role === 'assistant',
  );

  const memoriesResult = await generateObject({
    model: opts.model, // CHANGED: Use model from opts instead of hardcoded google()
    schema: z.object({
      updates: z
        .array(
          z.object({
            id: z
              .string()
              .describe(
                'The ID of the existing memory to update',
              ),
            title: z
              .string()
              .describe('The updated memory title'),
            content: z
              .string()
              .describe('The updated memory content'),
          }),
        )
        .describe('Memories to update'),
      deletions: z
        .array(z.string())
        .describe('Array of memory IDs to delete'),
      additions: z
        .array(
          z.object({
            title: z.string().describe('The memory title'),
            content: z.string().describe('The memory content'),
          }),
        )
        .describe('New memories to add'),
    }),
    system: `You are a memory management agent that extracts and maintains permanent information about the user from conversations.

<existing-memories>
${opts.memories.map((memory) => memoryToText(memory)).join('\n')}
</existing-memories>

Based on the conversation, decide which memories to update, delete, or add. Maintain a consistent, evolving profile of the user.

For each operation:
- Updates: Only update if information has genuinely changed or become clearer
- Deletions: Remove memories that are no longer accurate or relevant
- Additions: Add new facts that will help personalize future conversations

Be conservative - only add memories that will genuinely help personalize future conversations.`,
    messages: convertToModelMessages(filteredMessages),
  });

  const { updates, deletions, additions } =
    memoriesResult.object;

  // ADDED: Return only the results, no DB operations
  return { updates, deletions, additions };
};
```

</Spoiler>

#### Refactoring `extractAndUpdateMemories`

- [ ] Update `extractAndUpdateMemories` to call `extractMemoriesInner` with the hardcoded model, then handle all the database operations. This separates concerns between logic and persistence.

<Spoiler>

```typescript
// CHANGED: Simplified function now calls extractMemoriesInner
export async function extractAndUpdateMemories(opts: {
  messages: MyMessage[];
  memories: DB.Memory[];
}) {
  // ADDED: Call the testable inner function with the model
  const { updates, deletions, additions } =
    await extractMemoriesInner({
      messages: opts.messages,
      memories: opts.memories,
      model: google('gemini-2.5-flash'),
    });

  const filteredDeletions = deletions.filter(
    (deletion) =>
      !updates.some((update) => update.id === deletion),
  );

  await Promise.all(
    updates.map((update) =>
      updateMemory(update.id, {
        title: update.title,
        content: update.content,
      }),
    ),
  );

  await Promise.all(
    filteredDeletions.map((deletion) => deleteMemory(deletion)),
  );

  await Promise.all(
    additions.map((addition) =>
      createMemory({
        id: crypto.randomUUID(),
        title: addition.title,
        content: addition.content,
      }),
    ),
  );
}
```

</Spoiler>

## Adding `createUIMessageFixture`

<!-- VIDEO -->

Let's add a utility function that makes it easy to create UI message histories for testing. This eliminates the need to manually assign IDs and roles to each message.

Recommendation: cherry-pick this commit. This is a utility function I'm considering adding to Evalite at some point anyway, so might as well cherry-pick it here.

### Steps To Complete

#### Creating the `createUIMessageFixture` function

- [ ] Create a new file called `create-ui-message-fixture.ts` in the `evals` directory. This function will accept messages as either an array or variadic arguments, alternating between user and assistant roles.

<Spoiler>

```typescript
// evals/create-ui-message-fixture.ts
import type { UIMessage } from 'ai';

export function createUIMessageFixture<
  TMessage extends UIMessage,
>(input: string[]): TMessage[];
export function createUIMessageFixture<
  TMessage extends UIMessage,
>(...input: string[]): TMessage[];
export function createUIMessageFixture<
  TMessage extends UIMessage,
>(...input: (string | string[])[]): TMessage[] {
  return input.flat().map((message, index): TMessage => {
    return {
      id: String(index + 1),
      role: index % 2 === 0 ? 'user' : 'assistant',
      parts: [{ type: 'text', text: message }],
    } as TMessage;
  });
}
```

</Spoiler>

- [ ] The function uses function overloads to support both array and variadic string arguments, then flattens the input and maps each message to a `UIMessage` with auto-generated IDs and alternating roles (user on even indices, assistant on odd indices).

## Scaffolding the eval

<!-- VIDEO -->

Let's scaffold our first evaluation for testing memory extraction when the database is empty.

Recommendation: hand-code this commit. This is your first chance to use `createUIMessageFixture`, and it's worth hand-coding the scorers especially.

### Steps To Complete

#### Setting up the eval file structure

- [ ] Create a new file `evals/extract-memories.eval.ts` with the necessary imports and model setup.

<Spoiler>

```typescript
// evals/extract-memories.eval.ts
import { extractMemoriesInner } from '@/app/api/chat/extract-memories';
import { MyMessage } from '@/app/api/chat/route';
import { google } from '@ai-sdk/google';
import { evalite } from 'evalite';
import { createUIMessageFixture } from './create-ui-message-fixture';

evalite.each([
  {
    name: 'Gemini 2.5 Flash',
    input: google('gemini-2.5-flash'),
  },
  {
    name: 'Gemini 2.5 Flash Lite',
    input: google('gemini-2.5-flash-lite'),
  },
])('Extract When Memories Are Empty', {});
```

</Spoiler>

#### Adding test data

- [ ] Add the `data` array with a test fixture message. This focuses on the empty memory case, which is crucial for setting up future memories correctly.

<Spoiler>

```typescript
evalite.each([
  {
    name: 'Gemini 2.5 Flash',
    input: google('gemini-2.5-flash'),
  },
  {
    name: 'Gemini 2.5 Flash Lite',
    input: google('gemini-2.5-flash-lite'),
  },
])('Extract When Memories Are Empty', {
  // ADDED: Test data with fixture message
  data: [
    {
      input: createUIMessageFixture<MyMessage>(
        "I'm a software engineer at Google.",
      ),
    },
  ],
});
```

</Spoiler>

#### Adding the task function

- [ ] Add the `task` function that calls `extractMemoriesInner` with an empty memories array and returns the updates, deletions, and additions.

<Spoiler>

```typescript
evalite.each([
  {
    name: 'Gemini 2.5 Flash',
    input: google('gemini-2.5-flash'),
  },
  {
    name: 'Gemini 2.5 Flash Lite',
    input: google('gemini-2.5-flash-lite'),
  },
])('Extract When Memories Are Empty', {
  data: [
    {
      input: createUIMessageFixture<MyMessage>(
        "I'm a software engineer at Google.",
      ),
    },
  ],
  // ADDED: Task that calls extractMemoriesInner with empty memories array
  task: async (input, model) => {
    const { updates, deletions, additions } =
      await extractMemoriesInner({
        messages: input,
        memories: [],
        model: model,
      });
    return {
      updates,
      deletions,
      additions,
    };
  },
});
```

</Spoiler>

#### Creating the scorers

- [ ] Add three scorers to validate the output. Since the memory database is empty, we expect no updates or deletions, but exactly one addition (the extracted memory).

<Spoiler>

```typescript
evalite.each([
  {
    name: 'Gemini 2.5 Flash',
    input: google('gemini-2.5-flash'),
  },
  {
    name: 'Gemini 2.5 Flash Lite',
    input: google('gemini-2.5-flash-lite'),
  },
])('Extract When Memories Are Empty', {
  data: [
    {
      input: createUIMessageFixture<MyMessage>(
        "I'm a software engineer at Google.",
      ),
    },
  ],
  task: async (input, model) => {
    const { updates, deletions, additions } =
      await extractMemoriesInner({
        messages: input,
        memories: [],
        model: model,
      });
    return {
      updates,
      deletions,
      additions,
    };
  },
  // ADDED: Three scorers to validate output
  scorers: [
    {
      name: 'Updates',
      description: 'The number of updates should be 0',
      scorer: ({ output }) => {
        return output.updates.length === 0 ? 1 : 0;
      },
    },
    {
      name: 'Deletions',
      description: 'The number of deletions should be 0',
      scorer: ({ output }) => {
        return output.deletions.length === 0 ? 1 : 0;
      },
    },
    {
      name: 'Additions',
      description: 'The number of additions should be 1',
      scorer: ({ output }) => {
        return output.additions.length === 1 ? 1 : 0;
      },
    },
  ],
});
```

</Spoiler>

#### Adding the dev:eval script

- [ ] Update `package.json` to add a `dev:eval` script that runs Evalite in watch mode for fast feedback during development.

<Spoiler>

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack",
    "dev:eval": "evalite watch",
    "start": "next start",
    "cherry-pick": "ai-hero-cli cherry-pick --branch=live-run-through",
    "reset": "ai-hero-cli reset --branch=live-run-through"
  }
}
```

</Spoiler>

#### Running the eval

- [ ] Run the eval in watch mode to see the results:

```bash
pnpm dev:eval
```

- [ ] Navigate to `localhost:3006` to view the eval dashboard. Both models should score 100% on extracting the software engineer memory from the empty database.

## Building the dataset

<!-- VIDEO -->

Let's expand the test dataset with multiple test cases covering different scenarios: extracting memories, handling action-based inputs with no extractable memories, filtering temporary vs permanent information, and multi-turn conversations.

Recommendation: hand-code this commit, and think deeply about each test case. Writing test cases is HARD, and practice makes perfect.

### Steps To Complete

#### Adding expected outputs to the first test case

- [ ] Update the first test case to include an `expected` field with the memory we expect to extract from "I'm a software engineer at Google."

<Spoiler>

```typescript
{
  input: createUIMessageFixture<MyMessage>(
    "I'm a software engineer at Google."
  ),
  // ADDED: Expected memory from the input
  expected: "User is a software engineer at Google",
},
```

</Spoiler>

#### Adding test case for action-based input with no extractable memory

- [ ] Add a test case for an action-based message that shouldn't produce a memory. This tests that the system correctly identifies when no persistent memory should be extracted.

<Spoiler>

```typescript
{
  input: createUIMessageFixture<MyMessage>(
    "I need to email Michelle about the project deadline."
  ),
  // ADDED: No memory expected from action-based input
  expected: null,
},
```

</Spoiler>

#### Adding test case for multiple permanent memories

- [ ] Add a test case with multiple permanent facts about the user (job, hobbies, programming language) and specify the expected combined memory output.

<Spoiler>

```typescript
{
  input: createUIMessageFixture<MyMessage>(
    "I work as a product manager at Microsoft. I love rock climbing and playing guitar. My primary programming language is TypeScript."
  ),
  // ADDED: Multiple memories expected
  expected:
    "User works as a product manager at Microsoft. User loves rock climbing and playing guitar. User's primary programming language is TypeScript.",
},
```

</Spoiler>

#### Adding test case for filtering temporary vs permanent information

- [ ] Add a test case that mixes temporary information (feeling tired, needing help) with permanent information (pet, preferences). The expected output should only include the permanent memories.

<Spoiler>

```typescript
{
  input: createUIMessageFixture<MyMessage>(
    "Can you help me with a bug I'm having? I'm feeling tired today. By the way, I have a golden retriever named Max and I prefer dark mode in all my applications."
  ),
  // ADDED: Only permanent information expected
  expected:
    "User has a golden retriever named Max. User prefers dark mode in all their applications.",
},
```

</Spoiler>

#### Adding test case for multi-turn conversation

- [ ] Add a test case with a multi-turn conversation using `createUIMessageFixture` with alternating user and assistant messages. Extract the permanent information from across the conversation.

<Spoiler>

```typescript
{
  input: createUIMessageFixture<MyMessage>(
    "Hi, I need help with my React project.",
    "Sure, I'd be happy to help! What's the issue?",
    "I'm building a dashboard. I work remotely from Portland, Oregon.",
    "That's great! What kind of dashboard are you building?",
    "It's for tracking fitness goals. I'm really into marathon running and I train 5 days a week. I also follow a vegetarian diet.",
    "Sounds like a great project! What technology stack are you using?",
    "I'm using Next.js and TypeScript. I've been a full-stack developer for 8 years now."
  ),
  // ADDED: Multiple permanent memories from conversation
  expected:
    "User is building a dashboard for tracking fitness goals. User works remotely from Portland, Oregon. User is a full-stack developer for 8 years now. User is into marathon running and trains 5 days a week. User follows a vegetarian diet.",
},
```

</Spoiler>

#### Running the evaluation

- [ ] Run the evaluation suite to see how the models perform against your new test dataset.

```bash
pnpm dev:eval
```

- [ ] Note that the existing scorers at the bottom of the file are still checking for exactly 1 addition, which will fail for test cases with multiple expected memories. This will be addressed in the next commit when the scorers are updated to properly compare expected vs actual outputs.

## Adding answerCorrectness scorer

<!-- VIDEO -->

Let's replace the simple "Additions" scorer with a more sophisticated "Addition Faithfulness" scorer using the `answerCorrectness` scorer from Evalite.

Recommendation: cherry-pick this commit, then read carefully and test. This uses a pre-built scorer from Evalite - but in the next commit, we'll actually replace it with a more suitable one.

### Steps To Complete

#### Import the answerCorrectness scorer

- [ ] Import the `answerCorrectness` scorer from the `evalite/scorers` package at the top of the file.

```typescript
import { answerCorrectness } from 'evalite/scorers';
```

#### Replace the Additions scorer with Addition Faithfulness

- [ ] Update the "Additions" scorer to "Addition Faithfulness". This new scorer will evaluate whether the extracted memories are faithful to the conversation and expected values, not just count them.

<Spoiler>

```typescript
{
  name: "Addition Faithfulness",
  scorer: ({ input, output, expected }) => {
    // ADDED: If no expected additions are provided, check if no additions were made
    if (expected === null) {
      return output.additions.length === 0 ? 1 : 0;
    }

    // ADDED: Use answerCorrectness to compare extracted memories against expected
    return answerCorrectness({
      // ADDED: Format additions as "title: content" pairs joined by newlines
      answer: output.additions
        .map((addition) => addition.title + ": " + addition.content)
        .join("\n"),
      // ADDED: Expected memories from test data
      reference: expected,
      // ADDED: Use flash-lite for scoring efficiency
      model: google("gemini-2.5-flash-lite"),
      // ADDED: Use text embedding model for semantic similarity comparison
      embeddingModel: google.textEmbeddingModel("text-embedding-004"),
      // ADDED: Frame the question for the LLM to evaluate faithfulness
      question: `Given the following conversation and the expected memory additions, is the addition faithful to the conversation and the expected memory additions? Remember - only permanent memories are expected.`,
    });
  },
},
```

</Spoiler>

The `answerCorrectness` scorer will:

- Check if no additions were made when `expected` is `null`
- Compare extracted memories against expected values using both LLM factuality checks and semantic similarity
- Return a score between 0 and 1 based on how well the memories match the expected output

#### Running the evaluation

- [ ] Run the evaluation to see the new scorer in action:

```bash
pnpm dev:eval
```

- [ ] Examine the results in the Evalite UI. You'll see detailed metadata showing how the scorer breaks down the comparison, including true positives, false positives, and false negatives.

## Replacing `answerCorrectness` with `answerSimilarity`

<!-- VIDEO -->

Let's try replacing the `answerCorrectness` scorer with `answerSimilarity` for a simpler, faster semantic comparison of generated memories to expected text.

Recommendation: hand-code this commit. This is an extremely useful scorer that you'll likely use a LOT in the future.

### Steps To Complete

#### Update the import statement

- [ ] Change the import from `answerCorrectness` to `answerSimilarity` in the eval file.

```typescript
// evals/extract-memories.eval.ts

// CHANGED: Import answerSimilarity instead of answerCorrectness
import { answerSimilarity } from 'evalite/scorers';
```

#### Update the scorer name and description

- [ ] Change the scorer name from "Addition Faithfulness" to "Addition Similarity" and add a description explaining what it measures.

<Spoiler>

```typescript
{
  // CHANGED: Renamed scorer and added description
  name: "Addition Similarity",
  description: "How similar are the additions to the expected additions?",
  scorer: ({ input, output, expected }) => {
    // ...
  },
}
```

</Spoiler>

#### Replace answerCorrectness with answerSimilarity

- [ ] Update the scorer function to use `answerSimilarity` instead of `answerCorrectness`. Remove the `model` and `question` parameters, keeping only `answer`, `reference`, and `embeddingModel`.

<Spoiler>

```typescript
scorer: ({ input, output, expected }) => {
  // If no expected additions are provided, check if no additions were made
  if (expected === null) {
    return output.additions.length === 0 ? 1 : 0;
  }

  // CHANGED: Use answerSimilarity instead of answerCorrectness
  // REMOVED: model and question parameters
  return answerSimilarity({
    answer: output.additions
      .map(
        (addition) => addition.title + ': ' + addition.content,
      )
      .join('\n'),
    reference: expected,
    embeddingModel: google.textEmbeddingModel(
      'text-embedding-004',
    ),
  });
};
```

</Spoiler>

#### Update test data (optional)

- [ ] For testing purposes, you can change the expected value in one of the test cases (e.g., "Microsoft" to "Google") to see how the similarity score changes. This demonstrates that the scorer detects semantic differences.

<Spoiler>

```typescript
{
  input: createUIMessageFixture<MyMessage>(
    "I work as a product manager at Microsoft. I love rock climbing and playing guitar. My primary programming language is TypeScript."
  ),
  // CHANGED: Updated from "Microsoft" to "Google" for testing
  expected:
    "User works as a product manager at Google. User loves rock climbing and playing guitar. User's primary programming language is TypeScript.",
}
```

</Spoiler>

#### Run the evals

- [ ] Execute your eval to see the new scores. The `answerSimilarity` scorer returns a cosine similarity between embeddings as a decimal (0-1), which Evalite converts to a percentage score.

```bash
pnpm run eval
```
