# Workshop Goals

## Section 01: Retrieval Skill Building

**Learning Goals:**

- Understand RAG fundamentals and connecting LLMs to private data
- Master keyword search (BM25) and semantic search (embeddings)
- Combine multiple retrieval methods via rank fusion
- Optimize retrieval quality through query rewriting and reranking

### [01.01 - Retrieval Intro](./exercises/01-retrieval-skill-building/01.01-retrieval-intro/speaker-notes.md) (Intro)

- What retrieval is: connecting LLMs to private/external data
- Public vs private data retrieval approaches
- Retrieval-Augmented Generation (RAG) concept
- Foundation for personal assistant architecture
- Section roadmap: BM25 → embeddings → rank fusion → query rewriting → reranking

### [01.02 - BM25](./exercises/01-retrieval-skill-building/01.02-bm25/explainer/readme.md) (Explainer)

- Keyword-based search using BM25 algorithm
- Term frequency & inverse document frequency scoring
- Document length normalization
- Interactive playground UI to experiment with different keyword combinations
- Understanding BM25 limitations: no semantic understanding, requires exact keyword matching

### [01.03 - Retrieval with BM25](./exercises/01-retrieval-skill-building/01.03-retrieval-with-bm25/problem/readme.md) (Problem)

- Generate keywords from conversation history using `streamObject`
- Implement BM25 search with `okapibm25` package
- Select top N most relevant search results
- Use LLM to answer questions with retrieved email context
- Format message history for LLM consumption

### [01.04 - Embeddings](./exercises/01-retrieval-skill-building/01.04-embeddings/problem/readme.md) (Problem)

- Semantic search via embeddings (vector representations of text)
- Use `embedMany` to create corpus embeddings
- Use `embed` to create query embeddings
- Calculate relevance with `cosineSimilarity`
- Compare semantic vs keyword-based retrieval performance
- Understand when embeddings outperform keyword search

### [01.05 - Rank Fusion](./exercises/01-retrieval-skill-building/01.05-rank-fusion/explainer/readme.md) (Explainer)

- Reciprocal rank fusion (RRF) algorithm for combining rankings
- Merge BM25 + semantic search results
- Handle different scoring scales between ranking systems
- Position-based scoring formula: `1/(k+rank)`
- Interactive playground UI with visual comparison of BM25, semantic, and RRF ordering
- Leverage complementary strengths of multiple retrieval methods

### [01.06 - Query Rewriting](./exercises/01-retrieval-skill-building/01.06-query-rewriting/problem/readme.md) (Problem)

- Pre-retrieval optimization via query rewriter LLM
- Convert long conversation history to focused, refined query
- Prevent dilution of recent/relevant context in embeddings
- Improve semantic search precision
- Generate both keywords (for BM25) and search query (for embeddings) in single call

## Section 02: Retrieval Project Work

**Learning Goals:**

- Apply Section 01 techniques to real project codebase
- Build production-ready search with embedding cache
- Build agent-controlled search tool with BM25 + embeddings + rank fusion
- Configure multi-step agent workflows

### [02.01 - Building Your Own Dataset](./exercises/02-retrieval-project-work/02.01-building-your-own-dataset/explainer/readme.md) (Explainer)

- Choose dataset: pre-built (75 or 547 emails) or custom
- Gmail export via mbox for personal email data
- Alternative datasets: notes, chat logs, docs, transcripts, journals
- Map any JSON to Email schema (id/subject/body minimum)
- Optional: skip if using pre-built dataset

### [02.02 - Building a Search Algorithm](./exercises/02-retrieval-project-work/02.02-building-a-search-algorithm/explainer/notes.md) (Explainer)

- Replace simple string search with BM25 keyword search in project `/search` page
- Implement semantic search using `embedMany` and `cosineSimilarity`
- Build file-system embedding cache (`data/embeddings/{emailId}.json`) to avoid regeneration
- Combine BM25 + embedding results with reciprocal rank fusion
- Production alternative: pgvector in Postgres stores embeddings on database rows
- Apply Section 01 retrieval skills to real project codebase

### [02.03 - Adding Search Tool to Agent](./exercises/02-retrieval-project-work/02.03-adding-search-tool-to-agent/explainer/notes.md) (Explainer)

