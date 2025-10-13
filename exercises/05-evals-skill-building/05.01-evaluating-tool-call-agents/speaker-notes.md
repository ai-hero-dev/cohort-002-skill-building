# Evaluating Tool Call Agents

## Explainer

### Intro

- Testing tool calling = foundation of reliable agent systems
- Without evals: don't know if LLM calling correct tools, with correct params
- Evalite framework: systematic testing of LLM behavior
- Binary scoring pattern: 1 for success, 0 for failure
- Real world use: catch regressions when changing prompts/models, quantify accuracy

### Understanding Tool Call Evaluation

#### Basic Pattern

- `generateText` returns `toolCalls` array containing all tool invocations
- Each tool call has `toolName`, `args`, execution result
- Simplest eval: check if expected tool exists in array
- Use `.some()` to search for tool by name
- See [`readme.md`](./readme.md) lines 7-46 for complete pattern

#### Evalite Structure

- `data` array: test cases with input + expected tool
- `task` function: runs LLM with tools, returns result
- `scorers` array: functions that inspect output, return score
- Score 1 = success, score 0 = failure
- Binary scoring enables pass/fail metrics

### Extending Beyond Basic Checks

#### Validating Tool Parameters

- Check not just tool name but also `args` object
- Verify location param matches expected value
- Example: `call.args.location === input.expectedLocation`
- Catches incorrect tool usage

#### Validating Execution Results

- Tool calls contain execution output in result
- Can verify tool executed correctly
- Example: check weather result contains expected format
- Full integration test of tool pipeline

### Steps To Complete

- Review basic tool call evaluation pattern in [`readme.md`](./readme.md)
- Understand `toolCalls` array structure
- See how scorer uses `.some()` to check tool existence
- Consider extensions: parameter validation, result validation
- Foundation for next lesson: creating synthetic test datasets

### Next Up

Generating synthetic eval datasets at scale - using LLMs to create realistic test cases covering diverse scenarios.
