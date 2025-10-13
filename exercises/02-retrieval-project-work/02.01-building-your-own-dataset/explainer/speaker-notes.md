# Building Your Own Dataset

## Explainer

### Intro

- Section 1 taught retrieval techniques. Section 2 applies them to real project
- Need dataset first - emails or any personal data you want to query
- Two pre-built email datasets provided (75 or 547 emails)
- Can skip this lesson if using pre-built
- Or build custom dataset from personal data sources
- Real power: query YOUR data not demo data

### Dataset Options

#### Phase 1: Pre-built Email Datasets

- Small dataset: `datasets/emails.json` (75 emails) - good for learning, fast
- Large dataset: `ai-personal-assistant/data/emails.json` (547 emails) - realistic scale
- Already structured, ready to use
- If using these, proceed straight to 02.02

#### Phase 2: Email Schema Understanding

- Show schema from [`notes.md`](./notes.md) - `Email` type
- Minimum required fields: `id`, `subject`, `body`
- Optional but useful: `from`, `to`, `timestamp`, `threadId`, `labels`
- Frontend built for emails but retrieval works on any JSON
- Key insight: map YOUR data structure to Email schema

#### Phase 3: Alternative Dataset Ideas

- Personal notes: Obsidian/Notion exports - `title` → `subject`, `content` → `body`
- Chat logs: Slack/Discord/WhatsApp - `username` → `from`, `message` → `body`
- Documentation: wikis, blog posts - `title` → `subject`, `content` → `body`
- Meeting transcripts: Zoom/Teams - `attendees` → `from`, `transcript` → `body`
- Journal entries: Day One, markdown journals - `date` → `subject`, `entry` → `body`
- Research papers: `title` → `subject`, `abstract` → `body`
- Anything JSON array can become searchable dataset

#### Phase 4: Gmail Export Option

- Google Takeout exports Gmail as mbox format
- [`notes.md`](./notes.md) shows example using `mbox` package
- Parse mbox file, extract headers + body, map to Email schema
- Write JSON array to `datasets/my-emails.json`
- Most realistic for personal assistant use case
- Warning: can be large - start with subset

### Next Up

Got dataset (pre-built or custom)? Next: 02.02 builds search algorithm - BM25 + embeddings + rank fusion applied to real project search page.
