import type { DB } from './memory-persistence.ts';

const RRF_K = 60;

export function reciprocalRankFusion(
  rankings: { memory: DB.MemoryItem; score: number }[][],
): { memory: DB.MemoryItem; score: number }[] {
  const rrfScores = new Map<string, number>();
  const documentMap = new Map<string, DB.MemoryItem>();

  // Process each ranking list
  rankings.forEach((ranking) => {
    ranking.forEach((doc, rank) => {
      // Get current RRF score for this document
      const currentScore = rrfScores.get(doc.memory.id) || 0;

      // Add contribution from this ranking list
      const contribution = 1 / (RRF_K + rank);
      rrfScores.set(doc.memory.id, currentScore + contribution);

      // Store document reference
      documentMap.set(doc.memory.id, doc.memory);
    });
  });

  // Sort by RRF score (descending)
  return Array.from(rrfScores.entries())
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([memoryId, score]) => ({
      memory: documentMap.get(memoryId)!,
      score,
    }));
}