- Build chat API route with `createUIMessageStream` for agent-driven search
- Build `searchSemanticEmails` tool using lesson 2.2 algorithm (BM25 + embeddings + RRF)
- Agent generates keywords + search query via tool parameters
- Configure `stopWhen: stepCountIs(5)` for multi-tool workflows
- Apply Anthropic prompt template: task context → background data → rules → the ask
- Stream conversational answers based on retrieved email context

## Section 03: Retrieval Day 2 Skill Building

**Learning Goals:**

- Understand chunking problem: context window fairness for irregular documents
- Compare fixed-size (token-based) vs structural (markdown-based) chunking
- Apply BM25, embeddings, and rank fusion to chunks
- Improve retrieval precision with reranking

### [03.01 - Chunking Intro](./exercises/03-retrieval-day-2-skill-building/03.01-chunking-intro/explainer/notes.md) (Explainer)

- Irregular datasets (docs, notes) often need chunking; emails can benefit too (long threads, quoted text)
- Core problem: large chunks dominate context window, crowd out small relevant sections
- Context fairness: 8k window fits 1 giant section OR 20 small sections
- Wasteful info issue: fixed chunks may contain irrelevant text
- Two approaches preview: fixed-size (token-based + overlap) vs structural (markdown/semantic boundaries)
- Visualize problem: section length distribution shows 100-10,000+ char variance
- Foundation for 03.02 (fixed chunking), 03.03 (structural), 03.04 (retrieval), 03.05 (reranking)

### [03.02 - Fixed Size Chunks](./exercises/03-retrieval-day-2-skill-building/03.02-fixed-size-chunks/explainer/readme.md) (Explainer)

- Token-based chunking with overlap using `TokenTextSplitter`
- Parameters: chunk size (300 tokens) + overlap (50 tokens)
- Playground UI to explore chunk output on TypeScript book dataset
- Understand overlap: preserve context across chunk boundaries
- Visualize chunk boundaries and sizes before retrieval integration

### [03.03 - Structural Chunking](./exercises/03-retrieval-day-2-skill-building/03.03-structural-chunking/explainer/readme.md) (Explainer)

- Document structure-based chunking in same playground
- Chunk by markdown structure: headings, sections, paragraphs using `RecursiveCharacterTextSplitter`
- Why structural chunking: reduces wasteful information, preserves semantic boundaries
- Particularly effective for markdown documents
- Compare structural vs fixed-size chunking visually in playground
- Still using TypeScript book dataset, no LLM integration yet

### [03.04 - Retrieval with Chunks](./exercises/03-retrieval-day-2-skill-building/03.04-retrieval-with-chunks/explainer/readme.md) (Explainer)

- Integrate chunking with retrieval techniques in playground
- Apply BM25 keyword search to chunks
- Embed each chunk separately for semantic search
- Combine BM25 + embedding results via reciprocal rank fusion
- No LLM response generation yet - focus on retrieval quality
- View top ranked chunks from search queries

### [03.05 - Reranking](./exercises/03-retrieval-day-2-skill-building/03.05-reranking/problem/readme.md) (Problem)

- Post-retrieval filtering via reranker LLM in playground
- Pass top 30 chunk results to reranker, return most relevant IDs only
- Token optimization: return IDs not full content
- Format chunks with IDs for LLM evaluation
- Handle potential LLM hallucination of non-existent IDs
- Trade latency for improved retrieval relevance
- Still in playground, no final answer generation

## Section 04: Retrieval Day 2 Project Work

**Learning Goals:**

- Apply chunking and reranking to email dataset
- Build multi-tool agent architecture with custom filters
- Implement metadata-first retrieval patterns for efficient context usage
- Master advanced agentic search techniques

### [04.01 - Chunking Emails Playground](./exercises/04-retrieval-day-2-project-work/04.01-chunking-emails-playground/explainer/notes.md) (Explainer)

- Apply Section 03 chunking techniques to emails dataset in playground
- Experiment with structural chunking (email threads, quoted replies)
- Experiment with fixed-size chunking for long email bodies
- Visualize chunk boundaries and sizes on email corpus
- Understand when chunking benefits emails: long threads, attachments, quoted text
- Foundation for integrating chunking into search tool

