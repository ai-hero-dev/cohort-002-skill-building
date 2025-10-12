# Section 03: Memory Skill Building - Learning Goals

## [03.01 - Basic Memory Setup](./03.01-basic-memory-setup/problem/readme.md) (Problem)

- Load and format existing memories from persistent storage
- Pass memory context to LLM via system prompt
- Extract permanent memories from conversation using `generateObject`
- Define Zod schema for memory array structure
- Save new memories with ID and timestamp metadata
- Distinguish permanent vs temporary/situational information

## [03.02 - Updating Previous Memories](./03.02-updating-previous-memories/problem/readme.md) (Problem)

- Implement memory CRUD operations: updates, deletions, additions
- Define schemas for memory modifications using Zod
- Handle contradictory information by updating existing memories
- Prevent deletion conflicts by filtering IDs being updated
- Enable working memory (temporary info) beyond permanent facts
- Track memory evolution as user preferences change over time

## [03.03 - Memory as Tool Call](./03.03-memory-as-tool-call/problem/readme.md) (Problem)

- Convert automatic `onFinish` callback to agent-controlled tool
- Give agent decision power over when to memorize
- Use `tool()` function with updates/deletions/additions parameters
- Set `stopWhen: stepCountIs(5)` to allow multi-step tool calls
- Improve token efficiency by skipping trivial conversations
- Enable transparent tool calls visible in UI
- Agent batching: wait for natural conversation end before memorizing

## [03.04 - Semantic Recall on Memories](./03.04-semantic-recall-on-memories/explainer/readme.md) (Explainer)

- Scale memory system beyond loading entire database
- Query rewriting: generate keywords + search query for memory retrieval
- Combine BM25 keyword search with semantic embeddings search
- Use Reciprocal Rank Fusion to merge ranking results
- Embed memories at creation time using `embedMemory` function
- Retrieve top N most relevant memories (10-50) based on conversation context
- Format and inject retrieved memories into system prompt
