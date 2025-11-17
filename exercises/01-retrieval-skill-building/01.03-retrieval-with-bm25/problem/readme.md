We're going to take the BM25 knowledge we've acquired and plug it into a retrieval system for an LLM. This will let us ask questions about an email dataset, and the system will search through it to find relevant emails.

The key is generating keywords from the user's question, searching our email corpus with those keywords, and then injecting the results into the message history so the LLM can answer based on real data.

## Steps To Complete

### Set Up BM25 Search

- [ ] Import the necessary functions and libraries at the top of `api/chat.ts`

```ts
import { generateObject } from 'ai';
import { searchEmails } from './bm25.ts';
import z from 'zod';
```

- [ ] Implement keyword generation inside the `POST` route

Generate keywords from the conversation history using [`generateObject()`](/PLACEHOLDER/generateObject):

```ts
// TODO: Implement a keyword generator that generates a list of keywords
// based on the conversation history. Use generateObject to do this.
const keywords = TODO;
```

When implementing this:

- Use [`generateObject()`](/PLACEHOLDER/generateObject) with your selected model
- Use the `KEYWORD_GENERATOR_SYSTEM_PROMPT` already defined at the top of the file
- Define a schema using [`z.object()`](/PLACEHOLDER/zod-object) with a `keywords` array of strings
- Pass the conversation messages using [`convertToModelMessages()`](/PLACEHOLDER/convertToModelMessages)
- Extract the `keywords` array from the generated object
- Log the generated keywords to the console so you can see what was generated

- [ ] Implement email search using the generated keywords

Search your email corpus and get the top results:

```ts
// TODO: Use the searchEmails function to get the top X number of
// search results based on the keywords
const topSearchResults = TODO;
```

When implementing this:

- Use the `searchEmails()` function from `bm25.ts` with your generated keywords
- Filter the results to get the top X number of emails (suggested: top 10) using the [`slice()`](/PLACEHOLDER/array-slice) method
- Optionally filter out results with low relevance scores (scores greater than 0)
- Optionally log the top search results to see which emails were retrieved

### Test Your Implementation

- [ ] Run the exercise with `pnpm run dev` and open the local dev server at `localhost:3000`

- [ ] Test with the pre-populated question

The app comes with a default question already filled in: "What did David say about the mortgage application?"

- [ ] Observe the generated keywords in your terminal

Check that meaningful keywords were extracted from the question.

- [ ] Verify email injection into the message history

Check that email snippets are being added to the conversation before the [LLM](/PLACEHOLDER/llm-basics) sees them.

- [ ] Confirm the LLM is answering based on retrieved emails

The answer should reference specific information from the emails that were found.

- [ ] Verify source citation

The [LLM](/PLACEHOLDER/llm-basics) should cite its sources using email subject lines in [markdown format](/PLACEHOLDER/markdown-syntax).
