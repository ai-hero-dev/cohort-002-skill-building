# Updating Previous Memories

## Problem

### Intro

- Current memory system only adds - no updates/deletes
- Makes system unusable for anything but permanent unchanging facts
- Real world: preferences change (window seat -> aisle seat as you age)
- Without updates: contradictory memories accumulate, pollute context
- Opens door to working memory pattern (temp info like "currently focusing on X")
- Need CRUD: Create, Read, Update, Delete

### Steps To Complete

#### Phase 1: Define Zod schemas for CRUD operations

[`problem/api/chat.ts`](./problem/api/chat.ts)

- Schema needs 3 arrays: updates, deletions, additions
- `updates`: array of `{id: string, memory: string}` objects
- `deletions`: array of memory ID strings
- `additions`: array of new memory strings (already familiar from prev lesson)
- Add `.describe()` to guide LLM on when to use each operation

#### Phase 2: Update system prompt

[`problem/api/chat.ts`](./problem/api/chat.ts)

- Change role from "memory extraction agent" to "memory management agent"
- Add instructions for UPDATES task (modify existing memories with new info)
- Add instructions for DELETIONS task (remove outdated/incorrect memories)
- Keep ADDITIONS task instructions but note dedupe against existing
- Guide LLM: update takes precedence over delete (filtered later)

#### Phase 3: Call memory functions

[`problem/api/chat.ts`](./problem/api/chat.ts)

- `updates.forEach()` -> call `updateMemory(update.id, {...})`
- `filteredDeletions.forEach()` -> call `deleteMemory(deletion)`
- `saveMemories()` with additions mapped to full `MemoryItem` objects (add id + createdAt)
- Note: `filteredDeletions` prevents conflict if LLM tries to update AND delete same ID

#### Phase 4: Test contradictions

- Run dev server, chat with assistant
- Tell it fact: "I prefer window seats"
- Later contradict: "Actually I prefer aisle seats now"
- Check console logs - should see update to existing memory OR delete + add
- Working memory test: "I'm working on Project X" then "I finished Project X, now working on Y"

## Solution

### Steps To Complete

#### Phase 1: Schema definition

[`solution/api/chat.ts`](./solution/api/chat.ts) (lines 82-108)

- `updates`: `z.array(z.object({ id: z.string().describe(...), memory: z.string().describe(...) }))`
- `deletions`: `z.array(z.string()).describe(...)`
- `additions`: `z.array(z.string()).describe(...)`
- Descriptions help LLM understand purpose of each field
- Top-level `.describe()` on arrays explains when to use operation

#### Phase 2: Enhanced system prompt

[`solution/api/chat.ts`](./solution/api/chat.ts) (lines 109-140)

- Role: "memory management agent"
- Three explicit tasks listed: ADDITIONS, UPDATES, DELETIONS
- UPDATES: "identify existing memories that need updated with new info"
- DELETIONS: "identify outdated, incorrect, or no longer relevant"
- Instructions for each operation explain what to return
- Empty arrays if no changes needed

#### Phase 3: Memory operations

[`solution/api/chat.ts`](./solution/api/chat.ts) (lines 163-180)

- `updates.forEach(update => updateMemory(update.id, { memory: update.memory, createdAt: new Date().toISOString() }))`
- `filteredDeletions.forEach(deletion => deleteMemory(deletion))`
- `saveMemories(additions.map(addition => ({ id: generateId(), memory: addition, createdAt: new Date().toISOString() })))`
- Order matters: updates, then deletes, then adds
- `filteredDeletions` ensures no conflict from LLM returning same ID in both update & delete

### Next Up

- Memory system now handles changing facts
- Enables working memory (temporary context)
- But: all memories loaded into every request
- Token costs scale linearly with memory count
- Next: learn retrieval techniques to selectively load relevant memories only
