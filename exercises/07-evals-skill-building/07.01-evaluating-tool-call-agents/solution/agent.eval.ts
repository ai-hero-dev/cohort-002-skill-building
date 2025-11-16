import { createUIMessageFixture } from '#shared/create-ui-message-fixture.ts';
import { google } from '@ai-sdk/google';
import { stepCountIs } from 'ai';
import { evalite } from 'evalite';
import { runAgent } from './agent.ts';
import { wrapAISDKModel } from 'evalite/ai-sdk';

evalite('Agent Tool Call Evaluation', {
  data: [
    {
      input: createUIMessageFixture(
        'What is the weather in San Francisco right now?',
      ),
    },
    {
      input: createUIMessageFixture(
        'Create a spreadsheet called "Q4 Sales" with columns for Date, Product, and Revenue',
      ),
    },
    {
      input: createUIMessageFixture(
        'Send an email to john@example.com with subject "Meeting Tomorrow".',
        'What should the email say?',
        "Don't forget our 2pm meeting",
      ),
    },
  ],
  task: async (messages) => {
    const result = runAgent(
      wrapAISDKModel(google('gemini-2.0-flash')),
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
  scorers: [],
});
