# Build HITL Harness

## Learning Goals

- Apply Section 07 HITL patterns to real assistant project
- Implement action lifecycle: `data-action-start`, `data-action-decision`, `data-action-end`
- Build approval/rejection UI for destructive actions
- Process HITL decisions and execute approved actions
- Format custom data parts in conversation diary for LLM context

## Steps To Complete

### 1. Define Custom Data Parts in `MyMessage`

Extend `MyMessage` type in `/src/app/api/chat/route.ts`:

```typescript
export type MyMessage = UIMessage<
  never,
  {
    "frontend-action": "refresh-sidebar";
    "action-start": {
      action: Action;
    };
    "action-decision": {
      actionId: string;
      decision: ActionDecision;
    };
    "action-end": {
      actionId: string;
      output: string;
    };
  }
>;
```

Define action types:

```typescript
export type Action = {
  id: string;
  type: "send-email" | "create-github-issue" | "create-todo";
  // Type-specific fields based on action type
  to?: string;
  subject?: string;
  content?: string;
  repo?: string;
  title?: string;
  body?: string;
};

export type ActionDecision =
  | { type: "approve" }
  | { type: "reject"; reason: string };
```

**Note:** Action types match destructive tools from 08.01. Extend as needed.

### 2. Modify Tools to Write `data-action-start`

Update tool execute handlers (from lesson 08.01) to write action instead of executing:

```typescript
// Example: email tool
export const sendEmailTool = tool({
  description: "Send email",
  parameters: z.object({
    to: z.string(),
    subject: z.string(),
    content: z.string(),
  }),
  execute: async ({ to, subject, content }, { writer }) => {
    const actionId = crypto.randomUUID();

    writer.write({
      type: "data-action-start",
      data: {
        action: {
          id: actionId,
          type: "send-email",
          to,
          subject,
          content,
        },
      },
    });

    return `Email to ${to} queued for approval`;
  },
});
```

**Key:** Tool returns immediately. No actual execution. Use `stopWhen: hasToolCall` to pause agent.

### 3. Build HITL Processor Function

Create `findDecisionsToProcess()` utility:

```typescript
type HITLResult =
  | { action: Action; decision: ActionDecision }[]
  | { status: number; message: string };

export function findDecisionsToProcess({
  mostRecentUserMessage,
  mostRecentAssistantMessage,
}: {
  mostRecentUserMessage: MyMessage;
  mostRecentAssistantMessage?: MyMessage;
}): HITLResult {
  // Extract actions from assistant message
  const actions =
    mostRecentAssistantMessage?.parts
      .filter((p) => p.type === "data-action-start")
      .map((p) => p.data.action) || [];

  // Extract decisions from user message
  const decisions =
    mostRecentUserMessage.parts
      .filter((p) => p.type === "data-action-decision")
      .map((p) => ({ actionId: p.data.actionId, decision: p.data.decision })) ||
    [];

  if (actions.length === 0) return [];

  // Match actions with decisions
  const results = actions.map((action) => {
    const decision = decisions.find((d) => d.actionId === action.id);
    if (!decision) {
      return {
        status: 400,
        message: `No decision for action ${action.id}`,
      };
    }
    return { action, decision: decision.decision };
  });

  if (results.some((r) => "status" in r)) {
    return results.find((r) => "status" in r) as HITLResult;
  }

  return results as { action: Action; decision: ActionDecision }[];
}
```

**Note:** Returns error if pending action without decision.

### 4. Build Frontend Approval UI

Create action preview component in chat UI (`/src/app/chat.tsx` or separate component):

