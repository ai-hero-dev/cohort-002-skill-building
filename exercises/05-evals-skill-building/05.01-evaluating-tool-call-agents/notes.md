# Lesson 05.01 - Evaluating Tool Call Agents

## Learning Goals

- Test LLM tool calling with Evalite framework
- Inspect `toolCalls` array for expected tool invocation
- Binary scoring pattern: 1 success, 0 failure
- Extend to validate tool parameters, execution results
- Foundation for systematic agent testing

## Steps To Complete

### 1. Setup Evalite test with weather and calculator tools

```ts
import { evalite } from 'evalite';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { tool } from 'ai';
import { z } from 'zod';

// Fake tools for testing
const getWeather = tool({
  description: 'Get current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City name'),
  }),
  execute: async ({ location }) => `Sunny and 72°F in ${location}`,
});

const calculator = tool({
  description: 'Perform basic math calculations',
  inputSchema: z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
    a: z.number(),
    b: z.number(),
  }),
  execute: async ({ operation, a, b }) => {
    switch (operation) {
      case 'add': return a + b;
      case 'subtract': return a - b;
      case 'multiply': return a * b;
      case 'divide': return a / b;
    }
  },
});

evalite({
  data: [
    {
      input: 'What is the weather in San Francisco?',
      expectedTool: 'getWeather',
    },
    {
      input: 'Calculate 42 plus 17',
      expectedTool: 'calculator',
    },
    {
      input: 'Hello, how are you?',
      expectedTool: null, // No tool should be called
    },
  ],
  task: async (input) => {
    // TODO: Call generateText with prompt and tools
    const result = TODO;
    return result;
  },
  scorers: [
    // TODO: Implement tool call scorer
  ],
});
```

**Notes:**
- Tools defined upfront with realistic schemas
- Test cases cover: tool needed, different tool, no tool needed
- `expectedTool: null` tests LLM doesn't call tools unnecessarily

### 2. Implement task function

```ts
task: async (input) => {
  // TODO: Call generateText with model, prompt, and tools
  const result = await generateText({
    model: TODO,
    prompt: TODO,
    tools: {
      getWeather: TODO,
      calculator: TODO,
    },
  });
  return result;
},
```

**Notes:**
- Use `generateText` not `streamText` (evals need sync results)
- Pass both tools to every request
- LLM decides which tool (if any) to call
- Return full `GenerateTextResult` (contains `toolCalls` array)

### 3. Implement tool call scorer

```ts
scorers: [
  (input, output) => {
    // TODO: Check if expectedTool was called
    const toolWasCalled = output.toolCalls.some(
      (call) => TODO
    );

    // TODO: Handle null case (no tool should be called)
    const score = TODO;

    return {
      name: 'Tool Called',
      score,
    };
  },
],
```

**Notes:**
- Scorer receives `input` (test case) and `output` (task result)
- `output.toolCalls` is array of tool invocations
- Use `.some()` to check if expected tool exists
- When `expectedTool` is `null`, check array is empty
- Binary score: 1 if correct, 0 if wrong

### 4. Add parameter validation scorer (optional extension)

```ts
scorers: [
  // ... existing tool call scorer
  (input, output) => {
    if (!input.expectedTool) {
      return { name: 'Params Valid', score: 1 }; // N/A
    }

    // TODO: Find the tool call
    const call = output.toolCalls.find(
      (c) => c.toolName === input.expectedTool
    );
    if (!call) return { name: 'Params Valid', score: 0 };

    // TODO: Validate args contain reasonable values
    // For weather: check location is a string
    // For calculator: check operation, a, b present
    const paramsValid = TODO;

    return {
      name: 'Params Valid',
      score: paramsValid ? 1 : 0,
    };
  },
],
```

**Notes:**
- Access tool args via `call.args` object
- Check required parameters present and correct type
- Can validate specific values (e.g., location extracted from prompt)
- Skip validation when no tool expected

### 5. Run eval and inspect results

```bash
pnpm evalite main.ts
```

**Notes:**
- Terminal shows pass/fail for each test case
- Scores aggregate across all tests
- Use to catch regressions when changing prompts/models
- Foundation for lessons 6.x (memory/retrieval evals)

## Key Concepts

- `GenerateTextResult.toolCalls`: array of tool invocations
- `toolCall.toolName`: string identifier
- `toolCall.args`: parameters passed to tool
- Binary scoring common for tool call validation
- Testing negative cases (no tool needed) important
- Can extend to check execution results via `toolCall.result`

## Extension Ideas

- Test multi-tool scenarios (calls multiple tools in sequence)
- Validate tool call ordering
- Verify tool execution results match expected output
- Test edge cases (ambiguous queries, missing context)
- Add test cases for tool errors/failures
