import BM25 from 'okapibm25';
import { loadEmails } from './utils.ts';

export const searchEmailsViaBM25 = async (keywords: string[]) => {
  const emails = await loadEmails();

  const scores: number[] = (BM25 as any)(
    emails.map((email) => `${email.subject} ${email.body}`),
    keywords,
  );

  return scores
    .map((score, index) => ({
      score,
      email: emails[index]!,
    }))
    .sort((a, b) => b.score - a.score);
};
