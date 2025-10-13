# Evaluating Memory Extraction

## Intro

### Why Test Memory Extraction

- Memory extraction critical to assistant quality - wrong memories = broken UX
- Regressions invisible without testing - prompt changes break silently
- Need quantifiable accuracy before production
- Foundation for scaling tests with synthetic data (06.02)

### What We're Building

- Evalite test suite for `extractMemories()` function from project
- 5 manual test cases covering key scenarios
- Binary scorer: was memory created when expected?
- Length scorer: prevent overly long memories (>500 chars)
- Baseline before synthetic dataset generation

## Steps To Complete

### Phase 1: Setup Test Structure

[`main.ts`](/home/mattpocock/repos/ai/personal-assistant-in-typescript/exercises/06-evals-project-work/06.01-evaluating-memory-tool/explainer/main.ts)

- Import `extractMemories()` from project repo (refactored in 04.03)
- Define `TestCase` type: messages + existingMemories + expectedMemoryCreated
- Evalite structure: data array, task function, scorers array
- Task calls extraction, returns operations object

### Phase 2: Create Manual Test Cases

[`main.ts`](/home/mattpocock/repos/ai/personal-assistant-in-typescript/exercises/06-evals-project-work/06.01-evaluating-memory-tool/explainer/main.ts)

- 5 scenarios: casual chat, personal info, contradiction, mixed content, multiple facts
- Casual chat: no permanent info → expect no memory
- Personal info: "favorite drink is coffee" → expect memory
- Contradiction: "prefer tea over coffee" with existing coffee memory → expect update
- Mixed: "I work as engineer. Weather nice today" → extract occupation, skip weather
- Multiple facts: "dog named Max, live Seattle, love hiking" → batch into memories
- Keep conversations short (2-4 turns) for debuggability
- `expectedMemoryCreated` checks if ANY operation happened (add/update/delete)

### Phase 3: Add Binary Scorer

[`main.ts`](/home/mattpocock/repos/ai/personal-assistant-in-typescript/exercises/06-evals-project-work/06.01-evaluating-memory-tool/explainer/main.ts)

- Check if any operation happened: additions/updates/deletions arrays
- Compare with expected behavior: `memoryCreated === input.expectedMemoryCreated`
- Binary scoring: 1 for correct, 0 for incorrect
- Catches over-extraction (memories from casual chat) and under-extraction (missing permanent info)

### Phase 4: Add Length Scorer

[`main.ts`](/home/mattpocock/repos/ai/personal-assistant-in-typescript/exercises/06-evals-project-work/06.01-evaluating-memory-tool/explainer/main.ts)

- Threshold: 500 chars (adjust based on needs)
- Check all additions and updates content length
- Score 0 if any memory exceeds threshold
- Prevents bloat, token waste, overly detailed memories
- Complementary to binary scorer - different quality dimension

### Phase 5: Run and Analyze

- Execute: `pnpm evalite main.ts`
- Review failures - adjust prompts or test expectations
- Length scorer identifies verbose extraction
- Binary scorer catches major functional issues
- 5 manual cases validate basic behavior before scaling

## Key Concepts

### Testing Philosophy

- Test mechanism quality, not agent behavior
- Focus on `extractMemories()` function in isolation
- Manual cases for foundation, synthetic for scale (06.02)
- Two scorers = complementary perspectives (correctness + quality)

### Scorer Design Patterns

- Binary: simple pass/fail for major failures
- Threshold-based: enforce constraints (length, count, etc)
- Could extend: LLM-as-judge for content quality (defer to 06.05)
- Start simple, add complexity as needed

### Integration with Project

- Imports from project repo - real production code
- Test cases mirror real user conversations
- Validates 04.03 automatic extraction implementation
- Catches regressions during prompt tuning

## Next Up

- 06.02: Generate synthetic dataset (32+ cases) for scale testing
- 06.03: Apply same eval approach to retrieval algorithms
- Synthetic generation eliminates manual test case creation bottleneck
