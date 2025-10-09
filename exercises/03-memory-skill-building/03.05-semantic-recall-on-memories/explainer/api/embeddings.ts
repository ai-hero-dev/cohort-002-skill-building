import { google } from '@ai-sdk/google';
import { cosineSimilarity, embed } from 'ai';
import type { DB } from './memory-persistence.ts';

const myEmbeddingModel = google.textEmbeddingModel(
  'text-embedding-004',
);

export const searchMemoriesViaEmbeddings = async (
  memories: DB.MemoryItem[],
  query: string,
) => {
  const queryEmbedding = await embed({
    model: myEmbeddingModel,
    value: query,
  }).then((result) => result.embedding);

  const scores = memories.map((memory) => {
    return {
      score: cosineSimilarity(queryEmbedding, memory.embedding),
      memory,
    };
  });

  return scores.sort((a, b) => b.score - a.score);
};

export const EMBED_CACHE_KEY = 'memories-google';

export const embedMemory = async (memory: string) => {
  return embed({
    model: myEmbeddingModel,
    value: memory,
  }).then((result) => result.embedding);
};
