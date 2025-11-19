Now that you've built your tools, it's time to wrap them in a human-in-the-loop system. This harness will let you integrate the functions from your skill building exercises into a real agent framework.

You'll be porting most of the code you've already written, but with improvements—especially on the front end. The goal is to create a system that can pause, ask for human input when needed, and gracefully handle the back-and-forth interaction that makes AI agents actually useful in practice.

This is where your tools become part of a living, breathing system.

## Implementing Human-In-The-Loop on the Backend

<!-- VIDEO -->

Let's implement the backend infrastructure for human-in-the-loop tool approval, allowing users to review and approve/reject tool executions before they run.

Recommendation: cherry-pick this commit. This is porting material over from the skill-building.

### Steps To Complete

#### Creating the HITL types and utilities

- [ ] Create a new file `src/app/api/chat/hitl.ts` with the core types for tool approval decisions and data parts.

<Spoiler>

```typescript
// src/app/api/chat/hitl.ts
import {
  convertToModelMessages,
  ModelMessage,
  ToolSet,
  UIMessageStreamWriter,
} from 'ai';
import { MyMessage } from './route';

// ADDED: Type for approval or rejection decisions
export type ToolApprovalDecision =
  | {
      type: 'approve';
    }
  | {
      type: 'reject';
      reason: string;
    };

// ADDED: Data part types for approval workflow
export type ToolApprovalDataParts = {
  'approval-request': {
    tool: ToolRequiringApproval;
  };
  'approval-decision': {
    toolId: string;
    decision: ToolApprovalDecision;
  };
  'approval-result': {
    output: unknown;
    toolId: string;
  };
};

// ADDED: Type for tools awaiting approval
export type ToolRequiringApproval = {
  id: string;
  name: string;
  input: unknown;
};
```

</Spoiler>

#### Adding the `annotateMessageHistory` function

- [ ] Add the `annotateMessageHistory` function to convert data parts into text for the LLM to understand the approval workflow.

<Spoiler>

```typescript
// src/app/api/chat/hitl.ts - ADDED

export const annotateMessageHistory = (
  messages: MyMessage[],
): ModelMessage[] => {
  const modelMessages = convertToModelMessages<MyMessage>(
    messages,
    {
      convertDataPart(part) {
        if (part.type === 'data-approval-request') {
          return {
            type: 'text',
            text: `The assistant requested to run the tool: ${
              part.data.tool.name
            } with input: ${JSON.stringify(part.data.tool.input)}`,
          };
        }
        if (part.type === 'data-approval-decision') {
          if (part.data.decision.type === 'approve') {
            return {
              type: 'text',
              text: 'The user approved the tool.',
            };
          }
          return {
            type: 'text',
            text: `The user rejected the tool: ${part.data.decision.reason}`,
          };
        }

        if (part.type === 'data-approval-result') {
          return {
            type: 'text',
            text: `The tool returned this result: ${JSON.stringify(
              part.data.output,
            )}`,
          };
        }
      },
    },
  );

  return modelMessages;
};
```

</Spoiler>

#### Adding error and decision types

- [ ] Add types for HITL errors and decisions to process.

<Spoiler>

```typescript
// src/app/api/chat/hitl.ts - ADDED

export type HITLError = {
  message: string;
  status: number;
};

export type HITLDecisionsToProcess = {
  tool: ToolRequiringApproval;
  decision: ToolApprovalDecision;
};
```

</Spoiler>

#### Adding the `findDecisionsToProcess` function

- [ ] Add the `findDecisionsToProcess` function to extract user decisions from messages and match them with assistant tool requests.

<Spoiler>

```typescript
// src/app/api/chat/hitl.ts - ADDED

export const findDecisionsToProcess = (opts: {
  mostRecentUserMessage: MyMessage;
  mostRecentAssistantMessage: MyMessage | undefined;
}): HITLError | HITLDecisionsToProcess[] => {
  const { mostRecentUserMessage, mostRecentAssistantMessage } =
    opts;

  // If there's no assistant message, nothing to process
  if (!mostRecentAssistantMessage) {
    return [];
  }

  // Get all tool requests from assistant
  const tools = mostRecentAssistantMessage.parts
    .filter((part) => part.type === 'data-approval-request')
    .map((part) => part.data.tool);

  // Get all user decisions
  const decisions = new Map(
    mostRecentUserMessage.parts
      .filter((part) => part.type === 'data-approval-decision')
      .map((part) => [part.data.toolId, part.data.decision]),
  );

  const decisionsToProcess: HITLDecisionsToProcess[] = [];

  for (const tool of tools) {
    const decision = decisions.get(tool.id);

    // User must decide on all tools before continuing
    if (!decision) {
      return {
        message: `No decision found for tool ${tool.id}`,
        status: 400,
      };
    }

    decisionsToProcess.push({
      tool,
      decision,
    });
  }

  return decisionsToProcess;
};
```

