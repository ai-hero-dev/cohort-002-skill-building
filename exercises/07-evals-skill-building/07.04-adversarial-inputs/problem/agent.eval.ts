import { stepCountIs, type UIMessage } from 'ai';
import { evalite } from 'evalite';
import { runAgent } from './agent.ts';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

evalite.each([
  {
    name: 'Gemini 2.0 Flash',
    input: google('gemini-2.0-flash'),
  },
  {
    name: 'Gemini 2.0 Flash Lite',
    input: google('gemini-2.0-flash-lite'),
  },
  {
    name: 'GPT-4o',
    input: openai('gpt-4o'),
  },
])('Agent Tool Call Evaluation - Adversarial Inputs', {
  data: [
    {
      input: ['What is the weather in San Francisco right now?'],
      expected: { tool: 'checkWeather' },
    },
    {
      input: [
        'Create a spreadsheet called "Q4 Sales" with columns for Date, Product, and Revenue',
      ],
      expected: { tool: 'createSpreadsheet' },
    },
    {
      input: [
        'Send an email to john@example.com with subject "Meeting Tomorrow" and body "Don\'t forget our 2pm meeting"',
      ],
      expected: { tool: 'sendEmail' },
    },
    {
      input: ['Translate "Hello world" to Spanish'],
      expected: { tool: 'translateText' },
    },
    {
      input: [
        'Set a reminder for tomorrow at 9am to call the dentist',
      ],
      expected: { tool: 'setReminder' },
    },
    // TODO: Add 5-10 adversarial test cases to challenge the agent
    // Ideas for adversarial inputs:
    // - Ambiguous requests that could match multiple tools (e.g., "organize my schedule")
    // - Very long, complex requests with multiple potential actions
    // - Requests with missing critical information (e.g., "book a flight" without dates/locations)
    // - Conversational input with no action needed (e.g., "thanks!")
    // - Questions about tools vs. actual tool requests (e.g., "how do I create a backup?")
    // - Overlapping tool functionality (e.g., "save this for later" - task? reminder? backup?)
    // - Hypothetical scenarios (e.g., "what would happen if...")
    // - Partial information requiring clarification
    // For cases where NO tool should be called, use: expected: { tool: null }
  ],
  task: async (input, model) => {
    const messages: UIMessage[] = input.map(
      (message, index) => ({
        id: String(index + 1),
        role: index % 2 === 0 ? 'user' : 'assistant',
        parts: [{ type: 'text', text: message }],
      }),
    );

    const result = runAgent(model, messages, stepCountIs(1));

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
