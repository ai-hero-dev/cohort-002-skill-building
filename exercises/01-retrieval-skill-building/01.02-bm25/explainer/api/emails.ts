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
    '../../../../../datasets/emails.json',
  );

  const content = await readFile(EMAILS_LOCATION, 'utf8');
  const emails: Email[] = JSON.parse(content);

  return emails;
};

const searchEmails = (
  emails: Email[],
  keywords: string[],
): { email: Email; score: number }[] => {
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

export const GET = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const search = url.searchParams.get('search') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = 20;

  const emails = await loadEmails();
  let emailsWithScores: { email: Email; score: number }[] = [];

  if (search) {
    // Perform BM25 search
    const keywords = search.split(' ').map((s) => s.trim());
    emailsWithScores = searchEmails(emails, keywords);
  } else {
    // Return all emails with zero scores
    emailsWithScores = emails.map((email) => ({
      email,
      score: 0,
    }));
  }

  // Calculate stats
  const totalEmails = emailsWithScores.length;
  const pageCount = Math.ceil(totalEmails / pageSize);

  // Paginate
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEmails = emailsWithScores.slice(
    startIndex,
    endIndex,
  );

  // Calculate score range for current page
  const pageScores = paginatedEmails.map((e) => e.score);
  const minScore =
    pageScores.length > 0 ? Math.min(...pageScores) : 0;
  const maxScore =
    pageScores.length > 0 ? Math.max(...pageScores) : 0;

  // Map to response format
  const emailsWithIndices = paginatedEmails.map((item, idx) => ({
    index: startIndex + idx,
    id: item.email.id,
    from: item.email.from,
    to: item.email.to,
    subject: item.email.subject,
    body: item.email.body,
    timestamp: item.email.timestamp,
    score: item.score,
  }));

  return Response.json({
    emails: emailsWithIndices,
    stats: {
      total: totalEmails,
      pageCount,
      currentPage: page,
      minScore,
      maxScore,
    },
  });
};
