# All Memories Upfront

## Intro

### Why This Lesson

- Simplest memory integration: load all, pass to system prompt
- Foundation before tool-controlled creation (04.02) and semantic recall (later)
- Real project implementation using Section 03 skills
- Understand tradeoffs: simple vs scalable

### When to Use This Approach

- Small/medium memory DBs (<50-100 memories)
- All context frequently relevant to most conversations
- Early prototyping, MVP stage
- User has limited personal info stored

### Limitations to Address Later

- Doesn't scale: 500+ memories waste context window
- High token cost for irrelevant memories every request
- No relevance filtering
- Leads to later lessons: semantic recall (04.05)

## Demo

### Phase 1: Load Memories from Persistence Layer

[`loadMemories()` from persistence layer]

- Returns `DB.Memory[]` with `id`, `title`, `content`, `createdAt`, `updatedAt`
- Single function call, no filtering/retrieval yet
- Called at start of chat route request handler

```ts
const memories = await loadMemories();
console.log(`Loaded ${memories.length} memories`);
```

### Phase 2: Format Memories as Text

[Format memory objects for LLM consumption]

- Simple text format: title, content, created date
- Separator (`---`) helps LLM distinguish individual memories
- Include temporal metadata for context

```ts
const formatMemory = (memory: DB.Memory) => {
  return [
    `Title: ${memory.title}`,
    `Content: ${memory.content}`,
    `Created: ${memory.createdAt}`,
  ].join('\n');
};

const memoriesText = memories
  .map(formatMemory)
  .join('\n\n---\n\n');
```

### Phase 3: Inject into System Prompt

[Add memories to system prompt with XML tags]

- XML tags (`<memories>`) help LLM identify memory section
- System prompt instructs LLM to use for personalization
- All memories passed every request

```ts
system: `You are a helpful personal assistant.

The user has shared the following memories with you:

<memories>
${memoriesText}
</memories>

Use these memories to provide personalized responses.`
```

### Phase 4: Test with Manual Memory Creation

[Use existing UI to create test memories]

- Memory creation UI already exists (sidebar)
- Persistence layer handles storage
- This lesson focuses on retrieval/usage, not creation
- Test: create memory "favorite color is blue", ask "what's my favorite color?"
- Verify LLM responds from memory context

## Token Cost Analysis

[Show impact of loading all memories]

- 10 memories ~2-3k tokens
- 50 memories ~10-15k tokens
- 100 memories ~20-30k tokens
- Every request pays full cost regardless of relevance
- Compare to semantic recall: retrieve only top 10-20 relevant

## Real-World Usage

[When this approach works in production]

- Personal assistants with limited info (new users)
- Specialized agents with small knowledge sets
- Internal tools with controlled memory growth
- Prototypes before optimizing for scale

## Next Up

- 04.02: Tool-controlled memory creation - agent decides when to remember
- 04.03: Automatic extraction via `onFinish` callback
- 04.04: User-confirmed memories with approval flow
- Future: Semantic recall to retrieve only relevant memories (scales to 1000s)
