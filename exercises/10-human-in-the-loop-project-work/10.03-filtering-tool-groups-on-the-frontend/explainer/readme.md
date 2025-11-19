As your personal assistant gains more tools, you'll run into a scaling problem. Each tool added to your `system` prompt increases the number of tokens used on every request, and eventually the LLM struggles to choose between too many options.

There are several ways to solve this - [sub-agents](/PLACEHOLDER/agent-sub-agents), [code execution environments](/PLACEHOLDER/code-execution-environments), or smart UX design. The most practical approach right now? Let users explicitly opt into tool groups.

Instead of overwhelming your agent with every possible tool, you can organize them by category - calendar tools, task tools, email tools - and only tell the LLM about the ones the user actually wants to use. This is exactly what [ChatGPT's "chat with your apps"](/PLACEHOLDER/chatgpt-chat-with-apps) feature does. It's elegant UX that solves a real scaling problem.

## Adding Types and Helper Functions

<!-- VIDEO -->

Let's set up the app configuration system with type definitions and helper functions to manage tool filtering and app selection.

Recommendation: cherry-pick this commit, then carefully examine it. It creates the structure which we're going to rely on in the next couple of commits. Finally, tweak it. The commit assumes you're using Google Calendar and Google Tasks, so you'll need to tweak it to your own tools.

### Steps To Complete

#### Creating the apps configuration file

- [ ] Create a new file `src/app/api/chat/apps-config.ts` that will hold all app definitions and helper functions.

#### Defining the AppDefinition type

- [ ] Define an `AppDefinition` type that describes each app with an `id`, `name`, `icon`, and `toolPrefix`. This structure lets us associate Lucide icons with each integration.

```typescript
import {
  Calendar,
  CheckSquare,
  type LucideIcon,
} from 'lucide-react';
import type { ToolSet } from 'ai';
import type { MyMessage } from './route';

export type AppDefinition = {
  id: string;
  name: string;
  icon: LucideIcon;
  toolPrefix: string;
};
```

#### Creating the available apps array

- [ ] Create an `availableApps` array with Calendar and Tasks apps. Each app maps to a specific Zapier MCP tool prefix so we can filter tools by app.

<Spoiler>

```typescript
export const availableApps: AppDefinition[] = [
  {
    id: 'calendar',
    name: 'Calendar',
    icon: Calendar,
    toolPrefix: 'google_calendar_',
  },
  {
    id: 'tasks',
    name: 'Tasks',
    icon: CheckSquare,
    toolPrefix: 'google_tasks_',
  },
];
```

</Spoiler>

#### Implementing filterToolsByApps

- [ ] Create a `filterToolsByApps` function that takes a `ToolSet` and array of `appIds`, returning only tools whose names start with the matching tool prefixes. This ensures the agent only sees tools for selected apps.

<Spoiler>

```typescript
export const filterToolsByApps = (
  tools: ToolSet,
  appIds: string[],
): ToolSet => {
  if (appIds.length === 0) {
    return {};
  }

  // ADDED: Get tool prefixes for the selected app IDs
  const prefixes = availableApps
    .filter((app) => appIds.includes(app.id))
    .map((app) => app.toolPrefix);

  const filteredTools: ToolSet = {};

  // ADDED: Only include tools matching the selected prefixes
  for (const [toolName, tool] of Object.entries(tools)) {
    if (prefixes.some((prefix) => toolName.startsWith(prefix))) {
      filteredTools[toolName] = tool;
    }
  }

  return filteredTools;
};
```

</Spoiler>

#### Implementing parseAppIdsFromMessage

- [ ] Create a `parseAppIdsFromMessage` function that extracts unique app IDs from message data parts with type `"data-app-tag"`. This lets us remember which apps were selected for a conversation.

<Spoiler>

```typescript
export const parseAppIdsFromMessage = (
  message: MyMessage | undefined,
): string[] => {
  if (!message) return [];

  // ADDED: Extract app IDs from data-app-tag parts
  const appIds = message.parts
    .filter((part) => part.type === 'data-app-tag')
    .map((part) => part.data.appId);

  // ADDED: Return unique app IDs
  return [...new Set(appIds)];
};
```

</Spoiler>

#### Updating the MyMessage type

- [ ] Update `src/app/api/chat/route.ts` to add the `"app-tag"` custom data part to the `MyMessage` type. This allows messages to carry app selection metadata.

```typescript
// src/app/api/chat/route.ts

export type MyMessage = UIMessage<
  never,
  {
    'frontend-action': 'refresh-sidebar';
    'app-tag': { appId: string }; // ADDED: App selection data
  } & ToolApprovalDataParts,
  InferUITools<ReturnType<typeof getTools>>
>;
```

## Implementing App Tagging on Frontend

<!-- VIDEO -->

Let's add the ability for users to tag specific apps (Calendar, Tasks, etc.) before sending messages, which gets sent as data parts alongside the message text.

Recommendation: cherry-pick this commit if you're not that interested in frontend code.

### Steps To Complete

#### Creating the `PromptInputAppButtons` component

- [ ] Create a new file `src/components/ai-elements/prompt-input-app-buttons.tsx` that displays toggle buttons for each available app.

<Spoiler>

```typescript
// src/components/ai-elements/prompt-input-app-buttons.tsx
"use client";

import { availableApps } from "@/app/api/chat/apps-config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const PromptInputAppButtons = (props: {
  taggedAppIds: string[];
  onToggle: (appId: string) => void;
}) => {
  return (
    <div className="flex gap-2">
      {availableApps.map((app) => {
        const isActive = props.taggedAppIds.includes(app.id);
        const Icon = app.icon;

        return (
          <Button
            key={app.id}
            type="button"
            variant={isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => props.onToggle(app.id)}
            className={cn(
              "flex items-center gap-1.5 min-w-fit",
              isActive && "bg-primary text-primary-foreground"
            )}
          >
            <Icon className="size-3 shrink-0" />
            <span className="text-xs whitespace-nowrap">{app.name}</span>
          </Button>
        );
      })}
    </div>
  );
};
```

</Spoiler>

#### Adding app tagging state to Chat component

- [ ] Import `PromptInputAppButtons` and the `parseAppIdsFromMessage` helper in `src/app/chat.tsx`.

```typescript
// src/app/chat.tsx
import { PromptInputAppButtons } from '@/components/ai-elements/prompt-input-app-buttons';
import { parseAppIdsFromMessage } from './api/chat/apps-config';
```

- [ ] Add state to track tagged app IDs, initialized from the last user message to provide persistence across conversations.

<Spoiler>

```typescript
// src/app/chat.tsx
const [taggedAppIds, setTaggedAppIds] = useState<string[]>(
  () => {
    const lastUserMessage = props.chat?.messages
      ?.filter((m) => m.role === 'user')
      .at(-1);
    return parseAppIdsFromMessage(lastUserMessage);
  },
);
```

</Spoiler>

#### Adding the toggle handler

- [ ] Create a `handleToggleApp` function that adds or removes an app ID from the tagged list.

<Spoiler>

```typescript
// src/app/chat.tsx
const handleToggleApp = (appId: string) => {
  setTaggedAppIds((prev) =>
    prev.includes(appId)
      ? prev.filter((id) => id !== appId)
      : [...prev, appId],
  );
};
```

</Spoiler>

#### Updating message submission to include app tags

- [ ] Modify the `handleSubmit` function to transform tagged app IDs into data parts and send them alongside the message text. This uses the parts API to send rich, multi-layered information in a single request.

<Spoiler>

```typescript
// src/app/chat.tsx
const handleSubmit = (message: PromptInputMessage) => {
  const hasText = Boolean(message.text);
  const hasAttachments = Boolean(message.files?.length);

  if (!(hasText || hasAttachments)) {
    return;
  }

  if (isGivingFeedback) {
    handleSubmitRejectReason();
    return;
  }

  startTransition(() => {
    // ADDED: Transform tagged app IDs into data parts
    const appTagParts = taggedAppIds.map((appId) => ({
      type: 'data-app-tag' as const,
      data: { appId },
    }));

    // CHANGED: Use parts array instead of simple text/files
    wrappedSendMessage({
      parts: [
        {
          type: 'text',
          text: message.text || 'Sent with attachments',
        },
        ...appTagParts,
        ...(message.files ?? []),
      ],
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

#### Adding the app buttons to the UI

- [ ] Add the `PromptInputAppButtons` component to the toolbar in the prompt input, passing the tagged app IDs and toggle handler.

<Spoiler>

```typescript
// src/app/chat.tsx
<PromptInputToolbar>
  <PromptInputTools>
    <PromptInputActionMenu>
      <PromptInputActionMenuTrigger />
      <PromptInputActionMenuContent>
        <PromptInputActionAddAttachments />
      </PromptInputActionMenuContent>
    </PromptInputActionMenu>
    {/* ADDED: App tag buttons */}
    <PromptInputAppButtons
      taggedAppIds={taggedAppIds}
      onToggle={handleToggleApp}
    />
  </PromptInputTools>
  <PromptInputSubmit disabled={!input && !status} status={status} />
</PromptInputToolbar>
```

</Spoiler>

#### Testing app tagging

- [ ] Run the development server and open the chat interface. You should see Calendar and Tasks buttons in the prompt toolbar.

```bash
# Terminal
pnpm dev
```

- [ ] Click on the Calendar button to tag it, then send a message. Open the Network tab in DevTools, find the chat request, and verify the payload contains a `data-app-tag` part with the app ID.

- [ ] Click Calendar again to untag it, then send another message. Verify the `data-app-tag` part is no longer in the payload.

- [ ] Start a new conversation, send a message with Calendar tagged, then refresh the page. The Calendar button should remain selected, confirming persistence from the last user message.

## Implementing App Tagging on Backend

<!-- VIDEO -->

Let's implement app tagging on the backend to filter MCP tools based on which apps the user has enabled.

Recommendation: hand-code this commit. This is new ground, and covers an important concept.

### Steps To Complete

#### Importing the app configuration utilities

- [ ] Add imports for the new app filtering functions at the top of the chat route file:

```typescript
// src/app/api/chat/route.ts
import {
  filterToolsByApps,
  parseAppIdsFromMessage,
} from './apps-config';
```

#### Parsing app IDs from the user message

- [ ] In the `POST` function, after fetching related chats, parse the app IDs that the user has tagged in their message:

<Spoiler>

```typescript
// src/app/api/chat/route.ts
const relatedChats = await searchForRelatedChats(
  chatId,
  messages,
);

// ADDED: Extract which apps the user has enabled
const taggedAppIds = parseAppIdsFromMessage(body.message);
```

</Spoiler>

#### Filtering MCP tools by enabled apps

- [ ] Rename the `getMCPTools()` result to `allMcpTools` and create a filtered version for the agent:

<Spoiler>

```typescript
// src/app/api/chat/route.ts
// CHANGED: Get all tools and store in allMcpTools
const allMcpTools = await getMCPTools();
// ADDED: Filter tools to only those matching tagged app IDs
const mcpTools = filterToolsByApps(allMcpTools, taggedAppIds);
```

</Spoiler>

#### Passing all tools to HITL execution

- [ ] Update the `executeHITLDecisions` call to use `allMcpTools` instead of the filtered tools. This allows tool execution for any previously approved tools:

<Spoiler>

```typescript
// src/app/api/chat/route.ts
const messagesWithToolResults = await executeHITLDecisions({
  decisions: hitlResult,
  // CHANGED: Pass all MCP tools to allow execution of any approved tools
  mcpTools: allMcpTools,
  writer,
  messages: messageHistoryForLLM,
});
```

</Spoiler>

#### Passing filtered tools to the agent

- [ ] Keep the agent creation call using the filtered `mcpTools`. This ensures the agent only uses tools from enabled apps:

<Spoiler>

```typescript
// src/app/api/chat/route.ts
const agent = createAgent({
  memories: memories.map((memory) => memory.item),
  relatedChats: relatedChats.map((chat) => chat.item),
  messages: messagesWithToolResults,
  model: google('gemini-2.5-flash'),
  stopWhen: stepCountIs(10),
  // CHANGED: Use filtered mcpTools to respect user's app selections
  mcpTools,
  writer,
});
```

</Spoiler>

#### Testing the implementation

- [ ] Test by enabling only the Tasks app and asking to create a task. The agent should successfully create a task.

- [ ] Start a new conversation with only Tasks enabled, then ask about your calendar. The agent should correctly refuse access since Calendar is not enabled.
