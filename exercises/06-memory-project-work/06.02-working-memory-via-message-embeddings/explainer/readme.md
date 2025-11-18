Chat conversations can go on forever. Users keep messaging without starting new chats, and the entire message history gets passed to the LLM every time.

This quickly becomes a problem. The context window fills up with old messages that aren't relevant to the current conversation. The LLM gets slower, more expensive to run, and eventually hits its limits.

The solution is **working memory** - a sliding window approach where you send the LLM only recent messages, then use retrieval to search through older messages when needed. That way, conversations can continue indefinitely without overwhelming the model.

## Made `/api/chat` receive only one message

<!-- VIDEO -->

The default behavior of the AI SDK is to send the entire message history to the API. For production applications, it's more efficient to send only the most recent message since we're persisting the full history anyway.

### Steps To Complete

#### Update the Chat Component Transport

- [ ] Import `DefaultChatTransport` from the `ai` package in `src/app/chat.tsx`

```typescript
import { DefaultChatTransport } from 'ai';
```

- [ ] Add a `transport` property to the `useChat` hook that overrides how messages are sent to the API. Instead of sending all messages, we'll send only the most recent one along with the chat ID.

<Spoiler>

```typescript
// src/app/chat.tsx

const { messages, sendMessage, status, regenerate } =
  useChat<MyMessage>({
    id: chatIdInUse,
    messages: props.chat?.messages || [],
    onData: (message) => {
      if (
        message.type === 'data-frontend-action' &&
        message.data === 'refresh-sidebar'
      ) {
        router.refresh();
      }
    },
    onFinish: () => {
      router.refresh();
    },
    generateId: () => crypto.randomUUID(),
    // ADDED: Custom transport to send only the latest message
    transport: new DefaultChatTransport({
      prepareSendMessagesRequest: (request) => {
        return {
          body: {
            id: request.body?.id,
            message:
              request.messages[request.messages.length - 1],
          },
        };
      },
    }),
  });
```

</Spoiler>

#### Update the API Route Handler

- [ ] Change the POST handler in `src/app/api/chat/route.ts` to expect a single `message` instead of an array of `messages`

<Spoiler>

```typescript
// src/app/api/chat/route.ts

export async function POST(req: Request) {
  const body: {
    // CHANGED: Changed from messages array to single message
    message: MyMessage;
    id: string;
  } = await req.json();

  const chatId = body.id;

  // ADDED: Fetch existing chat to get full message history
  let chat = await getChat(chatId);

  // CHANGED: Combine existing messages with the new message for validation
  const validatedMessagesResult =
    await safeValidateUIMessages<MyMessage>({
      messages: [...(chat?.messages ?? []), body.message],
    });

  if (!validatedMessagesResult.success) {
    return new Response(validatedMessagesResult.error.message, {
      status: 400,
    });
  }

  const messages = validatedMessagesResult.data;

  // ... rest of the handler remains the same
}
```

</Spoiler>

#### Verify the Changes

- [ ] Test the chat by sending a message. In the browser's Network tab, you should see the request payload now contains only `id` and `message` (the most recent message) instead of the entire message history.

- [ ] Send another message and verify that the payload again contains only the new most recent message.

## Added searchMessages function

<!-- VIDEO -->

Let's implement the `searchMessages` function that uses our generic embedding search to find older messages based on recent message context.

### Steps To Complete

#### Creating the `searchMessages` function

- [ ] Create a new file called `message-search.ts` in the `src/app` directory. This function will search older messages using recent messages as the query context.

<Spoiler>

```typescript
// src/app/message-search.ts
import { MyMessage } from './api/chat/route';
import { searchWithEmbeddings } from './search';
import { messageHistoryToQuery, messageToText } from './utils';

// ADDED: Function to search older messages using recent messages as context
export const searchMessages = async (opts: {
  recentMessages: MyMessage[];
  olderMessages: MyMessage[];
}) => {
  // ADDED: Early return if no older messages to search
  if (opts.olderMessages.length === 0) {
    return [];
  }

  // ADDED: Convert recent messages into an embedding query
  const query = messageHistoryToQuery(opts.recentMessages);

  // ADDED: Search older messages using embeddings with messageToText converter
  const embeddingsRanking = await searchWithEmbeddings(
    query,
    opts.olderMessages,
    messageToText,
  );

  return embeddingsRanking;
};
```

</Spoiler>

The function leverages our existing generic `searchWithEmbeddings` utility and `messageHistoryToQuery` helper to create a simple yet powerful working memory system. Recent messages become the search query, and we find the most relevant older messages to include in context.

## Using `searchMessages` to implement working memory

<!-- VIDEO -->

Let's implement working memory by using semantic search on older messages combined with recent message history.

### Steps To Complete

#### Add imports and constants

- [ ] Import the `searchMessages` function at the top of `route.ts`

```typescript
import { searchMessages } from '@/app/message-search';
```

- [ ] Add two constants below `MEMORIES_TO_USE` to control message history behavior

<Spoiler>

```typescript
const MESSAGE_HISTORY_LENGTH = 10;
const OLD_MESSAGES_TO_USE = 10;
```

</Spoiler>

#### Split messages into recent and older

- [ ] Separate the combined messages into recent messages (last 10) and older messages (everything before). This keeps recent context readily available while older messages are searched semantically.

<Spoiler>

```typescript
const recentMessages = [
  ...(chat?.messages ?? []),
  body.message,
].slice(-MESSAGE_HISTORY_LENGTH);

const olderMessages = chat?.messages.slice(
  0,
  -MESSAGE_HISTORY_LENGTH,
);
```

</Spoiler>

- [ ] Update the `safeValidateUIMessages` call to validate only the recent messages

<Spoiler>

```typescript
const validatedMessagesResult =
  await safeValidateUIMessages<MyMessage>({
    messages: recentMessages,
  });
```

</Spoiler>

#### Search for relevant old messages

- [ ] After getting `memories`, search the older messages using `searchMessages`. This finds semantically similar past messages that might be relevant to the current conversation.

<Spoiler>

```typescript
const oldMessagesToUse = await searchMessages({
  recentMessages: messages,
  olderMessages: olderMessages ?? [],
}).then((results) =>
  results
    .slice(0, OLD_MESSAGES_TO_USE)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.item),
);

console.log('oldMessagesToUse', oldMessagesToUse.length);
```

</Spoiler>

#### Combine message histories for the LLM

- [ ] Create a combined message history that includes both old messages and recent messages. Place older messages first so the LLM has historical context before recent exchanges.

<Spoiler>

```typescript
const messageHistoryForLLM = [...oldMessagesToUse, ...messages];
```

</Spoiler>

#### Update the model call

- [ ] Change the `streamText` call to use `messageHistoryForLLM` instead of just `messages`. This gives the LLM access to both recent context and semantically relevant historical messages for infinite-length conversations.

<Spoiler>

```typescript
const result = streamText({
  model: google('gemini-2.5-flash'),
  messages: convertToModelMessages(messageHistoryForLLM),
  // ... rest of config
});
```

</Spoiler>

#### Testing

- [ ] Start a conversation with multiple back-and-forth exchanges to build up message history beyond the 10 recent message limit.

- [ ] Reference something you said 15+ messages ago. The LLM should be able to retrieve and use that context through semantic search.

- [ ] Check the browser console or server logs to see `oldMessagesToUse` logged. You should see it retrieving old messages as your conversation grows.