### [04.02 - Reranking & Chunking in Search Tool](./exercises/04-retrieval-day-2-project-work/04.02-reranking-and-chunking-in-search-tool/explainer/notes.md) (Explainer)

- Add chunking to `searchSemanticEmails` tool from lesson 2.3
- Chunk emails before BM25 + embeddings + RRF retrieval
- Add mandatory reranking step: pass top 30 chunks to reranker LLM, return relevant IDs only
- Token optimization: reranker returns chunk IDs not full content
- Handle LLM hallucination of non-existent chunk IDs
- Trade latency for improved retrieval precision

### [04.03 - Custom Filter Tools](./exercises/04-retrieval-day-2-project-work/04.03-custom-filter-tools/explainer/notes.md) (Explainer)

- Build `filterEmails` tool for traditional filtering alongside semantic search
- Parameters: `from`, `to`, `contains`, `before`, `after`, `limit`, `contentLevel`
- `contentLevel` union: `subjectOnly` (metadata), `fullContent` (with body), `fullThread` (entire thread)
- Agent chooses between semantic search vs filter search based on query type
- Combine tools in multi-step workflows with `stopWhen: stepCountIs(5)`
- System prompt engineering: guide agent on when to use each tool

### [04.04 - Metadata-First Retrieval Pattern](./exercises/04-retrieval-day-2-project-work/04.04-metadata-first-retrieval-pattern/explainer/notes.md) (Explainer)

- Modify `searchSemanticEmails` and `filterEmails` to return metadata only by default
- Build `getEmailById` tool: accepts array of email IDs for targeted full content retrieval
- Optional `includeThread` parameter to retrieve entire conversation thread
- Metadata scan → targeted retrieval pattern: agent browses subjects first, fetches content selectively
- Token efficiency: avoid loading full email bodies until agent confirms relevance
- Multi-step agentic workflow: search → filter results → fetch specific emails → answer

## Section 05: Memory Skill Building

**Learning Goals:**

- Build persistent memory system with CRUD operations
- Distinguish permanent vs situational information
- Control memory creation via agent tools vs automatic extraction
- Scale memory systems with semantic recall

### [05.01 - Basic Memory Setup](./exercises/05-memory-skill-building/05.01-basic-memory-setup/problem/readme.md) (Problem)

- Load and format existing memories from persistent storage
- Pass memory context to LLM via system prompt
- Extract permanent memories from conversation using `generateObject`
- Define Zod schema for memory array structure
- Save new memories with ID and timestamp metadata
- Distinguish permanent vs temporary/situational information

### [05.02 - Updating Previous Memories](./exercises/05-memory-skill-building/05.02-updating-previous-memories/problem/readme.md) (Problem)

- Implement memory CRUD operations: updates, deletions, additions
- Define schemas for memory modifications using Zod
- Handle contradictory information by updating existing memories
- Prevent deletion conflicts by filtering IDs being updated
- Enable working memory (temporary info) beyond permanent facts
- Track memory evolution as user preferences change over time

### [05.03 - Memory as Tool Call](./exercises/05-memory-skill-building/05.03-memory-as-tool-call/problem/readme.md) (Problem)

- Convert automatic `onFinish` callback to agent-controlled tool
- Give agent decision power over when to memorize
- Use `tool()` function with updates/deletions/additions parameters
- Set `stopWhen: stepCountIs(5)` to allow multi-step tool calls
- Improve token efficiency by skipping trivial conversations
- Enable transparent tool calls visible in UI
- Agent batching: wait for natural conversation end before memorizing

### [05.04 - Semantic Recall on Memories](./exercises/05-memory-skill-building/05.04-semantic-recall-on-memories/explainer/readme.md) (Explainer)

- Scale memory system beyond loading entire database
- Query rewriting: generate keywords + search query for memory retrieval
- Embed memories at creation time using `embedMemory` function
- Retrieve top N most relevant memories (10-50) based on conversation context
- Format and inject retrieved memories into system prompt

## Section 06: Memory Project Work

**Learning Goals:**

- Implement memory loading and formatting for LLM consumption
- Compare approaches: tool-controlled vs automatic vs user-confirmed creation
- Understand tradeoffs: transparency, latency, cost, user control
- Build production memory system integrated with chat interface

### [06.01 - All Memories Upfront](./exercises/06-memory-project-work/06.01-all-memories-upfront/explainer/notes.md) (Explainer)

