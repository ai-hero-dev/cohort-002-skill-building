import { google } from '@ai-sdk/google';
import { cosineSimilarity, embed, embedMany } from 'ai';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { loadEmails, type Email } from './utils.ts';

export type Embeddings = Record<string, number[]>;

const getExistingEmbeddingsPath = (cacheKey: string) => {
  return path.resolve(process.cwd(), 'data', `${cacheKey}.json`);
};

const saveEmbeddings = async (
  cacheKey: string,
  embeddingsResult: Embeddings,
) => {
  const existingEmbeddingsPath =
    getExistingEmbeddingsPath(cacheKey);

  await mkdirSync(path.dirname(existingEmbeddingsPath), {
    recursive: true,
  });

  await writeFile(
    existingEmbeddingsPath,
    JSON.stringify(embeddingsResult),
  );
};

export const getExistingEmbeddings = async (
  cacheKey: string,
): Promise<Embeddings | undefined> => {
  const existingEmbeddingsPath =
    getExistingEmbeddingsPath(cacheKey);

  if (!existsSync(existingEmbeddingsPath)) {
    return;
  }

  try {
    const existingEmbeddings = await readFile(
      existingEmbeddingsPath,
      'utf8',
    );
    return JSON.parse(existingEmbeddings);
  } catch (error) {
    return;
  }
};

const myEmbeddingModel = google.textEmbeddingModel(
  'text-embedding-004',
);

export const embedEmails = async (
  cacheKey: string,
): Promise<Embeddings> => {
  const emails = await loadEmails();

  const existingEmbeddings =
    await getExistingEmbeddings(cacheKey);

  if (existingEmbeddings) {
    return existingEmbeddings;
  }

  const embeddings: Embeddings = {};

  // Chunk the values into batches of 99
  const chunkSize = 99;
  const chunks = [];
  for (let i = 0; i < emails.length; i += chunkSize) {
    chunks.push(emails.slice(i, i + chunkSize));
  }

  // Process each chunk sequentially
  let processedCount = 0;
  for (const chunk of chunks) {
    const embedManyResult = await embedLotsOfText(chunk);

    embedManyResult.forEach((embedding) => {
      embeddings[embedding.id] = embedding.embedding;
    });

    processedCount += chunk.length;
  }

  await saveEmbeddings(cacheKey, embeddings);

  return embeddings;
};

export const searchEmailsViaEmbeddings = async (
  query: string,
) => {
  const embeddings =
    await getExistingEmbeddings(EMBED_CACHE_KEY);

  if (!embeddings) {
    throw new Error(
      `Embeddings not yet created under this cache key: ${EMBED_CACHE_KEY}`,
    );
  }
  const emails = await loadEmails();
  const emailsMap = new Map(emails.map((email) => [email.id, email]));

  const queryEmbedding = await embedOnePieceOfText(query);

  const scores = Object.entries(embeddings).map(
    ([key, value]) => {
      return {
        score: calculateScore(queryEmbedding, value),
        email: emailsMap.get(key)!,
      };
    },
  );

  return scores.sort((a, b) => b.score - a.score);
};

export const EMBED_CACHE_KEY = 'emails-google';

const embedLotsOfText = async (
  emails: Email[],
): Promise<
  {
    id: string;
    embedding: number[];
  }[]
> => {
  const result = await embedMany({
    model: myEmbeddingModel,
    values: emails.map((email) => `${email.subject} ${email.body}`),
    maxRetries: 0,
  });

  return result.embeddings.map((embedding, index) => ({
    id: emails[index]!.id,
    embedding,
  }));
};

const calculateScore = (
  queryEmbedding: number[],
  embedding: number[],
): number => {
  return cosineSimilarity(queryEmbedding, embedding);
};

const embedOnePieceOfText = async (text: string) => {
  const result = await embed({
    model: myEmbeddingModel,
    value: text,
  });

  return result.embedding;
};
