# Human-in-the-Loop Introduction

## Explainer

### Intro

- HITL = balance between LLM power and risk management
- More power = more useful but more risk
- Example: draft emails good, auto-send risky
- HITL adds human approval checkpoints before actions execute
- Real world: prevents AI from doing things without confirmation

### Steps To Complete

#### Phase 1: Understanding the Power vs Risk Trade-off

- Giving LLM minimal power = safe but limited usefulness
- Giving LLM full power = dangerous without oversight
- HITL solution: delegate power but require human approval
- Use case: let LLM draft/compose but user sends
- Enables powerful features while maintaining control

#### Phase 2: Why Build HITL Yourself

- AI SDK has first-class HITL support
- Building yourself = deeper control + custom extensions
- Lesson 08.03 example: thread-scoped permissions
  - Approve action once = grant access for entire conversation
  - Not possible with first-class solutions
- Custom approval flows, permission models, specialized behaviors
- Understanding internals unlocks advanced patterns

#### Phase 3: Custom Data Parts Architecture

See [`readme.md`](./readme.md) for flow diagram

Three data part types for action lifecycle:
- `data-action-start`: LLM requests to perform action
- `data-action-decision`: User approves/rejects with feedback
- `data-action-end`: Confirms action completed (after approval only)

#### Phase 4: The HITL Flow

Four-step process:
1. **LLM Initiates**: Creates `data-action-start` when wanting to act
2. **Human Review**: System pauses, presents action for approval
3. **User Decision**: Approve or reject via `data-action-decision`, rejection includes feedback reason
4. **Action Execution**: Only approved actions proceed to `data-action-end` + execution

#### Phase 5: Building This Pattern

Next lessons implement full HITL system:
- 07.02: Initiating requests (action-start)
- 07.03: Approval/rejection UI (action-decision)
- 07.04: Formatting custom parts for LLM context
- 07.05: Processing decisions and matching actions
- 07.06: Executing approved actions

### Next Up

Conceptual foundation complete. Next: implement `data-action-start` by modifying tool execute handlers to pause instead of running immediately.
