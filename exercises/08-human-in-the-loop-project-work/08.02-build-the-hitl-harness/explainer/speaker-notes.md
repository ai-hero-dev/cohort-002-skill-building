# Build the HITL Harness

## Intro

- Apply Section 07 patterns to real assistant project
- Take destructive tools from 08.01, add approval layer
- Action lifecycle: start → decision → execution → end
- LLM sees full flow via diary formatting
- Balance power vs safety through human oversight

## Implementation Phases

### Phase 1: Define Action Types

[`/src/app/api/chat/route.ts`]

- Extend `MyMessage` with 3 custom data parts: `action-start`, `action-decision`, `action-end`
- `Action` type: discriminated union matching tool types from 08.01 (send-email, create-github-issue, create-todo)
- Each action type has specific fields (to/subject/content for email, repo/title/body for GitHub)
- `ActionDecision`: approve (no data) or reject (with reason string)
- UUID action IDs for tracking through lifecycle

### Phase 2: Convert Tools to Action Writers

- Modify tool execute handlers from 08.01
- Instead of calling service: write `data-action-start` with action metadata
- Return immediate confirmation: "Email to X queued for approval"
- Use `stopWhen: hasToolCall` to pause agent after tool invocation
- Tool execution separated from action execution

### Phase 3: Build HITL Processor

- `findDecisionsToProcess()` matches actions with user decisions
- Extract `action-start` parts from assistant message, `action-decision` from user message
- Match by action ID, return error if pending action without decision
- Returns array of `{ action, decision }` pairs for execution
- Prevents action execution without explicit approval

### Phase 4: Frontend Approval UI

[`/src/app/chat.tsx`]

- Render action preview from `data-action-start` parts
- Show action details based on type (email content, GitHub issue body, etc)
- Track `actionIdsWithDecisions` set to hide buttons after submission
- Approve button: send `data-action-decision` with `{ type: "approve" }` via `sendMessage`
- Reject flow: capture feedback in input, submit as `{ type: "reject", reason: string }`
- Reuse `ChatInput` component for feedback entry, change placeholder

### Phase 5: Diary Formatting

- `getDiary()` converts `UIMessage[]` to markdown string for LLM
- LLM doesn't receive message objects, receives text diary
- Format text parts as-is
- Format `action-start`: "Assistant requested to send email: To/Subject/Content"
- Format `action-decision`: "User approved" or "User rejected: reason"
- Format `action-end`: "Action result: output message"
- All custom parts must be readable text in diary

### Phase 6: Execute Actions in Stream

[`/src/app/api/chat/route.ts`]

- Inside `createUIMessageStream`, call `findDecisionsToProcess()` first
- Clone messages array: `messagesAfterHitl = structuredClone(messages)`
- Loop through HITL results, execute approved actions
- Approved: call service (emailService.send, githubService.createIssue), write `data-action-end` with success output
- Rejected: write `data-action-end` with cancellation message including reason
- Append `action-end` parts to `messagesAfterHitl` array
- Pass `messagesAfterHitl` to `getDiary()` so LLM sees action outcomes
- Use `prompt: getDiary(messagesAfterHitl)` instead of `messages: convertToModelMessages()`

### Phase 7: System Prompt Guidance

- Explain HITL flow: tool call → pause → approval → result
- List which tools require approval vs instant execution
- Instruct: never assume success, wait for action-end result
- Guide: acknowledge user decisions, adjust on rejection feedback
- Transparent behavior: LLM knows it's waiting for human decision

### Phase 8: Test Flows

**Approve:**
- User: "Email john@example.com about meeting change"
- Agent calls sendEmail tool
- UI shows preview, user approves
- Email sends, agent confirms success

**Reject:**
- User: "Send reminder about TPS reports"
- Agent calls sendEmail tool
- UI shows preview, user rejects with "Wrong recipient"
- Agent sees rejection reason in diary, asks clarifying question
- LLM adapts based on feedback

## Key Implementation Details

**State management:** Track which action IDs have decisions to hide buttons after submission

**Error handling:** HITL processor returns error if action lacks matching decision

**Message cloning:** `structuredClone()` avoids mutating original array when appending action-end parts

**Tool execution timing:** Deferred vs immediate - destructive tools write action-start, safe tools execute instantly

**Diary vs messages:** LLM receives formatted text diary, not UIMessage objects

**stopWhen strategy:** `hasToolCall` pauses after any tool call, resumes after user decision

**Service layer integration:** Import email/GitHub/calendar services from 08.01, call inside execution switch

**TypeScript patterns:** Action discriminated union, switch on type for type-specific fields

**UI polish:** Action history display, loading states, execution confirmation messages

**Non-destructive exemption:** Todos, search, read-only tools don't need HITL, execute immediately

## Next Up

Lesson 08.03: thread-scoped permissions to reduce approval friction - "Allow for This Thread" vs "Approve Once"