- Load entire memory DB via `loadMemories()` from persistence layer
- Format memories as text for LLM consumption
- Inject all memories into system prompt for full context
- Simplest approach: no retrieval, no filtering - all context every request
- Manual memory creation via existing UI (no automatic extraction yet)
- Understand limitations: doesn't scale, wastes tokens on irrelevant memories
- Foundation before adding tool-controlled creation and semantic recall

### [06.02 - Tool Call Memory Creation](./exercises/06-memory-project-work/06.02-tool-call-memory-creation/explainer/notes.md) (Explainer)

- Define `createMemory`, `updateMemory`, `deleteMemory` tools with CRUD parameters
- LLM controls timing: calls tools when user shares/updates personal info
- Execute handlers call persistence layer functions
- System prompt guides LLM judgment: permanent vs situational info
- Real-time memory operations during conversation
- Transparent approach: tool calls visible in UI
- Agent decides when to remember, immediate save without user confirmation

### [06.03 - Automatic Memory Creation](./exercises/06-memory-project-work/06.03-automatic-memory-creation/explainer/notes.md) (Explainer)

- Automatic extraction via `onFinish` callback after each response
- Use `generateObject` to analyze full conversation for memory operations
- Define Zod schema for updates (id + title + content), deletions (IDs), additions (title + content)
- System prompt guides permanent vs situational judgment
- Filter deletions to avoid conflicts with updates
- Comprehensive approach: analyzes every message automatically
- Trade-offs: less transparent, extra LLM call per message, higher latency/cost vs tool approach

### [06.04 - User Confirmed Memories](./exercises/06-memory-project-work/06.04-user-confirmed-memories/explainer/notes.md) (Explainer)

- LLM suggests memory operations (create/update/delete) via `generateObject` in `onFinish`
- Send suggestions as transient data part (`data-memory-suggestions`) for ephemeral approval flow
- Frontend detects suggestions via `onData` callback, displays alert notification
- Build approval modal UI showing each suggested operation with approve/reject buttons
- Execute only user-approved operations via server action calling persistence layer
- Maximum user control approach: nothing saved without explicit approval
- Trade-offs: most complex implementation, user friction vs transparency and trust

## Section 07: Evals Skill Building

**Learning Goals:**

- Test agent behavior systematically with Evalite framework
- Verify tool invocation and parameter correctness
- Generate synthetic test datasets using LLMs
- Scale testing beyond manual test cases

### [07.01 - Evaluating Tool Call Agents](./exercises/07-evals-skill-building/07.01-evaluating-tool-call-agents/problem/readme.md) (Problem)

- Test LLM tool calling with Evalite framework
- Fake tools: getWeather and calculator for testing
- Inspect `toolCalls` array to verify expected tool invocation
- Test positive cases (tool needed) and negative cases (no tool needed)
- Binary scoring pattern: 1 correct, 0 wrong
- Extend to validate tool parameters
- Foundation for systematic agent testing

### [07.02 - Creating Synthetic Datasets](./exercises/07-evals-skill-building/07.02-creating-synthetic-datasets/problem/readme.md) (Problem)

- Generate realistic evaluation datasets using LLMs to scale testing
- Use `generateText` for simple output (persona descriptions)
- Use `generateObject` for structured data (conversation turns)
- Create 4 scenario types: happy path, situational only, edge case mixed, adversarial privacy
- Prompt engineering for diverse, realistic synthetic data generation
- Output 12 conversations (3 per scenario) to test memory extraction systems

## Section 08: Evals Project Work

**Learning Goals:**

- Evaluate memory extraction accuracy with operation-specific scorers
- Generate synthetic test datasets (32 cases across 4 operation types)
- Compare RAG vs agentic search approaches experimentally
- Build LLM-as-judge scorer for automated answer quality evaluation

### [08.01 - Evaluating Memory Extraction](./exercises/08-evals-project-work/08.01-evaluating-memory-tool/explainer/notes.md) (Explainer)

