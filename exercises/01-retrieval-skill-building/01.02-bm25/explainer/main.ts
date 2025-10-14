import BM25 from 'okapibm25';
import path from 'path';
import { readFile } from 'fs/promises';

type Email = {
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

const loadEmails = async () => {
  const EMAILS_LOCATION = path.resolve(
    import.meta.dirname,
    '../../../../datasets/emails.json',
  );

  const content = await readFile(EMAILS_LOCATION, 'utf8');
  const emails: Email[] = JSON.parse(content);

  return emails;
};

const searchEmails = (emails: Email[], keywords: string[]) => {
  const scores: number[] = (BM25.default as any)(
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

console.log('🔍 BM25 Search Algorithm Playground\n');

const emails = await loadEmails();

// TODO: Try different keyword combinations:
//
// ['mortgage', 'pre-approval']
// ['house', 'Chorlton', 'Victorian']
// ['freelance', 'consulting', 'income']
// ['offer', 'property', 'accepted']
const keywords = ['mortgage', 'pre-approval'];

console.log(`Query: [${keywords.join(', ')}]`);
console.log('='.repeat(60));

const results = searchEmails(emails, keywords);
const topResults = results
  .filter((r) => r.score > 0)
  .slice(0, 10);

topResults.forEach((result, i) => {
  console.log(`\n${i + 1}. Score: ${result.score.toFixed(3)}`);
  console.log(`   From: ${result.email?.from}`);
  console.log(`   Subject: ${result.email?.subject}`);
  console.log(result.email?.body);
});
