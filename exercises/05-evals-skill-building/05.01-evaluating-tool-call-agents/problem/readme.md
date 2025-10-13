Evalite lets you test LLM tool calling behavior. Simplest eval: check if expected tool was called.

## Basic Pattern

Tool calls appear in result's `toolCalls` array. Check if tool exists:

```ts
import { evalite } from 'evalite';

evalite({
  data: [
    {
      input: 'What is the weather in SF?',
      expectedTool: 'getWeather',
    },
  ],
  task: async (input) => {
    const result = await generateText({
      model: google('gemini-2.0-flash-001'),
      prompt: input,
      tools: {
        getWeather: tool({
          description: 'Get weather for location',
          inputSchema: z.object({
            location: z.string(),
          }),
          execute: async ({ location }) =>
            `Sunny in ${location}`,
        }),
      },
    });
    return result;
  },
  scorers: [
    (input, output) => {
      const toolWasCalled = output.toolCalls.some(
        (call) => call.toolName === input.expectedTool,
      );
      return {
        name: 'Tool Called',
        score: toolWasCalled ? 1 : 0,
      };
    },
  ],
});
```

## Key Points

- `toolCalls` array contains all tool invocations
- Use `.some()` to check if expected tool exists
- Return score 1 for success, 0 for failure
- Can also check tool parameters, execution results

## Steps To Complete

- [ ] Review basic tool call evaluation pattern
- [ ] Understand how `toolCalls` array works
- [ ] See how scorer checks for tool existence
- [ ] Consider extending to validate parameters
