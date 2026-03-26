Fixed-size chunks are simple, but they don't respect a document's structure. They can split important content apart and miss natural boundaries like headings and sections.

A smarter approach is to use **structural chunking** — splitting documents at meaningful delimiters like headings, chapter markers, and code blocks. This keeps related information together and makes chunks more searchable and useful for retrieval systems.

LangChain's [`RecursiveCharacterTextSplitter`](https://docs.langchain.com/oss/python/integrations/splitters) makes this possible by letting you define separators where splits are allowed, and it tries them in order until it finds the right breaking point.

## Steps To Complete

### Understanding Structural Chunking

- [ ] Review the `RecursiveCharacterTextSplitter` from LangChain

The splitter has several key properties:

| Property       | Purpose                                         |
| -------------- | ----------------------------------------------- |
| `chunkSize`    | Number of characters per chunk (not tokens)     |
| `chunkOverlap` | Character overlap between chunks for continuity |
| `separators`   | Array of delimiters where splits are allowed    |

The splitter tries separators in order, only splitting at these designated spots. It never splits at arbitrary positions.

- [ ] Navigate to `problem/api/chunks.ts` and locate the `RecursiveCharacterTextSplitter` configuration

Here's the current setup with TODOs marking what needs to be added:

```ts
const splitter = new RecursiveCharacterTextSplitter({
  // TODO: Set chunk size and overlap
  chunkSize: 1000,
  chunkOverlap: 100,
  separators: [
    // TODO: Add separators for headings (not including h1's)
    '\n## ',
    // TODO: Add separators for code blocks

    // TODO: Add separators for chapter markers (e.g., "--- CHAPTER ---")

    '\n\n',
  ],
});
```

- [ ] Run the application using `pnpm run dev` to see the current chunking behavior

- [ ] Open your browser to `localhost:3000` to view the chunks

Notice how chunks are currently split only at the `\n## ` heading separator and `\n\n` double newlines.

The chunks may look somewhat small due to the `chunkSize: 1000` setting. Some chunks contain content that should be split differently.

### Adding Separators

- [ ] Add separators for all heading levels (except h1's which use `# `)

```ts
separators: [
  '\n## ',
  '\n### ',
  '\n#### ',
  '\n##### ',
  '\n###### ',
  // ... other separators
],
```

This ensures each heading level creates a natural chunk boundary.

- [ ] Add separators for code blocks to prevent them from being split mid-block

````ts
separators: [
  // ... heading separators
  '```\n\n',
  // ... other separators
],
````

Code blocks should stay intact. The triple backticks with newlines mark the end of a code block.

- [ ] Add separators for chapter markers in the book

```ts
separators: [
  '\n--- CHAPTER ---\n',
  // ... other separators
],
```

Chapter markers typically denote major section breaks and should be high priority in your separator array.

- [ ] Add separators for horizontal lines (which may also denote section breaks)

```ts
separators: [
  // ... other separators
  '\n\n***\n\n',
  '\n\n---\n\n',
  '\n\n___\n\n',
  // ... other separators
],
```

These visual delimiters often separate different topics or ideas in the document.

### Tuning And Testing

- [ ] Adjust the `chunkSize` to create appropriately sized chunks

The current `1000` character setting may be too small for substantial chunks. Try increasing to `2000` characters.

Observe how this affects the chunk distribution in the browser. Larger chunks capture more context but may mix unrelated content.

- [ ] Adjust the `chunkOverlap` to ensure continuity between chunks

Increase from `100` to around `200` characters to preserve context across chunk boundaries.

Too little overlap may lose important context. Too much creates unnecessary duplication.

- [ ] Review the chunks in the browser at `localhost:3000`

Use the search functionality to find specific content like "TypeScript's Beginnings". Check that related content stays together—a heading with its following paragraphs should form a coherent chunk.

Verify that chapter markers properly separate major sections. Ensure code blocks aren't split in the middle.

- [ ] Use the pagination controls to browse through different chunks

Observe the stats bar showing total chunks, average character count, and current page. Notice how the chunk boundaries align with meaningful document structure.

- [ ] Experiment with different separator orderings

The order matters: separators earlier in the array are tried first. Consider this typical ordering:

| Priority | Separator Type   | Example                 |
| -------- | ---------------- | ----------------------- |
| 1        | Chapter markers  | `\n--- CHAPTER ---\n`   |
| 2        | Headings (h2-h6) | `\n## `, `\n### `, etc. |
| 3        | Code blocks      | ` ``` `                 |
| 4        | Paragraph breaks | `\n\n`                  |
| 5        | Fallbacks        | `\n`, ` `, `''`         |

Chapter markers should come before headings. Headings should come before paragraph breaks. The final separators act as fallbacks.

- [ ] Fine-tune the configuration until you achieve well-structured, searchable chunks

Chunks should contain coherent, related information. Important delimiters like headings should align with chunk boundaries.

The average chunk size should be appropriate for your use case. Test your configuration thoroughly before moving forward.
