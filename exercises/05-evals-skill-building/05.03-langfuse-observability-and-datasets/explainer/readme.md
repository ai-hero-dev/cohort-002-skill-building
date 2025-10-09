# Langfuse Observability & Datasets

Langfuse = open-source LLM observability platform. Provides traces, sessions, datasets, and evaluations. Bridges production monitoring → systematic evaluation workflow.

## Why Observability for Evals?

Previous exercises: synthetic datasets + manual test cases. Real-world approach: capture production conversations → curate into datasets → run evals.

Benefits:
- Find edge cases from actual usage
- Track performance over time
- Link eval failures back to production traces
- Collaborate on test data with team

## Setup Langfuse

### 1. Install Dependencies

```bash
pnpm add @langfuse/otel @langfuse/tracing @opentelemetry/sdk-trace-node
```

### 2. Create Instrumentation File

Create `instrumentation.ts` at project root:

```typescript
import { LangfuseSpanProcessor } from "@langfuse/otel";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

export const langfuseSpanProcessor = new LangfuseSpanProcessor();

const tracerProvider = new NodeTracerProvider({
  spanProcessors: [langfuseSpanProcessor],
});

tracerProvider.register();
```

### 3. Environment Variables

Add to `.env`:

```bash
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_HOST=https://cloud.langfuse.com # or self-hosted URL
```

Get keys from Langfuse dashboard (Settings → API Keys).

### 4. Enable Telemetry in AI SDK

In your route handler (e.g., `api/chat.ts`):

```typescript
import { observe, updateActiveObservation } from "@langfuse/tracing";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

const handler = async (req: Request) => {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-2.0-flash-001'),
    messages,
    experimental_telemetry: {
      isEnabled: true, // Enable OpenTelemetry tracing
    },
    onFinish: async (result) => {
      // Optional: add custom metadata to trace
      updateActiveObservation({
        output: result.text,
        metadata: { messageCount: messages.length },
      });
    },
  });

  return result.toDataStreamResponse();
};

// Wrap handler with observe() to create Langfuse trace
export const POST = observe(handler);
```

Key changes:
- `experimental_telemetry: { isEnabled: true }` → sends spans to Langfuse
- `observe(handler)` → wraps function in Langfuse trace
- `updateActiveObservation()` → add custom metadata (optional)

## Trace Conversations with Sessions

Sessions = group multiple traces into single conversation/thread.

### Add Session ID

```typescript
import { observe } from "@langfuse/tracing";

const handler = async (req: Request) => {
  const { messages, sessionId } = await req.json(); // Get sessionId from client

  const result = streamText({
    model: google('gemini-2.0-flash-001'),
    messages,
    experimental_telemetry: {
      isEnabled: true,
      metadata: {
        sessionId, // Pass sessionId as metadata
      },
    },
  });

  return result.toDataStreamResponse();
};

export const POST = observe(handler, {
  sessionId: async (req: Request) => {
    const { sessionId } = await req.json();
    return sessionId; // Extract sessionId for Langfuse
  },
});
```

Frontend: generate stable `sessionId` per conversation (e.g., UUID stored in localStorage).

### View Sessions in Langfuse

1. Open Langfuse dashboard
2. Navigate to **Sessions** tab
3. See all traces grouped by `sessionId`
4. Click session → view full conversation replay

## Convert Traces to Datasets

Workflow: production trace → dataset item → evaluation

### 1. Find Interesting Traces

In Langfuse UI, filter for:
- **Errors/failures**: model hallucinations, tool call mistakes
- **Edge cases**: unusual user inputs, ambiguous requests
- **Good examples**: ideal behavior to preserve

### 2. Create Dataset from Trace

**Option A: Via UI**

1. Open trace in Langfuse
2. Click **Add to Dataset** button
3. Select existing dataset or create new one
4. Add **expected output** as ground truth:
   - For memory extraction: expected memories
   - For tool calling: expected tool + params
   - For text generation: ideal response

**Option B: Via SDK**

```typescript
import { LangfuseClient } from "@langfuse/client";

const langfuse = new LangfuseClient();

// Create dataset
await langfuse.dataset.create({
  name: "memory-extraction-examples",
  description: "Curated conversations for memory extraction eval",
});

// Add item from trace
await langfuse.dataset.createItem({
  datasetName: "memory-extraction-examples",
  input: {
    messages: [...], // Conversation history
  },
  expectedOutput: {
    memories: [
      "User works as software engineer",
      "User prefers concise explanations",
    ],
  },
  metadata: {
    sourceTraceId: "trace-abc123", // Link back to production trace
  },
});
```

### 3. Annotate with Ground Truth

Critical step: add expected outputs by:
- Manual review: domain expert labels correct answer
- Consensus: multiple reviewers agree on expected output
- Synthetic: use stronger model (e.g., GPT-4) to generate ground truth

Example for memory extraction:
```json
{
  "input": {
    "messages": [
      {"role": "user", "content": "I'm a software engineer in SF"},
      {"role": "assistant", "content": "Nice! What do you work on?"}
    ]
  },
  "expectedOutput": {
    "memories": [
      "User works as software engineer",
      "User lives in San Francisco"
    ]
  }
}
```

