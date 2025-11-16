import { stepCountIs, type UIMessage } from 'ai';
import { evalite } from 'evalite';
import { runAgent } from './agent.ts';
import { google } from '@ai-sdk/google';
import { createUIMessageFixture } from '#shared/create-ui-message-fixture.ts';
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

    // TODO: Consume the stream so the agent completes execution

    // TODO: Extract the toolCalls from the result
    // The result object has a toolCalls property that you need to await
    // Map the toolCalls to include only toolName and input for easier inspection

    // TODO: Get the text response from the result

    // TODO: Return an object with toolCalls and text properties
    return {};
  },
});
