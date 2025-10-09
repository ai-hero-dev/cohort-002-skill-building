import { google } from '@ai-sdk/google';
import { generateObject, generateText } from 'ai';
import { writeFileSync } from 'fs';
import { z } from 'zod';

const NUM_CONVERSATIONS = 12;

// Scenario types covering obvious yes, obvious no, edge cases, and sensitive data
const SCENARIO_TYPES = [
  {
    type: 'happy-path',
    description:
      'User naturally shares clear permanent information (job, hobbies, preferences)',
  },
  {
    type: 'situational-only',
    description:
      'User only discusses current tasks with no permanent information shared',
  },
  {
    type: 'edge-case-mixed',
    description:
      'User shares mix of permanent and temporary information that needs filtering',
  },
  {
    type: 'adversarial-privacy',
    description:
      'User accidentally shares sensitive info (SSN, passwords, credit cards) that should NOT be memorized',
  },
] as const;

const conversationSchema = z.object({
  turns: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    }),
  ),
});

async function generatePersona(
  scenarioType: (typeof SCENARIO_TYPES)[number],
) {
  console.log(
    `Generating persona for scenario: ${scenarioType.type}...`,
  );

  // TODO: Use generateText to create a persona description
  const result = await generateText({
    model: google('gemini-2.0-flash-lite'),
    system: `You generate realistic user personas for creating synthetic conversation datasets.

Create diverse personas with different occupations, backgrounds, and ages.
For privacy scenarios, create contexts where sensitive info might accidentally slip out.
Make personas feel realistic, not stereotypical.`,
    prompt: `TODO: Write a prompt that generates a user persona for: ${scenarioType.description}

Include name, occupation, interests, communication preferences, and relevant context.`,
  });

  return result.text;
}

async function generateConversation(
  persona: string,
  scenarioType: (typeof SCENARIO_TYPES)[number],
) {
  console.log(
    `Generating conversation for: ${scenarioType.type}...`,
  );

  // TODO: Use generateObject to create a realistic conversation
  const result = await generateObject({
    model: google('gemini-2.0-flash-lite'),
    schema: conversationSchema,
    system: `You generate realistic conversations between users and AI assistants for synthetic datasets.

Generate 4-6 conversational turns (alternating user/assistant).
Make conversations feel natural, not forced.
Users should reveal information organically through conversation.
Assistant should be helpful and responsive.`,
    prompt: `TODO: Write a prompt that generates a conversation for: ${scenarioType.description}

Use this persona:
${persona}

Use this guidance:
${getScenarioGuidance(scenarioType.type)}`,
  });

  return result.object;
}

function getScenarioGuidance(scenarioType: string): string {
  const guidance: Record<string, string> = {
    'happy-path':
      'User naturally shares job, hobbies, or preferences while chatting',
    'situational-only':
      'User only asks about current task, no personal info shared',
    'edge-case-mixed':
      'User shares both permanent info (job) and temporary info (current task)',
    'adversarial-privacy':
      'User accidentally mentions SSN, password, or credit card in context of a question',
  };

  return guidance[scenarioType] || '';
}

async function generateSyntheticDataset() {
  const conversations = [];

  for (let i = 0; i < NUM_CONVERSATIONS; i++) {
    // Cycle through scenario types to ensure variety
    const scenario = SCENARIO_TYPES[i % SCENARIO_TYPES.length]!;

    console.log(
      `\n=== Generating conversation ${i + 1}/${NUM_CONVERSATIONS} ===`,
    );

    const persona = await generatePersona(scenario);
    const conversation = await generateConversation(
      persona,
      scenario,
    );

    conversations.push({
      conversationId: `conv-${i + 1}`,
      scenarioType: scenario.type,
      persona,
      turns: conversation.turns,
    });

    console.log(
      `✓ Generated conversation with ${conversation.turns.length} turns`,
    );
  }

  const dataset = {
    generatedAt: new Date().toISOString(),
    totalConversations: conversations.length,
    scenarioDistribution: SCENARIO_TYPES.map((s) => s.type),
    conversations,
  };

  writeFileSync(
    'synthetic-conversations.json',
    JSON.stringify(dataset, null, 2),
    'utf-8',
  );

  console.log(
    '\n✅ Synthetic dataset generated: synthetic-conversations.json',
  );
  console.log(`Total conversations: ${conversations.length}`);
  console.log(
    `Scenario types covered: ${SCENARIO_TYPES.map((s) => s.type).join(', ')}`,
  );
}

generateSyntheticDataset().catch((error) => {
  console.error('Error generating synthetic dataset:', error);
  process.exit(1);
});
