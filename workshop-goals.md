# Workshop Goals

## Section 01: Retrieval Skill Building

### [01.01 - BM25](./exercises/01-retrieval-skill-building/01.01-bm25/explainer/readme.md) (Explainer)

- Keyword-based search using BM25 algorithm
- Term frequency & inverse document frequency scoring
- Document length normalization
- Understanding BM25 limitations: no semantic understanding, requires exact keyword matching

### [01.02 - Retrieval with BM25](./exercises/01-retrieval-skill-building/01.02-retrieval-with-bm25/problem/readme.md) (Problem)

- Generate keywords from conversation history using `streamObject`
- Implement BM25 search with `okapibm25` package
- Select top N most relevant search results
- Use LLM to answer questions with retrieved email context
- Format message history for LLM consumption

### [01.03 - Embeddings](./exercises/01-retrieval-skill-building/01.03-embeddings/problem/readme.md) (Problem)

- Semantic search via embeddings (vector representations of text)
- Use `embedMany` to create corpus embeddings
- Use `embed` to create query embeddings
- Calculate relevance with `cosineSimilarity`
- Compare semantic vs keyword-based retrieval performance
- Understand when embeddings outperform keyword search

### [01.04 - Rank Fusion](./exercises/01-retrieval-skill-building/01.04-rank-fusion/explainer/readme.md) (Explainer)

- Reciprocal rank fusion (RRF) algorithm for combining rankings
- Merge BM25 + semantic search results
- Handle different scoring scales between ranking systems
- Position-based scoring formula: `1/(k+rank)`
- Leverage complementary strengths of multiple retrieval methods

### [01.05 - Query Rewriting](./exercises/01-retrieval-skill-building/01.05-query-rewriting/problem/readme.md) (Problem)

- Pre-retrieval optimization via query rewriter LLM
- Convert long conversation history to focused, refined query
- Prevent dilution of recent/relevant context in embeddings
- Improve semantic search precision
- Generate both keywords (for BM25) and search query (for embeddings) in single call

### [01.06 - Reranking](./exercises/01-retrieval-skill-building/01.06-reranking/problem/readme.md) (Problem)

- Post-retrieval filtering via reranker LLM
- Pass top 30 results to reranker, return most relevant IDs only
- Token optimization: return IDs not full content
- Format emails with IDs for LLM evaluation
- Handle potential LLM hallucination of non-existent IDs
- Trade latency for improved retrieval relevance

## Section 02: Retrieval Project Work

### [02.01 - Building Your Own Dataset](./exercises/02-retrieval-project-work/02.01-building-your-own-dataset/explainer/readme.md) (Explainer)

- Set up custom dataset for project work
- Options: Gmail export, chat logs, or pre-built email dataset
- Prepare data structure for retrieval pipeline
- Optional: skip if using pre-built dataset

### [02.02 - Building a Search Algorithm](./exercises/02-retrieval-project-work/02.02-building-a-search-algorithm/explainer/todo.md) (Explainer)

- Build complete search algorithm from scratch in project search page
- Work directly in project codebase vs isolated exercises

### [02.03 - Building a Search Agent](./exercises/02-retrieval-project-work/02.03-building-a-search-agent/explainer/todo.md) (Explainer)

- Connect search algorithm to agent
- Integrate retrieval with agent conversation flow
- Apply query optimization in production context

### [02.04 - Returning Related Emails](./exercises/02-retrieval-project-work/02.04-returning-related-emails/explainer/todo.md) (Explainer)

- Understand email relationships and thread structure
- Fetch entire email threads from single email match
- Include related emails in retrieval results
- Configure before/after range for thread context
- Explore LLM tool for dynamic thread fetching
- Pass thread-enriched results to reranker

## Section 03: Memory Skill Building

### [03.01 - Basic Memory Setup](./exercises/03-memory-skill-building/03.01-basic-memory-setup/problem/readme.md) (Problem)

- Load and format existing memories from persistent storage
- Pass memory context to LLM via system prompt
- Extract permanent memories from conversation using `generateObject`
- Define Zod schema for memory array structure
- Save new memories with ID and timestamp metadata
- Distinguish permanent vs temporary/situational information

### [03.02 - Updating Previous Memories](./exercises/03-memory-skill-building/03.02-updating-previous-memories/problem/readme.md) (Problem)

- Implement memory CRUD operations: updates, deletions, additions
- Define schemas for memory modifications using Zod
- Handle contradictory information by updating existing memories
- Prevent deletion conflicts by filtering IDs being updated
- Enable working memory (temporary info) beyond permanent facts
- Track memory evolution as user preferences change over time

### [03.03 - Memory as Tool Call](./exercises/03-memory-skill-building/03.03-memory-as-tool-call/problem/readme.md) (Problem)

