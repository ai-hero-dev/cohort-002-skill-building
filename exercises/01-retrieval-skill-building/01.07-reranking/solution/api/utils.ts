import path from 'path';
import { readFile } from 'fs/promises';

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
  rankings: { email: Email; score: number }[][],
): { email: Email; score: number }[] {
  const rrfScores = new Map<string, number>();
  const emailMap = new Map<string, Email>();

  // Process each ranking list
  rankings.forEach((ranking) => {
    ranking.forEach((result, rank) => {
      // Get current RRF score for this email
      const currentScore = rrfScores.get(result.email.id) || 0;

      // Add contribution from this ranking list
      const contribution = 1 / (RRF_K + rank);
      rrfScores.set(result.email.id, currentScore + contribution);

      // Store email reference
      emailMap.set(result.email.id, result.email);
    });
  });

  // Sort by RRF score (descending)
  return Array.from(rrfScores.entries())
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .map(([emailId, score]) => ({
      email: emailMap.get(emailId)!,
      score,
    }));
}
