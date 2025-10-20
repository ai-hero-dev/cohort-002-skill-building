# Workshop Goals

## Section 01: Retrieval Skill Building

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
- Leverage complementary strengths of multiple retrieval methods

### [01.06 - Query Rewriting](./exercises/01-retrieval-skill-building/01.06-query-rewriting/problem/readme.md) (Problem)

- Pre-retrieval optimization via query rewriter LLM
- Convert long conversation history to focused, refined query
- Prevent dilution of recent/relevant context in embeddings
- Improve semantic search precision
- Generate both keywords (for BM25) and search query (for embeddings) in single call

## Section 02: Retrieval Project Work

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

### [02.03 - Building a Search Workflow](./exercises/02-retrieval-project-work/02.03-building-a-search-workflow/explainer/notes.md) (Explainer)

- Build chat API route with `createUIMessageStream` for conversational retrieval
- Generate keywords + search query from conversation via `generateObject` (query rewriting)
- Integrate lesson 2.2 search algorithm (BM25 + embeddings + rank fusion)
- Add mandatory reranking step: pass top 30 to reranker LLM, return relevant IDs only
- Stream retrieved emails as custom data parts (`data-search-results`) before answer
- Experiment with email formatting (JSON/markdown/minimal) and monitor token usage via `result.usage`
- Learn formatting impact: different formats vary 30-50% in token consumption
- Stream final answer with citations from retrieved email context

### [02.04 - Agent-Controlled Search Tools](./exercises/02-retrieval-project-work/02.04-agent-controlled-search-tools/explainer/notes.md) (Explainer)

- Convert automatic RAG flow (lesson 2.3) to agent-driven tool orchestration
- Build `searchSemanticEmails` tool: BM25 + embeddings + RRF + reranking, metadata only
- Build `filterEmails` tool: traditional filtering (`from`, `contains`, `limit`, `contentLevel`)
- `contentLevel` union: `subjectOnly` (metadata), `fullContent` (with body), `fullThread` (entire thread)
- Build `getEmailById` tool: targeted retrieval after metadata scan, optional thread inclusion
- Configure `stopWhen: stepCountIs(5)` for multi-tool workflows
- Apply Anthropic prompt template: task context → background data → rules → the ask
- Agent autonomy: semantic vs filter search, metadata scan → targeted retrieval patterns

## Section 03: Retrieval Day 2 Skill Building

### [03.01 - Chunking Intro](./exercises/03-retrieval-day-2-skill-building/03.01-chunking-intro/explainer/readme.md) (Explainer)

- Why chunking needed: handling irregular datasets vs regular pre-chunked emails
- Problem: large chunks dominate context window
- Additional problem: wasteful information in fixed-size chunks
- Solution: chunk documents into regular sizes for balanced retrieval
- Foundation for fixed-size and structural chunking approaches

### [03.02 - Fixed Size Chunks](./exercises/03-retrieval-day-2-skill-building/03.02-fixed-size-chunks/explainer/readme.md) (Explainer)

- Token-based chunking with overlap using `TokenTextSplitter`
- Parameters: chunk size (300 tokens) + overlap (50 tokens)
- Demo implementation showing document splitting
- Understand overlap: preserve context across chunk boundaries
- Prepare for integration with retrieval pipeline

### [03.03 - Fixed Chunks with Retrieval](./exercises/03-retrieval-day-2-skill-building/03.03-fixed-chunks-with-retrieval/problem/readme.md) (Problem)

- Integrate fixed-size chunking with existing retrieval mechanism
- Apply BM25 keyword search to chunks
- Embed each chunk separately for semantic search
- Combine BM25 + embedding results via reciprocal rank fusion
- Build complete chunked retrieval pipeline
- Initial implementation (replaced by structural chunking in 03.04)

### [03.04 - Structural Chunking](./exercises/03-retrieval-day-2-skill-building/03.04-structural-chunking/problem/readme.md) (Problem)

- Replace 03.03 fixed-size implementation with document structure-based chunking
- Chunk by markdown structure: headings, sections, paragraphs
- Why structural chunking: reduces wasteful information, preserves semantic boundaries
- Particularly effective for markdown documents
- Maintain existing BM25 + embeddings + rank fusion integration
- Compare structural vs fixed-size chunking performance

### [03.05 - Reranking](./exercises/03-retrieval-day-2-skill-building/03.05-reranking/problem/readme.md) (Problem)

- Post-retrieval filtering via reranker LLM
- Pass top 30 chunk results to reranker, return most relevant IDs only
- Token optimization: return IDs not full content
- Format chunks with IDs for LLM evaluation
- Handle potential LLM hallucination of non-existent IDs
- Trade latency for improved retrieval relevance
- Applies reranking to chunked retrieval results

