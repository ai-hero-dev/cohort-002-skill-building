import { google } from '@ai-sdk/google';
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateObject,
  streamText,
  type UIMessage,
} from 'ai';
import { z } from 'zod';
import { searchChunks } from './search.ts';

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: UIMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const keywords = await generateObject({
        model: google('gemini-2.0-flash-001'),
        system: `You are a helpful TypeScript book assistant, able to search book content for information.
          Your job is to generate a list of keywords which will be used to search the book.
          You should also generate a search query which will be used to search the book. This will be used for semantic search, so can be more general.
        `,
        schema: z.object({
          keywords: z
            .array(z.string())
            .describe(
              'A list of keywords to search the book with. Use these for exact terminology.',
            ),
          searchQuery: z
            .string()
            .describe(
              'A search query which will be used to search the book. Use this for broader terms.',
            ),
        }),
        messages: convertToModelMessages(messages),
      });

      console.dir(keywords.object, { depth: null });

      const searchResults = await searchChunks({
        keywordsForBM25: keywords.object.keywords,
        embeddingsQuery: keywords.object.searchQuery,
      });

      const topSearchResults = searchResults.slice(0, 5);

      for (const result of topSearchResults) {
        console.log(`Found chunk:`);
        console.log(`Score: ${result.score}`);
        console.log(result.chunk);
      }

      const chunkSnippets = [
        '## Relevant Book Sections',
        ...topSearchResults.map((result, i) => {
          return [result.chunk, '---'].join('\n\n');
        }),
        '## Instructions',
        "Based on the book sections above, please answer the user's question.",
      ].join('\n\n');

      const answer = streamText({
        model: google('gemini-2.0-flash'),
        system: `You are a helpful TypeScript book assistant that answers questions based on book content.
          You should use the provided book sections to answer questions accurately.
          ALWAYS cite sources using markdown formatting with the section number as the source.
          Be concise but thorough in your explanations.
        `,
        messages: [
          ...convertToModelMessages(messages),
          {
            role: 'user',
            content: chunkSnippets,
          },
        ],
      });

      writer.merge(answer.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
