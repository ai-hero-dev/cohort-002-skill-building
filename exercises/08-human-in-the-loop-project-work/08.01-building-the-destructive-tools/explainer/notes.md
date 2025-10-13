# Building Destructive Tools & Integrations

## Learning Goals

- Implement multiple destructive tool handlers (email, GitHub, calendar, todos)
- Integrate MCP servers (Zapier, filesystem, database, GitHub)
- Design tool architecture for scalability and maintainability
- Balance power vs risk through thoughtful tool design
- Understand integration patterns for external APIs
- Overwhelm with possibilities to inspire custom implementations

## Integration Landscape

By lesson 8.1, you've built HITL harness (lesson 7). Now: make it useful.

Goal: give assistant real-world power. Every developer needs different tools. Below = massive list of options.

### Email & Communication
- **Send emails** - SMTP, Gmail API, SendGrid, Resend
- **Slack messages** - post to channels, DMs, thread replies
- **Discord webhooks** - server notifications, bot messages
- **SMS/WhatsApp** - Twilio API for text messages

### Task & Project Management
- **Create todos** - Linear, Asana, Todoist, ClickUp
- **GitHub issues** - create, comment, label, assign
- **Jira tickets** - create, transition, update fields
- **Trello cards** - add to boards, move between lists

### Calendar & Scheduling
- **Google Calendar events** - create, update, cancel
- **Cal.com bookings** - schedule meetings programmatically
- **Calendar invites** - send .ics files via email

### Development Tools
- **GitHub PRs** - create draft PRs, request reviews
- **Git commits** - commit and push changes
- **Deploy triggers** - Vercel, Netlify, Railway webhooks
- **Database writes** - Postgres, MongoDB, Supabase

### File & Content Operations
- **Filesystem writes** - via MCP filesystem server
- **Google Docs** - create/update documents
- **Notion pages** - create pages, update databases
- **Cloud storage** - S3, GCS uploads

### AI & Automation
- **Zapier MCP** - 30,000+ actions across 8,000 apps
- **Make.com webhooks** - automation workflows
- **n8n** - self-hosted automation
- **IFTTT** - consumer automation

### Finance & Commerce
- **Expense tracking** - log to accounting software
- **Invoice generation** - QuickBooks, Stripe
- **Payment requests** - PayPal, Venmo APIs

## Implementation Patterns

### 1. Direct API Integration

Most straightforward: npm package + API key.

**Example: Send Email via Resend**

```typescript
// src/lib/tools/email-tools.ts
import { tool } from "ai";
import { z } from "zod";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmailTool = tool({
  description: "Send email. Use for user-requested emails, drafts approved by user.",
  parameters: z.object({
    to: z.string().email().describe("Recipient email address"),
    subject: z.string().describe("Email subject line"),
    body: z.string().describe("Email body (plain text or HTML)"),
  }),
  execute: async ({ to, subject, body }, { writer }) => {
    // Write data-action-start for HITL approval
    const actionId = crypto.randomUUID();

    writer.write({
      type: "data-action-start",
      data: {
        id: actionId,
        type: "send-email",
        to,
        subject,
        content: body,
      },
    });

    // Return immediately - actual send happens in HITL processing
    return `Email to ${to} queued for approval`;
  },
});
```

**Note:** Above returns early. Actual send happens when user approves via HITL harness (lesson 7.06).

**Execute handler (in HITL processor):**

```typescript
// Inside findDecisionsToProcess loop
if (action.type === "send-email" && decision.approved) {
  const result = await resend.emails.send({
    from: "assistant@yourdomain.com",
    to: action.to,
    subject: action.subject,
    html: action.content,
  });

  writer.write({
    type: "data-action-end",
    data: {
      id: action.id,
      output: `Email sent successfully. ID: ${result.id}`,
    },
  });
}
```

### 2. MCP Server Integration

MCP = standardized way to connect AI to external tools. Requires MCP client setup.

**Popular MCP Servers:**
- `@modelcontextprotocol/server-filesystem` - read/write files
- `@modelcontextprotocol/server-github` - GitHub API
- `@modelcontextprotocol/server-postgres` - database queries
- `@modelcontextprotocol/server-brave-search` - web search
- Zapier MCP - 8,000+ app integrations

