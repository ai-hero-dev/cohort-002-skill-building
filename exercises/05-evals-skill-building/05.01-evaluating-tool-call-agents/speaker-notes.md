# Evaluating Tool Call Agents

## Problem

### Intro

- Built agent systems with tools - but how verify they work correctly?
- Manual testing doesn't scale - need systematic approach
- Evalite framework lets you test LLM behavior automatically
- Start simple: verify LLM calls expected tool
- Foundation for all future testing (memory extraction, retrieval quality, agent behavior)
- Real-world value: catch regressions when changing prompts, models, or tools

### Steps To Complete

#### Phase 1: Setup Tools and Test Data

[`problem/main.ts`](./problem/main.ts)

- Two fake tools provided: `getWeather` and `calculator`
- Fake tools return mock data - don't need real APIs for testing
- Test data array: 3 cases covering different scenarios
  - Weather query → expect `getWeather` tool
  - Math query → expect `calculator` tool
  - Casual greeting → expect `null` (no tool)
- Testing negative cases (no tool needed) crucial - prevents over-calling
- `expectedTool` field: what we expect LLM to call

#### Phase 2: Implement Task Function

[`problem/main.ts`](./problem/main.ts)

- Task receives test input, returns result for scoring
- Use `generateText` not `streamText` - evals need synchronous results
- Pass model: `google('gemini-2.0-flash-001')`
- Pass `input` as prompt
- Pass both tools in `tools` object
- LLM decides which tool (if any) to call based on prompt
- Return full `GenerateTextResult` - contains `toolCalls` array

#### Phase 3: Implement Tool Call Scorer

[`problem/main.ts`](./problem/main.ts)

- Scorer receives `input` (test case) and `output` (task result)
- `output.toolCalls` is array of all tool invocations
- Use `.some()` to check if expected tool exists: `call.toolName === input.expectedTool`
- Handle null case: when `expectedTool` is `null`, verify array empty
- Score logic: if expected matches actual → 1, otherwise → 0
- Binary scoring common pattern for tool call validation
- Return object with `name` and `score`

#### Phase 4: Run Evaluation

```bash
pnpm evalite main.ts
```

- Terminal output shows pass/fail per test case
- Scores aggregate across all tests
- Should see 3/3 passing if implementation correct
- If any fail, inspect which tool was called vs expected

#### Phase 5: Optional Extension - Parameter Validation

[`problem/main.ts`](./problem/main.ts)

- Beyond checking tool name, validate parameters
- Add second scorer: "Params Valid"
- Skip validation if `expectedTool` is null (return score 1)
- Find tool call: `output.toolCalls.find(c => c.toolName === input.expectedTool)`
- If not found, return score 0
- Access parameters via `call.args` object
- For weather: check `args.location` is string
- For calculator: check `args.operation`, `args.a`, `args.b` present
- Can go deeper: validate extracted values match prompt intent

## Solution

### Steps To Complete

#### Phase 1: Complete Task Function

[`solution/main.ts`](./solution/main.ts)

- Fill in `generateText` call
- Model: `google('gemini-2.0-flash-001')`
- Prompt: `input` (from test case)
- Tools: `{ getWeather, calculator }` (both provided)
- Return result directly - contains `toolCalls` array

#### Phase 2: Complete Basic Scorer

[`solution/main.ts`](./solution/main.ts)

- Check if expected tool called: `output.toolCalls.some(call => call.toolName === input.expectedTool)`
- Handle null case: if `input.expectedTool === null`, flip logic
- When null expected: `score = output.toolCalls.length === 0 ? 1 : 0`
- When tool expected: `score = toolWasCalled ? 1 : 0`
- Can simplify: `score = input.expectedTool === null ? (output.toolCalls.length === 0 ? 1 : 0) : (toolWasCalled ? 1 : 0)`

#### Phase 3: Optional Parameter Scorer

[`solution/main.ts`](./solution/main.ts)

- Return early if no tool expected: `if (!input.expectedTool) return { name: 'Params Valid', score: 1 }`
- Find tool call: `output.toolCalls.find(c => c.toolName === input.expectedTool)`
- If not found, score 0
- Check `call.args` has required fields
- Weather: `typeof call.args.location === 'string'`
- Calculator: `call.args.operation && typeof call.args.a === 'number' && typeof call.args.b === 'number'`

#### Phase 4: Run and Verify

```bash
pnpm evalite main.ts
```

- Should see 3/3 passing for basic scorer
- With param scorer: 3/3 passing if params extracted correctly
- Framework for testing any tool-based agent behavior
- Key concepts: `toolCalls` array, `toolName`, `args` object
- Binary scoring: 1 correct, 0 wrong

### Next Up

Next lesson: generating synthetic test datasets with LLMs. Manual test cases don't scale - learn how to use LLMs to create hundreds of realistic test scenarios automatically.
