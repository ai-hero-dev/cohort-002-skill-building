import { stepCountIs, type UIMessage } from 'ai';
import { evalite } from 'evalite';
import { runAgent } from './agent.ts';
import { google } from '@ai-sdk/google';
import { createUIMessageFixture } from '#shared/create-ui-message-fixture.ts';
import { openai } from '@ai-sdk/openai';
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
])('Ask For Clarification Evaluation', {
  data: [
    // Flight booking with missing critical details
    {
      input: createUIMessageFixture('Book a flight to Paris'),
    },
    // Email with missing recipient details
    {
      input: createUIMessageFixture('Send John an email'),
    },
    // Invoice creation with no details
    {
      input: createUIMessageFixture(
        'Create an invoice for the client',
      ),
    },
    // Reminder with no specifics
    {
      input: createUIMessageFixture('Set a reminder'),
    },
    // Translation with missing text and target language
    {
      input: createUIMessageFixture('Translate this text'),
    },
    // Weather check without location
    {
      input: createUIMessageFixture('Check the weather'),
    },
    // Social media post with no content or time
    {
      input: createUIMessageFixture(
        'Schedule a social media post',
      ),
    },
    // Task creation with no details
    {
      input: createUIMessageFixture('Create a task for me'),
    },
    // Calendar search without specifics
    {
      input: createUIMessageFixture('Search my calendar'),
    },
    // File compression without paths
    {
      input: createUIMessageFixture('Compress a file'),
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
      name: 'Called askForClarification',
      description:
        'The agent called the askForClarification tool',
      scorer: ({ output }) => {
        return output.toolCalls.some(
          (tc) => tc.toolName === 'askForClarification',
        )
          ? 1
          : 0;
      },
    },
  ],
});
