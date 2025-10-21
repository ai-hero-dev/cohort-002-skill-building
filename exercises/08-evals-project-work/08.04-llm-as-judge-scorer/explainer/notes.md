# LLM-as-Judge Scorer

## Learning Goals

- Scale experiment from lesson 6.4 with automated scoring
- Implement LLM-as-judge pattern for answer evaluation
- Use factuality scoring rubric (inspired by Braintrust)
- Replace manual inspection with systematic automated evaluation
- Understand LLM-as-judge tradeoffs: cost vs scalability

## Steps To Complete

### 1. Create Factuality Scorer Function

Build scorer that compares generated answer to expected answer using LLM.

```typescript
import { generateObject } from "ai"
import { z } from "zod"

const factualityScorer = async (input: {
  question: string
  output: string
  expected: string
}) => {
  const result = await generateObject({
    model: anthropic("claude-3-5-haiku-latest"),
    prompt: `
You are evaluating the factual accuracy of a submitted answer compared to an expert answer.

Question: ${input.question}

Expert Answer: ${input.expected}

Submitted Answer: ${input.output}

Compare the factual content of both answers. Ignore differences in style, grammar, or punctuation.

Select the option that best describes the relationship:
(A) Submitted answer is a subset of expert answer - it's correct but missing some details
(B) Submitted answer is a superset of expert answer - it has all details plus extra correct info
(C) Submitted answer contains exactly the same details as expert answer
(D) There is a factual disagreement between the answers
(E) Answers differ in phrasing but mean the same thing factually
    `,
    schema: z.object({
      reasoning: z.string().describe("Explanation of your evaluation"),
      verdict: z.enum(["A", "B", "C", "D", "E"]),
    })
  })

  // Scoring rubric (inspired by Braintrust)
  const scoreMap = {
    A: 0.4,  // Subset - partially correct
    B: 0.6,  // Superset - correct plus extra
    C: 1.0,  // Exact match
    D: 0.0,  // Disagreement - incorrect
    E: 1.0,  // Same meaning - correct
  }

  return {
    score: scoreMap[result.object.verdict],
    reasoning: result.object.reasoning,
    verdict: result.object.verdict
  }
}
```

**Key design choices:**
- Multiple-choice format gives LLM clear options
- Reasoning field provides transparency
- Graduated scoring: partial credit for subset (0.4), superset (0.6)
- Exact/equivalent answers get full credit (1.0)
- Disagreements get zero (0.0)

### 2. Integrate Scorer into evalite.each

Update lesson 6.4 eval to use automated scorer instead of manual inspection.

```typescript
evalite.each([
  { name: "semantic", variant: "semantic" },
  { name: "agentic", variant: "agentic" }
])("Search Approach Comparison", {
  data: async () => testCases,
  task: async (testCase, { variant }) => {
    if (variant === "semantic") {
      return await semanticSearchVariant(testCase.question)
    }
    return await agenticSearchVariant(testCase.question)
  },
  scorers: [
    async ({ input, output }) => {
      const result = await factualityScorer({
        question: input.question,
        output: output,
        expected: input.expectedAnswer
      })

      return {
        name: "factuality",
        score: result.score,
        metadata: {
          reasoning: result.reasoning,
          verdict: result.verdict
        }
      }
    }
  ]
})
```

**Note:** Scorer runs for each variant output, enabling automated comparison at scale.

### 3. Run Automated Evaluation

Execute eval and review automated scoring results.

```bash
pnpm evalite
```

**Output interpretation:**
- Compare average factuality scores between variants
- Review reasoning metadata for failed cases (score < 0.5)
- Identify patterns: which edge cases each variant handles better
- Scale to larger test datasets (20-50 cases) now that scoring is automated

### 4. Validate LLM-as-Judge Accuracy

Spot-check LLM judge decisions to ensure reliability.

**Validation process:**
1. Pick 5-10 test cases with varying scores
2. Manually review: do you agree with verdict?
3. Check reasoning: does explanation make sense?
4. Identify judge errors: hallucinations, overly strict/lenient scoring
5. Refine prompt if needed

**Common issues:**
- Judge too strict: penalizes paraphrasing (adjust prompt: "ignore phrasing differences")
- Judge too lenient: accepts incorrect info (add examples of disagreements)
- Inconsistent: same answer scored differently (use temperature=0 for consistency)

### 5. Experiment with Test Dataset Size

Now that scoring is automated, scale up experiment.

```typescript
// Generate additional synthetic test cases
const additionalCases = [
  {
    question: "What emails did Jennifer send about property viewings?",
    expectedAnswer: "Multiple emails including Victoria Road property..."
  },
  // Add 20-30 more cases covering:
  // - Date/time queries
  // - Sender/recipient filtering
  // - Multi-hop reasoning
  // - Thread following
  // - Numerical facts (prices, amounts)
]
```

**Scaling benefits:**
- More test cases = better statistical confidence
- Uncover edge cases missed in small dataset
- Quantify performance difference: "Agentic approach scores 0.85 vs semantic 0.72 on multi-hop queries"
- Catch regressions when modifying prompts/models

## Notes

**LLM-as-judge tradeoffs:**
- **Pros**: Scales to 100s of test cases, consistent rubric, no manual labor
- **Cons**: Costs money per eval, can have biases, needs validation
- **Best for**: Factuality, relevance, helpfulness (subjective qualities)
- **Not ideal for**: Exact string matching, structured output validation (use deterministic scorers)

**Factuality rubric philosophy:**
- Subset (0.4): Answer correct but incomplete - better than nothing
- Superset (0.6): Answer correct with bonus details - slightly penalized for verbosity
- Exact/equivalent (1.0): Perfect match - goal state
- Disagreement (0.0): Factually wrong - unacceptable

**When to use LLM-as-judge:**
- Testing conversational AI responses
- Comparing variant performance at scale
- Evaluating open-ended generation quality
- When human evaluation isn't scalable

**Prompt engineering tips:**
- Multiple-choice > free-form (more consistent)
- Request reasoning before verdict (improves accuracy)
- Provide clear rubric in prompt
- Use low temperature (0-0.3) for consistency
- Include few-shot examples for complex cases
