# Prompt: Add Crash Course Links to Exercise Section

Add "Crash Course Links" sections to all exercises in a skill-building section, linking back to prerequisite lessons from the AI Engineering Crash Course in `LESSON_LEARNINGS.md`.

## Instructions

1. Find all `readme.md` files in the specified skill-building section (e.g., `exercises/01-retrieval-skill-building/`)

2. For each exercise, analyze:
   - What AI SDK functions/patterns it uses (`streamObject`, `generateObject`, `streamText`, `embed`, etc.)
   - What prompting techniques it requires (basic prompting, exemplars, chain of thought, etc.)
   - What streaming patterns it implements (custom data parts, message metadata, error handling, etc.)

3. Add a "## Crash Course Links" section at the end of each README with:
   - Links to relevant crash course lessons in `internal/LESSON_LEARNINGS.md` using relative paths
   - Brief descriptions of what each link covers (e.g., "`streamObject()` for structured keyword generation")
   - Use markdown anchor links to specific sections (e.g., `#0109---streaming-objects`)

4. Guidelines:
   - **Only link if truly prerequisite** - don't add links just because they're tangentially related
   - If nothing from crash course is needed, omit the section entirely
   - Keep descriptions concise - just explain what the link provides
   - Use relative paths: `../../../../../internal/LESSON_LEARNINGS.md#section-anchor`
   - For exercises building on previous exercises in same section, can reference those instead

5. Example format:

```markdown
## Crash Course Links

- [01.09 - Streaming Objects](../../../../../internal/LESSON_LEARNINGS.md#0109---streaming-objects) - `streamObject()` for structured keyword generation
- [05.02 - Basic Prompting](../../../../../internal/LESSON_LEARNINGS.md#0502---basic-prompting) - Prompt engineering fundamentals
```

## Usage

Replace `[SECTION_NAME]` with the skill-building section to process (e.g., `01-retrieval-skill-building`, `03-memory-skill-building`, `05-evals-skill-building`):

```
Add crash course links to all exercises in exercises/[SECTION_NAME]/ following the pattern from retrieval skill building
```
