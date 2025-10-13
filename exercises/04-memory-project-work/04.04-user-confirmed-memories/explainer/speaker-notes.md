# User Confirmed Memories

## Explainer

### Intro

- Previous approaches: automatic (04.03) or LLM-controlled tools (04.02)
- User has no control - LLM decides what to remember
- Privacy concerns, accuracy issues, trust problems
- User confirmation = maximum control approach
- Nothing saved without explicit approval
- Trade complexity + friction for transparency + trust

### The HITL Pattern for Memories

- Human-in-the-loop (HITL) applied to memory operations
- LLM suggests, user approves/rejects
- Similar to Section 07 HITL but for memories not actions
- Flow: generate suggestions → send as transient → UI approval → execute
- Transient data parts = ephemeral, don't persist in history
- Perfect for approval flows - visible during stream only

### Implementation Architecture

#### Step 1: Define Custom Data Part

[`notes.md`](./notes.md) lines 9-33

- Add `memory-suggestions` type to `MyMessage`
- Same structure as 04.03 automatic extraction
- Contains updates/deletions/additions arrays
- Transient flag prevents persistence

#### Step 2: Generate Suggestions in onFinish

[`notes.md`](./notes.md) lines 42-98

- Reuses `extractMemories()` from 04.03
- Called in `onFinish` callback after response
- Writer parameter allows sending data parts
- `transient: true` = doesn't persist
- Only send if operations exist
- Console logs track suggestion generation

#### Step 3: Detect Transient Data

[`notes.md`](./notes.md) lines 100-144

- Frontend `onData` callback fires on transient parts
- Store suggestions in component state
- Shows alert notification when received
- Transient parts won't appear in messages array
- Perfect for ephemeral approval flows

#### Step 4: Build Approval UI

[`notes.md`](./notes.md) lines 146-335

- Dialog opens automatically when suggestions arrive
- Three operation types: create (additions), update, delete
- Badge colors: secondary (create/update), destructive (delete)
- Track approved operations separately from suggestions
- Individual approve/reject per operation
- Bulk "Approve All" / "Reject All" buttons
- Close dialog clears pending state

#### Step 5: Execute Approved Operations

[`notes.md`](./notes.md) lines 337-423

- Server action pattern for secure execution
- Receives only approved operations
- Same conflict filtering as 04.03
- Filters deletions to avoid conflicts with updates
- Calls persistence layer functions
- Router refresh updates sidebar immediately
- Only executes what user approved

### Testing the Flow

[`notes.md`](./notes.md) lines 425-455

Test scenarios:
- Additions: "My favorite color is blue" → alert → modal → approve → sidebar
- Updates: "Actually green" → update operation → approve → memory updated
- Deletions: "Don't care anymore" → delete operation → approve → removed
- Rejections: share info → reject all → nothing saved
- Partial approval: 3 suggestions → approve 1 → only 1 executed
- Casual chat: "Hello" → no suggestions generated

### Steps To Complete

- Run dev server in ai-personal-assistant repo
- Share personal information, wait for alert notification
- Click alert to open approval modal
- Review each suggested operation
- Test individual approve/reject buttons
- Test "Approve All" / "Reject All"
- Verify only approved operations persist
- Check sidebar refreshes immediately
- Test rejection flow - verify nothing saved
- Monitor console logs for suggestion generation vs execution

### Comparison: Three Memory Approaches

**04.02 Tool Call Memory Creation:**
- LLM controls timing via tools
- Transparent (tool calls visible)
- No user approval
- Token efficient (only calls when needed)
- Best for: responsive systems, trusted LLMs

**04.03 Automatic Memory Creation:**
- Runs `generateObject` every message
- No user visibility or control
- Comprehensive (analyzes all messages)
- Higher cost/latency (extra LLM call per message)
- Best for: maximum automation, background operation

**04.04 User Confirmed Memories:**
- LLM suggests, user approves
- Maximum transparency + control
- Most complex implementation
- User friction (approval fatigue risk)
- Best for: privacy-sensitive apps, building trust

### When This Approach Works

- Privacy-sensitive applications (healthcare, legal, personal data)
- Systems where incorrect memories costly
- Building trust through transparency
- Users willing to review regularly
- Accuracy > convenience
- Compliance requirements (user consent)

### Limitations

- Most complex: frontend + backend + state + UI
- User friction - requires interaction every time
- Approval fatigue - users may ignore/skip
- Interrupts conversation flow
- Still runs extraction every message (like 04.03)
- Higher development/maintenance cost

### Optimization Ideas

- Batch suggestions across multiple messages
- Add confidence scores, auto-approve high-confidence
- Remember user preferences per operation type
- "Edit before saving" option in modal
- Smart timing - wait for natural conversation breaks
- Reduce extraction frequency (not every message)

### Next Up

- Section 05: Evals for testing memory extraction quality
- Build test suite for memory operations (create/update/delete/no-action)
- Generate synthetic datasets for evaluation
- Measure accuracy across different approaches
