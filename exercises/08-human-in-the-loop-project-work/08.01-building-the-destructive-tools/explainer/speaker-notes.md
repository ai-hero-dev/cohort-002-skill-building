# Building Destructive Tools & Integrations

## Intro

- Section 7: built HITL harness. Now: make it useful
- Goal: overwhelm with integration options, inspire custom builds
- Every developer needs different tools - choose what matters
- Balance power vs risk through thoughtful tool design

## Demo: Integration Landscape

### Real-World Power

**Core categories:**
- Communication: email (Resend, SendGrid), Slack, Discord, SMS
- Task mgmt: Linear, GitHub issues, Jira, Trello
- Calendar: Google Calendar, Cal.com
- DevOps: GitHub PRs, git commits, deploy triggers, database writes
- Files: MCP filesystem, Google Docs, Notion, S3
- Nuclear option: Zapier MCP = 30k+ actions across 8k apps

**HITL decision matrix:**
- Destructive = approval required: emails, public posts, charges, deletes, deploys, meetings
- Safe = instant: search/read, local todos, analysis, calculations

### Implementation Pattern 1: Direct API

**Links:** `notes.md` lines 64-124 (Resend email example)

- npm package + API key
- Tool writes `data-action-start`, returns early
- Actual execution in HITL processor on approval
- Example: Resend SDK for email, Octokit for GitHub

**Key points:**
- Tool execute = queue, not execute
- HITL handler = switch on action.type, run service
- Error handling with try/catch, write action-end with error flag

### Implementation Pattern 2: MCP Servers

**Links:** `notes.md` lines 126-168

- Standardized protocol for AI-to-tool connection
- Popular: filesystem, GitHub, Postgres, Brave search
- Zapier MCP = everything else
- Config via JSON, tools auto-discovered
- AI SDK v5: `experimental_toolCall: "auto"`

**Demo flow:**
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {"GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"}
    }
  }
}
```

### Implementation Pattern 3: Hybrid Tool + Service

**Links:** `notes.md` lines 170-263

- Service layer: `src/lib/services/` for testability
- Tool layer: `src/lib/tools/` for LLM interface
- Separation enables testing, reuse, swapping backends

**Architecture:**
```typescript
// Service: pure logic
GitHubService.createIssue(opts)

// Tool: LLM interface
createGitHubIssueTool.execute() -> writes data-action-start
```

### Implementation Pattern 4: Persistence Layer

**Links:** `notes.md` lines 265-343

- Extend existing DB schema for local data
- Non-destructive = no HITL needed
- Example: todos with title, description, dueDate
- Direct execution, instant feedback

## Walkthrough: Building Integration Stack

### Phase 1: Choose Stack

**Starter kit (2-3 tools):**
- Email (Resend/SMTP)
- GitHub issue (Octokit)
- Local todo (persistence)

**Power user (5+ tools):**
- Above + calendar, Slack, Zapier MCP

### Phase 2: Service Layer

**Links:** `notes.md` lines 426-450

Create `src/lib/services/`:
- `email-service.ts` - EmailService.send()
- `github-service.ts` - GitHubService.createIssue(), createPR()
- `calendar-service.ts` - CalendarService.createEvent()

Keep separate from tools for testing

### Phase 3: Tool Schemas

**Links:** `notes.md` lines 452-478

Create `src/lib/tools/destructive-tools.ts`:

All destructive tools must:
1. Write `data-action-start` with action metadata
2. Return description of queued action
3. NOT execute immediately

### Phase 4: Add to Agent

**Links:** `notes.md` lines 480-497

Update chat route:
- Import tools
- Add to `tools` object
- Set `stopWhen: hasToolCall` to pause for HITL

### Phase 5: Action Executors

**Links:** `notes.md` lines 499-552

In HITL processor loop:
- Switch on `action.type`
- Call service for approved actions
- Write `data-action-end` with result/error
- Handle rejections with feedback

### Phase 6: Test Flows

**Email test:**
1. "Send email to john@example.com"
2. Queue shows preview
3. Approve → sends
4. Reject → cancels

**GitHub test:**
1. "Create issue: bug in auth"
2. Preview shows
3. Reject with "add bug label"
4. Agent adjusts, re-shows
5. Approve → issue created, returns URL

**Todo test:**
1. "Remind me review PR #456 tomorrow"
2. Instant execution (non-destructive)

### Phase 7: MCP Servers (Optional)

**Links:** `notes.md` lines 574-595

- Install: `npm install -g @modelcontextprotocol/server-zapier`
- Configure in Claude Desktop or custom client
- Zapier = 30k+ actions unlocked

### Phase 8: System Prompt

**Links:** `notes.md` lines 597-622

Update prompt with:
- Available tools list
- HITL behavior description
- Confirmation requirements
- Proactive but cautious guidance

## Example Conversation Flows

**Links:** `notes.md` lines 624-664

Walk through 3 scenarios:
1. Email: draft → preview → approve → sent
2. GitHub: create → preview → reject with feedback → adjust → approve → URL
3. Todo: request → instant execution

## Mindful Considerations

### Authentication Patterns

**Links:** `notes.md` lines 393-410

- Env vars: simplest, single-user
- OAuth: complex, requires refresh flow, token storage
- Per-user keys: store encrypted in DB, tightest security

### Error Handling

**Links:** `notes.md` lines 365-391

- All tools: try/catch wrapper
- Write action-end with error flag
- Re-throw for agent handling
- Graceful failure messages

## Inspiration: More Integration Ideas

**Links:** `notes.md` lines 666-696

**20+ categories:**
- Data: Postgres MCP, Google Sheets, Airtable, Mixpanel
- DevOps: CI/CD triggers, Datadog, feature flags, Terraform
- CRM: HubSpot, Salesforce, Close.io, Intercom
- Content: DALL-E, Whisper, DeepL, Bitly
- Team: Loom, Zoom, Teams, Confluence

Goal: overwhelm with possibilities

## Next Up

**Links:** workshop-goals.md lines 320-342

- **Lesson 8.2:** Build HITL harness in project (apply Section 7 patterns)
- **Lesson 8.3:** Timed tool access - thread-scoped permissions reduce friction

Remember: build what makes YOUR assistant useful. Every workflow is unique.
