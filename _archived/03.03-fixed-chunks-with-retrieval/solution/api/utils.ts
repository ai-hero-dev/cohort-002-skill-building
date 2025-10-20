import { TokenTextSplitter } from '@langchain/textsplitters';
import { createHash } from 'crypto';
import { readFile } from 'fs/promises';
import path from 'path';

export type Chunk = {
  id: string;
  content: string;
};

export const loadBookText = async (): Promise<string> => {
  const BOOK_LOCATION = path.resolve(
    import.meta.dirname,
    '../../../../../datasets/total-typescript-book.md',
  );

  const content = await readFile(BOOK_LOCATION, 'utf8');
  return content;
};

export const createChunks = async (): Promise<Chunk[]> => {
  const bookText = await loadBookText();

  const splitter = new TokenTextSplitter({
    chunkSize: 500,
    chunkOverlap: 200,
  });

  const chunkTexts = await splitter.splitText(bookText);

  return chunkTexts.map((content) => ({
    id: hashChunk(content),
    content,
  }));
};

export const hashChunk = (content: string): string => {
  return createHash('sha256').update(content).digest('hex');
};

const RRF_K = 60;

export function reciprocalRankFusion(
  rankings: { chunk: string; score: number }[][],
): { chunk: string; score: number }[] {
  const rrfScores = new Map<string, number>();
  const chunkMap = new Map<
    string,
    { chunk: string; score: number }
  >();

  // Process each ranking list
  rankings.forEach((ranking) => {
    ranking.forEach((doc, rank) => {
      // Get current RRF score for this document
      const currentScore = rrfScores.get(doc.chunk) || 0;

      // Add contribution from this ranking list
      const contribution = 1 / (RRF_K + rank);
      rrfScores.set(doc.chunk, currentScore + contribution);

      // Store document reference
      chunkMap.set(doc.chunk, doc);
    });
  });

  // Sort by RRF score (descending)
  return Array.from(rrfScores.entries())
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([chunkContent]) => chunkMap.get(chunkContent)!);
}
