# Retrieval Intro

## Intro

- LLMs don't know your private data: emails, docs, internal systems, personal notes
- Public info easy: Brave/Tavily search, Wikipedia, web scraping
- Private info requires retrieval: connecting LLM to your data
- Core problem: LLM context windows limited, can't load entire email inbox every request
- Solution: retrieval = finding most relevant data, feeding only that to LLM
- Foundation of personal assistant architecture
- Real-world everywhere: ChatGPT web search, customer support bots, internal knowledge bases

## What is Retrieval?

- Search problem: given query, find relevant docs from large corpus
- Two phases:
  - Index time: prepare data for fast searching (embeddings, keyword indexes)
  - Query time: user asks question → find relevant docs → feed to LLM
- Not new tech: search engines been doing this for decades
- AI twist: LLM reads results, synthesizes answer with citations
- Retrieval-Augmented Generation (RAG) = fancy term for "search then answer"

## Section Overview

- Journey from simple → sophisticated retrieval
- **01.02 - BM25**: keyword-based search, term frequency scoring, fast + deterministic
- **01.03 - Retrieval with BM25**: build email assistant, generate keywords from conversation, search + answer
- **01.04 - Embeddings**: semantic search via vector similarity, understands meaning not just keywords
- **01.05 - Rank Fusion**: combine BM25 + embeddings for best of both worlds
- **01.06 - Query Rewriting**: pre-retrieval optimization, convert conversation to focused query
- **01.07 - Reranking**: post-retrieval filtering, LLM picks most relevant from top results
- Each lesson builds on previous: simple keyword → semantic understanding → hybrid approaches → optimization

## Why This Matters

- Without retrieval: LLM hallucinates answers about your data
- With retrieval: LLM grounds responses in actual facts from your emails/docs
- Token efficiency: only send relevant context, not entire dataset
- Accuracy: LLM answers questions it couldn't possibly know otherwise
- Foundation for sections 2-4: project work applying these skills to real assistant
- Production use: every AI assistant with private data uses retrieval

## Next Up

Starting with BM25 - keyword search algorithm powering modern search engines. Foundation before semantic approaches.
