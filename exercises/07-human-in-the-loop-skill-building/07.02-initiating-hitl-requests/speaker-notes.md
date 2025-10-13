# Initiating HITL Requests

## Problem

### Intro

- Current impl: LLM sends emails directly via `sendEmail` tool - too much power
- Need preview mechanism: agent proposes action, waits for approval
- First step in HITL: pause execution, show what agent wants to do
- Real world: can't trust LLM to execute high-stakes actions autonomously

### Steps To Complete

#### Phase 1: Define Action Type

[`problem/api/chat.ts`](./problem/api/chat.ts)

- Extend `MyMessage` type with `action-start` custom data part
- Include: `id`, `type` ("send-email"), `to`, `subject`, `content`
- `id` critical for future phases to reference this action

#### Phase 2: Modify Tool Execute

[`problem/api/chat.ts`](./problem/api/chat.ts)

- Replace `sendEmail()` call with `writer.write()` in tool execute
- Write `data-action-start` part with action details
- Agent now proposes instead of executes
- Keep return value for tool result

#### Phase 3: Update Stop Condition

[`problem/api/chat.ts`](./problem/api/chat.ts)

- Current: `stopWhen: stepCountIs(10)` - backstop only
- Need: stop on tool call AND step limit
- Use `hasToolCall('sendEmail')` from AI SDK
- Array syntax: `stopWhen: [stepCountIs(10), hasToolCall('sendEmail')]`
- Stops immediately after sendEmail called, waits for user approval

#### Phase 4: Render Preview UI

[`problem/client/components.tsx`](./problem/client/components.tsx)

- Check `part.type === 'data-action-start'` in Message component
- Display email preview: to, subject, content fields
- Visual formatting shows pending action

## Solution

### Steps To Complete

#### Phase 1: Type Definition

[`solution/api/chat.ts`](./solution/api/chat.ts)

- Extract `Action` type: `id`, `type: 'send-email'`, `to`, `subject`, `content`
- `MyMessage` data part: `'action-start': { action: Action }`
- Reusable across future action types

#### Phase 2: Write Action to Stream

[`solution/api/chat.ts`](./solution/api/chat.ts)

- Tool execute: `writer.write({ type: 'data-action-start', data: { action: {...} } })`
- Generate unique `id: crypto.randomUUID()`
- Include all action props: type, to, subject, content
- No longer calls `sendEmail()` directly

#### Phase 3: Stop Conditions Array

[`solution/api/chat.ts`](./solution/api/chat.ts)

- Import `hasToolCall` from `ai`
- `stopWhen: [stepCountIs(10), hasToolCall('sendEmail')]`
- Both conditions active: stops on either trigger

#### Phase 4: Action Preview Component

[`solution/client/components.tsx`](./solution/client/components.tsx)

- Check `part.type === 'data-action-start'`
- Render preview: "I'm requesting to send an email"
- Styled card: gray bg, displays to/subject/content
- Key prop: `part.id` for React reconciliation

### Next Up

- Agent proposes, UI shows preview
- Still missing: approval/rejection mechanism
- Next: wire up buttons to resume or cancel execution
