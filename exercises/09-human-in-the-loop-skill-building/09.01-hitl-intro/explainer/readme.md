In this section, we're going to explore one of the most essential UX patterns you need to know if you're building a personal assistant or building any kind of AI that's supposed to do actual things in the world.

That pattern is **human in the loop**.

Instead of giving the AI full power to do anything it wants in the world, you make it check with you first before actually going and doing anything.

## The AI SDK v6 Announcement

This material is in a funny spot because the [AI SDK](/PLACEHOLDER/ai-sdk) announced [v6](https://v6.ai-sdk.dev/docs/announcing-ai-sdk-6-beta) recently, which just adds a small extra couple of features on top of v5.

| Version Jump | Size  |
| ------------ | ----- |
| v4 to v5     | Large |
| v5 to v6     | Small |

One of the features they did announce was human in the loop. This is where you can specify [tool execution approval](/PLACEHOLDER/tool-execution-approval) by just adding `needsApproval: true` to a [tool definition](/PLACEHOLDER/tool-definition).

This is really great—it's obviously fantastic that this is baked into the [AI SDK](/PLACEHOLDER/ai-sdk) itself.

However, v6 is still in beta, and I don't yet feel comfortable teaching it - it's not yet stable enough.

## Building It Ourselves

Instead, we're going to be building this ourselves using [custom data parts](/PLACEHOLDER/custom-data-parts).

This is an incredibly valuable exercise because it teaches you how powerful custom data parts are as an abstraction.

Once you've built human in the loop with them, I promise you can build really anything with them.

In terms of human-in-the-loop, I always think it's better to learn things by building them from scratch.
