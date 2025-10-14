import { runLocalDevServer } from '#shared/run-local-dev-server.ts';
import {
  EMBED_CACHE_KEY,
  embedTsDocs,
} from './api/create-embeddings.ts';

console.log('Embedding TS Docs');

await embedTsDocs(EMBED_CACHE_KEY);

console.log('Embedding complete');

await runLocalDevServer({
  root: import.meta.dirname,
});
