# Section 05: Evals Skill Building - Learning Goals

## [05.01 - Evaluating Tool Call Agents](./05.01-evaluating-tool-call-agents/explainer/readme.md) (Explainer)

- Test LLM tool calling behavior using Evalite framework
- Inspect `toolCalls` array to verify expected tool invocation
- Binary scoring pattern: 1 for success, 0 for failure
- Extend evaluations to validate tool parameters and execution results
- Foundation for systematic agent testing

## [05.02 - Creating Synthetic Datasets](./05.02-creating-synthetic-datasets/problem/readme.md) (Problem)

- Generate realistic evaluation datasets using LLMs to scale testing
- Use `generateText` for simple output (persona descriptions)
- Use `generateObject` for structured data (conversation turns)
- Create 4 scenario types: happy path, situational only, edge case mixed, adversarial privacy
- Prompt engineering for diverse, realistic synthetic data generation
- Output 12 conversations (3 per scenario) to test memory extraction systems

## [05.03 - Langfuse Observability & Datasets](./05.03-langfuse-observability-and-datasets/explainer/readme.md) (Explainer)

- Bridge production monitoring to systematic evaluation workflow
- Enable OpenTelemetry tracing with `experimental_telemetry: { isEnabled: true }`
- Group multi-turn conversations using `sessionId` for session tracking
- Wrap handlers with `observe()` decorator to create Langfuse traces
- Convert production traces to datasets with ground truth annotations
- Iterative improvement loop: monitor → dataset → eval → fix → repeat
- Export Langfuse datasets for Evalite evaluation runs
- Track performance over time and link eval failures to production traces
