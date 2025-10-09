import { google } from '@ai-sdk/google';
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  generateId,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from 'ai';
import { z } from 'zod';
import {
  loadMemories,
  saveMemories,
  deleteMemory,
  updateMemory,
  type DB,
} from './memory-persistence.ts';

export type MyMessage = UIMessage<unknown, {}>;

const formatMemory = (memory: DB.MemoryItem) => {
  return [
    `Memory: ${memory.memory}`,
    `ID: ${memory.id}`,
    `Created At: ${memory.createdAt}`,
  ].join('\n');
};

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: MyMessage[] } = await req.json();
  const { messages } = body;

  const memories = await loadMemories();

  const memoriesText = memories.map(formatMemory).join('\n\n');

  const result = streamText({
    model: google('gemini-2.0-flash-lite'),
    system: `You are a helpful assistant that can answer questions and help with tasks.

    The date is ${new Date().toISOString().split('T')[0]}.

    You have access to the following memories:

    <memories>
    ${memoriesText}
    </memories>

    When users share new personal information, contradict previous information, or ask you to remember/forget things, use the manageMemories tool to update the memory system.
    `,
    messages: convertToModelMessages(messages),
    // TODO: Add the manageMemories tool
    // The tool should have three parameters:
    // - updates: array of objects with { id: string, memory: string }
    // - deletions: array of strings (memory IDs to delete)
    // - additions: array of strings (new memories to add)
    // In the execute function, perform the actual memory operations
    tools: {
      manageMemories: TODO,
    },
    // TODO: Add stopWhen with stepCountIs to allow the agent to call tools
    // Use stepCountIs(5) to allow up to 5 generation steps
    stopWhen: TODO,
  });

  return createUIMessageStreamResponse({
    stream: result.toUIMessageStream(),
  });
};
