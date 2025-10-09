import { google } from '@ai-sdk/google';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  embed,
  generateId,
  generateObject,
  streamText,
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
import { embedMemory } from './embeddings.ts';
import { searchMemories } from './search.ts';

export type MyMessage = UIMessage<unknown, {}>;

const formatMessageHistory = (messages: UIMessage[]) => {
  return messages
    .map((message) => {
      return `${message.role}: ${partsToText(message.parts)}`;
    })
    .join('\n');
};

const partsToText = (parts: UIMessage['parts']) => {
  return parts
    .map((part) => {
      if (part.type === 'text') {
        return part.text;
      }

      return '';
    })
    .join('');
};

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

  const queryRewriterResult = await generateObject({
    model: google('gemini-2.0-flash-001'),
    system: `You are a helpful memory search assistant, able to generate effective search queries for finding relevant memories in a user's memory system.
      Your job is to generate a list of keywords and a search query which will be used to search through the user's stored memories.
      The memories contain personal information, preferences, facts, and details about the user that have been shared in previous conversations.
    `,
    schema: z.object({
      keywords: z
        .array(z.string())
        .describe(
          "A list of keywords to search the user's memories with. Use these for exact terminology and specific terms mentioned in the conversation.",
        ),
      searchQuery: z
        .string()
        .describe(
          "A search query which will be used to search the user's memories. Use this for broader semantic search terms that capture the intent and context of the conversation.",
        ),
    }),
    prompt: `
      Conversation history:
      ${formatMessageHistory(messages)}
    `,
  });

  console.dir(queryRewriterResult.object, { depth: null });

  const allMemories = await searchMemories({
    searchQuery: queryRewriterResult.object.searchQuery,
    keywordsForBM25: queryRewriterResult.object.keywords,
  });

  const formattedMemories = allMemories
    .slice(0, 10)
    .map((memory) => formatMemory(memory.memory))
    .join('\n\n');

  const stream = createUIMessageStream<MyMessage>({
    execute: async ({ writer }) => {
      const result = streamText({
        model: google('gemini-2.0-flash-lite'),
        system: `You are a helpful assistant that can answer questions and help with tasks.

        The date is ${new Date().toISOString().split('T')[0]}.

        You have access to the following memories:

        <memories>
        ${formattedMemories}
        </memories>
        `,
        messages: convertToModelMessages(messages),
      });

      writer.merge(result.toUIMessageStream());
    },
    onFinish: async (response) => {
      const allMessages = [...messages, ...response.messages];

      const memoriesResult = await generateObject({
        model: google('gemini-2.0-flash'),
        schema: z.object({
          updates: z
            .array(
              z.object({
                id: z
                  .string()
                  .describe(
                    'The ID of the existing memory to update',
                  ),
                memory: z
                  .string()
                  .describe('The updated memory content'),
              }),
            )
            .describe(
              'Array of existing memories that need to be updated with new information',
            ),
          deletions: z
            .array(z.string())
            .describe(
              'Array of memory IDs that should be deleted (outdated, incorrect, or no longer relevant)',
            ),
          additions: z
            .array(z.string())
            .describe(
              "Array of new memory strings to add to the user's permanent memory",
            ),
        }),
        system: `You are a memory management agent. Your task is to analyze the conversation history and manage the user's permanent memories by adding new ones, updating existing ones, and deleting outdated ones.

        PERMANENT MEMORIES are facts about the user that:
        - Are unlikely to change over time (preferences, traits, characteristics)
        - Will remain relevant for weeks, months, or years
        - Include personal details, preferences, habits, or important information shared
        - Are NOT temporary or situational information

        EXAMPLES OF PERMANENT MEMORIES:
        - "User prefers dark mode interfaces"
        - "User works as a software engineer"
        - "User has a dog named Max"
        - "User is learning TypeScript"
        - "User prefers concise explanations"
        - "User lives in San Francisco"

        EXAMPLES OF WHAT NOT TO MEMORIZE:
        - "User asked about weather today" (temporary)
        - "User is currently debugging code" (situational)
        - "User said hello" (trivial interaction)

        MEMORY MANAGEMENT TASKS:
        1. ADDITIONS: Extract any new permanent memories from this conversation that aren't already covered by existing memories.
        2. UPDATES: Identify existing memories that need to be updated with new information (e.g., if user mentioned they moved cities, update their location memory).
        3. DELETIONS: Identify existing memories that are now outdated, incorrect, or no longer relevant based on new information in the conversation.

        For each memory operation:
        - Additions: Return concise, factual statements about the user
        - Updates: Provide the memory ID and the updated content
        - Deletions: Provide the memory ID of memories that should be removed

        If no memory changes are needed, return empty arrays for all operations.`,
        prompt: `
        CONVERSATION HISTORY:
        ${formatMessageHistory(allMessages)}

        EXISTING MEMORIES:
        ${formattedMemories}
        `,
      });

      const { updates, deletions, additions } =
        memoriesResult.object;

      console.log('Updates', updates);
      console.log('Deletions', deletions);
      console.log('Additions', additions);

      // Only delete memories that are not being updated
      const filteredDeletions = deletions.filter(
        (deletion) =>
          !updates.some((update) => update.id === deletion),
      );

      for (const update of updates) {
        updateMemory(update.id, {
          memory: update.memory,
          createdAt: new Date().toISOString(),
          embedding: await embedMemory(update.memory),
        });
      }

      filteredDeletions.forEach((deletion) =>
        deleteMemory(deletion),
      );

      saveMemories(
        await Promise.all(
          additions.map(async (addition) => ({
            id: generateId(),
            memory: addition,
            createdAt: new Date().toISOString(),
            embedding: await embedMemory(addition),
          })),
        ),
      );
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