- Test memory extraction from conversation history using Evalite framework
- Import `extractMemories()` function from project repo (refactored in 06.03)
- Manual test case creation covering 5 scenarios: casual chat, personal info, contradictions, mixed content, multiple facts
- Binary scorer: verify memory created/skipped when expected
- Length scorer: prevent overly long memory content (>500 chars threshold)
- Foundation for synthetic dataset generation in 08.02
- Quantify extraction accuracy, catch regressions when changing prompts/models

### [08.02 - Creating Memory Tool Evaluation Dataset](./exercises/08-evals-project-work/08.02-creating-memory-tool-evaluation-dataset/explainer/notes.md) (Explainer)

- Generate synthetic test cases using `generateObject` with operation-specific prompts
- Separate generation (`generate-dataset.ts`) from evaluation (`main.ts`) for consistent testing
- 4 operation types: create (new info), update (contradictions), delete (forget requests), no-action (casual chat)
- Reusable generator function produces 8 cases per operation (32 total)
- Test case schema: conversation turns + existing memories + expected operations
- 4 separate Evalite suites with operation-specific scorers
- Scale from 5 manual cases (08.01) to 32 synthetic cases
- Identify which memory operations have low accuracy for prompt tuning

### [08.03 - Evaluating Retrieval](./exercises/08-evals-project-work/08.03-evaluating-retrieval/explainer/notes.md) (Explainer)

- Test retrieval mechanism quality using production dataset
- Manual dataset analysis: identify 8-10 key factual emails with clear retrieval signals
- Create test cases: natural language queries + expected email IDs
- Import search algorithm from project work (lesson 2.2: BM25 + embeddings + RRF)
- Graduated scoring: 1.0 if top result, 0.5 if positions 2-5, 0 otherwise
- Quantify retrieval accuracy across diverse question types (amounts, dates, reasons, people)
- Focus on mechanism quality, not agent output
- Catch regressions when changing search implementation or tuning parameters

### [08.04 - LLM-as-Judge Scorer](./exercises/08-evals-project-work/08.04-llm-as-judge-scorer/explainer/notes.md) (Explainer)

- Build LLM-as-judge scorer for automated answer quality evaluation
- Implement factuality scorer comparing generated vs expected answers (inspired by Braintrust)
- Multiple-choice verdict format: subset (0.4), superset (0.6), exact (1.0), disagreement (0.0), equivalent (1.0)
- Request reasoning before verdict for transparency and accuracy
- Apply scorer to retrieval test cases from lesson 8.3
- Validate LLM judge decisions via spot-checking 5-10 cases
- Scale test dataset to 20-50 cases now that scoring is automated
- Understand tradeoffs: cost vs scalability, consistency vs human judgment
- Prompt engineering best practices: multiple-choice format, low temperature, clear rubric

## Section 09: Human-in-the-Loop Skill Building

**Learning Goals:**

- Balance LLM autonomy vs risk management with human oversight
- Implement action lifecycle with custom data parts (start, decision, end)
- Build approval/rejection flow with user feedback
- Format custom message history for LLM context

### [09.01 - HITL Intro](./exercises/09-human-in-the-loop-skill-building/09.01-hitl-intro/explainer/readme.md) (Explainer)

- Balance LLM autonomy vs risk management through human oversight
- Custom data parts for action lifecycle: `data-action-start`, `data-action-decision`, `data-action-end`
- Pause execution for human review before performing actions
- User approval/rejection flow with feedback mechanism
- Prevent LLM from executing high-impact actions without confirmation
- Why build HITL yourself: enables extensions like thread-scoped permissions (see 10.03)

### [09.02 - Initiating HITL Requests](./exercises/09-human-in-the-loop-skill-building/09.02-initiating-hitl-requests/problem/readme.md) (Problem)

- Define `action-start` custom data part with action metadata (id, type, to, subject, content)
- Modify tool `execute` to write `data-action-start` instead of performing action
- Use `stopWhen` with `hasToolCall` to halt agent after tool invocation
- Render email preview UI from `data-action-start` parts
- Separate tool calling from tool execution for human review

### [09.03 - Approving HITL Requests](./exercises/09-human-in-the-loop-skill-building/09.03-approving-hitl-requests/problem/readme.md) (Problem)

- Define `action-decision` custom data part with `ActionDecision` discriminated union
- Track decisions via `actionIdsWithDecisionsMade` set to hide approve/reject buttons
- Handle approval: send `data-action-decision` part via `sendMessage`
- Handle rejection: capture feedback in state, reuse `ChatInput` for reason entry
- Submit rejection feedback as `data-action-decision` with reason

