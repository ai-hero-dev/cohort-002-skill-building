# Automatic Memory Creation

## Concept Overview

### Why Automatic Extraction

- Tool approach (04.02): LLM decides when to remember, transparent but may miss context
- Automatic approach: analyzes every message, comprehensive but less transparent
- Tradeoff: completeness vs latency/cost vs transparency
- Use when: want hands-off memory management, can afford extra LLM call per message

### Flow Diagram

1. User message → LLM response
2. `onFinish` callback fires
3. `generateObject` analyzes full conversation
4. Extract additions/updates/deletions
5. Execute operations on persistence layer
6. Memories available next conversation

Files: [readme.md](./readme.md), [notes.md](./notes.md)

## Implementation Walkthrough

### Phase 1: Extract Memory Function

[notes.md Step 1](./notes.md)

- Create `extractMemories()` for reusability
- Takes messages + existing memories
- Returns operations object (updates/deletions/additions)
- Enables evaluation in Section 06 (testable in isolation)
- Schema: updates need ID, additions don't
- System prompt: permanent vs situational, add/update/delete/skip logic

### Phase 2: onFinish Integration

[notes.md Step 2](./notes.md)

- Call `extractMemories()` in `onFinish` callback
- Load existing memories first
- Pass full conversation (messages + response)
- Console log operations for debugging
- Clean separation: route handles orchestration, function handles logic

### Phase 3: Execute Operations

[notes.md Step 3](./notes.md)

- Process updates/deletions/additions sequentially
- Critical: filter deletions to exclude IDs being updated (conflict prevention)
- Update existing memories first
- Delete filtered list
- Create new memories with UUIDs
- Console logs track memory evolution

### Phase 4: Testing Flow

[notes.md Step 4-5](./notes.md)

- Test basic: "My favorite drink is coffee" → addition
- Test update: "Actually I prefer tea" → update not addition
- Test skip: "Weather is nice" → no operations
- Test multiple: share 3 facts → all added
- Test conflict: update + delete same ID → deletion filtered
- Console essential for debugging LLM decisions

## Comparison to Other Approaches

### 04.02 Tool Approach

- LLM decides when via tool calls
- Transparent (visible in UI)
- Flexible timing (batches at conversation end)
- Lower cost (only calls when needed)
- May miss context if LLM forgets

### 04.03 Automatic Approach (This Lesson)

- Runs after every message
- Less transparent (background)
- Comprehensive (never misses)
- Higher cost (extra call per message)
- More token-efficient than upfront loading at scale

### 04.04 User Confirmation (Next)

- Maximum control (nothing without approval)
- Most complex implementation
- User friction vs trust
- Best for high-stakes memory operations

## Key Insights

- Extraction function enables evaluation (Section 06)
- Deletion filtering prevents conflicts
- System prompt tuning critical (over/under-extraction)
- Console logs essential for debugging LLM decisions
- Comprehensive approach trades cost for completeness
- Memory completeness > latency when context critical

## Next Up

- 04.04: User-confirmed memories - approval flow before saving
- Maximum transparency, most friction
- Balance autonomy vs control