**Setup Example: GitHub MCP**

```json
// mcp-config.json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

**Connecting in AI SDK:**

```typescript
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

// Tools automatically discovered from MCP servers
const result = await generateText({
  model: anthropic("claude-sonnet-4.5"),
  prompt: "Create GitHub issue: Bug in auth flow",
  experimental_toolCall: "auto", // AI SDK v5 MCP support
});
```

**Zapier MCP = nuclear option:** 30,000+ actions. Gmail, Google Sheets, Airtable, Salesforce, etc. One MCP connection unlocks everything.

### 3. Hybrid: Tool Wrapper + External Service

Combine tool definition with service abstraction.

**Example: GitHub Issue Creation**

```typescript
// src/lib/services/github-service.ts
import { Octokit } from "@octokit/rest";

export class GitHubService {
  private octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  async createIssue(opts: {
    owner: string;
    repo: string;
    title: string;
    body: string;
    labels?: string[];
  }) {
    const response = await this.octokit.issues.create({
      owner: opts.owner,
      repo: opts.repo,
      title: opts.title,
      body: opts.body,
      labels: opts.labels,
    });

    return response.data;
  }

  async createPullRequest(opts: {
    owner: string;
    repo: string;
    title: string;
    head: string;
    base: string;
    body: string;
  }) {
    const response = await this.octokit.pulls.create({
      owner: opts.owner,
      repo: opts.repo,
      title: opts.title,
      head: opts.head,
      base: opts.base,
      body: opts.body,
    });

    return response.data;
  }
}

// src/lib/tools/github-tools.ts
import { tool } from "ai";
import { z } from "zod";
import { GitHubService } from "../services/github-service";

const github = new GitHubService();

export const createGitHubIssueTool = tool({
  description: "Create GitHub issue in repository. Use for bug reports, feature requests, tasks.",
  parameters: z.object({
    repo: z.string().describe("Repository in format: owner/repo"),
    title: z.string().describe("Issue title"),
    body: z.string().describe("Issue description (markdown)"),
    labels: z.array(z.string()).optional().describe("Labels to add"),
  }),
  execute: async ({ repo, title, body, labels }, { writer }) => {
    const [owner, repoName] = repo.split("/");

    const actionId = crypto.randomUUID();

    writer.write({
      type: "data-action-start",
      data: {
        id: actionId,
        type: "create-github-issue",
        repo,
        title,
        body,
        labels,
      },
    });

    return `GitHub issue queued: "${title}" in ${repo}`;
  },
});
```

### 4. Persistence Layer Integration

Use existing persistence layer for local data operations.

**Example: Create Todo Tool**

```typescript
// Extend persistence layer
// src/lib/persistence-layer.ts

export namespace DB {
  export interface Todo {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    dueDate?: string;
    createdAt: string;
    updatedAt: string;
  }

  export interface PersistenceData {
    chats: Chat[];
    memories: Memory[];
    todos: Todo[]; // Add this
  }
}

export async function createTodo(opts: {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
}): Promise<DB.Todo> {
  const todos = await loadTodos();
  const now = new Date().toISOString();

  const newTodo: DB.Todo = {
    id: opts.id,
    title: opts.title,
    description: opts.description,
    completed: false,
    dueDate: opts.dueDate,
    createdAt: now,
    updatedAt: now,
  };

  todos.push(newTodo);
  await saveTodos(todos);

  return newTodo;
}

// src/lib/tools/todo-tools.ts
import { tool } from "ai";
import { z } from "zod";
import { createTodo } from "@/lib/persistence-layer";