- Convert automatic `onFinish` callback to agent-controlled tool
- Give agent decision power over when to memorize
- Use `tool()` function with updates/deletions/additions parameters
- Set `stopWhen: stepCountIs(5)` to allow multi-step tool calls
- Improve token efficiency by skipping trivial conversations
- Enable transparent tool calls visible in UI
- Agent batching: wait for natural conversation end before memorizing

### [03.04 - Semantic Recall on Memories](./exercises/03-memory-skill-building/03.04-semantic-recall-on-memories/explainer/readme.md) (Explainer)

- Scale memory system beyond loading entire database
- Query rewriting: generate keywords + search query for memory retrieval
- Embed memories at creation time using `embedMemory` function
- Retrieve top N most relevant memories (10-50) based on conversation context
- Format and inject retrieved memories into system prompt

## Section 04: Memory Project Work

_Content to be added_

## Section 05: Evals Skill Building

### [05.01 - Evaluating Tool Call Agents](./exercises/05-evals-skill-building/05.01-evaluating-tool-call-agents/explainer/readme.md) (Explainer)

- Test LLM tool calling behavior using Evalite framework
- Inspect `toolCalls` array to verify expected tool invocation
- Binary scoring pattern: 1 for success, 0 for failure
- Extend evaluations to validate tool parameters and execution results
- Foundation for systematic agent testing

### [05.02 - Creating Synthetic Datasets](./exercises/05-evals-skill-building/05.02-creating-synthetic-datasets/problem/readme.md) (Problem)

- Generate realistic evaluation datasets using LLMs to scale testing
- Use `generateText` for simple output (persona descriptions)
- Use `generateObject` for structured data (conversation turns)
- Create 4 scenario types: happy path, situational only, edge case mixed, adversarial privacy
- Prompt engineering for diverse, realistic synthetic data generation
- Output 12 conversations (3 per scenario) to test memory extraction systems

### [05.03 - Langfuse Observability & Datasets](./exercises/05-evals-skill-building/05.03-langfuse-observability-and-datasets/explainer/readme.md) (Explainer)

- Bridge production monitoring to systematic evaluation workflow
- Enable OpenTelemetry tracing with `experimental_telemetry: { isEnabled: true }`
- Group multi-turn conversations using `sessionId` for session tracking
- Wrap handlers with `observe()` decorator to create Langfuse traces
- Convert production traces to datasets with ground truth annotations
- Iterative improvement loop: monitor → dataset → eval → fix → repeat
- Export Langfuse datasets for Evalite evaluation runs
- Track performance over time and link eval failures to production traces

## Section 06: Evals Project Work

_Content to be added_

## Section 07: Human-in-the-Loop Skill Building

### [07.01 - HITL Intro](./exercises/07-human-in-the-loop-skill-building/07.01-hitl-intro/explainer/readme.md) (Explainer)

- Balance LLM autonomy vs risk management through human oversight
- Custom data parts for action lifecycle: `data-action-start`, `data-action-decision`, `data-action-end`
- Pause execution for human review before performing actions
- User approval/rejection flow with feedback mechanism
- Prevent LLM from executing high-impact actions without confirmation

### [07.02 - Initiating HITL Requests](./exercises/07-human-in-the-loop-skill-building/07.02-initiating-hitl-requests/problem/readme.md) (Problem)

- Define `action-start` custom data part with action metadata (id, type, to, subject, content)
- Modify tool `execute` to write `data-action-start` instead of performing action
- Use `stopWhen` with `hasToolCall` to halt agent after tool invocation
- Render email preview UI from `data-action-start` parts
- Separate tool calling from tool execution for human review

### [07.03 - Approving HITL Requests](./exercises/07-human-in-the-loop-skill-building/07.03-approving-hitl-requests/problem/readme.md) (Problem)

- Define `action-decision` custom data part with `ActionDecision` discriminated union
- Track decisions via `actionIdsWithDecisionsMade` set to hide approve/reject buttons
- Handle approval: send `data-action-decision` part via `sendMessage`
- Handle rejection: capture feedback in state, reuse `ChatInput` for reason entry
- Submit rejection feedback as `data-action-decision` with reason

### [07.04 - Passing Custom Message History to LLM](./exercises/07-human-in-the-loop-skill-building/07.04-passing-custom-message-history-to-the-llm/problem/readme.md) (Problem)

- Fix LLM ignoring user feedback by formatting custom data parts
- Replace `convertToModelMessages` with `prompt: getDiary(messages)`
- `getDiary` converts `UIMessage` array to markdown-formatted string
- Include all message parts (text, action-start, action-decision) in prompt
- Prompt engineering via custom message formatting for full conversation context

