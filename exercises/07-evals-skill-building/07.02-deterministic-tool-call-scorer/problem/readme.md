Manually checking whether your agent called the right tool for each input is tedious and error-prone. A better approach is to encode your expectations into your dataset and use an automatic scorer to evaluate performance.

By adding expected tool calls to your data points and implementing a scorer, you can get an automatic score for your entire evaluation suite. This gives you clear, quantifiable feedback on how well your system is performing.

## Steps To Complete

### Implementing the Scorer

- [ ] Understand the scorer structure in `agent.eval.ts`

  The scorer receives an `output` object containing the [`toolCalls`](/PLACEHOLDER/tool-calls) array and an `expected` object that you'll define. Your job is to check if any tool call matches the expected tool.

- [ ] Implement the scorer logic to check for matching tool calls

  ```ts
  scorers: [
    {
      name: 'Matches Expected Tool',
      description: 'The agent called the expected tool',
      scorer: ({ output, expected }) => {
        // TODO: Check if any toolCall in output.toolCalls matches expected.tool
        // Return 1 if match found, 0 otherwise
        return 0;
      },
    },
  ],
  ```

  Inside the scorer:
  - Loop through `output.toolCalls`
  - Check if any `toolCall.toolName` matches `expected.tool`
  - Return `1` if a match is found, or `0` if no match is found

### Adding Expected Tool Calls to Data Points

- [ ] Add an `expected` field to each data point with the tool name you expect to be called

  For the first data point, "What is the weather in San Francisco right now?", the expected tool should be `checkWeather`:

  ```ts
  {
    input: createUIMessageFixture(
      'What is the weather in San Francisco right now?',
    ),
    // TODO: Add expected tool call
    expected: {
      tool: 'checkWeather',
    },
  },
  ```

- [ ] Add expected tool calls to all remaining data points

  Review each input and determine which tool from `agent.ts` should be called:
  - "Create a spreadsheet called..." → `createSpreadsheet`
  - "Send an email to..." → `sendEmail`
  - "Translate "Hello world" to Spanish" → `translateText`
  - "Set a reminder for tomorrow at 9am..." → `setReminder`

### Testing Your Implementation

- [ ] Run the evaluation with `pnpm run dev`

  This will start the [Evalite](https://evalite.dev) evaluation runner in watch mode.

- [ ] Observe the evaluation results

  Once the evaluation completes, you should see scores for each data point. The results should show which inputs matched their expected tools and which did not.

- [ ] Check the average score across all data points

  [Evalite](https://evalite.dev) will calculate and display an average score for your entire evaluation suite, giving you a clear sense of how well your agent is performing at calling the correct tools.
