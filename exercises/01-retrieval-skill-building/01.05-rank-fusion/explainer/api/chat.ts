import { google } from '@ai-sdk/google';
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateObject,
  streamText,
  type UIMessage,
} from 'ai';
import { z } from 'zod';
import { searchEmails } from './search.ts';

const formatMessageHistory = (messages: UIMessage[]) => {
  return messages
    .map((message) => {
      return `${message.role}: ${message.parts
        .map((part) => {
          if (part.type === 'text') {
            return part.text;
          }

          return '';
        })
        .join('')}`;
    })
    .join('\n');
};

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: UIMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const keywords = await generateObject({
        model: google('gemini-2.0-flash-001'),
        system: `You are a helpful email assistant, able to search emails for information.
          Your job is to generate a list of keywords which will be used to search the emails.
        `,
        schema: z.object({
          keywords: z.array(z.string()),
        }),
        prompt: `
          Conversation history:
          ${formatMessageHistory(messages)}
        `,
      });

      console.log(keywords.object.keywords);

      const searchResults = await searchEmails({
        keywordsForBM25: keywords.object.keywords,
        embeddingsQuery: formatMessageHistory(messages),
      });

      const topSearchResults = searchResults.slice(0, 5);

      console.log(
        topSearchResults.map((result) => result.email.subject),
      );

      const answer = streamText({
        model: google('gemini-2.0-flash-001'),
        system: `You are a helpful email assistant that answers questions based on email content.
          You should use the provided emails to answer questions accurately.
          ALWAYS cite sources using markdown formatting with the email subject as the source.
          Be concise but thorough in your explanations.
        `,
        prompt: [
          '## Conversation History',
          formatMessageHistory(messages),
          '## Email Snippets',
          ...topSearchResults.map((result, i) => {
            const from = result.email?.from || 'unknown';
            const to = result.email?.to || 'unknown';
            const subject =
              result.email?.subject || `email-${i + 1}`;
            const body = result.email?.body || '';
            const score = result.score;

            return [
              `### 📧 Email ${i + 1}: [${subject}](#${subject.replace(/[^a-zA-Z0-9]/g, '-')})`,
              `**From:** ${from}`,
              `**To:** ${to}`,
              `**Relevance Score:** ${score.toFixed(3)}`,
              body,
              '---',
            ].join('\n\n');
          }),
          '## Instructions',
          "Based on the emails above, please answer the user's question. Always cite your sources using the email subject in markdown format.",
        ].join('\n\n'),
      });

      writer.merge(answer.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({
    stream,
  });
};
