# Creating Synthetic Datasets

Building AI features like memory extraction requires evaluation datasets. Manually creating these doesn't scale. Instead, use LLMs to generate synthetic evaluation datasets.

In this exercise, you'll build a generator that creates realistic conversations for testing memory extraction systems.

## What You'll Build

A generator that produces synthetic conversations across 4 scenario types:

1. **Happy path** - Clear permanent information (obvious YES for memory extraction)
2. **Situational only** - No permanent information (obvious NO)
3. **Edge case mixed** - Mix of permanent and temporary information
4. **Adversarial privacy** - Sensitive data that should NOT be memorized

## Your Tasks

You need to complete 2 TODOs in the prompts for these functions:

### 1. `generatePersona()` - Uses `generateText`

Complete the prompt to generate diverse user personas. The system prompt is provided.

```typescript
prompt: `TODO: Write a prompt that generates a user persona for: ${scenarioType.description}

Include name, occupation, interests, communication preferences, and relevant context.`,
```

### 2. `generateConversation()` - Uses `generateObject`

Complete the prompt to generate realistic multi-turn conversations. The system prompt and schema are provided.

```typescript
prompt: `TODO: Write a prompt that generates a conversation for: ${scenarioType.description}

Use this persona:
${persona}

Use this guidance:
${getScenarioGuidance(scenarioType.type)}`,
```

## Key Learning

- **When to use `generateText`**: Simple text output (persona descriptions)
- **When to use `generateObject`**: Structured data (conversation with turns array)
- **Prompt engineering**: Writing prompts that produce varied, realistic synthetic data

## Output Format

```json
{
  "conversations": [
    {
      "conversationId": "conv-1",
      "scenarioType": "happy-path",
      "persona": "Sarah Chen is a 32-year-old software engineer...",
      "turns": [
        { "role": "user", "content": "..." },
        { "role": "assistant", "content": "..." }
      ]
    }
  ]
}
```

The generator creates 12 conversations (3 per scenario type) and outputs to `synthetic-conversations.json`.

## Steps

- [ ] Complete the `generatePersona()` prompt to create diverse, realistic personas
- [ ] Complete the `generateConversation()` prompt to generate natural conversations where users organically reveal information
- [ ] Run the script and inspect the output quality
- [ ] Verify variety across scenario types