## Use Datasets for Evaluation

### Export Dataset for Evalite

Langfuse datasets → export as JSON → use with Evalite.

```typescript
import { LangfuseClient } from "@langfuse/client";
import { writeFileSync } from "fs";

const langfuse = new LangfuseClient();

// Fetch dataset items
const dataset = await langfuse.dataset.get("memory-extraction-examples");
const items = await dataset.getItems();

// Transform to Evalite format
const evalData = items.map((item) => ({
  input: item.input,
  expected: item.expectedOutput,
  metadata: item.metadata,
}));

writeFileSync("dataset-from-langfuse.json", JSON.stringify(evalData, null, 2));
```

### Run Evalite with Dataset

```typescript
import { evaluate } from "evalite";
import dataset from "./dataset-from-langfuse.json";

evaluate({
  data: async () => dataset,
  task: async (input) => {
    // Run your memory extraction logic
    const result = await extractMemories(input.messages);
    return result;
  },
  scorers: [
    (input, output) => {
      // Check if expected memories were extracted
      const expectedMemories = input.expected.memories;
      const extractedMemories = output.memories;

      const recall = expectedMemories.filter((expected) =>
        extractedMemories.some((extracted) =>
          extracted.toLowerCase().includes(expected.toLowerCase())
        )
      ).length / expectedMemories.length;

      return {
        name: "Memory Recall",
        score: recall,
      };
    },
  ],
});
```

### Iterative Improvement Loop

1. **Monitor production** → identify failures in Langfuse
2. **Add to dataset** → convert failing traces to test cases
3. **Run evals** → measure performance on dataset
4. **Fix issues** → improve prompts, logic, or model
5. **Re-run evals** → verify improvements
6. **Repeat** → continuous quality improvement

## Key Patterns

### Pattern 1: Session Tracking

Always use `sessionId` for multi-turn conversations:
- Enables conversation-level analysis
- Groups related traces together
- Simplifies debugging

### Pattern 2: Metadata Enrichment

Add custom metadata to traces:
```typescript
updateActiveObservation({
  metadata: {
    userId: "user123",
    feature: "memory-extraction",
    modelVersion: "gemini-2.0-flash-001",
  },
});
```

Benefits:
- Filter traces by feature/user
- Track performance by model version
- Correlate with external metrics

### Pattern 3: Trace → Dataset → Eval

1. **Trace**: Capture production behavior
2. **Dataset**: Curate interesting examples
3. **Eval**: Measure against ground truth
4. **Deploy**: Ship improvements with confidence

### Pattern 4: Public Links for Collaboration

Share specific traces/sessions with team:
1. Open trace in Langfuse
2. Click **Share** → generate public link
3. Share with engineers/product managers
4. Discuss edge cases collaboratively

## Common Pitfalls

### 1. Missing SessionId

Without `sessionId`, multi-turn conversations appear as disconnected traces. Hard to debug conversation-level issues.

**Fix**: Always pass `sessionId` from frontend.

### 2. No Ground Truth

Dataset without expected outputs = no way to evaluate.

**Fix**: Always add ground truth when creating dataset items.

### 3. Overfitting to Dataset

Adding only easy examples → evals don't catch real issues.

**Fix**: Prioritize edge cases, failures, and adversarial examples.

### 4. Stale Datasets

Production behavior changes → old dataset no longer representative.

**Fix**: Regularly refresh dataset with recent traces.

## Advanced: Langfuse Prompts

Store prompts in Langfuse → version control + A/B testing.

```typescript
import { LangfuseClient } from "@langfuse/client";

const langfuse = new LangfuseClient();

// Fetch prompt from Langfuse
const prompt = await langfuse.prompt.get("memory-extraction-system");

const result = streamText({
  model: google('gemini-2.0-flash-001'),
  system: prompt.content, // Use versioned prompt
  messages,
  experimental_telemetry: {
    isEnabled: true,
    metadata: {
      langfusePrompt: prompt.toJSON(), // Link trace to prompt version
    },
  },
});
```

Benefits:
- Change prompts without redeploying code
- A/B test prompt variants
- Track which prompt version generated trace

## Steps To Review

- [ ] Understand why observability matters for evals (trace → dataset workflow)
- [ ] Install Langfuse packages and create `instrumentation.ts`
- [ ] Enable telemetry with `experimental_telemetry: { isEnabled: true }`
- [ ] Wrap route handler with `observe()` decorator
- [ ] Add `sessionId` to group multi-turn conversations
- [ ] View traces and sessions in Langfuse dashboard
- [ ] Convert interesting traces to dataset items via UI
- [ ] Add expected outputs as ground truth
- [ ] Export dataset and run Evalite evaluations
- [ ] Iterate: monitor → dataset → eval → fix → repeat

## Resources

- [Langfuse Docs](https://langfuse.com/docs)
- [Langfuse Vercel AI SDK Integration](https://langfuse.com/integrations/frameworks/vercel-ai-sdk)
- [AI SDK Observability](https://ai-sdk.dev/providers/observability/langfuse)
- [Langfuse Datasets](https://langfuse.com/docs/datasets/overview)
- [Langfuse Sessions](https://langfuse.com/docs/observability/features/sessions)
