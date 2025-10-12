# Section 07: Human-in-the-Loop Skill Building - Learning Goals

## [07.01 - HITL Intro](./07.01-hitl-intro/explainer/readme.md) (Explainer)

- Balance LLM autonomy vs risk management through human oversight
- Custom data parts for action lifecycle: `data-action-start`, `data-action-decision`, `data-action-end`
- Pause execution for human review before performing actions
- User approval/rejection flow with feedback mechanism
- Prevent LLM from executing high-impact actions without confirmation

## [07.02 - Initiating HITL Requests](./07.02-initiating-hitl-requests/problem/readme.md) (Problem)

- Define `action-start` custom data part with action metadata (id, type, to, subject, content)
- Modify tool `execute` to write `data-action-start` instead of performing action
- Use `stopWhen` with `hasToolCall` to halt agent after tool invocation
- Render email preview UI from `data-action-start` parts
- Separate tool calling from tool execution for human review

## [07.03 - Approving HITL Requests](./07.03-approving-hitl-requests/problem/readme.md) (Problem)

- Define `action-decision` custom data part with `ActionDecision` discriminated union
- Track decisions via `actionIdsWithDecisionsMade` set to hide approve/reject buttons
- Handle approval: send `data-action-decision` part via `sendMessage`
- Handle rejection: capture feedback in state, reuse `ChatInput` for reason entry
- Submit rejection feedback as `data-action-decision` with reason

## [07.04 - Passing Custom Message History to LLM](./07.04-passing-custom-message-history-to-the-llm/problem/readme.md) (Problem)

- Fix LLM ignoring user feedback by formatting custom data parts
- Replace `convertToModelMessages` with `prompt: getDiary(messages)`
- `getDiary` converts `UIMessage` array to markdown-formatted string
- Include all message parts (text, action-start, action-decision) in prompt
- Prompt engineering via custom message formatting for full conversation context

## [07.05 - Processing HITL Requests](./07.05-processing-hitl-requests/problem/readme.md) (Problem)

- Define `action-end` custom data part with action ID and output
- Implement `findDecisionsToProcess` to match actions with decisions
- Extract actions from assistant message, decisions from user message
- Return `HITLError` if user hasn't made decision for pending action
- Update `getDiary` to format `data-action-end` parts for LLM consumption

## [07.06 - Executing HITL Requests](./07.06-executing-the-hitl-requests/problem/readme.md) (Problem)

- Execute approved actions inside `createUIMessageStream` loop
- Create `messagesAfterHitl` copy to append `data-action-end` parts
- Call actual `sendEmail` only on approval, write `data-action-end` to stream
- Handle rejection branch: record rejection in `data-action-end` without executing
- Pass `messagesAfterHitl` to `getDiary` so LLM sees action outcomes
