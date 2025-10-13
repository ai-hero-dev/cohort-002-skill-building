# Approving HITL Requests

## Problem

### Intro

- Building approval flow for human-in-the-loop requests
- Frontend-heavy exercise - wiring up approve/reject buttons to data parts
- Creating feedback loop when rejecting actions
- Using discriminated unions for type-safe decision handling

### Steps To Complete

#### Phase 1: Backend Type Definition

[`problem/api/chat.ts`](./problem/api/chat.ts)

- Declare `action-decision` data part in `MyMessage` type
- Add `actionId` field (references which action decision is for)
- Add `decision` field of type `ActionDecision`
- `ActionDecision` is discriminated union: `{ type: 'approve' }` or `{ type: 'reject', reason: string }`

#### Phase 2: Component Props & Types

[`problem/client/components.tsx`](./problem/client/components.tsx), [`problem/client/root.tsx`](./problem/client/root.tsx)

- Type `onActionRequest` prop in `Message` component - takes `Action` and `ActionDecision`
- Type `actionIdsWithDecisionsMade` prop as `Set<string>`
- Implement `hasDecisionBeenMade` check - use `.has()` on set with action ID
- Only show buttons when `hasDecisionBeenMade` is false

#### Phase 3: Calculate Decisions Made

[`problem/client/root.tsx`](./problem/client/root.tsx)

- In `useMemo`, calculate `actionIdsWithDecisionsMade` set
- Filter all message parts for `'data-action-decision'` type
- Map to extract `actionId` from each decision
- Return as `new Set()`

#### Phase 4: Approval/Rejection Handlers

[`problem/client/root.tsx`](./problem/client/root.tsx)

- Implement `onActionRequest` callback
- For approve: call `sendMessage` with `data-action-decision` part containing `actionId` and `decision: { type: 'approve' }`
- For reject: save action to `actionGivingFeedbackOn` state, clear input
- Use state to switch `ChatInput` to feedback mode

#### Phase 5: Feedback Submission

[`problem/client/root.tsx`](./problem/client/root.tsx)

- Update `onSubmit` in `ChatInput`
- Check if `actionGivingFeedbackOn` exists
- If yes: send `data-action-decision` with `actionId` and `decision: { type: 'reject', reason: input }`
- Clear state and input after sending
- If no: normal text message flow

#### Phase 6: Render Buttons

[`problem/client/components.tsx`](./problem/client/components.tsx)

- Render Approve/Reject buttons in `Message` component
- Only show when `!hasDecisionBeenMade`
- Call `onActionRequest(part.data.action, 'approve')` and `'reject'`

## Solution

### Steps To Complete

#### Phase 1: Backend Type

[`solution/api/chat.ts`](./solution/api/chat.ts)

- `'action-decision'` part includes `actionId: string` and `decision: ActionDecision`
- Links user decision back to specific action via ID

#### Phase 2: Calculate Decision Set

[`solution/client/root.tsx`](./solution/client/root.tsx)

- Filter parts for `part.type === 'data-action-decision'`
- Map to `part.data.actionId`
- Wrap in `new Set()` for O(1) lookups
- Memoized - only recalculates when messages change

#### Phase 3: Approval Handler

[`solution/client/root.tsx`](./solution/client/root.tsx)

- Check `decision === 'approve'`
- Send message with parts array containing `data-action-decision`
- Include `actionId` from action and `decision: { type: 'approve' }`

#### Phase 4: Rejection + Feedback

[`solution/client/root.tsx`](./solution/client/root.tsx)

- On reject: clear input, save action to `actionGivingFeedbackOn`
- `ChatInput` switches placeholder to "Please give feedback..."
- On submit: check if `actionGivingFeedbackOn` exists
- Send `data-action-decision` with `type: 'reject'`, `reason: input`
- Clear state and input, return early

#### Phase 5: UI Components

[`solution/client/components.tsx`](./solution/client/components.tsx)

- Type `onActionRequest` as `(action: Action, decision: 'approve' | 'reject') => void`
- Type `actionIdsWithDecisionsMade` as `Set<string>`
- Check `actionIdsWithDecisionsMade.has(part.data.action.id)`
- Render Approve/Reject buttons with onClick handlers
- Buttons disappear after decision made

### Next Up

- Built complete approval flow with frontend state management
- Type-safe decision handling with discriminated unions
- Next: handling approved actions on backend - executing real operations based on user approvals
