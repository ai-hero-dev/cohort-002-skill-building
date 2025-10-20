import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { readFileSync } from 'fs';
import path from 'path';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 2000,
  chunkOverlap: 200,
  separators: [
    // First, try to split along Markdown headings (starting with level 2)
    '\n--- CHAPTER ---\n',
    '\n## ',
    '\n### ',
    '\n#### ',
    '\n##### ',
    '\n###### ',
    // Note the alternative syntax for headings (below) is not handled here
    // Heading level 2
    // ---------------
    // End of code block
    '```\n\n',
    // Horizontal lines
    '\n\n***\n\n',
    '\n\n---\n\n',
    '\n\n___\n\n',
    // Note that this splitter doesn't handle horizontal lines defined
    // by *three or more* of ***, ---, or ___, but this is not handled
    '\n\n',
    '\n',
    ' ',
    '',
  ],
});

const bookText = readFileSync(
  path.join(
    import.meta.dirname,
    '../../../../../datasets/total-typescript-book.md',
  ),
  'utf-8',
);

export const GET = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const search = url.searchParams.get('search') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const pageSize = parseInt(
    url.searchParams.get('pageSize') || '20',
    10,
  );

  // Split text into chunks
  const allChunks = await splitter.splitText(bookText);

  // Filter chunks based on search query
  const filteredChunks = search
    ? allChunks.filter((chunk) =>
        chunk.toLowerCase().includes(search.toLowerCase()),
      )
    : allChunks;

  // Calculate stats
  const totalChunks = filteredChunks.length;
  const avgChars =
    totalChunks > 0
      ? Math.round(
          filteredChunks.reduce(
            (sum, chunk) => sum + chunk.length,
            0,
          ) / totalChunks,
        )
      : 0;
  const pageCount = Math.ceil(totalChunks / pageSize);

  // Paginate
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedChunks = filteredChunks.slice(startIdx, endIdx);

  // Return chunks with their original indices
  const chunksWithIndices = paginatedChunks.map(
    (chunk, localIdx) => ({
      index: startIdx + localIdx,
      content: chunk,
    }),
  );

  return Response.json({
    chunks: chunksWithIndices,
    stats: {
      total: totalChunks,
      avgChars,
      pageCount,
      currentPage: page,
    },
  });
};
