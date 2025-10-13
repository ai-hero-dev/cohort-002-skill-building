# Building Your Own Dataset

## Pre-built Options

Workshop includes pre-built email datasets:

- **Small**: `datasets/emails.json` (75 emails) - good for learning
- **Large**: `ai-personal-assistant/data/emails.json` (547 emails) - realistic scale

Skip this exercise if using pre-built.

## Email Schema

From 01.02:

```ts
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
```

Minimum required: `id`, `subject`, `body`

## Alternative Datasets

Frontend built for emails, but retrieval works on any JSON array. Map your data to Email schema:

### Personal Notes

- Obsidian/Notion exports
- Map: `title` → `subject`, `content` → `body`
- Example: vault of markdown notes

### Chat Logs

- Slack/Discord/WhatsApp exports
- Map: `username` → `from`, `message` → `body`
- Preserve threads via `threadId`

### Documentation

- Wiki pages, blog posts, code comments
- Map: `title` → `subject`, `content` → `body`

### Meeting Transcripts

- Zoom/Teams recordings
- Map: `attendees` → `from`, `transcript` → `body`

### Journal Entries

- Day One exports, markdown journals
- Map: `date` → `subject`, `entry` → `body`

### Research Papers

- Title → `subject`, abstract → `body`
- PDF to text conversion

## Gmail Export via mbox

Google Takeout → Mail → mbox format

```ts
import Mbox from 'mbox';
import { writeFile } from 'fs/promises';

const mbox = new Mbox('path/to/takeout.mbox');
const emails: Email[] = [];

mbox.on('message', (msg) => {
  emails.push({
    id: crypto.randomUUID(),
    from: msg.headers.from,
    to: msg.headers.to,
    subject: msg.headers.subject,
    body: msg.body,
    timestamp: msg.headers.date,
  });
});

await mbox.read();
await writeFile(
  'datasets/my-emails.json',
  JSON.stringify(emails, null, 2),
);
```

## Next Steps

Proceed to 02.02 to build search algorithm using your dataset.