export const addTodoTool = tool({
  description: "Add todo to user's task list. Use for action items from conversation.",
  parameters: z.object({
    title: z.string().describe("Todo title (concise)"),
    description: z.string().describe("Detailed description"),
    dueDate: z.string().optional().describe("Due date (ISO 8601)"),
  }),
  execute: async ({ title, description, dueDate }) => {
    const todo = await createTodo({
      id: crypto.randomUUID(),
      title,
      description,
      dueDate,
    });

    return `Todo created: "${todo.title}"`;
  },
});
```

**Note:** Todos = non-destructive. No HITL needed. Direct execution OK.

## Mindful Considerations

### When to Use HITL

**Destructive actions (require approval):**
- Send emails, messages
- Create public issues/PRs
- Charge money
- Delete/modify data
- Deploy code
- Schedule meetings

**Safe actions (no approval needed):**
- Search/read operations
- Local todos/notes
- Data analysis
- Formatting/calculations

### Error Handling

All tools must handle failures gracefully:

```typescript
execute: async ({ to, subject, body }, { writer }) => {
  const actionId = crypto.randomUUID();

  try {
    writer.write({
      type: "data-action-start",
      data: { id: actionId, type: "send-email", to, subject, body },
    });

    return `Email queued for approval`;
  } catch (error) {
    writer.write({
      type: "data-action-end",
      data: {
        id: actionId,
        output: `Error: ${error.message}`,
        error: true,
      },
    });

    throw error; // Re-throw for agent handling
  }
}
```

### Authentication Patterns

**Environment Variables:**
```typescript
const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) throw new Error("RESEND_API_KEY not set");
```

**OAuth (complex):**
- Store tokens in persistence layer
- Implement refresh flow
- Handle expiration gracefully

**API Keys in DB (per-user):**
- Let users add own keys
- Encrypt at rest
- Scope permissions tightly

## Steps To Complete

### 1. Choose Your Integration Stack

**Starter Kit (2-3 tools):**
- Send email (Resend/SMTP)
- Create GitHub issue (Octokit)
- Add local todo (persistence layer)

**Power User (5+ tools + MCP):**
- Above +
- Calendar events (Google Calendar API)
- Slack messages (Slack SDK)
- Zapier MCP (everything else)

### 2. Implement Service Layer

Create `src/lib/services/` directory:

```typescript
// email-service.ts
export class EmailService {
  async send(opts: { to: string; subject: string; body: string }) {
    // Implementation
  }
}

// github-service.ts
export class GitHubService {
  async createIssue(opts: {...}) { }
  async createPR(opts: {...}) { }
}

// calendar-service.ts
export class CalendarService {
  async createEvent(opts: {...}) { }
}
```

Keep services separate from tools for testability.

### 3. Define Tool Schemas

Create `src/lib/tools/` directory:

```typescript
// destructive-tools.ts
import { tool } from "ai";
import { z } from "zod";

export const sendEmailTool = tool({
  description: "...",
  parameters: z.object({...}),
  execute: async (params, { writer }) => {
    // Write data-action-start
    // Return early (HITL processes later)
  },
});

export const createGitHubIssueTool = tool({...});
export const createCalendarEventTool = tool({...});
```

All destructive tools should:
1. Write `data-action-start`
2. Return description of queued action
3. NOT execute immediately

### 4. Add Tools to Agent

Update `/src/app/api/chat/route.ts`:

```typescript
import { sendEmailTool, createGitHubIssueTool } from "@/lib/tools/destructive-tools";
import { addTodoTool } from "@/lib/tools/todo-tools";

