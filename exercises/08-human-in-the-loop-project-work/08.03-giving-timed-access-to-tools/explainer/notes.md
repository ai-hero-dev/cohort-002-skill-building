# Giving Timed Access to Tools

## Learning Goals

- Implement permission system for thread-scoped tool access
- Reduce approval friction for repeated tool use
- Track granted permissions in persistence layer
- Differentiate single approval vs "allow for this thread"
- Build UI for permission control (approve once vs approve for session)
- Understand security/UX tradeoffs in permission models

## Steps To Complete

### 1. Extend Persistence Layer for Permissions

Add permission tracking to `DB.PersistenceData`:

```typescript
// src/lib/persistence-layer.ts
export namespace DB {
  export interface ToolPermission {
    toolName: string;  // e.g., 'sendEmail', 'createGitHubIssue'
    grantedAt: string;
  }

  export interface Chat {
    id: string;
    title: string;
    messages: MyMessage[];
    grantedPermissions: ToolPermission[];  // Add this
    createdAt: string;
    updatedAt: string;
  }
}

export async function grantToolPermission(
  chatId: string,
  toolName: string
): Promise<DB.Chat | null> {
  const chats = await loadChats();
  const chatIndex = chats.findIndex((chat) => chat.id === chatId);

  if (chatIndex === -1) return null;

  const existing = chats[chatIndex]!.grantedPermissions.find(
    (p) => p.toolName === toolName
  );

  if (!existing) {
    chats[chatIndex]!.grantedPermissions.push({
      toolName,
      grantedAt: new Date().toISOString(),
    });
    chats[chatIndex]!.updatedAt = new Date().toISOString();
    await saveChats(chats);
  }

  return chats[chatIndex]!;
}
```

**Note:** Initialize `grantedPermissions: []` in `createChat`.

### 2. Update Action Decision Types

Extend `ActionDecision` discriminated union with new type:

```typescript
// src/app/api/chat/route.ts (or types file)
export type ActionDecision =
  | { type: 'approve' }
  | { type: 'approve-for-thread'; toolName: string }
  | { type: 'reject'; reason: string };
```

**Note:** `approve-for-thread` includes `toolName` to track which tool has blanket approval.

### 3. Check Permissions Before Requesting HITL

Modify HITL processor to skip approval for granted tools:

```typescript
// In findDecisionsToProcess or similar
export const shouldRequestApproval = (opts: {
  action: Action;
  grantedPermissions: DB.ToolPermission[];
}): boolean => {
  const { action, grantedPermissions } = opts;

  // Map action type to tool name
  const toolName = getToolNameFromAction(action);

  return !grantedPermissions.some((p) => p.toolName === toolName);
};
```

When executing tool:

```typescript
// In chat route execute function
const chat = await getChat(chatId);
const grantedPermissions = chat?.grantedPermissions || [];

// For each tool call
if (shouldRequestApproval({ action, grantedPermissions })) {
  // Write data-action-start (requires approval)
  writer.write({
    type: "data-action-start",
    data: { action },
  });
  return "Action queued for approval";
} else {
  // Execute immediately - permission already granted
  const result = await sendEmail(action);
  writer.write({
    type: "data-action-end",
    data: {
      actionId: action.id,
      output: { type: action.type, message: result },
    },
  });
  return "Email sent (pre-approved)";
}
```

**Note:** Auto-execution means HITL flow bypassed entirely. LLM still sees action outcome via `data-action-end`.

### 4. Update Frontend Approval UI

Add second button for thread-scoped approval:

```tsx
// Frontend component rendering action-start parts
<div className="action-preview">
  <EmailPreview action={action} />
  <div className="flex gap-2">
    <button onClick={() => handleApprove(action.id)}>
      Approve Once
    </button>
    <button onClick={() => handleApproveForThread(action.id, toolName)}>
      Allow for This Thread
    </button>
    <button onClick={() => handleReject(action.id)}>
      Reject
    </button>
  </div>
</div>
```

Handler sends decision with `approve-for-thread` type:

```typescript
const handleApproveForThread = (actionId: string, toolName: string) => {
  sendMessage({
    parts: [{
      type: "data-action-decision",
      data: {
        actionId,
        decision: { type: "approve-for-thread", toolName },
      },
    }],
  });
};
```

### 5. Process Thread Approval in HITL

Handle `approve-for-thread` decision type:

```typescript
// In execute function after processing decisions
for (const { action, decision } of hitlResult) {
  if (decision.type === 'approve' || decision.type === 'approve-for-thread') {
    // Execute action
    const result = await sendEmail(action);

    writer.write({
      type: "data-action-end",
      data: {
        actionId: action.id,
        output: { type: action.type, message: result },
      },
    });

    // Grant permission if thread approval
    if (decision.type === 'approve-for-thread') {
      await grantToolPermission(chatId, decision.toolName);
    }
  } else {
    // Handle rejection
  }
}
```

### 6. Add Permission Revocation (Optional)

Build UI to view/revoke granted permissions:

```typescript
// Server action
export async function revokeToolPermission(
  chatId: string,
  toolName: string
): Promise<boolean> {
  const chats = await loadChats();
  const chatIndex = chats.findIndex((chat) => chat.id === chatId);

  if (chatIndex === -1) return false;

  chats[chatIndex]!.grantedPermissions = chats[
    chatIndex
  ]!.grantedPermissions.filter((p) => p.toolName !== toolName);

  await saveChats(chats);
  return true;
}
```

Display granted permissions in sidebar or settings panel with revoke buttons.

### 7. Update System Prompt for Transparency

Inform LLM about granted permissions:

```typescript
const permissionsList = grantedPermissions
  .map((p) => `- ${p.toolName} (granted ${p.grantedAt})`)
  .join('\n');

const systemPrompt = `You are a personal assistant.

**Pre-approved tools for this conversation:**
${permissionsList || '(none)'}

These tools execute immediately without user approval. Use responsibly.`;
```

**Note:** LLM doesn't control approval behavior, but knowing status improves response quality.

## Mindful Considerations

**Security implications:**
- Thread-scoped = permissions persist across entire chat history
- User might forget granted permissions - consider expiry times (e.g., 1 hour)
- Don't grant destructive tools by default on new threads

**UX patterns:**
- Show badge/indicator when tools have blanket approval
- Clear permission list in chat settings
- Consider "always allow" (global) vs "allow for thread" (chat-scoped)

**Edge cases:**
- Multiple actions in single turn - one might have approval, others not
- Tool parameters change (send to different email) - may still need approval
- Revocation doesn't affect in-flight actions

**Testing flow:**
1. Request email send → see "Approve Once" + "Allow for This Thread"
2. Click "Allow for This Thread" → email sends
3. Request another email → executes immediately, no UI prompt
4. Check chat in sidebar → shows granted permission badge
5. Revoke permission → next email request requires approval again
