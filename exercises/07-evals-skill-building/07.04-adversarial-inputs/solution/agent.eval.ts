import { stepCountIs, type UIMessage } from 'ai';
import { evalite } from 'evalite';
import { runAgent } from './agent.ts';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { createUIMessageFixture } from '#shared/create-ui-message-fixture.ts';
import { wrapAISDKModel } from 'evalite/ai-sdk';

evalite.each([
  {
    name: 'Gemini 2.0 Flash',
    input: google('gemini-2.0-flash'),
  },
  {
    name: 'GPT-4.1 Mini',
    input: openai('gpt-4.1-mini'),
  },
])('Agent Tool Call Evaluation - Adversarial Inputs', {
  data: [
    {
      input: createUIMessageFixture(
        'What is the weather in San Francisco right now?',
      ),
      expected: { tool: 'checkWeather' },
    },
    {
      input: createUIMessageFixture(
        'Create a spreadsheet called "Q4 Sales" with columns for Date, Product, and Revenue',
      ),
      expected: { tool: 'createSpreadsheet' },
    },
    {
      input: createUIMessageFixture(
        'Send an email to john@example.com with subject "Meeting Tomorrow" and body "Don\'t forget our 2pm meeting"',
      ),
      expected: { tool: 'sendEmail' },
    },
    {
      input: createUIMessageFixture(
        'Translate "Hello world" to Spanish',
      ),
      expected: { tool: 'translateText' },
    },
    {
      input: createUIMessageFixture(
        'Set a reminder for tomorrow at 9am to call the dentist',
      ),
      expected: { tool: 'setReminder' },
    },
    // Edge case: Ambiguous request that could match multiple tools
    {
      input: createUIMessageFixture(
        'I need to organize my schedule',
      ),
      expected: { tool: null }, // Could be searchCalendarEvents, createTask, setReminder
    },
    // Edge case: Very long, complex request with multiple potential actions
    {
      input: createUIMessageFixture(
        'I need to prepare for a big presentation next week. Can you help me create a spreadsheet to track all the tasks I need to complete, set reminders for the key milestones, search for the latest industry data online, and also check what meetings I have scheduled that might conflict with my preparation time?',
      ),
      expected: { tool: null }, // Multiple valid tools, unclear priority
    },
    // Edge case: Request with missing critical information
    {
      input: createUIMessageFixture(
        'Book a flight for next month',
      ),
      expected: { tool: null }, // Missing from, to, specific date
    },
    // Edge case: Conversational input with no action needed
    {
      input: createUIMessageFixture(
        'Thanks for your help earlier!',
      ),
      expected: { tool: null },
    },
    // Edge case: Request that sounds like action but is actually a question
    {
      input: createUIMessageFixture(
        'Can you explain how to create a backup of my files?',
      ),
      expected: { tool: null },
    },
    // Edge case: Overlapping tool functionality
    {
      input: createUIMessageFixture(
        'I want to save this information for later',
      ),
      expected: { tool: null }, // Could be createTask, setReminder, or createBackup
    },
    // Edge case: Request with conflicting constraints
    {
      input: createUIMessageFixture(
        'Send an urgent email but make sure to translate it to Spanish first',
      ),
      expected: { tool: null }, // Requires coordination between tools
    },
    // Edge case: Hypothetical scenario (no action should be taken)
    {
      input: createUIMessageFixture(
        'What would happen if I sent an email to the whole company?',
      ),
      expected: { tool: null },
    },
    // Edge case: Partial information requiring clarification
    {
      input: createUIMessageFixture('Create a reminder'),
      expected: { tool: null }, // Missing message and time
    },
    // Edge case: Request that seems tool-related but is actually general knowledge
    {
      input: createUIMessageFixture(
        "What's the difference between economy and business class on flights?",
      ),
      expected: { tool: null },
    },
  ],
  task: async (messages, model) => {
    const result = runAgent(
      wrapAISDKModel(model),
      messages,
      stepCountIs(1),
    );

    await result.consumeStream();

    const toolCalls = (await result.toolCalls).map(
      (toolCall) => ({
        toolName: toolCall.toolName,
        input: toolCall.input,
      }),
    );

    return {
      toolCalls,
      text: await result.text,
    };
  },
  scorers: [
    {
      name: 'Matches Expected Tool',
      description:
        'The agent called the expected tool (or correctly called no tool)',
      scorer: ({ output, expected }) => {
        // Handle null expected value (no tool should be called)
        if (expected?.tool === null) {
          return output.toolCalls.length === 0 ? 1 : 0;
        }

        // Check if expected tool was called
        return output.toolCalls.some(
          (toolCall) => toolCall.toolName === expected?.tool,
        )
          ? 1
          : 0;
      },
    },
  ],
});
