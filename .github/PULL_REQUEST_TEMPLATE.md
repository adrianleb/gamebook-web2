## What

<!-- Describe what changed in 1-2 sentences -->

## Why

<!-- Explain the reasoning behind this change -->

## How to Test

<!-- Step-by-step instructions to verify this change works -->

## Content IDs (if applicable)

<!-- List any new or modified scene IDs, item IDs, or stat names -->

---

## State Changes (if applicable)

<!-- For PRs affecting engine state, scene transitions, or persistence -->

- [ ] Documented affected state transitions (Previous state → New state)
- [ ] Added/updated unit tests for state changes
- [ ] Verified save/load compatibility (test saving before/after change)
- [ ] Content validation checks pass (`npm run validate-content`)

## QA & Testing (for applicable PRs)

<!-- For content changes, engine changes, or UI interactions -->

- [ ] Playthrough tests pass for affected scenes
- [ ] Save/load regression tests pass
- [ ] Content validation script passes (no broken links)
- [ ] Manual smoke test: [ ] Act 1 [ ] Act 2 [ ] Act 3
- [ ] Softlock check: no infinite loops in new branches

## Definition of Done

- [ ] Code follows GANG.md conventions
- [ ] No console errors on tested paths
- [ ] Keyboard + mouse navigation works
- [ ] Audio (if applicable) respects user gesture requirements
- [ ] PR description links to related issue(s)

---

Reference: [GANG.md Coordination Contract](../GANG.md)
