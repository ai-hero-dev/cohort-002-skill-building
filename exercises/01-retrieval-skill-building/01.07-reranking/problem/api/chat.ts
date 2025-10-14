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

const RERANKER_SYSTEM_PROMPT = `You are a search result reranker. Your job is to analyze a list of emails and return only the IDs of the most relevant emails for answering the user's question.

Given a list of emails with their IDs and content, you should:
1. Evaluate how relevant each email is to the user's question
2. Return only the IDs of the most relevant emails

You should be selective and only include emails that are genuinely helpful for answering the question. If an email is only tangentially related or not relevant, exclude its ID.

Return the IDs as a simple array of numbers.`;

export const POST = async (req: Request): Promise<Response> => {
  const body: { messages: UIMessage[] } = await req.json();
  const { messages } = body;

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const keywords = await generateObject({
        model: google('gemini-2.0-flash-001'),
        system: `You are a helpful email assistant, able to search emails for information.
          Your job is to generate a list of keywords which will be used to search emails.
          You should also generate a search query which will be used to search emails. This will be used for semantic search, so can be more general.
        `,
        schema: z.object({
          keywords: z
            .array(z.string())
            .describe(
              'A list of keywords to search emails with. Use these for exact terminology.',
            ),
          searchQuery: z
            .string()
            .describe(
              'A search query which will be used to search emails. Use this for broader terms.',
            ),
        }),
        prompt: `
          Conversation history:
          ${formatMessageHistory(messages)}
        `,
      });

      console.dir(keywords.object, { depth: null });

      const searchResults = await searchEmails({
        keywordsForBM25: keywords.object.keywords,
        embeddingsQuery: keywords.object.searchQuery,
      });

      // TODO: Slice the search results to the top 30
      // TODO: Add an ID to each result (just a number: use the index of the array)
      const topSearchResultsWithId = TODO;

      const topSearchResultsAsText = topSearchResultsWithId
        .map((result) =>
          [
            `## ID: ${result.id}`,
            `### From: ${result.email.from}`,
            `### To: ${result.email.to}`,
            `### Subject: ${result.email.subject}`,
            `<content>`,
            result.email.body,
            `</content>`,
          ].join('\n\n'),
        )
        .join('\n\n');

      // TODO: Filter down to only the most relevant search results
      // via a generateObject call
      // Use the RERANKER_SYSTEM_PROMPT to rerank the search results
      // Pass it the search results as text and the user's question
      // Return the IDs of the most relevant search results - NOT
      // all the content. No need to waste tokens returning all
      // the content too.
      const rerankedSearchResults = TODO;

      const topSearchResultsAsMap = new Map(
        topSearchResultsWithId.map((result) => [
          result.id,
          result,
        ]),
      );

      const topSearchResults =
        rerankedSearchResults.object.resultIds
          .map((id) => topSearchResultsAsMap.get(id))
          .filter((result) => result !== undefined);

      console.dir(
        topSearchResults.map((result) => result.email.subject),
        {
          depth: null,
        },
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
          '## Emails',
          ...topSearchResults.map((result, i) => {
            const from = result.email?.from || 'unknown';
            const to = result.email?.to || 'unknown';
            const subject =
              result.email?.subject || `email-${i + 1}`;
            const body = result.email?.body || '';

            return [
              `### 📧 Email ${i + 1}: [${subject}](#${subject.replace(/[^a-zA-Z0-9]/g, '-')})`,
              `**From:** ${from}`,
              `**To:** ${to}`,
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
