import BM25 from 'okapibm25';
import { loadEmails, type Email } from './utils.ts';

export const searchEmailsViaBM25 = async (
  keywords: string[],
) => {
  const emails = await loadEmails();

  const scores: number[] = (BM25 as any)(
    emails.map((email) =>
      `${email.subject} ${email.body}`.toLowerCase(),
    ),
    keywords.map((k) => k.toLowerCase()),
  );

  return scores
    .map((score, index) => ({
      score,
      email: emails[index]!,
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
};