### [07.05 - Processing HITL Requests](./exercises/07-human-in-the-loop-skill-building/07.05-processing-hitl-requests/problem/readme.md) (Problem)

- Define `action-end` custom data part with action ID and output
- Implement `findDecisionsToProcess` to match actions with decisions
- Extract actions from assistant message, decisions from user message
- Return `HITLError` if user hasn't made decision for pending action
- Update `getDiary` to format `data-action-end` parts for LLM consumption

### [07.06 - Executing HITL Requests](./exercises/07-human-in-the-loop-skill-building/07.06-executing-the-hitl-requests/problem/readme.md) (Problem)

- Execute approved actions inside `createUIMessageStream` loop
- Create `messagesAfterHitl` copy to append `data-action-end` parts
- Call actual `sendEmail` only on approval, write `data-action-end` to stream
- Handle rejection branch: record rejection in `data-action-end` without executing
- Pass `messagesAfterHitl` to `getDiary` so LLM sees action outcomes

## Section 08: Human-in-the-Loop Project Work

_Content to be added_

## Section 09: Subagents Skill Building

### [09.01 - Subagents Intro](./exercises/09-subagents-skill-building/09.01-subagents-intro/explainer/readme.md) (Explainer)

- Subagent architecture overcomes limitations of large monolithic agents
- Orchestrator agent coordinates specialized subagents for modular task delegation
- Four specialized agents: todos, student notes, scheduler, song finder
- Manual agent selection limitation: no cross-agent coordination
- Persistence layer pattern using JSON files for agent state
- `stopWhen: stepCountIs(10)` prevents infinite agent loops

### [09.02 - Building a Subagent Orchestrator](./exercises/09-subagents-skill-building/09.02-building-a-subagent-orchestrator/problem/readme.md) (Problem)

- Generate task list via `generateObject` with subagent name and task prompt
- System prompt defines available subagents and delegation strategy
- Tasks executed in parallel, inter-dependent work split into multiple tasks
- Zod schema for typed task array with subagent enum validation
- Format conversation history for orchestrator context
- Terminal logging for debugging task generation

### [09.03 - Streaming Tasks to the Frontend](./exercises/09-subagents-skill-building/09.03-streaming-tasks-to-the-frontend/problem/readme.md) (Problem)

- Swap `generateObject` to `streamObject` for progressive UI updates
- Monitor `partialObjectStream` for index-based task streaming
- Map task indexes to stable UUIDs for ID reconciliation
- Define `data-task` custom part type in `MyMessage` for task state
- Stream tasks to client via `writer.write` with stable IDs
- Render tasks in UI with `TaskItem` component showing progress

### [09.04 - Running Our Subagents](./exercises/09-subagents-skill-building/09.04-running-our-subagents/problem/readme.md) (Problem)

- Diary data structure (simple string) tracks chronological work log
- `while` loop with step counter prevents infinite orchestrator loops
- Execute subagents in parallel via `Promise.all` with task prompts
- Update UI and diary with task results or errors
- Pass diary to orchestrator prompt for informed decision-making
- Preserve task history in message parts for follow-up conversations

### [09.05 - Summarizing Our System Output](./exercises/09-subagents-skill-building/09.05-summarizing-our-system-output/problem/readme.md) (Problem)

- Generate final summary via `streamText` after all tasks complete
- Use diary and conversation history for coherent user-facing output
- Stream summary to client via manual text parts or `toUIMessageStream()`
- `getSummarizeSystemPrompt` provides summarization instructions
- Write summary using `writer.merge()` for streaming integration
- Transform raw task outputs into human-readable narrative

### [09.06 - Isolating Subagent Context](./exercises/09-subagents-skill-building/09.06-isolating-subagent-context/problem/readme.md) (Problem)

- Summarize subagent output before writing to diary/UI for context efficiency
- `summarizeAgentOutput` function with streaming delta callback
- Track full summary via progressive concatenation of deltas
- Prevent double-cost token usage by compressing verbose agent chatter
- Isolated subagent context windows enable longer orchestrator sessions
- Progressive UI updates during summarization via `onSummaryDelta`

### [09.07 - Add a Planner to Our Orchestrator](./exercises/09-subagents-skill-building/09.07-add-a-planner-to-our-orchestrator/problem/readme.md) (Problem)

- Pre-execution planning improves orchestrator reasoning quality
- Generate plan via `streamText` with `getPlanSystemPrompt` before loop
- Stream plan as reasoning parts: `reasoning-start`, `reasoning-delta`, `reasoning-end`
- Display reasoning parts in grayed-out UI for visual differentiation
- Store plan in diary to track chronological intent vs execution
- Planning phase allows better multi-agent coordination and error recovery

## Section 10: Subagents Project Work

_Content to be added_
