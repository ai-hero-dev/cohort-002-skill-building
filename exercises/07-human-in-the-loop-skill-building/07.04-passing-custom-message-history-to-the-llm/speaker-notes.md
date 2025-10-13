# Passing Custom Message History to the LLM

## Problem

### Intro

- Bug: LLM ignores rejection feedback, still claims email sent successfully
- Root cause: `convertToModelMessages` strips custom data parts from UIMessages
- Model messages only see text/tool parts, miss `action-start` and `action-decision` data
- Need LLM to see full context: what assistant requested + user's approval/rejection
- Solution: format entire conversation history as markdown string using `prompt` property

### Steps To Complete

#### Phase 1: Understand the Bug

- Test flow: send email → reject with feedback → LLM responds incorrectly
- [`problem/api/chat.ts`](./problem/api/chat.ts) line 104: uses `messages: convertToModelMessages(messages)`
- `convertToModelMessages` drops custom data parts (`action-start`, `action-decision`)
- LLM doesn't see rejection reason, thinks email sent

#### Phase 2: Use getDiary Function

- [`problem/api/chat.ts`](./problem/api/chat.ts) lines 44-84: `getDiary` helper provided
- Converts message history to markdown string
- Formats each message with heading (## User/Assistant Message)
- Translates custom parts to readable text:
  - `action-start` → "The assistant requested to send an email: To: X, Subject: Y..."
  - `action-decision` → "User approved/rejected: reason"
- Full control over prompt engineering from within messages

#### Phase 3: Replace convertToModelMessages

- Change line 104 from `messages: convertToModelMessages(messages)` to `prompt: getDiary(messages)`
- Add `console.log(getDiary(messages))` before `streamText` to inspect output
- Test: send email → reject → LLM now responds properly to feedback
- See formatted conversation history in console

## Solution

### Steps To Complete

#### Phase 1: Make the Switch

- [`solution/api/chat.ts`](./solution/api/chat.ts) line 101: uses `prompt: getDiary(messages)`
- No longer using `convertToModelMessages`
- System prompt mentions "diary of conversation so far"

#### Phase 2: Test the Fix

- Run app, send email request
- Reject with feedback like "too formal, make it casual"
- LLM now sees rejection reason in formatted history
- Redrafts email based on feedback
- Console shows full markdown-formatted conversation

#### Phase 3: Key Takeaway

- `prompt` property takes string, full control over formatting
- `messages` property uses model messages, loses custom data
- When using custom UIMessage data parts, format history yourself
- Prompt engineering inside message history = powerful pattern
- Trade-off: lose built-in context window management

### Next Up

- Built full human-in-the-loop workflow with custom message formatting
- Next: explore more advanced agentic patterns and multi-step reasoning
