import { searchViaBM25 } from './bm25.ts';
import { searchChunksViaEmbeddings } from './embeddings.ts';
import { createChunks, reciprocalRankFusion } from './utils.ts';

export const searchChunks = async (opts: {
  keywordsForBM25: string[];
  embeddingsQuery: string;
}): Promise<{ chunk: string; score: number }[]> => {
  const chunks = await createChunks();
  const chunkTexts = chunks.map((c) => c.content);

  const bm25SearchResults = await searchViaBM25(
    chunkTexts,
    opts.keywordsForBM25,
  );

  const embeddingsSearchResults =
    await searchChunksViaEmbeddings(chunks, opts.embeddingsQuery);

  const rrfResults = reciprocalRankFusion([
    bm25SearchResults,
    embeddingsSearchResults,
  ]);

  return rrfResults;
};
