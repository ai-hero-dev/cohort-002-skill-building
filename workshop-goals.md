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

- Transform lesson 2.2 search algorithm into agent-controlled `searchSemanticEmails` tool
- Tool accepts separate `keywords` (BM25) and `searchQuery` (embeddings) params matching query rewriter pattern
- Agent autonomously generates both params, calls tool, receives top 10 emails with full content
- Configure `stopWhen: stepCountIs(5)` for multi-step workflows - agent calls tool then processes results
- Apply Anthropic prompt template structure: task context → background data → rules → the ask
- Stream conversational answers based on retrieved context with markdown source citations

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

- Add `@langchain/textsplitters` dependency for chunking utilities
- Chunk emails using `RecursiveCharacterTextSplitter` (1000 char size, 100 overlap)
- Apply BM25 + embeddings + RRF to email chunks instead of full emails
- Use content-based hashing (SHA-256) for embedding cache instead of email IDs
- Track chunk index and total chunks per email for visualization
- Display chunk information (e.g., "Chunk 2 of 5") in search results UI
- Understand when chunking benefits emails: long threads, quoted text, fair context window usage

### [04.02 - Reranking & Chunking in Search Tool](./exercises/04-retrieval-day-2-project-work/04.02-reranking-and-chunking-in-search-tool/explainer/notes.md) (Explainer)

- Integrate reranking step after RRF: pass top 30 chunks to reranker LLM
- Reranker analyzes chunks with IDs, returns only relevant chunk IDs (not full content)
- Pass conversation history to reranker for context-aware filtering
- Filter and map returned IDs back to chunk objects
- Display tool calls in frontend with collapsible UI components
- Return metadata (from/to/subject) in search results for transparency
- Trade latency for improved retrieval precision via LLM-based filtering

### [04.03 - Custom Filter Tools](./exercises/04-retrieval-day-2-project-work/04.03-custom-filter-tools/explainer/notes.md) (Explainer)

- Build `filterEmails` tool for exact criteria filtering (from/to/contains/before/after/limit)
- Partial match, case-insensitive filtering on sender, recipient, text content, timestamps
- System prompt guides agent: use filter for exact criteria, search for semantic queries
- Display both tools in frontend with separate UI components (different parameter displays)
- Extract `EmailResultsGrid` as shared component for displaying email results
- Agent autonomously chooses filter vs search based on query type (e.g., "emails from John" uses filter)

### [04.04 - Metadata-First Retrieval Pattern](./exercises/04-retrieval-day-2-project-work/04.04-metadata-first-retrieval-pattern/explainer/notes.md) (Explainer)

- Modify search/filter tools to return metadata + 150-char snippet only (id/threadId/subject/from/to/timestamp/snippet)
- Build `getEmailsByIds` tool: accepts array of email IDs for targeted full content retrieval
- Add `includeThread` boolean parameter to fetch entire conversation threads by threadId
- When includeThread=true: gather unique threadIds, fetch all emails in those threads, sort by timestamp
- Multi-step workflow: browse subjects/snippets → select relevant IDs → fetch full content → answer
- Token efficiency: avoid loading full bodies until agent confirms relevance from snippets
- Display snippets in grid UI, full emails in expanded detail view with thread context

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

- Scale memory systems with semantic recall instead of loading entire DB
- Handle infinite message threads with working memory via message embeddings
- Learn from previous conversations with episodic memory and outcome tracking
- Build production memory system with cross-conversation context

### [06.01 - Semantic Recall on Memories](./exercises/06-memory-project-work/06.01-semantic-recall-on-memories/explainer/notes.md) (Explainer)

- Automatic memory creation via `onFinish` callback with `generateObject`
- Extract permanent memories (create/update/delete operations) from conversation
- Embed memories at creation time using `embedMemory()` function
- Query rewriting: generate keywords + search query from conversation context
- Retrieve top N most relevant memories via BM25 + embeddings + RRF
- Format and inject retrieved memories into system prompt (not entire DB)
- Scale memory system beyond loading all memories every request
- Foundation for working memory (6.2) and episodic memory (6.3)

### [06.02 - Working Memory via Message Embeddings](./exercises/06-memory-project-work/06.02-working-memory-via-message-embeddings/explainer/notes.md) (Explainer)

- Handle infinite message threads by embedding each message at creation
- Store embeddings alongside messages in chat persistence layer
- Sliding window: Last 10 messages passed directly to LLM for recent context
- Automatic semantic recall: Query rewriter runs on every request
- Retrieve relevant messages beyond sliding window via embeddings search
- Format recalled messages as "Earlier in conversation:" context
- Per-thread scope: working memory cleared when chat ends
- Token efficiency: Avoid loading entire chat history into context window

### [06.03 - Episodic Memory from Conversations](./exercises/06-memory-project-work/06.03-episodic-memory-from-conversations/explainer/notes.md) (Explainer)

- Cross-conversation learning: remember and learn from previous chats
- Auto-extract via `onFinish`: Summarize conversation with learnings/outcomes
- Schema includes: summary, whatWorked, whatDidntWork, chat ID, timestamp, embedding
- Store in separate `episodicMemory.json` collection
- Build `recallConversations` tool: semantic search across episodic memories
- Tool returns both episodic summary AND full chat messages from matched conversations
- Agent can ask: "What have you told me recently about X?" or "What approaches failed before?"
- Outcome tracking: LLM learns what worked and avoids repeating mistakes