</Spoiler>

#### Adding the `executeHITLDecisions` function

- [ ] Add the `executeHITLDecisions` function to execute approved tools and send results back to the client.

<Spoiler>

```typescript
// src/app/api/chat/hitl.ts - ADDED

export const executeHITLDecisions = async (opts: {
  decisions: HITLDecisionsToProcess[];
  mcpTools: ToolSet;
  writer: UIMessageStreamWriter<MyMessage>;
  messages: MyMessage[];
}) => {
  for (const { tool, decision } of opts.decisions) {
    if (decision.type === 'approve') {
      // Execute the tool with user-approved input
      const result = await opts.mcpTools[tool.name].execute?.(
        tool.input,
        {
          messages: [],
          toolCallId: 'foo',
        },
      );

      const messagePart = {
        type: 'data-approval-result' as const,
        data: {
          toolId: tool.id,
          output: result,
        },
      };

      // Send result to client
      opts.writer.write(messagePart);

      // Add result to message history
      opts.messages[opts.messages.length - 1].parts.push(
        messagePart,
      );
    }
  }

  return opts.messages;
};
```

</Spoiler>

#### Adding the `makeHITLToolSet` function

- [ ] Add the `makeHITLToolSet` function to wrap MCP tools so they send approval requests instead of executing directly. This function should return a new `ToolSet` object with the MCP tools wrapped in approval request functionality.

<Spoiler>

```typescript
// src/app/api/chat/hitl.ts - ADDED

export const makeHITLToolSet = (
  tools: ToolSet,
  writer: UIMessageStreamWriter<MyMessage> | undefined,
) => {
  const toolEntries = Object.entries(tools);

  const newTools: ToolSet = {};

  // Wrap each tool to request approval instead of executing
  for (const [toolName, tool] of toolEntries) {
    newTools[toolName] = {
      ...tool,
      execute: async (input) => {
        // Send approval request to client
        writer?.write({
          type: 'data-approval-request',
          data: {
            tool: {
              id: crypto.randomUUID(),
              input,
              name: toolName,
            },
          },
        });

        return 'Requested tool execution';
      },
    };
  }

  return newTools;
};
```

</Spoiler>

#### Updating the MyMessage type

- [ ] Update the `MyMessage` type in `src/app/api/chat/route.ts` to include the HITL data parts.

First, import the new types:

```typescript
// src/app/api/chat/route.ts - ADDED
import {
  annotateMessageHistory as annotateHITLMessageHistory,
  executeHITLDecisions,
  findDecisionsToProcess,
  ToolApprovalDataParts,
} from './hitl';
```

<Spoiler>

```typescript
// src/app/api/chat/route.ts - CHANGED
export type MyMessage = UIMessage<
  never,
  {
    'frontend-action': 'refresh-sidebar';
  } & ToolApprovalDataParts,
  InferUITools<ReturnType<typeof getTools>>
>;
```

</Spoiler>

#### Adding HITL decision processing to the POST handler

- [ ] Add code to find and process HITL decisions in the `POST` handler before creating the agent.

<Spoiler>

```typescript
// src/app/api/chat/route.ts - ADDED after message validation

const mostRecentAssistantMessage = messages.findLast(
  (message) => message.role === 'assistant',
);

const hitlResult = findDecisionsToProcess({
  mostRecentUserMessage: mostRecentMessage,
  mostRecentAssistantMessage,
});

// ADDED: Return error if user hasn't decided on all tools
if ('status' in hitlResult) {
  return new Response(hitlResult.message, {
    status: hitlResult.status,
  });
}
```

</Spoiler>

#### Executing HITL decisions and updating the agent

- [ ] Execute approved tool decisions and pass the results to the agent. Update the imports at the top.

First, import the new HITL function:

```typescript
// src/app/api/chat/route.ts
import { createAgent, getTools } from './agent';
```

<Spoiler>

```typescript
// src/app/api/chat/route.ts - ADDED in createUIMessageStream execute block

const mcpTools = await getMCPTools();

// ADDED: Execute user-approved tool decisions
const messagesWithToolResults = await executeHITLDecisions({
  decisions: hitlResult,
  mcpTools,
  writer,
  messages: messageHistoryForLLM,
});

// CHANGED: Pass wrapped tools and updated messages to agent
const agent = createAgent({
  memories: memories.map((memory) => memory.item),
  relatedChats: relatedChats.map((chat) => chat.item),
  messages: messagesWithToolResults,
  model: google('gemini-2.5-flash'),
  stopWhen: stepCountIs(10),
  mcpTools,
  writer,
});

const result = agent.stream({
  // CHANGED: Use annotated message history for HITL
  messages: annotateHITLMessageHistory(messagesWithToolResults),
});
```

