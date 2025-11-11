# Evaluating Retrieval

## Learning Goals

- Test retrieval quality using production dataset
- Manually identify key emails for evaluation
- Score retrieval: 1.0 top result, 0.5 positions 2-5, 0 otherwise
- Import search from project work (lesson 2.2)
- Quantify retrieval accuracy across question types

## Steps To Complete

### 1. Manual Dataset Analysis

Read through `datasets/emails.json`, identify 8-10 key factual emails. Choose emails with clear retrieval signals.

Examples:
- Mortgage pre-approval amount/date
- Property offer details
- Gazumping notification
- Seller counter-offer
- Sarah's job/consulting income

### 2. Define Test Cases

Create array of test cases: `{ query: string, expectedEmailId: string }`.

```ts
const testCases = [
  {
    query: "How much was the mortgage pre-approved for?",
    expectedEmailId: "email_1759404231272_8kx9u19f1" // £350k
  },
  {
    query: "Why did the Victoria Road property fall through?",
    expectedEmailId: "email_1759404414521_3nuwc29np" // gazumped
  },
  // ... 8-10 total
];
```

Diverse queries: amounts, dates, reasons, people, locations.

### 3. Import Search Algorithm

Import search from `../ai-personal-assistant` (lesson 2.2 project work).

```ts
import { search } from '../../../../../ai-personal-assistant/src/lib/search';

// Or copy BM25 + embeddings + RRF implementation
```

Search returns `Array<{ email: Email; score: number }>` sorted by relevance.

### 4. Build Evalite Test Suite

```ts
import { evalite } from 'evalite';

evalite('Retrieval Quality', {
  data: async () => testCases,
  task: async (testCase) => {
    const results = await search(testCase.query);
    return results;
  },
  scorers: [
    (output, testCase) => {
      const position = output.findIndex(
        (result) => result.email.id === testCase.expectedEmailId
      );

      if (position === 0) return { score: 1.0, name: 'top_result' };
      if (position >= 1 && position <= 4) return { score: 0.5, name: 'top_5' };
      return { score: 0, name: 'missed' };
    }
  ]
});
```

### 5. Customize Evalite UI Columns

Display query + expected email + result position for debugging. Use `columns` function.

```ts
evalite('Retrieval Quality', {
  data: async () => testCases,
  task: async (testCase) => {
    const results = await search(testCase.query);
    return results;
  },
  scorers: [
    (output, testCase) => {
      const position = output.findIndex(
        (result) => result.email.id === testCase.expectedEmailId
      );

      if (position === 0) return { score: 1.0, name: 'top_result' };
      if (position >= 1 && position <= 4) return { score: 0.5, name: 'top_5' };
      return { score: 0, name: 'missed' };
    }
  ],
  columns: async (result) => {
    const position = result.output.findIndex(
      (r) => r.email.id === result.input.expectedEmailId
    );

    return [
      {
        label: 'Query',
        value: result.input.query
      },
      {
        label: 'Expected Email',
        value: result.input.expectedEmailId
      },
      {
        label: 'Position',
        value: position === -1 ? 'Not found' : `#${position + 1}`
      }
    ];
  }
});
```

See https://www.evalite.dev/guides/customizing-the-ui.

### 6. Run & Analyze

```bash
pnpm evalite
```

Expected output:
- Query, Expected Email, Position columns in UI
- Per-query scores
- Overall accuracy
- Which query types fail

### Notes

- Focus: retrieval mechanism quality, not agent output
- Production dataset = realistic test
- Manual curation > synthetic generation here
- Helps tune BM25/embeddings/reranking params
- Catch regressions when changing search impl