## Section 07: Evals Skill Building

**Learning Goals:**

- Test agent behavior systematically with Evalite framework
- Build deterministic scorers for tool call validation
- Compare models and approaches with evalite.each
- Expand test coverage with adversarial inputs
- Implement clarifying questions tool with LLM-as-judge scoring
- Scale agent testing beyond manual verification

### [07.01 - Evaluating Tool Call Agents](./exercises/07-evals-skill-building/07.01-evaluating-tool-call-agents/problem/readme.md) (Explainer)

- Setup Evalite framework for agent with 20+ tools
- Basic eval structure for monitoring tool call behavior
- Inspect `toolCalls` array in streamText results
- Foundation for systematic agent testing
- Multi-tool agent testing patterns

### [07.02 - Deterministic Tool Call Scorer](./exercises/07-evals-skill-building/07.02-deterministic-tool-call-scorer/explainer/readme.md) (Explainer)

- Build scorers to verify correct tool invocation
- Validate tool call parameters match expectations
- Test positive cases (tool should be called) and negative cases (no tool needed)
- Binary scoring pattern: 1 correct, 0 wrong
- Handle multiple tool calls in single response
- Catch tool selection errors systematically

### [07.03 - Evalite.each for A/B Testing](./exercises/07-evals-skill-building/07.03-evalite-each-ab-testing/explainer/readme.md) (Explainer)

- Use evalite.each API to compare variations
- Test multiple models (GPT-4, Claude, Gemini) on same inputs
- Compare different prompt approaches side-by-side
- A/B test system prompts or tool descriptions
- Aggregate scores across model variations
- Identify which configurations perform best

### [07.04 - Adversarial Inputs](./exercises/07-evals-skill-building/07.04-adversarial-inputs/explainer/readme.md) (Explainer)

- Expand test dataset with edge cases
- Ambiguous requests requiring tool choice
- Missing required information scenarios
- Overlapping tool functionality tests
- User requests with conflicting constraints
- Build robust agent behavior under uncertainty

### [07.05 - Clarifying Questions Tool](./exercises/07-evals-skill-building/07.05-clarifying-questions-tool/explainer/readme.md) (Explainer)

- Add `askClarifyingQuestions` tool to agent
- Verify tool called when info missing (not proceeding with guesses)
- Test: ask questions vs incorrectly calling action tools
- Deterministic scorer: correct tool invocation when ambiguous
- Handle scenarios requiring user input before action
- Balance helpfulness vs over-questioning

### [07.06 - LLM Judge for Question Quality](./exercises/07-evals-skill-building/07.06-llm-judge-question-quality/explainer/readme.md) (Explainer)

- Build LLM-as-judge scorer for clarifying questions
- Validate questions are relevant and helpful
- Multiple-choice verdict format for consistency
- Request reasoning before scoring for transparency
- Evaluate question specificity and actionability
- Catch irrelevant or poorly-formed questions

## Section 08: Evals Project Work

**Learning Goals:**

- Evaluate memory extraction accuracy with manual test cases
- Test memory retrieval quality with `search_memories()` function
- Detect hallucinations in end-to-end agentic search system
- Build LLM-as-judge scorer for automated answer quality evaluation

### [08.01 - Evaluating Memory Extraction](./exercises/08-evals-project-work/08.01-evaluating-memory-tool/explainer/notes.md) (Explainer)

- Test memory extraction from conversation history using Evalite framework
- Import `extractMemories()` function from project repo (refactored in 06.03)
- Manual test case creation covering 5-10 scenarios: casual chat, personal info, contradictions, mixed content, multiple facts
- Binary scorer: verify memory created/skipped when expected
- Length scorer: prevent overly long memory content (>500 chars threshold)
- Quantify extraction accuracy, catch regressions when changing prompts/models

### [08.02 - Evaluating Memory Retrieval](./exercises/08-evals-project-work/08.02-evaluating-memory-retrieval/explainer/notes.md) (Explainer)

- Test `search_memories()` function quality using Evalite framework
- Import memory search function from project repo
- Manual test case creation: 8-10 memory queries with expected memory IDs
- Test semantic recall on memory collections (permanent memories from Section 6)
- Graduated position scoring: 1.0 if top result, 0.5 if positions 2-5, 0 otherwise
- Compare query strategies: keywords vs semantic search vs hybrid
- Quantify retrieval precision across diverse memory queries
- Catch regressions when tuning search parameters or ranking algorithms

### [08.03 - Evaluating End-to-End Agent](./exercises/08-evals-project-work/08.03-evaluating-end-to-end-agent/explainer/notes.md) (Explainer)

- Test complete agentic search system built in earlier lessons (Sections 2-4)
- Manual test case creation: 10-15 diverse queries with expected answers
- Use 547-email dataset for comprehensive testing
- Build LLM-as-judge factuality scorer for automated answer evaluation
- Multiple-choice verdict format: subset (0.4), superset (0.6), exact (1.0), disagreement (0.0), equivalent (1.0)
- Detect hallucinations: verify agent doesn't fabricate information
- Request reasoning before verdict for transparency
- Source citation validation: check if agent references retrieved context correctly
- Scale testing with automated evaluation (20-50 cases feasible)
- Identify which question types cause hallucinations or retrieval failures

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
