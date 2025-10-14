import BM25 from 'okapibm25';
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

export const searchEmails = async (keywords: string[]) => {
  const emails = await loadEmails();

  const scores: number[] = (BM25 as any)(
    emails.map((email) => `${email.subject} ${email.body}`),
    keywords,
  );

  return scores
    .map((score, index) => ({
      score,
      email: emails[index],
    }))
    .sort((a, b) => b.score - a.score);
};
