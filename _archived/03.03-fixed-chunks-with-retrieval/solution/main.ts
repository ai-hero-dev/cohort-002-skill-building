import { runLocalDevServer } from '#shared/run-local-dev-server.ts';
import { embedChunks } from './api/embeddings.ts';

console.log('Embedding book chunks');

await embedChunks();

console.log('Embedding complete');

await runLocalDevServer({
  root: import.meta.dirname,
});
