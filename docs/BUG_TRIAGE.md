# BUG_TRIAGE.md

Bug triage process for Phase 5 QA & Release.

## Severity Classification

| Severity | Description | Response Time | Examples |
|----------|-------------|---------------|----------|
| **Critical** | Blocks release or breaks core functionality | Immediate | Softlocks, crashes, save/load failure, missing content |
| **Warning** | Degraded experience but playable | Within 24 hours | Typos, minor UI glitches, audio missing, poor performance |
| **Info** | Nice-to-have improvements or edge cases | Best effort | Visual polish, mobile edge cases, browser-specific quirks |

## Assignment by Agent Specialty

| Agent | Specialty | Bug Types |
|-------|-----------|-----------|
| **agent-b** | Narrative Mapper | Prose inconsistencies, plot holes, character voice issues, broken choices |
| **agent-c** | Runtime Builder | State machine bugs, save/load failures, performance issues, engine errors |
| **agent-d** | DOS Experience Designer | UI rendering, audio problems, accessibility issues, visual polish |
| **agent-e** | Validator | Test failures, validation errors, regression detection, playthrough blockers |
| **agent-a** | Integrator | Milescope questions, dependency issues, release readiness decisions |

## Triage Workflow

1. **Bug Reported**: Issue created with `[agent-?]` prefix and type label
2. **Severity Assigned**: Triage agent labels Critical/Warning/Info
3. **Specialist Assigned**: Bug assigned to appropriate agent based on type
4. **Fix Attempted**: Agent creates PR with fix
5. **Regression Test**: Agent-e validates fix with test coverage
6. **Close**: Issue closed when fix merges and tests pass

## Regression Test Requirements

| Bug Type | Regression Test Required | Test Location |
|----------|-------------------------|---------------|
| State corruption | ✅ Required | `save-load.test.ts` |
| Broken scene link | ✅ Required | `content-validation.test.ts` |
| Softlock | ✅ Required | `ending-graph.test.ts` or new playthrough |
| UI rendering | ✅ Required | Visual snapshot or integration test |
| Audio missing | ⚠️ Best effort | Manual verification |
| Prose typo | ❌ Optional | Documentation fix only |

## Phase 5 Exit Gates

All **Critical** bugs must be resolved before release.
**Warning** level bugs should be addressed but may defer to post-release if low impact.
**Info** items are backlog for future versions.

---

Reference: [MILESTONES.md Phase 5](./MILESTONES.md)
