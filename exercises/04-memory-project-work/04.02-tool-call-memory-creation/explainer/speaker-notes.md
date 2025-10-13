# Tool Call Memory Creation

## Intro

- Tool-driven memory creation: LLM controls when to remember via tool calls
- Agent decides timing vs automatic extraction (04.03) or user confirmation (04.04)
- Apply Section 03.03 concepts to real project
- Trade-offs: LLM judgment vs comprehensive coverage vs user control

## Concept Overview

### Core Pattern

[notes.md](./notes.md)

- LLM calls `createMemory` tool when learns something worth remembering
- Tool handler immediately saves to DB
- Real-time operation during conversation
- Memory available in next message context

### Why This Approach

- **Intentional**: LLM judgment filters trivial vs permanent info
- **Real-time**: Memories created mid-conversation, not after
- **Transparent**: Tool calls visible in UI (if rendered)
- **Flexible**: Can capture metadata, categories in tool params
- **Token efficient**: Skips trivial conversations entirely

### Trade-offs vs Other Approaches

- **vs Automatic (04.03)**: Tool approach may miss info if LLM doesn't call. Automatic analyzes every message comprehensively.
- **vs User Confirmed (04.04)**: Tool approach executes immediately. User confirmation requires approval flow but builds trust.
- **vs Automatic**: Tool approach more transparent, less latency (no extra LLM call after response)

## Implementation Phases

### Phase 1: Load Memories Upfront

[Previous lesson 04.01](../../04.01-all-memories-upfront/explainer/notes.md)

- Already implemented: `loadMemories()` from persistence layer
- Format memories with IDs for update/delete operations
- Inject into system prompt with XML tags

```ts
const memories = await loadMemories();
const memoriesText = memories
  .map(m => `Title: ${m.title}\nContent: ${m.content}\nID: ${m.id}`)
  .join('\n\n---\n\n');
```

- **Critical**: Include ID in formatted output - needed for update/delete tool parameters

### Phase 2: Define Memory CRUD Tools

[notes.md - Approach section](./notes.md)

Define three tools in `streamText` config:

**`createMemory` tool:**
- Params: `title` (string), `content` (string)
- Handler calls `createMemory()` from persistence layer
- Returns `{ success: true, memoryId: string }`
- LLM calls when user shares new personal info

**`updateMemory` tool:**
- Params: `id` (string), `title` (string), `content` (string)
- Handler calls `updateMemory()` from persistence layer
- Returns `{ success: true, memoryId: string }` or error
- LLM calls when user contradicts/refines existing memory

**`deleteMemory` tool:**
- Params: `id` (string)
- Handler calls `deleteMemory()` from persistence layer
- Returns `{ success: true }` or error
- LLM calls when memory becomes outdated/irrelevant

**System prompt guidance:**
```
Memory management guidelines:
- CREATE: user shares new personal info, preferences, facts for long-term
- UPDATE: user contradicts/refines existing memory
- DELETE: memory becomes outdated/irrelevant
- SKIP: casual small talk, temporary/situational info
```

### Phase 3: Test Tool Behavior

[notes.md - Steps section](./notes.md)

**Test create:** "My favorite programming language is TypeScript"
- Check console logs: `Creating memory: { title: ..., content: ... }`
- Verify tool call visible in UI (if configured)
- Refresh memories page - new memory appears

**Test update:** "Actually, I prefer Python over TypeScript"
- Check console: `Updating memory: { id: ..., ... }`
- Verify LLM selected update tool, not create (no duplicate)
- Memory page shows updated content

**Test delete:** "I don't care about programming languages anymore"
- Check console: `Deleting memory: { id: ... }`
- Memory removed from page

**Test recall:** New chat, ask "What's my favorite language?"
- LLM should use updated/current memories from DB
- Verify context reflects latest operations

**Test negative:** Casual chat like "How's the weather?"
- Should NOT trigger any tool calls
- Monitor console - no memory operations

### Phase 4: Edge Cases

**Multiple operations in one message:**
- Share 3 facts, contradict 1 existing fact
- LLM should batch: 3 creates + 1 update

**Duplicate detection:**
- "I like coffee" then "I love coffee"
- Should update existing, not create duplicate

**Situational vs permanent:**
- "I'm at the gym" - temporary location, skip
- "I go to the gym every Monday" - routine, create

**Explicit requests:**
- "Remember that I like coffee"
- Should always trigger create tool

**Update vs create judgment:**
- Contradictory info should update existing
- New category should create new memory
- Prompt tuning critical for correct operation selection

## Key Implementation Details

**Tool schema with Zod:**
```ts
inputSchema: z.object({
  title: z.string().describe('Short title summarizing memory'),
  content: z.string().describe('Detailed memory content'),
})
```

**Handler pattern:**
```ts
execute: async ({ title, content }) => {
  const memory = await createMemory({
    id: crypto.randomUUID(),
    title,
    content,
  });
  return { success: true, memoryId: memory.id };
}
```

**Step count configuration:**
```ts
stopWhen: stepCountIs(5)
```
- Allows multiple tool calls in single turn
- Already configured from Section 02 search tools
- Critical for batch operations (multiple creates/updates/deletes)

## Common Pitfalls

- **Missing IDs in memory formatting**: Update/delete tools fail without ID reference
- **Over-triggering tools**: LLM creates memory for trivial info - tune system prompt
- **Under-triggering tools**: LLM misses important info - tune system prompt
- **Wrong operation selection**: LLM creates duplicate instead of updating - improve memory formatting visibility
- **No console logs**: Debugging difficult without execution visibility

## When to Use This Approach

**Good fit:**
- Want transparent memory system
- Building agent-driven workflows
- Need flexible memory metadata
- Token efficiency matters (skip trivial chats)

**Not ideal:**
- Need comprehensive coverage (every message)
- Want user control/trust building
- LLM judgment unreliable for domain

## Next Up

- **04.03**: Automatic memory extraction via `onFinish` - analyzes every message comprehensively
- **04.04**: User-confirmed memories - HITL pattern for trust/control
- Compare all three approaches to choose right fit for use case
