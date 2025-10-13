# Processing HITL Requests

## Problem

### Intro

- Have actions + decisions flowing through system, now need to connect them
- Processing = matching assistant's requested actions with user's decisions
- Critical safety mechanism: ensures user approves before execution
- Final validation step before actual email sending

### Steps To Complete

#### Phase 1: Declare action-end type

[`problem/api/chat.ts`](./problem/api/chat.ts)

- Add third custom data part: `action-end`
- Tracks action lifecycle: start -> decision -> end
- Contains `actionId` and `output` object with `message` field
- Enables diary to show completed actions

#### Phase 2: Update getDiary for action-end

[`problem/api/chat.ts`](./problem/api/chat.ts)

- Add handler for `data-action-end` part type
- Return descriptive string: `The action was performed: ${part.data.output.message}`
- Lets LLM see full action history

#### Phase 3: Validate user message

[`problem/api/chat.ts`](./problem/api/chat.ts)

- Check `mostRecentUserMessage` exists
- Return 400 Response if missing
- Optional: validate message role is 'user'
- Prevents processing empty/invalid messages

#### Phase 4: Implement findDecisionsToProcess

[`problem/api/hitl-processor.ts`](./problem/api/hitl-processor.ts)

- Extract actions: filter assistant parts for `data-action-start`, map to `.data.action`
- Extract decisions: filter user parts for `data-action-decision`, create Map of actionId -> decision
- Loop through actions, match with decisions
- If decision missing: return HITLError (400, "No decision found")
- If found: push `{action, decision}` to decisionsToProcess array
- Return array of matched pairs

#### Phase 5: Test

- Run dev server
- Send message triggering sendEmail
- Make approve/reject decision
- Check console.dir output shows matched action-decision pairs
- Note: emails still won't send (next exercise)

## Solution

### Steps To Complete

#### Phase 1: Type definitions

[`solution/api/chat.ts`](./solution/api/chat.ts)

- `action-end` part: `{actionId: string, output: {message: string}}`
- Simple structure, extensible for different action types

#### Phase 2: Diary handling

[`solution/api/chat.ts`](./solution/api/chat.ts)

- Handle `data-action-end`: return `The action was performed: ${part.data.output.message}`
- Maintains conversation context for LLM

#### Phase 3: Validation

[`solution/api/chat.ts`](./solution/api/chat.ts)

- Check `!mostRecentUserMessage`: return 400, "Messages array cannot be empty"
- Check `role !== 'user'`: return 400, "Last message must be a user message"
- Robust error handling

#### Phase 4: Core processor logic

[`solution/api/hitl-processor.ts`](./solution/api/hitl-processor.ts)

- Actions: `mostRecentAssistantMessage.parts.filter(part => part.type === 'data-action-start').map(part => part.data.action)`
- Decisions: `new Map(mostRecentUserMessage.parts.filter(part => part.type === 'data-action-decision').map(part => [part.data.actionId, part.data.decision]))`
- Loop + match: `decisions.get(action.id)`, return error if missing, otherwise push to array
- Clean, functional approach using filter/map

#### Phase 5: Flow overview

- Assistant requests action (action-start)
- User makes decision (action-decision)
- System validates all decisions present
- Returns matched pairs ready for execution
- Error if any action lacks decision

### Next Up

Action execution - actually sending emails based on approved decisions
