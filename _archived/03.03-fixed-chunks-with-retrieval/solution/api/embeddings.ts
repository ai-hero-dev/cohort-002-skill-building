import { google } from '@ai-sdk/google';
import { cosineSimilarity, embed, embedMany } from 'ai';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { createChunks, type Chunk } from './utils.ts';

export type Embeddings = Record<
  string,
  { content: string; embedding: number[] }
>;

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

export const embedChunks = async (): Promise<Embeddings> => {
  const chunks = await createChunks();

  const existingEmbeddings =
    (await getExistingEmbeddings(EMBED_CACHE_KEY)) || {};

  // Determine which chunks need embedding
  const chunksToEmbed = chunks.filter(
    (chunk) => !existingEmbeddings[chunk.id],
  );

  console.log(
    `Total chunks: ${chunks.length}, Already embedded: ${chunks.length - chunksToEmbed.length}, Need embedding: ${chunksToEmbed.length}`,
  );

  if (chunksToEmbed.length === 0) {
    console.log('All chunks already embedded');
    return existingEmbeddings;
  }

  const embeddings: Embeddings = { ...existingEmbeddings };

  // Batch chunks into groups of 99 for API efficiency
  const batchSize = 99;
  const batches = [];
  for (let i = 0; i < chunksToEmbed.length; i += batchSize) {
    batches.push(chunksToEmbed.slice(i, i + batchSize));
  }

  // Process each batch sequentially
  for (const batch of batches) {
    const embedManyResult = await embedLotsOfText(batch);

    embedManyResult.forEach((result) => {
      embeddings[result.id] = {
        content: result.content,
        embedding: result.embedding,
      };
    });

    console.log(
      `Embedded batch of ${batch.length} chunks (${Object.keys(embeddings).length}/${chunks.length} total)`,
    );
  }

  await saveEmbeddings(EMBED_CACHE_KEY, embeddings);

  return embeddings;
};

export const searchChunksViaEmbeddings = async (
  chunks: Chunk[],
  query: string,
): Promise<{ chunk: string; score: number }[]> => {
  const embeddings =
    await getExistingEmbeddings(EMBED_CACHE_KEY);

  if (!embeddings) {
    throw new Error(
      `Embeddings not yet created under this cache key: ${EMBED_CACHE_KEY}`,
    );
  }

  // Create a map of current chunks by ID
  const chunkMap = new Map(chunks.map((c) => [c.id, c.content]));

  const queryEmbedding = await embedOnePieceOfText(query);

  // Only score chunks that exist in current dataset
  const scores = Object.entries(embeddings)
    .filter(([id]) => chunkMap.has(id))
    .map(([id, data]) => {
      return {
        score: calculateScore(queryEmbedding, data.embedding),
        chunk: data.content,
      };
    });

  return scores.sort((a, b) => b.score - a.score);
};

export const EMBED_CACHE_KEY = 'book-chunks-google';

const embedLotsOfText = async (
  chunks: Chunk[],
): Promise<
  {
    id: string;
    content: string;
    embedding: number[];
  }[]
> => {
  const result = await embedMany({
    model: myEmbeddingModel,
    values: chunks.map((chunk) => chunk.content),
    maxRetries: 0,
  });

  return result.embeddings.map((embedding, index) => ({
    id: chunks[index]!.id,
    content: chunks[index]!.content,
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
