import { readFile } from 'fs/promises';
import path from 'path';

export type Email = {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string[];
  labels?: string[];
  arcId?: string;
  phaseId?: number;
};

export const loadEmails = async () => {
  const EMAILS_LOCATION = path.resolve(
    import.meta.dirname,
    '../../../../../datasets/emails.json',
  );

  const content = await readFile(EMAILS_LOCATION, 'utf8');
  const emails: Email[] = JSON.parse(content);

  return emails;
};

const RRF_K = 60;

export function reciprocalRankFusion(
  rankings: { email: Email }[][],
): { email: Email }[] {
  const rrfScores = new Map<string, number>();
  const emailMap = new Map<string, { email: Email }>();

  // Process each ranking list
  rankings.forEach((ranking) => {
    ranking.forEach((doc, rank) => {
      // Get current RRF score for this document
      const currentScore = rrfScores.get(doc.email.id) || 0;

      // Add contribution from this ranking list
      const contribution = 1 / (RRF_K + rank);
      rrfScores.set(doc.email.id, currentScore + contribution);

      // Store document reference
      emailMap.set(doc.email.id, doc);
    });
  });

  // Sort by RRF score (descending)
  return Array.from(rrfScores.entries())
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([docId]) => emailMap.get(docId)!);
}
