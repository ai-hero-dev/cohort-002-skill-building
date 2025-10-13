# Giving Timed Access to Tools

## Intro

- Why build HITL yourself: enables extensions like thread-scoped permissions
- AI SDK first-class HITL doesn't offer this flexibility
- Custom implementation = power to adapt approval flows
- Reduce approval friction for repeated tool use in conversation

## Demo Flow

### Phase 1: Show the Problem

[Main chat interface]

- Demo: trigger email send, approve once
- Trigger another email send - requires approval again
- Friction: repetitive approvals same tool same thread
- Workflow interrupted by constant confirmation requests
- User already trusted tool once - why ask again?

### Phase 2: Permission System Architecture

[`src/lib/persistence-layer.ts`]

- Extend `DB.Chat` schema: add `grantedPermissions: ToolPermission[]`
- `ToolPermission` interface: `toolName` + `grantedAt` timestamp
- `grantToolPermission()` function: upsert permission for chat+tool combo
- `revokeToolPermission()` function: remove permission from chat
- Thread-scoped: permissions persist entire chat, not global
- Initialize `grantedPermissions: []` in `createChat()`

### Phase 3: Update Decision Types

[Chat route types]

- Extend `ActionDecision` discriminated union
- Add `approve-for-thread` type with `toolName` field
- Three decision types: `approve`, `approve-for-thread`, `reject`
- Type safety ensures correct data flow through system

### Phase 4: Auto-Execute Granted Tools

[Chat API route - tool execute function]

- Load chat's `grantedPermissions` at request start
- Check: tool in granted list?
- If granted: execute immediately, write `data-action-end`, skip HITL
- If not granted: write `data-action-start`, wait for decision
- `shouldRequestApproval()` helper: maps action type to tool name, checks list
- LLM sees outcome either way via `action-end` part

### Phase 5: Frontend Approval UI

[Frontend component rendering actions]

- Two approval buttons: "Approve Once" + "Allow for This Thread"
- "Approve Once": sends `{ type: 'approve' }` decision
- "Allow for This Thread": sends `{ type: 'approve-for-thread', toolName }`
- Extract tool name from action type for permission tracking
- Track `actionIdsWithDecisionsMade` to hide buttons post-submission

### Phase 6: Process Thread Approval

[HITL decision processor]

- Execute action on approval or approve-for-thread
- Write `data-action-end` with result
- If `approve-for-thread`: call `grantToolPermission(chatId, toolName)`
- Permission persisted to file system immediately
- Next tool call same type auto-executes without UI prompt

### Phase 7: Permission Management UI

[Chat sidebar/settings]

- Display granted permissions list per chat
- Show tool name + grant timestamp
- Revoke button calls `revokeToolPermission` server action
- Permission badge indicator in chat UI
- Clear visual feedback when tools pre-approved

### Phase 8: System Prompt Transparency

[System prompt formatting]

- Inform LLM about granted permissions
- List pre-approved tools with grant timestamps
- "These tools execute immediately without user approval"
- Doesn't control behavior, improves response quality
- LLM knows context when actions auto-execute

## Demo the Working Flow

[Full workflow demonstration]

- Request email send → two approval options appear
- Click "Allow for This Thread" → email sends, permission granted
- Request another email send → executes immediately, no UI prompt
- Check sidebar → shows granted permission badge
- Revoke permission → next request requires approval again
- Scope: thread-level, not global across chats

## Mindful Considerations

**Security tradeoffs:**
- Thread-scoped = persists entire chat history
- User may forget granted permissions
- Consider expiry times (1 hour, session-based, etc.)
- Don't grant destructive tools by default

**UX patterns:**
- Badge indicators for pre-approved tools
- Clear permission list in settings
- Global vs thread vs time-limited approval
- Edge case: tool parameters change (different recipient) - still need approval?

**Implementation notes:**
- Multiple actions same turn: some granted, some not
- Revocation doesn't affect in-flight actions
- Tool name mapping must be consistent
- File system persistence: consider DB at scale

## Why This Matters

- Custom HITL implementation unlocks product features
- Thread-scoped permissions reduce friction without sacrificing safety
- Balances autonomy vs control
- Real assistant UX: trust builds over conversation
- Foundation for more sophisticated permission models
- Time-based, scope-based, parameter-based approval flows possible

## Next Up

Section 9: subagent architectures for modular task delegation
