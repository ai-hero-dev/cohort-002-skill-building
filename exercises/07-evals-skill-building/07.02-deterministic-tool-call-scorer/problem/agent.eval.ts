import { createUIMessageFixture } from '#shared/create-ui-message-fixture.ts';
import { google } from '@ai-sdk/google';
import { stepCountIs } from 'ai';
import { evalite } from 'evalite';
import { runAgent } from './agent.ts';

evalite('Agent Tool Call Evaluation', {
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
  ],
  task: async (messages) => {
    const result = runAgent(
      google('gemini-2.0-flash'),
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
      description: 'The agent called the expected tool',
      scorer: ({ output, expected }) => {
        // TODO: Check if any toolCall in output.toolCalls matches expected.tool
        // Return 1 if match found, 0 otherwise
        return 0;
      },
    },
  ],
});