### [09.04 - Passing Custom Message History to LLM](./exercises/09-human-in-the-loop-skill-building/09.04-passing-custom-message-history-to-the-llm/problem/readme.md) (Problem)

- Fix LLM ignoring user feedback by formatting custom data parts
- Replace `convertToModelMessages` with `prompt: getDiary(messages)`
- `getDiary` converts `UIMessage` array to markdown-formatted string
- Include all message parts (text, action-start, action-decision) in prompt
- Prompt engineering via custom message formatting for full conversation context

### [09.05 - Processing HITL Requests](./exercises/09-human-in-the-loop-skill-building/09.05-processing-hitl-requests/problem/readme.md) (Problem)

- Define `action-end` custom data part with action ID and output
- Implement `findDecisionsToProcess` to match actions with decisions
- Extract actions from assistant message, decisions from user message
- Return `HITLError` if user hasn't made decision for pending action
- Update `getDiary` to format `data-action-end` parts for LLM consumption

### [09.06 - Executing HITL Requests](./exercises/09-human-in-the-loop-skill-building/09.06-executing-the-hitl-requests/problem/readme.md) (Problem)

- Execute approved actions inside `createUIMessageStream` loop
- Create `messagesAfterHitl` copy to append `data-action-end` parts
- Call actual `sendEmail` only on approval, write `data-action-end` to stream
- Handle rejection branch: record rejection in `data-action-end` without executing
- Pass `messagesAfterHitl` to `getDiary` so LLM sees action outcomes

## Section 10: Human-in-the-Loop Project Work

**Learning Goals:**

- Implement destructive tools with API integrations (email, GitHub, calendar)
- Apply HITL harness to real assistant project
- Build thread-scoped permission system to reduce approval friction
- Integrate MCP servers for massive action coverage (30k+ Zapier actions)

### [10.01 - Building Destructive Tools & Integrations](./exercises/10-human-in-the-loop-project-work/10.01-building-the-destructive-tools/explainer/notes.md) (Explainer)

- Implement destructive tool handlers (email, GitHub, calendar, todos)
- Integrate MCP servers for massive action coverage (Zapier: 30k+ actions)
- Design service layer architecture separating tools from execution
- Balance power vs risk: HITL for destructive, instant for safe actions
- Direct API integration patterns (Resend, Octokit, Slack SDK)
- Hybrid tool wrapper + external service abstraction
- Persistence layer integration for local data operations
- Error handling, authentication patterns (env vars, OAuth, per-user keys)
- System prompt engineering to describe available tools
- Zapier MCP nuclear option: Gmail, Sheets, Airtable, Salesforce, 8,000 apps
- 20+ integration ideas across dev tools, communication, automation, finance

### [10.02 - Build the HITL Harness](./exercises/10-human-in-the-loop-project-work/10.02-build-the-hitl-harness/explainer/notes.md) (Explainer)

- Apply Section 07 HITL patterns to real assistant project
- Define custom data parts: `action-start`, `action-decision`, `action-end`
- Modify tools from 8.1 to write actions instead of executing immediately
- Build `findDecisionsToProcess` to match actions with decisions
- Create frontend approval/rejection UI with feedback capture
- Format custom parts in diary function for LLM context
- Execute approved actions, handle rejections with user feedback
- Use `messagesAfterHitl` with appended `action-end` parts for LLM visibility
- Track action IDs with decisions to hide buttons after submission
- System prompt guidance on HITL behavior and action outcomes

### [10.03 - Giving Timed Access to Tools](./exercises/10-human-in-the-loop-project-work/10.03-giving-timed-access-to-tools/explainer/notes.md) (Explainer)

- Thread-scoped permission system to reduce approval friction
- Extend persistence layer: track `grantedPermissions` per chat
- "Approve Once" vs "Allow for This Thread" decision types
- Check permissions before requesting HITL: auto-execute if granted
- Build permission revocation UI in settings/sidebar
- Frontend buttons for single vs thread-scoped approval
- Security considerations: thread scope, expiration times, revocation
- System prompt transparency: inform LLM of pre-approved tools
- UX patterns: permission badges, clear controls, edge case handling
