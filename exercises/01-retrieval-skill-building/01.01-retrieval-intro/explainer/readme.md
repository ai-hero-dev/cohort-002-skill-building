# Training LLMs on Private Data

One question I get all the time is: how do I train an LLM on my private data? I want to customize an LLM, I want to make it understand me, and I want it to know what I know so that it can help me better.

This, I think, is the wrong way of thinking about LLMs.

Instead of training your own LLM from scratch, you should be thinking about how to augment existing LLMs. Training LLMs from scratch is an extremely expensive business, but augmenting LLMs with retrieval is extremely powerful and cheap.

## How LLMs Are Trained

You probably have an idea for how LLMs are trained, but I just want to make it really secure in your head.

![How Are LLMs Trained?](./diagrams/how-are-llms-trained.png)

Let's say you're training a 70 billion parameter model. You take in, let's say, 10 terabytes of training data (which is `all-of-human-knowledge_final.md`). You go through a phase called **pre-training**, which basically compresses that data into a much smaller set of parameters.

These parameters are then what are used by the model to guide its behavior. They represent the model's understanding of the world — in other words, all of human knowledge.

Now you can see that there's 10 terabytes of data there, but it gets compressed down into 140 gigabytes. That is an extremely lossy compression algorithm.

To use an old internet term, this knowledge, when it actually gets to the LLM, is potato quality. If it were a video, you'd be struggling to make out what was on the screen.

## Why LLMs Hallucinate

And so it's no wonder then that LLMs hallucinate — because they don't really have access to the training data. They just have access to an extremely compressed version of it.

Whenever you're looking to create some kind of output from the LLM, you need to work backwards from the desired output to what inputs you need.

**Hallucinations are pretty much always a symptom of lacking context.**

![Hallucinated Outputs](./diagrams/hallucinated-outputs.png)

If you don't retrieve any data, then you can't be surprised when the LLM hallucinates things that it thinks might be there.

But if you do go away and retrieve some data and feed that into the LLM at inference time — in other words, the time that it's producing the output tokens for you — then you're much, much, much more likely to get correct outputs.

## Retrieval vs Pre-Training

Now this data that I've modeled here is on public-facing websites, right: `somearticle.com` or `mydocs.com`. The LM could probably find these by just using a public Google search, hooking it up to an API like [Tavily](https://tavily.com/) or [Serper](https://serper.dev/) or something like that.

But what about when the data is private? What about when the data is on your machine?

Well, this is what we're going to focus on in this section. We're going to look at how to make notes or emails on your machine or any data that you have searchable, so that you can then retrieve it just in time, pass it to an LLM, and it will understand your personal context.

This means that the retrieved data is always up to date. Whereas if we had to do pre-training, we would need to run the pre-training every single time we got some new information. Every time we received an email or something, we'd need to run this incredibly expensive pre-training again.

And even then, the data would be so lossy, it would hardly be worth it.

Whereas when retrieval is done well, it provides the LLM the documents it needs right at the moment it needs it.

## What's Coming Next

In this section, we're going to look at different strategies for that:

- **BM25** — a traditional search algorithm
- **Embeddings and vector databases** — semantic search with AI
- **Query rewriting** — improving search queries
