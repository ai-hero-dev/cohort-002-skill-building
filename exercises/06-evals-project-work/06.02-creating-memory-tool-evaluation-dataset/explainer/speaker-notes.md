# Creating Memory Tool Evaluation Dataset

## Intro

- Previous lesson (6.1): manually wrote 5 test cases for memory extraction
- Manual test creation doesn't scale - hard to cover all edge cases
- LLMs can generate synthetic test data - diverse, realistic scenarios
- Separate generation from evaluation - consistent dataset across runs
- Scale from 5 manual → 32 synthetic cases

## Why This Matters

- Test all memory operation types systematically (create/update/delete/no-action)
- Identify which operations have low accuracy - guides prompt tuning
- Reusable generator function - adjust prompts, regenerate dataset
- Version control dataset - track test evolution over time
- Foundation for continuous testing as memory system evolves

## Phase 1: Build Generator Schema & Function

[`generate-dataset.ts`](/home/mattpocock/repos/ai/personal-assistant-in-typescript/exercises/06-evals-project-work/06.02-creating-memory-tool-evaluation-dataset/explainer/notes.md) (conceptual - not in repo)

- Define test case schema: messages + existingMemories + expectedOperations
- `expectedOperations` flags guide scorers (shouldCreate, shouldUpdate, shouldDelete)
- Reusable `generateMemoryTestCases()` function with operation type param
- Operation-specific prompts:
  - **Create**: new permanent info (job, hobbies, preferences)
  - **Update**: contradicts/refines existing memory
  - **Delete**: explicit forget requests
  - **No-action**: casual chat, situational info only
- Use `generateObject` with Zod schema for structured output
- Generate 8 cases per operation = 32 total

## Phase 2: Generate & Save Dataset

- Run generator once: `pnpm tsx generate-dataset.ts`
- Creates `memory-test-cases.json` with all 4 operation types
- JSON enables version control, manual editing, sharing
- Fixed dataset ensures consistent eval results across runs
- Regenerate with tweaked prompts or schema updates as needed

## Phase 3: Build Evaluation Suites

[`main.ts`](/home/mattpocock/repos/ai/personal-assistant-in-typescript/exercises/06-evals-project-work/06.02-creating-memory-tool-evaluation-dataset/explainer/main.ts)

- Load generated dataset from JSON
- Import `extractMemories()` from project repo (lesson 4.3)
- Define 4 separate evalite suites - one per operation type
- Each suite has operation-specific scorer:
  - Create suite: verify additions.length > 0
  - Update suite: verify updates.length > 0
  - Delete suite: verify deletions.length > 0
  - No-action suite: verify all arrays empty
- Binary scoring: 1 if correct behavior, 0 if wrong
- Run with `pnpm evalite watch`

## Phase 4: Analyze Results

- Compare scores across operation types
- Low scores indicate operation-specific prompt issues
- Example: updates might score 0.5 while creates score 1.0
- Identifies which operations need better prompt engineering
- Can iterate on memory extraction prompts, re-run with same dataset
- Quantifies impact of prompt changes across 32 cases

## Key Patterns

- **Separation of concerns**: generation script vs evaluation script
- **Operation-specific generation**: targeted prompts per memory operation
- **Existing memory context**: update/delete cases need realistic prior memories
- **Binary validation**: simple pass/fail scorers per operation type
- **Consistent testing**: same dataset used for all eval runs

## Next Up

- Lesson 6.3: evaluating retrieval quality with production dataset
- Manual dataset analysis: identify key factual emails
- Test retrieval mechanism, not agent output
- Graduated scoring: position-based relevance
