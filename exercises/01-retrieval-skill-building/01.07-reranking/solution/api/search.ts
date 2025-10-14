import { searchEmailsViaBM25 } from './bm25.ts';
import { searchEmailsViaEmbeddings } from './embeddings.ts';
import { reciprocalRankFusion } from './utils.ts';

export const searchEmails = async (opts: {
  keywordsForBM25: string[];
  embeddingsQuery: string;
}) => {
  const bm25SearchResults = await searchEmailsViaBM25(
    opts.keywordsForBM25,
  );

  const embeddingsSearchResults = await searchEmailsViaEmbeddings(
    opts.embeddingsQuery,
  );

  const rrfResults = reciprocalRankFusion([
    bm25SearchResults,
    embeddingsSearchResults,
  ]);

  return rrfResults;
};
