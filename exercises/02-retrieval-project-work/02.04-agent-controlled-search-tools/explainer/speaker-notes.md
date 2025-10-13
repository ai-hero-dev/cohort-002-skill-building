# Agent-Controlled Search Tools + Context Engineering

## Intro

- Previous lesson: automatic RAG (retrieve → answer)
- This lesson: agent decides what/when/how to search
- Real-world benefit: agents choose optimal strategy per query
- Agent controls: semantic vs filter, metadata vs full content, result limits, sender/keyword filters
- Bonus: Anthropic prompt template for structured system prompts

## Core Concepts

### Agent vs Automatic RAG

- Automatic: always same search path (query rewrite → embed → BM25 → RRF → rerank → answer)
- Agent: evaluates query → picks tools → composes multi-step workflows
- Agent patterns: metadata scan → targeted fetch, filter → semantic refine, thread following
- Trade: latency/cost for flexibility/accuracy

### Tool Architecture

Three tools replace automatic pipeline:

**searchSemanticEmails**
- Encapsulates lesson 2.3 full pipeline (BM25 + embeddings + RRF + reranking)
- Query rewriting inside tool
- Returns metadata only (id/subject/from/to/timestamp)
- Use: broad conceptual queries ("vacation plans", "project updates")

**filterEmails**
- Traditional filtering: `from`, `contains` params
- `contentLevel` union: `subjectOnly` (metadata), `fullContent` (with body), `fullThread` (entire thread)
- No embeddings/reranking - direct filtering
- Use: precise filtering by known attributes (sender, keywords)

**getEmailById**
- Targeted retrieval after metadata scan
- `includeThread` option fetches related emails via `threadId`
- Pattern: scan → identify → fetch
- Use: get full content after metadata preview

### Multi-Tool Workflows

Enable agent chaining via `stopWhen: stepCountIs(5)`

Common patterns:
1. Semantic search → identify candidates → getEmailById for details
2. Filter with subjectOnly → scan → getEmailById for relevant ones
3. Filter with fullThread → get conversation at once
4. Multi-step: semantic → filter results → fetch specific

### Context Engineering

Anthropic prompt template structure:

```
<task-context>
Role and capabilities
</task-context>

<background-data>
Email schema, data structure
</background-data>

<rules>
When to use each tool
Search strategy guidance
Citation requirements
</rules>

<the-ask>
Help user search emails
</the-ask>
```

Why it works:
- LLMs have beginning/end bias - template exploits this
- Clear rules guide tool selection
- Background data provides schema understanding
- Scales to complex agents

## Implementation Walkthrough

### Phase 1: Convert to Tool-Based Agent

[Show main streaming setup]

- Replace automatic search with `tools` object
- Add `stopWhen: stepCountIs(5)` for multi-step
- Agent decides which tools to call

### Phase 2: Build searchSemanticEmails Tool

[Show tool definition with description, schema, execute]

- Description guides agent: "use for broad conceptual searches"
- Query rewriting via generateObject (keywords + searchQuery)
- Runs full pipeline from lesson 2.3
- Returns metadata only - forces follow-up with getEmailById

### Phase 3: Build filterEmails Tool

[Show contentLevel enum and filtering logic]

- `contentLevel` union provides granular control
- `subjectOnly` - minimal tokens
- `fullContent` - body included
- `fullThread` - entire conversation via threadId matching
- No AI - pure filtering

### Phase 4: Build getEmailById Tool

[Show targeted retrieval with includeThread option]

- Fetch after metadata scan
- Optional thread inclusion
- Error handling for missing IDs

### Phase 5: Apply Prompt Template

[Show getSystemPrompt function]

- Task context: role definition
- Background data: email schema
- Rules: tool selection strategy
- The ask: clear instruction
- Template improves tool selection accuracy

## Demo Queries

Show agent decision-making:

1. "Find emails about project deadlines" → searchSemanticEmails
2. "Show all emails from sarah@example.com" → filterEmails with `from`
3. "What did John say about the budget?" → semantic → getEmailById
4. "Show the full thread about vacation planning" → filter with fullThread

## Next Up

Agent controls search, but still loads all memories upfront. Next section: memory systems that scale - creation, updates, semantic recall.
