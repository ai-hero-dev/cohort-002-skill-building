In the previous exercise, memory creation happened automatically after every conversation turn via the `onFinish` callback. This approach works, but it's inefficient - we're calling `generateObject` even when there's nothing new to memorize.

In this exercise, we'll convert memory management into a **tool call** that the agent can choose to invoke only when necessary.

## The Problem With Automatic Memory Creation

Our current approach (from 03.03) uses `createUIMessageStream` with an `onFinish` callback:

```ts
const stream = createUIMessageStream<MyMessage>({
  execute: async ({ writer }) => {
    // Stream response...
  },
  onFinish: async (response) => {
    // This runs EVERY TIME, even for "Hello" or "What's the weather?"
    const memoriesResult = await generateObject({...});
  },
});
```

Problems:

- Runs after EVERY conversation turn regardless of content
- Wastes tokens analyzing trivial conversations
- No agent control over when to memorize
- Less semantic/intentional memory creation

## The Solution: Memory as a Tool

Instead of automatic callbacks, we give the agent a `manageMemories` tool it can call when appropriate:

```ts
const result = streamText({
  model: google('gemini-2.0-flash-lite'),
  system: `... instructions about when to use manageMemories ...`,
  messages: convertToModelMessages(messages),
  tools: {
    manageMemories: tool({
      description: '...',
      parameters: z.object({ updates, deletions, additions }),
      execute: async ({ updates, deletions, additions }) => {
        // Perform memory operations
      },
    }),
  },
  stopWhen: stepCountIs(5), // Allow up to 5 generation steps
});
```

Benefits:

- Agent decides when memory update needed
- More efficient token usage
- Can skip trivial conversations
- Can batch multiple turns before memorizing
- More transparent (tool calls visible in UI)

## Your Task

Looking at [`api/chat.ts`](./api/chat.ts), you'll see we've already switched from `createUIMessageStream` to `streamText`, and added system prompt guidance about when to use the tool.

You need to:

1. **Define the `manageMemories` tool**
   - Use the `tool()` function from AI SDK
   - Define parameters schema matching 03.03 structure (updates, deletions, additions)
   - Write clear description telling agent when to call it

2. **Implement the execute function**
   - Perform actual memory operations (update, delete, save)
   - Add console logging to see when tool is called
   - Return success message

3. **Set `stopWhen`**
   - Use `stepCountIs()` to allow agent to call tools during streaming
   - Typical value: `stepCountIs(5)` for up to 5 generation steps

## Testing

After implementation, test with:

1. **Casual conversation** - Agent should NOT call tool
   - "Hi, how are you?"
   - "What's the weather like?"

2. **Personal information** - Agent SHOULD call tool
   - "I prefer dark mode interfaces"
   - "My dog's name is Max"

3. **Contradictions** - Agent should use updates field
   - First: "I love coffee"
   - Later: "Actually, I prefer tea now"

4. **Batching** - Agent might wait before calling
   - Multiple facts in one turn
   - Or wait until conversation naturally ends

Watch console logs to see when `manageMemories` is invoked vs skipped.

## Steps To Complete

- [ ] Define the `manageMemories` tool with proper schema
  - [ ] Use `tool()` function from AI SDK
  - [ ] Define `updates`, `deletions`, `additions` parameters with descriptions
  - [ ] Write tool description explaining when to call it

- [ ] Implement the execute function
  - [ ] Filter deletions that are being updated (avoid conflicts)
  - [ ] Call `updateMemory()` for each update
  - [ ] Call `deleteMemory()` for filtered deletions
  - [ ] Call `saveMemories()` with new memory objects
  - [ ] Add console logging
  - [ ] Return success object with message

- [ ] Set `stopWhen` with `stepCountIs(5)` to allow tool calling

- [ ] Test with different conversation types
  - [ ] Verify tool is skipped for small talk
  - [ ] Verify tool is called when sharing personal info
  - [ ] Check updates work for contradictions