```typescript
// Track which actions have decisions
const [actionIdsWithDecisions, setActionIdsWithDecisions] = useState<Set<string>>(new Set());

// In message rendering loop:
{message.parts.map((part) => {
  if (part.type === "data-action-start") {
    const hasDecision = actionIdsWithDecisions.has(part.data.action.id);

    return (
      <div className="bg-gray-900 border rounded p-4">
        <h3>Action Request: {part.data.action.type}</h3>
        {/* Render action details based on type */}
        {part.data.action.type === "send-email" && (
          <>
            <p>To: {part.data.action.to}</p>
            <p>Subject: {part.data.action.subject}</p>
            <pre>{part.data.action.content}</pre>
          </>
        )}

        {!hasDecision && (
          <>
            <button onClick={() => handleApprove(part.data.action)}>
              Approve
            </button>
            <button onClick={() => setRejectingAction(part.data.action)}>
              Reject
            </button>
          </>
        )}
      </div>
    );
  }
})}
```

**Approval handler:**

```typescript
const handleApprove = (action: Action) => {
  sendMessage(
    {
      text: "", // Empty text OK for data-only message
      experimental_data: [
        {
          type: "data-action-decision",
          data: {
            actionId: action.id,
            decision: { type: "approve" },
          },
        },
      ],
    },
    { body: { id: chatId } }
  );

  setActionIdsWithDecisions((prev) => new Set(prev).add(action.id));
};
```

**Rejection handler:** Capture feedback in input, submit as decision:

```typescript
const [rejectingAction, setRejectingAction] = useState<Action | null>(null);

const handleRejectSubmit = (reason: string) => {
  sendMessage(
    {
      text: reason, // Visible feedback for LLM
      experimental_data: [
        {
          type: "data-action-decision",
          data: {
            actionId: rejectingAction!.id,
            decision: { type: "reject", reason },
          },
        },
      ],
    },
    { body: { id: chatId } }
  );

  setActionIdsWithDecisions((prev) => new Set(prev).add(rejectingAction!.id));
  setRejectingAction(null);
};
```

**Note:** Reuse `ChatInput` component for feedback entry. Change placeholder to "Explain why...".

### 5. Create Diary Function for LLM Context

Build `getDiary()` to format messages including custom data parts:

```typescript
function getDiary(messages: MyMessage[]): string {
  return messages
    .map((message) => {
      const header =
        message.role === "user" ? "## User Message" : "## Assistant Message";

      const parts = message.parts
        .map((part) => {
          if (part.type === "text") return part.text;

          if (part.type === "data-action-start") {
            const { action } = part.data;
            if (action.type === "send-email") {
              return [
                "Assistant requested to send email:",
                `To: ${action.to}`,
                `Subject: ${action.subject}`,
                `Content: ${action.content}`,
              ].join("\n");
            }
            // Handle other action types
          }

          if (part.type === "data-action-decision") {
            const { decision } = part.data;
            return decision.type === "approve"
              ? "User approved action."
              : `User rejected: ${decision.reason}`;
          }

          if (part.type === "data-action-end") {
            return `Action result: ${part.data.output}`;
          }

          return "";
        })
        .join("\n\n");

      return `${header}\n\n${parts}`;
    })
    .join("\n\n");
}
```

**Key:** All custom parts formatted as text. LLM sees full action lifecycle.

### 6. Execute Actions in `createUIMessageStream`

Wire up execution inside stream handler:

```typescript
const stream = createUIMessageStream<MyMessage>({
  execute: async ({ writer }) => {
    // Check for HITL processing
    const mostRecentUserMessage = messages[messages.length - 1];
    const mostRecentAssistantMessage = messages.findLast(
      (m) => m.role === "assistant"
    );

    const hitlResult = findDecisionsToProcess({
      mostRecentUserMessage,
      mostRecentAssistantMessage,
    });

    if ("status" in hitlResult) {
      throw new Error(hitlResult.message);
    }

    // Copy messages array to append action-end parts
    const messagesAfterHitl = structuredClone(messages);

    // Execute approved actions
    for (const { action, decision } of hitlResult) {
      if (decision.type === "approve") {
        // Perform actual action based on type
        let output = "";
        if (action.type === "send-email") {
          await emailService.send({
            to: action.to!,
            subject: action.subject!,
            body: action.content!,
          });
          output = `Email sent to ${action.to}`;
        }
        // Handle other action types...

        const actionEndPart = {
          type: "data-action-end" as const,
          data: { actionId: action.id, output },
        };

        writer.write(actionEndPart);
        messagesAfterHitl[messagesAfterHitl.length - 1]!.parts.push(
          actionEndPart
        );
      } else {
        const actionEndPart = {
          type: "data-action-end" as const,
          data: {
            actionId: action.id,
            output: `Action cancelled: ${decision.reason}`,
          },
        };

        writer.write(actionEndPart);
        messagesAfterHitl[messagesAfterHitl.length - 1]!.parts.push(
          actionEndPart
        );
      }
    }

    // Continue conversation with updated context
    const result = streamText({
      model: anthropic("claude-sonnet-4.5"),
      prompt: getDiary(messagesAfterHitl), // Use diary instead of messages
      tools: {
        sendEmail: sendEmailTool,
        // ... other destructive tools
      },
      stopWhen: hasToolCall, // Pause after any tool call for HITL
    });

    writer.merge(result.toUIMessageStream());
  },
});
```

**Critical:** Use `messagesAfterHitl` (with `action-end` parts) in `getDiary()`. LLM must see action outcomes.

### 7. Update System Prompt

Guide LLM behavior around HITL:

```typescript
const systemPrompt = `You are personal assistant.

When user requests destructive action:
1. Use tool to initiate action
2. Execution pauses for user approval
3. If approved: action executes, you see result
4. If rejected: you see feedback, adjust approach

Never assume action succeeded. Wait for action-end result.

Available tools:
- sendEmail: requires approval
- createGitHubIssue: requires approval
- addTodo: instant (no approval)

Be proactive but respectful. Always acknowledge user decisions.`;
```

### 8. Test Full Flow

**Approve flow:**

```
User: "Email john@example.com saying meeting moved to 3pm"
→ Agent calls sendEmail tool
→ UI shows email preview with Approve/Reject
→ User clicks Approve
→ Email sends
→ Agent confirms: "I've sent the email to john@example.com"
```

**Reject flow:**

```
User: "Send reminder about TPS reports"
→ Agent calls sendEmail tool
→ UI shows email preview
→ User clicks Reject, types "Wrong recipient"
→ Agent responds: "I understand. Who should receive the reminder?"
```

**Note:** Agent sees rejection reason in diary. Can ask clarifying questions.

### 9. Render `data-action-end` Parts (Optional Polish)

Show execution results in UI:

```typescript
{
  part.type === "data-action-end" && (
    <div className="text-green-500 text-sm">
      ✓ {part.data.output}
    </div>
  );
}
```

Makes action completion visible to user.

## Mindful Considerations

**State management:** Track `actionIdsWithDecisions` to hide buttons after decision. Prevents duplicate approvals.

**Error handling:** HITL processor must return error if action has no matching decision. Prevents action execution without approval.

**Message cloning:** Use `structuredClone()` to avoid mutating original messages array. Append `action-end` parts to copy.

**Tool execution:** Move from immediate execution (lesson 08.01) to deferred execution (this lesson). Tools write action-start, execution happens after approval.

**Diary formatting:** LLM doesn't receive `UIMessage` objects. Receives text diary. All custom parts must be formatted as readable text.

**Non-destructive tools:** Todos, search, etc. don't need HITL. Execute immediately. Only destructive tools write action-start.

**stopWhen:** Use `hasToolCall` instead of `stepCountIs`. Pauses after any tool call. Resumes after user decision.

**Service layer:** Import email/GitHub/calendar services from lesson 08.01. Call inside action execution switch statement.

**TypeScript unions:** Action type is discriminated union. Switch on `action.type` to access type-specific fields.

**UI polish:** Loading states, error displays, action history. Project work = production quality vs skill building = basic implementation.
