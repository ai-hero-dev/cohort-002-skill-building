# Creating Synthetic Datasets

## Problem

### Intro

- Manual test case creation doesn't scale
- Need 100s of test cases to find edge cases, prompt issues
- LLMs can generate realistic synthetic datasets for testing
- Learn when to use `generateText` (simple) vs `generateObject` (structured)
- Critical for memory extraction evals: need diverse conversation patterns
- Four scenario types test memory system boundaries
  - Happy path: obvious permanent info
  - Situational only: obvious skip
  - Edge case mixed: requires judgment
  - Adversarial privacy: sensitive data rejection
- Generator creates 12 conversations (3 per scenario type)

### Steps To Complete

#### Phase 1: Implement `generatePersona()` prompt

- Located in [`problem/main.ts`](./problem/main.ts#L41-L62)
- Uses `generateText` for unstructured paragraph output
- System prompt already provided
- TODO: Complete user prompt requesting persona attributes
- Request name, occupation, interests, communication style, relevant context
- Emphasize realism over stereotypes
- For privacy scenarios, create natural contexts where sensitive info slips out
- Output: natural paragraph, not structured data

#### Phase 2: Implement `generateConversation()` prompt

- Located in [`problem/main.ts`](./problem/main.ts#L64-L92)
- Uses `generateObject` with predefined Zod schema
- System prompt already provided
- TODO: Complete user prompt incorporating persona + scenario guidance
- Request 4-6 alternating user/assistant turns
- Information should emerge organically, not forcefully
- Natural dialogue patterns, realistic phrasing
- Schema enforces structure: `{ turns: Array<{ role, content }> }`

#### Phase 3: Run and validate output

- Run: `pnpm tsx problem/main.ts`
- Check `synthetic-conversations.json` for:
  - 12 conversations (3 per scenario)
  - Persona variety (ages, occupations, contexts)
  - Natural conversation flow
  - Scenario coverage correct
- Iterate prompts if output too generic/unrealistic
- Verify privacy scenarios include realistic sensitive data patterns

## Solution

### Steps To Complete

#### Phase 1: `generatePersona()` prompt

- Solution in [`solution/main.ts`](./solution/main.ts#L48-L62)
- Prompt structure:
  - "Generate a user persona description for this scenario: {description}"
  - Explicit request for attributes: name, occupation, interests, communication preferences, context
  - Request natural paragraph format
- Simple direct prompt, context comes from scenario description

#### Phase 2: `generateConversation()` prompt

- Solution in [`solution/main.ts`](./solution/main.ts#L64-L93)
- Prompt structure:
  - Lead with scenario description
  - Inject persona as labeled section: "USER PERSONA:"
  - Inject scenario guidance as labeled section: "SCENARIO-SPECIFIC GUIDANCE:"
  - Close with action request: "Generate the conversation turns:"
- Structured prompt with clear sections
- Dynamic context injection via persona + guidance
- Schema handles type safety automatically

#### Phase 3: Key distinctions

- `generateText` use case: simple unstructured output (persona descriptions)
- `generateObject` use case: structured data with defined shape (conversation turns)
- Prompt engineering: inject dynamic context, request specific attributes, emphasize naturalness
- Scenario guidance provides fine-tuned control per type
- Generator cycles through scenarios to ensure distribution

### Next Up

- Now have synthetic dataset to test memory extraction
- Next: Build evals using this dataset to quantify memory system accuracy
- Discover which scenarios your memory extraction handles poorly
