# Basic Memory Setup

## Problem

### Intro

- Mem0 great for getting started but owning memory logic gives control
- Building custom memory: load from storage, pass to LLM, extract new memories, persist
- Key: distinguish permanent facts (preferences, traits) from temporary info (current task, weather)
- Real world: personalization requires durable memory across sessions

### Steps To Complete

#### Phase 1: Load and Format Memories

[`problem/api/chat.ts`](./problem/api/chat.ts) - Complete TODOs for loading memories

- Call `loadMemories()` to get existing memories from JSON
- Map through memories using `formatMemory()`, join with `\n\n`
- Memory text inserted into system prompt's `<memories>` tags
- LLM now has access to all past memories in context

#### Phase 2: Extract New Memories with `generateObject`

[`problem/api/chat.ts`](./problem/api/chat.ts) - Complete `onFinish` TODO

- Use `generateObject` with Gemini model
- Define Zod schema: `z.object({ memories: z.array(z.string()) })`
- Write system prompt explaining permanent vs temporary:
  - Permanent: preferences, traits, facts that persist (job, pet name, location)
  - Not permanent: current tasks, weather, trivial interactions
- Pass conversation history via `formatMessageHistory(allMessages)`
- Include existing memories in prompt to avoid duplicates
- Returns array of new memory strings

#### Phase 3: Save Memories with Metadata

[`problem/api/chat.ts`](./problem/api/chat.ts) - Complete save TODO

- Transform string array into objects with:
  - `id: generateId()` - unique identifier
  - `memory: memory` - the extracted text
  - `createdAt: new Date().toISOString()` - timestamp
- Call `saveMemories()` with transformed array
- Memories appended to existing ones in `memories.local.json`

## Solution

### Steps To Complete

#### Phase 1: Load Memories

[`solution/api/chat.ts`](./solution/api/chat.ts) lines 51-53

- `const memories = await loadMemories()`
- `const memoriesText = memories.map(formatMemory).join('\n\n')`
- Simple: load array, map to formatted strings, join

#### Phase 2: Generate Object for Memory Extraction

[`solution/api/chat.ts`](./solution/api/chat.ts) lines 76-112

- `generateObject` with schema `z.object({ memories: z.array(z.string()) })`
- System prompt defines permanent memory criteria:
  - Unlikely to change, relevant for weeks/months/years
  - Personal details, preferences, habits
  - Examples provided: dark mode preference, job, pet names
  - Counter-examples: temporary/situational info
- Prompt includes:
  - Formatted conversation history
  - Existing memories to prevent duplication
- Returns `{ memories: string[] }`

#### Phase 3: Save with Metadata

[`solution/api/chat.ts`](./solution/api/chat.ts) lines 116-122

- Map memory strings to objects:
  - `id: generateId()`
  - `memory` content
  - `createdAt: new Date().toISOString()`
- `saveMemories()` appends to existing array in JSON

#### Key Implementation Details

- `formatMemory()` creates multi-line format with memory text + timestamp
- `formatMessageHistory()` converts UIMessages to readable text format
- `onFinish` callback runs after streaming completes
- Persistence layer handles file I/O, directory creation
- Memory accumulation: new memories added to existing ones

### Next Up

Memory system works but loads ALL memories every request. Next: add retrieval to only load relevant memories using BM25 and semantic search.
