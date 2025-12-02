Project exercises are where you take what you've learned in skill-building sections and apply it to a real project. Real projects don't follow a clean linear path. They zigzag as you try different approaches and iterate.

To make this more realistic, I've given you an entire commit history showing me building a project from scratch. Each exercise is built around a single commit in this history.

## The Exercise Structure

Each exercise page contains:

- **An introductory video** explaining what I did in the commit(s)
- **A recommendation** on how to approach the commit
- **Two utility commands** (`pnpm reset` and `pnpm cherry pick`) to help you work through it
- **Detailed steps** for hand-coding, with optional code samples
- **Tests at the bottom** to verify your work

You can tackle these exercises in two fundamentally different ways, depending on your learning style.

## Approach 1: Cherry Picking Commits

The `pnpm cherry pick` command works like [git cherry-pick](https://git-scm.com/docs/git-cherry-pick). It applies a specific commit on top of your current work.

```bash
pnpm cherry pick 2.2.03
```

```txt
Successfully cherry-picked Lesson 2.2.3
```

**When to use this:**

- You want to build your own implementation but incorporate my changes
- You've diverged from my solution and want to merge in new material
- You want to move through exercises faster

The beauty of cherry picking is that you keep all your previous work while pulling in new code. If you've made conflicting changes, you might get merge conflicts, but you can resolve those (or even use AI to help) and continue forward.

## Approach 2: Resetting to a Checkpoint

The `pnpm reset` command works like [git reset](/PLACEHOLDER/git-reset-documentation)—it resets your entire repository to a specific commit's state.

```bash
pnpm reset
```

**When to use this:**

- You want a completely guided experience
- You want to ensure you don't drift from my implementation
- You want a clean slate before starting a new exercise

This is perfect if you prefer to start each exercise fresh without worrying about previous work conflicting.

However, reset is destructive—any local changes you've made will be completely lost. So make sure you've committed your changes before resetting. The CLI will also give you the option to create a new branch before resetting.

This way, if you ever want to go back to your previous work, it's still there on your old branch.

### The Two Options Within Each Exercise

When you `reset` to an exercise, you'll see two choices at the top of the commands section:

| Option             | Result                                                                |
| ------------------ | --------------------------------------------------------------------- |
| Start the exercise | Resets to the commit _before_ the target, so you can code it yourself |
| See the final code | Resets to the target commit itself, showing you the complete solution |

Choose "start the exercise" if you want to hand-code and learn. Choose "see the final code" if you just want to see what the result should look like.

## Your Recommended Workflow

Here's how I suggest you work through these exercises:

1. **Read the recommendation** at the top of each exercise to see whether I suggest cherry picking or hand-coding

2. **For hand-coded exercises:**
   - Watch the introductory video
   - Work through the steps provided
   - Use the code samples to check your work as you go
   - Run the tests at the bottom to verify

3. **For cherry-pick exercises:**
   - Copy the `pnpm cherry pick` command
   - Paste it into your terminal
   - Watch the video to understand what was added
   - Review the code carefully

4. **If you get lost or want a reset:**
   - Use `pnpm reset` anytime to return to a known state
   - Create a new branch first so you don't lose your work
   - Continue from there

## Why This Matters

This workflow gives you the best of both worlds. You can hand-code the stuff that matters most while skipping the tedious, repetitive parts. You're free to diverge completely from my implementation and build things your own way, yet you can still pull in reference material whenever you need it.

You can move at your own pace—blazing through exercises with cherry picks when you're confident, or slowing down to hand-code everything when you're learning something new. The choice is yours.