## Section 04: Retrieval Day 2 Project Work

### [04.01 - Grabbing Your Own Dataset](./exercises/04-retrieval-day-2-project-work/04.01-grabbing-your-own-dataset/explainer/readme.md) (Explainer)

- Choose dataset: notes, Google Docs, documentation sites, various sources
- Different from day 1 email focus - more flexible dataset types
- Export/gather data in format suitable for chunking
- Alternatives: Notion exports, Obsidian vaults, blog posts, wikis
- End with collection of documents ready to chunk
- Optional: skip if using provided irregular dataset (04.02)

### [04.02 - Exploring Our Dataset](./exercises/04-retrieval-day-2-project-work/04.02-exploring-our-dataset/explainer/readme.md) (Explainer)

- Fallback dataset if students don't grab their own
- Sarah Chen's personal notes and diary entries (fits existing email dataset narrative)
- Messy, irregular structure: some entries very long, others short
- Real-world personal knowledge base with varied document lengths
- Demonstrates why chunking needed for irregular documents
- Prepare for chunking exploration in 04.03

### [04.03 - Chunking Playground](./exercises/04-retrieval-day-2-project-work/04.03-chunking-playground/explainer/readme.md) (Explainer)

- Reuse UI-based playground from project
- Visually explore chunk output before embedding
- Compare fixed-size vs structural chunking on your dataset
- Inspect chunk boundaries, overlap, semantic coherence
- Identify which chunking strategy works best for your data
- Critical step: verify chunks look correct before retrieval

### [04.04 - Implementing Chunking in Retrieval](./exercises/04-retrieval-day-2-project-work/04.04-implementing-chunking-in-retrieval/explainer/readme.md) (Explainer)

- Apply chosen chunking method from 04.03 exploration
- Integrate chunking with BM25 + embeddings + rank fusion
- Students pick fixed-size or structural based on findings
- Embed each chunk separately for semantic search
- Add reranking step to complete retrieval pipeline for notes
- Build complete chunked retrieval pipeline matching email search capabilities
- Apply all day 2 skill-building techniques (Section 03) to real project

### [04.05 - Combining Multiple Data Sources](./exercises/04-retrieval-day-2-project-work/04.05-combining-multiple-data-sources/explainer/readme.md) (Explainer)

- Combine emails + notes retrieval into LLM application from Section 02
- Rank fusion of rank fusion: merge results from both datasets
- Apply unified reranking across combined email + note results
- Feed combined, reranked results to LLM for conversational answers
- Demonstrates multi-corpus RAG with heterogeneous data sources
- Project uses separate routes for email search and notes search

## Section 05: Memory Skill Building

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

### [08.04 - Comparing Semantic Search with Agentic Search](./exercises/08-evals-project-work/08.04-comparing-semantic-search-with-agentic-search/explainer/notes.md) (Explainer)

- Comparative evaluation using `evalite.each` for variant comparison
- Experiment-driven testing: treat eval as experiment comparing two approaches
- Semantic search variant: upfront retrieval (BM25 + embeddings + RRF) then answer
- Agentic search variant: LLM uses tools (searchSemanticEmails, filterEmails, getEmailById)
- Test cases focus on answer correctness, not retrieval quality
- Manual answer inspection (defer LLM-as-judge scorer to next lesson)
- Edge cases expose boundaries: multi-hop queries, filtering needs, thread following, simple facts
- Identify when agents excel (complex multi-step) vs RAG sufficient (simple lookups)
- Experimental mindset: discover approach strengths/weaknesses through systematic comparison

### [08.05 - LLM-as-Judge Scorer](./exercises/08-evals-project-work/08.05-llm-as-judge-scorer/explainer/notes.md) (Explainer)

- Scale lesson 6.4 experiment with automated scoring via LLM-as-judge
- Implement factuality scorer comparing generated vs expected answers (inspired by Braintrust)
- Multiple-choice verdict format: subset (0.4), superset (0.6), exact (1.0), disagreement (0.0), equivalent (1.0)
- Request reasoning before verdict for transparency and accuracy
- Integrate scorer into `evalite.each` from lesson 6.4
- Validate LLM judge decisions via spot-checking 5-10 cases
- Scale test dataset to 20-50 cases now that scoring is automated
- Understand tradeoffs: cost vs scalability, consistency vs human judgment
- Prompt engineering best practices: multiple-choice format, low temperature, clear rubric

## Section 09: Human-in-the-Loop Skill Building

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
