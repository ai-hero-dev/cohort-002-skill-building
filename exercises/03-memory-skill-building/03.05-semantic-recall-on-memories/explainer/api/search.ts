import BM25 from 'okapibm25';
import { searchMemoriesViaEmbeddings as searchViaEmbeddings } from './embeddings.ts';
import { loadMemories, type DB } from './memory-persistence.ts';
import { reciprocalRankFusion } from './utils.ts';

export const searchViaBM25 = async (
  memories: DB.MemoryItem[],
  keywords: string[],
) => {
  const scores: number[] = (BM25 as any)(
    memories.map((memory) => memory.memory),
    keywords,
  );

  return scores
    .map((score, index) => ({
      score,
      memory: memories[index]!,
    }))
    .sort((a, b) => b.score - a.score);
};

export const searchMemories = async (opts: {
  searchQuery: string;
  keywordsForBM25: string[];
}) => {
  const memories = loadMemories();

  const embeddingsResults = await searchViaEmbeddings(
    memories,
    opts.searchQuery,
  );

  const bm25Results = await searchViaBM25(
    memories,
    opts.keywordsForBM25,
  );

  const rrfResults = reciprocalRankFusion([
    embeddingsResults,
    bm25Results,
  ]);

  return rrfResults;
};
