# Memory as Tool Call

## Problem

### Intro

- Previous lesson: automatic memory creation via `onFinish` callback after every turn
- Problem: runs even for "Hi" or "What's the weather?" - wasting tokens
- No agent control over when to memorize
- Less semantic/intentional approach
- Solution: convert to tool agent can call when needed

### Steps To Complete

#### Phase 1: Define the manageMemories tool

[`problem/api/chat.ts`](./problem/api/chat.ts)

- Already switched from `createUIMessageStream` to `streamText`
- System prompt already guides agent when to use tool
- Use `tool()` function from AI SDK
- Define schema: `updates` (id + memory), `deletions` (IDs), `additions` (strings)
- Match structure from lesson 03.02 `generateObject` schema
- Write description: when to call (personal info, contradictions, explicit requests)

#### Phase 2: Implement execute function

[`problem/api/chat.ts`](./problem/api/chat.ts)

- Filter deletions being updated (avoid conflicts)
- Call `updateMemory()` for each update with id + memory + timestamp
- Call `deleteMemory()` for filtered deletions
- Call `saveMemories()` with additions mapped to full objects (id, memory, createdAt)
- Add console logs to see when tool called
- Return success object with counts message

#### Phase 3: Set stopWhen

[`problem/api/chat.ts`](./problem/api/chat.ts)

- Add `stopWhen: stepCountIs(5)` to allow tool calls during streaming
- Without this, agent can't call tools
- 5 steps sufficient for memory operations

#### Phase 4: Test behavior

- Casual conversation: "Hi, how are you?" - agent should skip tool
- Personal info: "I prefer dark mode" - agent should call tool
- Contradictions: "I love coffee" then "Actually prefer tea" - should use updates
- Batching: agent might wait for natural conversation end
- Watch console logs to verify when tool invoked vs skipped

## Solution

### Steps To Complete

#### Phase 1: Define manageMemories tool

[`solution/api/chat.ts`](./solution/api/chat.ts#L63-L94)

- `tool()` with description explaining when to call
- `inputSchema` with three arrays: updates (id + memory objects), deletions (string IDs), additions (strings)
- Descriptions on each parameter guide LLM usage
- Execute function receives destructured parameters

#### Phase 2: Implement memory operations

[`solution/api/chat.ts`](./solution/api/chat.ts#L94-L132)

- Console log all operations for debugging
- Filter deletions: exclude IDs in updates array
- Loop updates: `updateMemory(id, { memory, createdAt })`
- Loop filtered deletions: `deleteMemory(id)`
- Map additions to full objects with `generateId()` and timestamp
- `saveMemories()` with mapped additions array
- Return success object with operation counts

#### Phase 3: Add stopWhen configuration

[`solution/api/chat.ts`](./solution/api/chat.ts#L135)

- `stopWhen: stepCountIs(5)` allows up to 5 generation steps
- Enables agent to call tools during streaming response
- Without this, streaming ends before tool execution possible

#### Phase 4: System prompt guidance

[`solution/api/chat.ts`](./solution/api/chat.ts#L50-L60)

- Guidelines in system prompt tell agent when to CALL vs SKIP
- CALL: personal details, contradictions, explicit requests
- SKIP: casual small talk, temporary questions
- Note: agent can batch multiple turns before calling

### Next Up

Semantic recall on memories: as memory DB scales, loading entire DB becomes inefficient. Next lesson uses embeddings to retrieve only relevant memories based on conversation context.
