import { google } from '@ai-sdk/google';
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from 'ai';

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

const KEYWORD_GENERATOR_SYSTEM_PROMPT = `
  You are a helpful email assistant, able to search through emails for information.
  Your job is to generate a list of keywords which will be used to search emails.
`;

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: UIMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // TODO: Implement a keyword generator that generates a list of keywords
      // based on the conversation history. Use generateObject to do this.
      const keywords = TODO;

      // TODO: Use the searchEmails function to get the top X number of
      // search results based on the keywords
      const topSearchResults = TODO;

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
