# Section 09: Subagents Skill Building - Learning Goals

## [09.01 - Subagents Intro](./09.01-subagents-intro/explainer/readme.md) (Explainer)

- Subagent architecture overcomes limitations of large monolithic agents
- Orchestrator agent coordinates specialized subagents for modular task delegation
- Four specialized agents: todos, student notes, scheduler, song finder
- Manual agent selection limitation: no cross-agent coordination
- Persistence layer pattern using JSON files for agent state
- `stopWhen: stepCountIs(10)` prevents infinite agent loops

## [09.02 - Building a Subagent Orchestrator](./09.02-building-a-subagent-orchestrator/problem/readme.md) (Problem)

- Generate task list via `generateObject` with subagent name and task prompt
- System prompt defines available subagents and delegation strategy
- Tasks executed in parallel, inter-dependent work split into multiple tasks
- Zod schema for typed task array with subagent enum validation
- Format conversation history for orchestrator context
- Terminal logging for debugging task generation

## [09.03 - Streaming Tasks to the Frontend](./09.03-streaming-tasks-to-the-frontend/problem/readme.md) (Problem)

- Swap `generateObject` to `streamObject` for progressive UI updates
- Monitor `partialObjectStream` for index-based task streaming
- Map task indexes to stable UUIDs for ID reconciliation
- Define `data-task` custom part type in `MyMessage` for task state
- Stream tasks to client via `writer.write` with stable IDs
- Render tasks in UI with `TaskItem` component showing progress

## [09.04 - Running Our Subagents](./09.04-running-our-subagents/problem/readme.md) (Problem)

- Diary data structure (simple string) tracks chronological work log
- `while` loop with step counter prevents infinite orchestrator loops
- Execute subagents in parallel via `Promise.all` with task prompts
- Update UI and diary with task results or errors
- Pass diary to orchestrator prompt for informed decision-making
- Preserve task history in message parts for follow-up conversations

## [09.05 - Summarizing Our System Output](./09.05-summarizing-our-system-output/problem/readme.md) (Problem)

- Generate final summary via `streamText` after all tasks complete
- Use diary and conversation history for coherent user-facing output
- Stream summary to client via manual text parts or `toUIMessageStream()`
- `getSummarizeSystemPrompt` provides summarization instructions
- Write summary using `writer.merge()` for streaming integration
- Transform raw task outputs into human-readable narrative

## [09.06 - Isolating Subagent Context](./09.06-isolating-subagent-context/problem/readme.md) (Problem)

- Summarize subagent output before writing to diary/UI for context efficiency
- `summarizeAgentOutput` function with streaming delta callback
- Track full summary via progressive concatenation of deltas
- Prevent double-cost token usage by compressing verbose agent chatter
- Isolated subagent context windows enable longer orchestrator sessions
- Progressive UI updates during summarization via `onSummaryDelta`

## [09.07 - Add a Planner to Our Orchestrator](./09.07-add-a-planner-to-our-orchestrator/problem/readme.md) (Problem)

- Pre-execution planning improves orchestrator reasoning quality
- Generate plan via `streamText` with `getPlanSystemPrompt` before loop
- Stream plan as reasoning parts: `reasoning-start`, `reasoning-delta`, `reasoning-end`
- Display reasoning parts in grayed-out UI for visual differentiation
- Store plan in diary to track chronological intent vs execution
- Planning phase allows better multi-agent coordination and error recovery