</Spoiler>

#### Updating the createAgent function

- [ ] Update `createAgent` in `src/app/api/chat/agent.ts` to wrap MCP tools with HITL and add stop conditions for MCP tool calls.

First, add the necessary imports:

```typescript
// src/app/api/chat/agent.ts - ADDED
import { hasToolCall, UIMessageStreamWriter } from 'ai';
import { makeHITLToolSet } from './hitl';
```

Then, update the `createAgent` function to wrap the MCP tools with HITL and add stop conditions for MCP tool calls.

<Spoiler>

```typescript
// src/app/api/chat/agent.ts

export const createAgent = (opts: {
  messages: MyMessage[];
  model: LanguageModel;
  stopWhen: StopCondition<any>;
  memories: DB.Memory[];
  relatedChats: DB.Chat[];
  mcpTools: ToolSet;
  writer?: UIMessageStreamWriter; // ADDED
}) =>
  new Agent({
    model: opts.model,
    tools: {
      ...getTools(opts.messages),
      // CHANGED: Wrap MCP tools to request approval
      ...makeHITLToolSet(opts.mcpTools, opts.writer),
    },
    // CHANGED: Stop on any MCP tool call for user approval
    stopWhen: [
      opts.stopWhen,
      ...Object.keys(opts.mcpTools).map((toolName) =>
        hasToolCall(toolName),
      ),
    ],
    system: `...`, // Keep existing system prompt
  });
```

</Spoiler>

Now the backend is ready to handle human-in-the-loop approvals! The agent will stop when requesting MCP tools, send approval requests to the frontend, and execute approved decisions before continuing.

## Implementing HITL on the Frontend

<!-- VIDEO -->

We're going to add human-in-the-loop approval functionality to the chat interface, allowing users to approve or reject tool usage before execution.

Recommendation: cherry-pick this commit, but read through the changes carefully. Wrapping `sendMessage` is a common pattern. There are also some small tweaks and improvements from the skill-building version. Finally, test it a LOT to make sure it's working as expected.

### Steps To Complete

#### Adding New Imports and Types

- [ ] Update the imports in `src/app/chat.tsx` to include `ToolInput` from the tool components and add `useMemo` to the React imports:

```typescript
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
} from '@/components/ai-elements/tool';

import {
  Fragment,
  startTransition,
  useMemo,
  useState,
} from 'react';
```

#### Creating a Wrapped Send Message Function

- [ ] Create a `wrappedSendMessage` function that automatically includes the chat ID in every send message request. This prevents repetition across approval, rejection, and normal messaging flows.

<Spoiler>

```typescript
const wrappedSendMessage: typeof sendMessage = async (
  message,
  options,
) => {
  return sendMessage(message, {
    ...options,
    body: {
      id: chatIdInUse,
      ...options?.body,
    },
  });
};
```

</Spoiler>

#### Tracking Outstanding Approval Decisions

- [ ] Add state to track which tool ID is currently receiving feedback, and create a `useMemo` hook to compute outstanding decisions by comparing all approval requests against all approval decisions:

<Spoiler>

```typescript
const [toolIdGivingFeedbackOn, setToolIdGivingFeedbackOn] =
  useState<string | null>(null);

const outstandingDecisions = useMemo(() => {
  const allMessageParts = messages.flatMap(
    (message) => message.parts,
  );

  const toolIdsOfAllRequests = new Set(
    allMessageParts
      .filter((part) => part.type === 'data-approval-request')
      .map((part) => part.data.tool.id),
  );

  const toolIdsOfAllDecisions = new Set(
    allMessageParts
      .filter((part) => part.type === 'data-approval-decision')
      .map((part) => part.data.toolId),
  );

  // Get the tool IDs that have requests but no decisions
  const outstandingDecisions = toolIdsOfAllRequests.difference(
    toolIdsOfAllDecisions,
  );

  return outstandingDecisions;
}, [messages]);

const isGivingFeedback = !!toolIdGivingFeedbackOn;
const shouldDisableInput =
  outstandingDecisions.size > 0 && !isGivingFeedback;
```

</Spoiler>

#### Handling Approval Actions

- [ ] Create a `handlePressApprove` function that sends an approval decision with the tool ID:

<Spoiler>

```typescript
const handlePressApprove = (toolId: string) => {
  wrappedSendMessage({
    parts: [
      {
        type: 'data-approval-decision',
        data: {
          toolId,
          decision: {
            type: 'approve',
          },
        },
      },
    ],
  });
};
```

</Spoiler>

#### Handling Rejection Flow

- [ ] Create a `handlePressReject` function that sets up the rejection state and focuses the input field for the user to provide feedback:

<Spoiler>

```typescript
const handlePressReject = (toolId: string) => {
  setToolIdGivingFeedbackOn(toolId);
  setInput('');
  // Waits for the 'disabled' state to be removed from the input
  // before focusing the input
  setTimeout(() => {
    ref.current?.focus();
  }, 1);
};
```

</Spoiler>

#### Handling Rejection Reason Submission

- [ ] Create a `handleSubmitRejectReason` function that sends the rejection decision with the user's reason, then clears the feedback state:

<Spoiler>

```typescript
const handleSubmitRejectReason = () => {
  if (!toolIdGivingFeedbackOn) return;

  wrappedSendMessage({
    parts: [
      {
        type: 'data-approval-decision',
        data: {
          toolId: toolIdGivingFeedbackOn,
          decision: {
            type: 'reject',
            reason: input,
          },
        },
      },
    ],
  });

  setToolIdGivingFeedbackOn(null);
  setInput('');
};
```

</Spoiler>

#### Updating the Submit Handler

- [ ] Modify the `handleSubmit` function to check if the user is giving feedback. If they are, submit the rejection reason instead of a regular message:

<Spoiler>

```typescript
const handleSubmit = (message: PromptInputMessage) => {
  const hasText = Boolean(message.text);
  const hasAttachments = Boolean(message.files?.length);

  if (!(hasText || hasAttachments)) {
    return;
  }

  // ADDED: Check if user is giving feedback on a rejection
  if (isGivingFeedback) {
    handleSubmitRejectReason();
    return;
  }

  startTransition(() => {
    // CHANGED: Use wrappedSendMessage instead of sendMessage
    wrappedSendMessage({
      text: message.text || 'Sent with attachments',
      files: message.files,
    });

    setInput('');

    if (!chatIdFromSearchParams) {
      router.push(`/?chatId=${chatIdInUse}`);
      setBackupChatId(crypto.randomUUID());
    }
  });
};
```

</Spoiler>

#### Rendering Approval Request UI

- [ ] Add a new case in the message parts switch statement to handle `"data-approval-request"` parts. This displays the approval request with Approve and Reject buttons:

<Spoiler>

```typescript
case "data-approval-request":
  return (
    <Tool
      key={`${message.id}-${i}`}
      className="w-full"
      defaultOpen={true}
    >
      <ToolHeader
        title={`Approval Request: ${part.data.tool.name}`}
        type={"tool-approval" as const}
        state="input-available"
      />

      <ToolContent>
        <ToolInput input={part.data.tool.input} />
        {outstandingDecisions.has(part.data.tool.id) && (
          <div className="flex gap-2 p-4 pt-0">
            <Button
              onClick={() =>
                handlePressApprove(part.data.tool.id)
              }
            >
              Approve
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                handlePressReject(part.data.tool.id)
              }
            >
              Reject
            </Button>
          </div>
        )}
      </ToolContent>
    </Tool>
  );
```

</Spoiler>

#### Updating the Input Placeholder and State

- [ ] Update the `PromptInputTextarea` to show context-aware placeholder text and disable input when awaiting approval decisions (unless the user is currently providing rejection feedback):

<Spoiler>

```typescript
<PromptInputTextarea
  onChange={(e) => setInput(e.target.value)}
  value={input}
  // ADDED: Change placeholder based on whether user is rejecting
  placeholder={
    isGivingFeedback
      ? "Why are you rejecting this tool?"
      : "What would you like to know?"
  }
  // ADDED: Disable input while awaiting approval decisions
  disabled={shouldDisableInput}
  ref={ref}
  autoFocus
/>
```

</Spoiler>

#### Testing the HITL Approval Flow

- [ ] Run the development server and test the approval flow by asking a question that triggers a tool approval request:

```bash
pnpm dev
```

- [ ] When an approval request appears, verify that:
  - The Approve and Reject buttons are visible
  - The chat input is disabled until you make a decision
  - Clicking Reject focuses the input and changes the placeholder to "Why are you rejecting this tool?"
  - Submitting a rejection reason sends the decision and clears the feedback state
  - Clicking Approve immediately sends the approval decision
  - The approval request disappears after a decision is made
