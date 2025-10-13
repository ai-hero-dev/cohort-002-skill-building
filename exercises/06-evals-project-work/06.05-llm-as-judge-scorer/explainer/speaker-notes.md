# LLM-as-Judge Scorer

## Intro

- Lesson 6.4 requires manual answer inspection - doesn't scale
- Need automated scoring to test 20-50+ cases
- LLM-as-judge: use LLM to evaluate LLM outputs
- Enables systematic comparison of semantic vs agentic search at scale
- Trade cost for scalability and consistency

## Steps To Explore

### Phase 1: Build Factuality Scorer

[notes.md](./notes.md#1-create-factuality-scorer-function)

- Import `generateObject` from AI SDK
- Prompt LLM to compare submitted vs expert answer
- Multiple-choice verdict format: subset (A), superset (B), exact (C), disagreement (D), equivalent (E)
- Request reasoning before verdict for transparency, accuracy
- Score mapping: subset 0.4, superset 0.6, exact 1.0, disagreement 0.0, equivalent 1.0
- Rubric inspired by Braintrust factuality scorer
- Multiple-choice more consistent than free-form scoring

### Phase 2: Integrate into Evalite

[notes.md](./notes.md#2-integrate-scorer-into-evaliteeach)

- Update lesson 6.4 eval with factuality scorer
- Scorer runs on each variant output
- Return score + metadata (reasoning, verdict)
- Enables automated variant comparison without manual inspection

### Phase 3: Run and Validate

[notes.md](./notes.md#3-run-automated-evaluation)

- Execute `pnpm evalite` to see automated scores
- Compare average factuality across variants
- Review reasoning metadata for failures (score < 0.5)
- Spot-check 5-10 cases: do you agree with judge?
- Validate judge isn't too strict/lenient
- Temperature 0 for consistency

### Phase 4: Scale Dataset

[notes.md](./notes.md#5-experiment-with-test-dataset-size)

- Manual inspection limited to ~5-10 cases
- Automated scoring enables 20-50+ cases
- Better statistical confidence
- Uncover edge cases, quantify performance gaps
- Catch regressions when changing prompts/models

## Key Concepts

**LLM-as-judge tradeoffs:**
- Pros: scales to 100s cases, consistent rubric, no manual labor
- Cons: costs money per eval, potential biases, needs validation
- Best for: factuality, relevance, helpfulness (subjective)
- Not ideal for: exact string matching, structured validation (use deterministic)

**When to use:**
- Testing conversational AI at scale
- Comparing variants systematically
- Open-ended generation quality
- Human eval not scalable

**Prompt engineering tips:**
- Multiple-choice > free-form
- Request reasoning before verdict
- Clear rubric in prompt
- Low temp (0-0.3) for consistency
- Few-shot examples for complex cases

## Next Up

- Section 07: Human-in-the-Loop
- Manage risk of destructive actions
- Balance autonomy vs oversight
- Action approval workflows before execution
