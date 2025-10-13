# Executing HITL Requests

## Problem

### Intro

- All HITL loop components built - now execute approved actions
- Connect user decisions to actual email sending
- Critical: keep LLM aware of action results via message history
- Real-world: LLM needs feedback about what actually happened to continue conversation intelligently

### Steps To Complete

#### Phase 1: Copy messages array

[`problem/api/chat.ts`](problem/api/chat.ts)

- Make `messagesAfterHitl` copy of incoming `messages`
- Will mutate to include `data-action-end` parts
- LLM needs updated history to see action outputs

#### Phase 2: Handle approved actions

[`problem/api/chat.ts`](problem/api/chat.ts)

- In `approve` branch: call `sendEmail()` with action details
- Create `data-action-end` message part (use `MyMessagePart` type)
- `writer.write()` to sync frontend
- Push part to last message in `messagesAfterHitl`

#### Phase 3: Handle rejected actions

[`problem/api/chat.ts`](problem/api/chat.ts)

- In reject branch: skip email send
- Create `data-action-end` part with rejection reason
- `writer.write()` to sync frontend
- Push part to last message in `messagesAfterHitl`
- `getDiary()` already formats rejection for LLM

#### Phase 4: Fix diary prompt

[`problem/api/chat.ts`](problem/api/chat.ts)

- Change `getDiary(messages)` to `getDiary(messagesAfterHitl)`
- Without this, LLM won't see action results
- Breaks conversation continuity

## Solution

### Steps To Complete

#### Phase 1: Set up message tracking

[`solution/api/chat.ts`](solution/api/chat.ts) (line 140)

- `messagesAfterHitl` initialized as reference to `messages`
- Mutates as we process decisions
- Used later for LLM prompt

#### Phase 2: Execute approve branch

[`solution/api/chat.ts`](solution/api/chat.ts) (lines 143-168)

- `sendEmail()` with `action.to`, `action.subject`, `action.content`
- Create typed `data-action-end` part: `type: 'data-action-end'`, includes `actionId` and output message
- `writer.write(messagePart)` syncs to frontend
- Push to `messagesAfterHitl[messagesAfterHitl.length - 1]!.parts`

#### Phase 3: Execute reject branch

[`solution/api/chat.ts`](solution/api/chat.ts) (lines 169-188)

- Skip actual email send
- Create `data-action-end` part with rejection message
- Same write and push pattern as approve
- `getDiary()` already handles formatting rejection for LLM context

#### Phase 4: Update LLM prompt

[`solution/api/chat.ts`](solution/api/chat.ts) (line 200)

- `prompt: getDiary(messagesAfterHitl)` instead of `messages`
- LLM now sees complete action lifecycle
- Can acknowledge what happened in next response

### Next Up

Full HITL loop complete - LLM requests action, user decides, action executes, LLM continues with knowledge of outcome. Real personal assistant behavior achieved.
