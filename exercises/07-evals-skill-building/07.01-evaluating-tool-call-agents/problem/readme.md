# Evaluating Tool-Calling Agents

When building AI agents that use tools, we need to understand how well different language models perform at calling the right tools at the right times. This is crucial because we're relying on the LLM to make intelligent decisions about which tools to invoke from potentially dozens of options.

The challenge becomes even more complex as we add more tools to our agent. How many tools can a model handle before it starts making mistakes? Which models are best at tool selection? These are the questions we need to answer through systematic evaluation.

In this exercise, you'll set up an evaluation harness using [Evalite](https://evalite.dev) to test how well an agent selects and calls tools across different scenarios. You'll extract the tool calls from the agent's response and inspect them to see what the model decided to do.

## Steps To Complete

### Understanding the Setup

- [ ] Review the three test cases in `agent.eval.ts`
  - Each case represents a different user request that should trigger specific tool calls
  - The first asks about weather (should call `checkWeather`)
  - The second asks to create a spreadsheet (should call `createSpreadsheet`)
  - The third asks to send an email (should call `sendEmail`)

- [ ] Examine the `runAgent` function in `agent.ts`
  - It calls [`streamText`](/PLACEHOLDER/streamText) with a model, messages, tools, and a `stopWhen` condition
  - The [`stepCountIs(1)`](/PLACEHOLDER/stepCountIs) tells the agent to take only one step before stopping
  - This prevents the agent from executing the actual tool and allows us to inspect its decision

### Consuming the Stream

- [ ] Locate the first TODO in the `task` function

The `runAgent` function returns a stream that needs to be [consumed](/PLACEHOLDER/consuming-streams) before the agent completes execution. Here's how to do it:

```ts
const result = runAgent(
  wrapAISDKModel(google('gemini-2.0-flash')),
  messages,
  stepCountIs(1),
);

// TODO: Consume the stream so the agent completes execution
```

- [ ] Call [`consumeStream()`](/PLACEHOLDER/consumeStream) on the result to wait for the agent to finish
  - This ensures all the data is available before you try to access it

```ts
await result.consumeStream();
```

### Extracting Tool Calls

- [ ] Locate the second TODO about extracting tool calls

The `result` object has a [`toolCalls`](/PLACEHOLDER/toolCalls) property that contains all the tools the agent decided to call. Here's what you need to do:

```ts
// TODO: Extract the toolCalls from the result
// The result object has a toolCalls property that you need to await
// Map the toolCalls to include only toolName and input for easier inspection
```

- [ ] Await the `toolCalls` property on the result
  - This gives you an array of tool call objects
  - Each object contains `toolName`, `input`, and other metadata

- [ ] Map over the `toolCalls` array to create a cleaner structure
  - Extract only `toolName` and `input` from each tool call
  - This makes the evaluation output easier to read and understand

```ts
const toolCalls = (await result.toolCalls).map((toolCall) => ({
  toolName: toolCall.toolName,
  input: toolCall.input,
}));
```

### Getting the Text Response

- [ ] Locate the third TODO about getting the text response

In case the agent didn't call any tools, you'll want to capture what it said instead:

```ts
// TODO: Get the text response from the result
```

- [ ] Access the [`text`](/PLACEHOLDER/text-property) property from the result and await it
  - This gives you the full text response from the model

```ts
const text = await result.text;
```

### Returning the Results

- [ ] Locate the final TODO about returning an object

Now combine everything into a single return object:

```ts
// TODO: Return an object with toolCalls and text properties
return {};
```

- [ ] Return an object with two properties:
  - `toolCalls`: the array of tool calls you mapped earlier
  - `text`: the text response from the model

```ts
return {
  toolCalls,
  text,
};
```

### Testing Your Implementation

- [ ] Run the evaluation with `pnpm run dev`
  - This starts [Evalite](https://evalite.dev) in watch mode
  - It will run all three test cases automatically

- [ ] Open [Evalite](https://evalite.dev) in your browser
  - The output should show the three test cases
  - Each one displays the `toolCalls` and `text` that were extracted

- [ ] Verify the results make sense
  - The weather question should show `checkWeather` being called
  - The spreadsheet request should show `createSpreadsheet` being called
  - The email request should show `sendEmail` being called
  - Each tool call should have the appropriate `input` parameters

- [ ] Check the browser console for any errors
  - If the stream consumption or extraction fails, you'll see errors here
  - Debug any issues and re-run the evaluation
