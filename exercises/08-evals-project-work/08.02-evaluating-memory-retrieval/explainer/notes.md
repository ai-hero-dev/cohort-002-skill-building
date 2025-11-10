# Creating Memory Tool Evaluation Dataset

## Learning Goals

Generate synthetic test cases for memory extraction using LLMs. Separate dataset generation from evaluation. Scale from 5 manual cases (6.1) to 32 synthetic cases across 4 operation types. Reusable generator with operation-specific prompts.

## Steps To Complete

### 1. Setup Generator Schema

Define test case structure for generation.

**Implementation (`generate-dataset.ts`):**

```ts
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { writeFileSync } from 'fs';
import { z } from 'zod';

const testCaseSchema = z.object({
  testCases: z.array(
    z.object({
      name: z.string(),
      messages: z.array(
        z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        }),
      ),
      existingMemories: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          content: z.string(),
        }),
      ),
      expectedOperations: z.object({
        shouldCreate: z.boolean(),
        shouldUpdate: z.boolean(),
        shouldDelete: z.boolean(),
      }),
    }),
  ),
});
```

**Notes:**

- Schema includes conversation + context + expectations
- `expectedOperations` flags guide scorer validation
- Existing memories needed for update/delete scenarios

### 2. Build Reusable Generator Function

Generate operation-specific test cases.

**Implementation:**

```ts
async function generateMemoryTestCases(
  operationType: 'create' | 'update' | 'delete' | 'no-action',
  count: number = 8,
) {
  const prompts = {
    create: `Generate ${count} test cases where user shares NEW permanent information that should be memorized. Examples: job, hobbies, preferences, facts about themselves. Include 2-4 conversation turns per case.`,

    update: `Generate ${count} test cases where user CONTRADICTS or REFINES existing memory. User must reference something already known, then correct/update it. Provide realistic existing memories. Include 2-4 turns.`,

    delete: `Generate ${count} test cases where user explicitly asks to FORGET something or says information no longer relevant. Provide existing memory that should be deleted. Include 2-4 turns.`,

    'no-action': `Generate ${count} test cases with casual conversation containing NO permanent information. Examples: weather, current tasks, general questions, situational chat. No memory operations needed. Include 2-4 turns.`,
  };

  const result = await generateObject({
    model: google('gemini-2.0-flash-lite'),
    schema: testCaseSchema,
    system: `Generate realistic test cases for memory extraction system.

Make conversations natural and varied.
For update/delete cases, provide plausible existing memories.
Set expectedOperations flags correctly based on scenario.`,
    prompt: prompts[operationType],
  });

  return result.object.testCases;
}
```

**Notes:**

- Operation-specific prompts for targeted generation
- Update/delete require existing memories in context
- 2-4 turns keeps cases focused, debuggable
- `expectedOperations` flags set by generator for validation

### 3. Generate Dataset File

Create JSON with all 4 operation types.

**Implementation:**

```ts
console.log('Generating memory test dataset...\n');

const dataset = {
  create: await generateMemoryTestCases('create', 8),
  update: await generateMemoryTestCases('update', 8),
  delete: await generateMemoryTestCases('delete', 8),
  noAction: await generateMemoryTestCases('no-action', 8),
};

writeFileSync(
  'memory-test-cases.json',
  JSON.stringify(dataset, null, 2),
);

console.log('✅ Generated memory-test-cases.json');
console.log(
  `Total test cases: ${
    dataset.create.length +
    dataset.update.length +
    dataset.delete.length +
    dataset.noAction.length
  }`,
);
```

**Running:**

```bash
pnpm tsx generate-dataset.ts
```

**Notes:**

- Run once to create fixed dataset
- 32 total cases (8 per operation)
- JSON enables version control, sharing
- Edit dataset manually as needed, re-run generator with a tweaked prompt or update the schema

### 4. Build Evaluation File

Load dataset, define 4 eval suites.

**Implementation (`main.ts`):**

```ts
import { evalite } from 'evalite';
import { readFileSync } from 'fs';
import { extractMemories } from '../../../../ai-personal-assistant/src/lib/extract-memories';

const dataset = JSON.parse(
  readFileSync('memory-test-cases.json', 'utf-8'),
);

evalite('Memory Extraction - Create', {
  data: dataset.create,
  task: async (input) => {
    return await extractMemories({
      messages: input.messages,
      existingMemories: input.existingMemories,
    });
  },
  scorers: [
    (input, output) => {
      const created = output.additions.length > 0;
      return {
        name: 'Should Create',
        score:
          created === input.expectedOperations.shouldCreate
            ? 1
            : 0,
      };
    },
  ],
});

evalite('Memory Extraction - Update', {
  data: dataset.update,
  task: async (input) => {
    return await extractMemories({
      messages: input.messages,
      existingMemories: input.existingMemories,
    });
  },
  scorers: [
    (input, output) => {
      const updated = output.updates.length > 0;
      return {
        name: 'Should Update',
        score:
          updated === input.expectedOperations.shouldUpdate
            ? 1
            : 0,
      };
    },
  ],
});

evalite('Memory Extraction - Delete', {
  data: dataset.delete,
  task: async (input) => {
    return await extractMemories({
      messages: input.messages,
      existingMemories: input.existingMemories,
    });
  },
  scorers: [
    (input, output) => {
      const deleted = output.deletions.length > 0;
      return {
        name: 'Should Delete',
        score:
          deleted === input.expectedOperations.shouldDelete
            ? 1
            : 0,
      };
    },
  ],
});

evalite('Memory Extraction - No Action', {
  data: dataset.noAction,
  task: async (input) => {
    return await extractMemories({
      messages: input.messages,
      existingMemories: input.existingMemories,
    });
  },
  scorers: [
    (input, output) => {
      const noAction =
        output.additions.length === 0 &&
        output.updates.length === 0 &&
        output.deletions.length === 0;
      return {
        name: 'Should Do Nothing',
        score: noAction ? 1 : 0,
      };
    },
  ],
});
```

**Notes:**

- 4 separate eval suites for focused scoring
- Each scorer validates specific operation type
- Same dataset used across all eval runs
- Binary scoring: 1 if correct, 0 if wrong

### 5. Run Evals and Analyze Results

Execute evals, identify weak operation types.

**Running:**

```bash
pnpm evalite watch
```

**Expected output:**

```
Memory Extraction - Create
✓ Case 1: User shares job
  Should Create: 1
✓ Case 2: User mentions hobby
  Should Create: 1
Average: 1.0

Memory Extraction - Update
✓ Case 1: User corrects preference
  Should Update: 1
✗ Case 2: User refines occupation
  Should Update: 0
Average: 0.5

...
```

**Notes:**

- Low scores indicate operation-specific issues
- Can iterate on prompts, re-run evals with same data
- Compare accuracy across operation types
- Update/delete typically harder than create/no-action

## Additional Notes

**Operation Types:**

- **Create**: New info → additions array
- **Update**: Contradicts existing → updates array
- **Delete**: Explicit forget → deletions array
- **No-action**: Situational chat → all arrays empty

**Scaling from 6.1:**

- 6.1: 5 manual cases covering all operations
- 6.2: 32 synthetic cases (8 per operation)
- Separate suites enable operation-specific analysis
- Identifies which operations need prompt tuning