const result = streamText({
  model: anthropic("claude-sonnet-4.5"),
  messages: convertToModelMessages(messages),
  tools: {
    sendEmail: sendEmailTool,
    createGitHubIssue: createGitHubIssueTool,
    addTodo: addTodoTool,
  },
  stopWhen: hasToolCall, // Pause for HITL after tool calls
});
```

### 5. Implement Action Executors

In HITL processor (from lesson 7), add handlers:

```typescript
// Inside findDecisionsToProcess loop
for (const { action, decision } of decisionsToProcess) {
  if (!decision.approved) {
    writer.write({
      type: "data-action-end",
      data: {
        id: action.id,
        output: `Action rejected: ${decision.feedback}`,
      },
    });
    continue;
  }

  // Execute based on action type
  switch (action.type) {
    case "send-email":
      const emailResult = await emailService.send({
        to: action.to,
        subject: action.subject,
        body: action.content,
      });
      writer.write({
        type: "data-action-end",
        data: {
          id: action.id,
          output: `Email sent to ${action.to}`,
        },
      });
      break;

    case "create-github-issue":
      const issueResult = await githubService.createIssue({
        owner: action.owner,
        repo: action.repo,
        title: action.title,
        body: action.body,
      });
      writer.write({
        type: "data-action-end",
        data: {
          id: action.id,
          output: `Issue created: ${issueResult.html_url}`,
        },
      });
      break;

    // Add more cases for each tool type
  }
}
```

### 6. Test Integration Flow

**Test cases:**
1. "Send email to john@example.com about project update"
   - Should queue email for approval
   - Approve → email sends
   - Reject → email cancelled

2. "Create GitHub issue in owner/repo: bug in login"
   - Should show issue preview
   - Approve → issue created, returns URL
   - Reject with feedback → agent adjusts

3. "Add todo: review PR #123 by Friday"
   - Should execute immediately (non-destructive)
   - Todo appears in UI

### 7. Add MCP Servers (Optional Power Move)

**Install Zapier MCP:**

```bash
npm install -g @modelcontextprotocol/server-zapier
```

**Configure in Claude Desktop (or custom client):**

```json
{
  "mcpServers": {
    "zapier": {
      "command": "mcp-server-zapier",
      "env": {
        "ZAPIER_API_KEY": "your-key"
      }
    }
  }
}
```

Now assistant has access to 30,000+ actions across Gmail, Sheets, Slack, Notion, etc.

### 8. Extend System Prompt

Update system prompt to describe available tools:

```typescript
const systemPrompt = `You are a personal assistant with access to:

**Communication:**
- Send emails (requires approval)
- Post Slack messages (requires approval)

**Development:**
- Create GitHub issues/PRs (requires approval)
- Add local todos (instant)

**Calendar:**
- Create calendar events (requires approval)

When user requests action:
1. Confirm details
2. Use appropriate tool
3. Wait for approval (destructive actions)
4. Report outcome

Be proactive but never assume. Always confirm destructive actions.`;
```

## Example Conversation Flows

**Email Flow:**
```
User: "Send email to sarah@example.com thanking her for the meeting"
Assistant: I'll draft email to sarah@example.com.

Subject: Thank You for the Meeting
Body: Hi Sarah, thank you for taking time to meet...

[UI shows email preview with approve/reject buttons]

User: [Approves]
Assistant: Email sent to sarah@example.com successfully.
```

**GitHub Issue Flow:**
```
User: "Create issue in myorg/myrepo about broken auth"
Assistant: I'll create GitHub issue:

Repo: myorg/myrepo
Title: Authentication Flow Broken
Body: [detailed description based on conversation context]

[UI shows issue preview]

User: [Rejects with feedback: "Add 'bug' label"]
Assistant: Updated issue with bug label. Ready?

[UI shows updated preview with label]

User: [Approves]
Assistant: Issue created: https://github.com/myorg/myrepo/issues/123
```

**Todo Flow (instant):**
```
User: "Remind me to review PR #456 tomorrow"
Assistant: Todo added: "Review PR #456" (due: tomorrow)
```

## Additional Integration Ideas

**Data & Analytics:**
- Query Postgres/MySQL via MCP
- Update Google Sheets rows
- Log events to Mixpanel/Amplitude
- Create Airtable records

**DevOps:**
- Trigger CI/CD pipelines
- Query monitoring (Datadog, Sentry)
- Update feature flags (LaunchDarkly)
- Manage infrastructure (Terraform Cloud API)

**CRM & Sales:**
- Create HubSpot contacts
- Update Salesforce leads
- Log calls in Close.io
- Send follow-ups via Intercom

**Content & Media:**
- Generate images (DALL-E, Midjourney)
- Transcribe audio (Whisper API)
- Translate text (DeepL)
- Shorten URLs (Bitly)

**Team Coordination:**
- Create Loom recordings
- Schedule Zoom meetings
- Post updates to Teams
- Update wiki pages (Confluence)

## Next Steps

After implementing tools in 8.1:
- **Lesson 8.2:** Build HITL harness in project (if not done in section 7)
- **Lesson 8.3:** Implement timed tool access / temporary permissions

Remember: goal = overwhelm with possibilities. Every developer has unique workflow. Build what makes YOUR assistant useful.