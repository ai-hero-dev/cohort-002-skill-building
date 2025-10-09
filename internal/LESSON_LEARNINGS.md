# AI Engineering Crash Course - Lesson Learnings

## 01: AI SDK Basics

### 01.01 - What is the AI SDK

- Intro lesson - no code

### 01.02 - Choosing Your Model

- Provider packages: `@ai-sdk/openai`, `@ai-sdk/google`, `@ai-sdk/anthropic`
- Env vars: `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `ANTHROPIC_API_KEY`
- Model instantiation: `openai('gpt-4o-mini')`, `google('gemini-2.0-flash')`, `anthropic('claude-3-5-sonnet')`

### 01.03 - Generating Text

- `generateText(model, prompt)` syntax
- `await result.text` for response

### 01.04 - Stream Text to Terminal

- `streamText(model, prompt)` for streaming
- `stream.textStream` returns async iterable
- `for await...of` loop to consume chunks
- `process.stdout.write()` for terminal output

### 01.05 - UI Message Streams

- `UIMessage` type - represents messages in UI
- `stream.toUIMessageStream()` converts to structured stream
- Stream objects: `{type: 'start'}`, `{type: 'text-delta', id, delta}`, `{type: 'finish'}`

### 01.06 - Stream Text to UI

- `useChat()` hook from `@ai-sdk/react`
- Returns `messages`, `sendMessage`
- `convertToModelMessages(UIMessage[])` converts UIMessage[] to ModelMessage[]
- `streamText()` accepts `messages` param
- `createUIMessageStreamResponse({stream})` returns Response

### 01.07 - System Prompts

- `system` param in `streamText()`
- `SYSTEM_PROMPT` for LLM behavior customization

### 01.08 - Passing Images and Files

- `sendMessage({text, parts})` accepts parts array
- parts can include file data
- `fileToDataURL(file)` converts File to data URL
- Models like gemini-2.0-flash support image inputs

### 01.09 - Streaming Objects

- `streamObject()` for structured output
- `schema` param accepts Zod schema
- `z.object({facts: z.array(z.string())})` syntax
- `partialObjectStream` returns async iterable of partial objects

## 02: LLM Fundamentals

### 02.01 - Tokens

- js-tiktoken library: `new Tiktoken(o200k_base)`
- `tokenizer.encode(text)` returns array of token IDs
- Tokens are currency of LLMs, not characters
- `o200k_base` tokenizer for GPT-4o

### 02.02 - Usage

- `await output.usage` for token consumption tracking
- usage object has `promptTokens`, `completionTokens`, `totalTokens`, `cachedInputTokens`
- usage is promise from streamText output

### 02.03 - Data Represented as Tokens

- Data format affects token efficiency: Markdown < XML < JSON
- `JSON.stringify(data, null, 2)` for formatted JSON
- Fewer tokens in context = better performance

### 02.04 - Context Window

- Context window = limit of input + output tokens
- `maxRetries: 0` to prevent retry on expected failures
- Exceeding context window throws quota/validation errors
- Different models have different context window sizes

### 02.05 - Prompt Caching

- Prompt caching reduces cost on repeat requests
- `cachedInputTokens` property on usage
- Cache invalidates when first non-matching token found
- `tokenizer.decode()` converts tokens back to text
- Conversations cache previous messages, only new content charged at full rate
- Cached vs uncached tokens billed differently

## 03: Agents

### 03.01 - Tool Calling

- `tool()` function from 'ai' SDK - define tools with description, inputSchema (zod), execute function
- `stepCountIs()` stop condition - limit agent steps
- `tools` object passed to `streamText()`
- `stopWhen` parameter for custom stop conditions
- Multi-step tool calling - LLM calls tool, waits for response, calls again

### 03.02 - Message Parts

- `toUIMessageStream()` converts streamText to UIMessageStream
- `onFinish` callback - access final messages structure
- Stream events: tool-input-start, tool-input-delta, tool-input-available, tool-output-available
- `UIMessage.parts` array - structured format containing step-start, tool-{name}, text parts
- `parts[].state` property - tracks tool execution state (output-available, done)

### 03.03 - Showing Tools in the Frontend

- `InferUITools<typeof tools>` - infer tool types for type safety
- `UIMessage<TRole, TSteps, TTools>` - generic type with tool parameter
- Custom `MyUIMessage` type - UIMessage with inferred tools
- `useChat<MyUIMessage>()` - pass custom message type to useChat
- `MyUIMessage['parts']` - typed parts for frontend rendering
- Extract tools to module scope for type inference

### 03.04 - MCP via Stdio

- `experimental_createMCPClient()` from 'ai' - create MCP client
- `Experimental_StdioMCPTransport` from 'ai/mcp-stdio' - stdio transport
- `StdioMCPTransport` config - command, args, env for Docker
- `mcpClient.tools()` - get tools from MCP server
- `mcpClient.close()` - cleanup MCP client in onFinish
- Docker run for MCP server via stdio

### 03.05 - MCP via SSE

- SSE transport alternative to stdio
- `transport: { type: 'sse', url, headers }` - SSE config
- Direct API connection vs local process
- No StdioMCPTransport needed for SSE
- Authorization via Bearer token in headers

## 04: Persistence

### 04.01 - onFinish

- `streamText.onFinish` callback with `response.messages` (model messages)
- `toUIMessageStreamResponse.onFinish` callback with `messages` (full history) and `responseMessage` (single new message)
- `originalMessages` parameter in toUIMessageStreamResponse for full conversation persistence

### 04.02 - Pass Chat ID to the API

- AI SDK auto-generates UUID on frontend and passes as id in request
- `useSearchParams` from react-router for URL-based chatId
- Pass `id` to useChat hook to control chat identity
- `crypto.randomUUID()` for fallback chatId

### 04.03 - Persistence

- `getChat` and `appendToChatMessages` persistence functions
- `createChat` for new chat initialization
- `useSuspenseQuery` from React Query for loading chat data
- Pass `id` and `initialMessages` to useChat hook
- `setSearchParams` to update URL with chatId on first send
- GET endpoint with `url.searchParams.get` for fetching chat
- onFinish in toUIMessageStreamResponse to persist AI response

### 04.04 - Persistence in a Normalized DB

- Normalized DB schema with separate parts table vs JSON blob
- Drizzle ORM for schema definition (`pgTable`, `varchar`, `references`, `onDelete` cascade)
- SQL check constraints for enforcing part type field requirements
- `mapUIMessagePartsToDBParts` and `mapDBPartToUIMessagePart` conversion functions
- Prefixed field names (`text_text`, `reasoning_text`) for different part types
- `order` field for maintaining part sequence

### 04.05 - Validating Messages

- `validateUIMessages` function for backend validation
- Try-catch pattern for validation error handling
- Returns typed `UIMessage[]` or throws error

## 05: Context Engineering

### 05.01 - The Template

- Anthropic prompt template structure: task-context, tone-context, background-data, rules, examples, conversation-history, the-ask, thinking-instructions, output-formatting
- XML tags for marking prompt sections and wrapping documents
- LLM bias toward beginning and end of prompts - put critical instructions (the-ask, output-formatting) at end
- Few-shot prompting via examples section
- Template function pattern with string interpolation for dynamic prompts

### 05.02 - Basic Prompting

- Apply template to real use case: generating conversation titles
- Minimal template usage - only need task-context, conversation-history, the-ask, output-format
- Output formatting instructions to constrain LLM response (prevent verbose output)
- `streamText()` with `prompt` parameter

### 05.03 - Exemplars

- Exemplars (input-output pairs) show model desired responses
- XML formatting: `<example><input></input><expected></expected></example>`
- Exemplars can replace explicit rules - examples convey intent
- Exemplars array with input/expected structure

### 05.04 - Retrieval

- Tavily API for web scraping: `tavily.extract([url])`
- Retrieved external data reduces hallucinations
- Format scraped content in `<background-data>` or `<content>` XML tags
- Rules for citing sources: instruct model to quote website content
- `rawContent` extraction from `scrapeResult.results[0]`

### 05.05 - Chain of Thought

- Chain of thought: get LLM to plan/think before solving
- Thinking instructions: 'think about answer first before responding'
- `<thinking>` XML block separates reasoning from final answer
- Output format with two sections: thinking block + answer (answer NOT in XML)
- Chain of thought improves complex task quality by burning tokens on planning

## 06: Evals

### 06.01 - Evalite Basics

- `evalite()` config: `data()`, `task()`, `scorers[]`
- `generateText()` for AI calls in task
- Scorer returns 0-1 score
- Run locally on port 3006

### 06.02 - Deterministic Eval

- Deterministic scorers: fast, code-based checks
- Check markdown links with regex
- Check output length
- Eval-driven dev: write scorers, iterate prompt

### 06.03 - LLM as a Judge Eval

- LLM-as-a-judge for subjective metrics
- `createScorer()` for separate scorer files
- Use string grades (A/B/C/D) not numbers (LLMs biased)
- `generateObject()` with schema for judge
- Return score + metadata (feedback)
- Pass PDF with `type: 'file', mediaType: 'application/pdf'`

### 06.04 - Dataset Management

- Dev dataset: 5-10 evals, every local change
- CI dataset: medium size, <15min, every commit
- Regression dataset: 500-1000+ evals, scheduled
- Move evals between datasets as needed

### 06.05 - Chat Title Generation

- CSV dataset with input/output pairs
- Slice dataset with EVAL_DATA_SIZE for iteration
- Visual comparison before scorers
- Add deterministic scorer for length
- Add LLM-as-judge scorer for quality comparison

### 06.06 - Critiquing Our Chat Title Generation Dataset

- Data quality metrics: quantity, quality, coverage
- Test edge cases: malicious, non-English, long/short, poor grammar
- Garbage in, garbage out principle
- Diversity > just high quality

### 06.07 - Langfuse Basics

- LangFuse for observability
- `NodeSDK` + `LangfuseExporter` in otelSDK
- `Langfuse({environment, publicKey, secretKey, baseUrl})`
- `langfuse.trace({sessionId})`
- Trace = container, span = unit of work
- `experimental_telemetry: {isEnabled, functionId, metadata: {langfuseTraceId}}`
- `langfuse.flushAsync()` to send traces

## 07: Streaming

### 07.01 - Custom Data Parts

- `UIMessage<never, { customDataPartType: dataType }>` - extends UIMessage with custom data parts
- `createUIMessageStream({ execute: async ({ writer }) => {} })` - creates custom message stream
- `writer.merge(streamTextResult.toUIMessageStream())` - merges streamText result into parent stream
- `await streamTextResult.consumeStream()` - consumes stream until fully read
- `writer.write({ id, type, data })` - writes custom data parts to stream
- `crypto.randomUUID()` - generates unique ID for data part reconciliation
- `followupSuggestionsResult.textStream` - iterates over streaming text chunks
- `messages[i].parts.find(part => part.type === 'data-suggestion')` - extracts custom data part from message

### 07.02 - Custom Data Parts with streamObject

- `streamObject({ model, schema, messages })` - generates structured outputs instead of text
- `schema: z.object({ suggestions: z.array(z.string()) })` - defines Zod schema for structured output
- `followupSuggestionsResult.partialObjectStream` - iterates over partial objects as they stream
- `chunk.suggestions?.filter(Boolean)` - filters undefined values from partial array

### 07.03 - Message Metadata

- `UIMessage<{ duration: number }>` - first type parameter is metadata (vs second for data parts)
- `result.toUIMessageStreamResponse<MyUIMessage>({ messageMetadata: (part) => {} })` - adds metadata function
- `messageMetadata` callback - called on every part, return metadata object when `type === 'finish'`
- `Date.now()` - start/end timestamps to calculate duration
- `message.metadata` - access metadata in frontend

### 07.04 - Error Handling

- `onError(error)` handler in createUIMessageStream - handles errors thrown in execute function
- `RetryError.isInstance(error)` - checks if error is RetryError type
- onError return value - custom error message shown to user
- useChat returns `error` property - destructure to access error in frontend
- `error.message` - display error message in UI

## 08: Agents and Workflows

### 08.01 - Workflow

- Generator-evaluator workflow pattern
- `generateText()` for non-streaming LLM calls
- Sequential LLM calls with output feeding into next prompt

### 08.02 - Streaming Custom Data to the Frontend

- `sendStart: false` in `writer.merge()`
- Manual start/finish parts with `{ type: 'start' }`

### 08.03 - Creating Your Own Loop

- `while` loop for iterative LLM workflows
- State tracking across iterations (step, mostRecentDraft, mostRecentFeedback)
- Manual text part streaming (text-start, text-delta, text-end)
- Loop iteration count as config/tuning parameter

### 08.04 - Breaking the Loop Early

- LLM-controlled loop breaking via boolean field
- Combining streaming UX with structured output validation

## 09: Advanced Patterns

### 09.01 - Guardrails

- `generateText()` for fast guardrail calls before main LLM
- Single-digit output (0/1) for speed optimization
- Manual streaming with text-start/text-delta/text-end parts via `writer.write()`
- Early return pattern to halt stream execution
- `console.time/timeEnd` for performance monitoring

### 09.02 - Model Router

- Model routing via `generateText()` to select model dynamically
- `messageMetadata` in `toUIMessageStream()` to pass data to frontend

### 09.03 - Comparing Multiple Outputs

- `Promise.all()` for parallel `streamText()` calls
- `AsyncIterableStream<string>` type
- Custom data-output parts for multiple outputs
- `messages.slice()` to replace messages in useChat
- `setMessages()` from useChat hook
- Converting data parts to text parts for message history

### 09.04 - Research Workflow

- Multi-step workflow: generate queries → search → summarize
- Markdown links in LLM responses for citations
