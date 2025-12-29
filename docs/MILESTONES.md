# MILESTONES.md

Project milestone plan for The Understage gamebook adaptation.

## Overview

This document defines the five macro phases from GANG.md, with specific deliverables, dependencies, and gate definitions for each milestone. Gates must be satisfied before progressing to the next phase.

---

## Phase 1: Inception & Mapping

**Goal**: Extract gamebook structure and define canonical content IDs.

### Deliverables

| Agent | Deliverable | Status |
|-------|-------------|--------|
| agent-a | MILESTONES.md, PR/issue templates | ✅ Complete |
| agent-b | content/manifest.json, SCENE_ID_CONVENTIONS.md | Pending |
| agent-c | Engine prototype: state machine, scene loader | Pending |
| agent-d | STYLE_GUIDE.md, UI shell prototype | Pending |
| agent-e | TEST_PLAYTHROUGHS.md (draft) | Pending |

### Exit Gate

- [ ] `content/manifest.json` exists with all scene IDs mapped
- [ ] State variables documented (stats, inventory, flags)
- [ ] All 5 endings identified with requirements
- [ ] Engine prototype loads a test scene
- [ ] UI shell demonstrates layout prototype
- [ ] TEST_PLAYTHROUGHS.md has 3+ critical paths outlined

---

## Phase 2: Vertical Slice

**Goal**: Implement one complete playable path demonstrating all core systems.

### Scope

Representative content including:
- At least one inventory-gated choice
- At least one stat check
- At least one scene transition
- Save/load at key points
- Basic audio (optional)

### Deliverables

| Component | Location | Owner |
|-----------|----------|-------|
| Engine core | `src/engine/` | agent-c |
| UI components | `src/ui/` | agent-d |
| Test scenes | `content/scenes/` | agent-b |
| Playthrough tests | `tests/` | agent-e |

### Exit Gate: Vertical Slice Complete

**Functional Requirements:**
- [ ] At least **1 complete playthrough path** executable (Start → Ending)
- [ ] **Save/load works** at all scene transitions in the slice
- [ ] **No softlocks** in implemented content (every state has valid choices)
- [ ] All stat checks in slice have **test coverage**
- [ ] Content validation passes: no broken links, all scene IDs exist

**Quality Requirements:**
- [ ] Keyboard navigation works (arrows/Enter)
- [ ] UI readable at 1280×720
- [ ] No console errors on the playthrough path
- [ ] Audio (if present) respects user gesture requirements

**Documentation:**
- [ ] TEST_PLAYTHROUGHS.md updated with vertical slice path
- [ ] Any RFCs for scope deviations documented

---

## Phase 3: Full Content Implementation

**Goal**: Convert all gamebook sections into playable content.

### Scope

All scenes, branches, and endings from the source gamebook:
- Act 1: The Pursuer
- Act 2: The Green Room / Archives
- Act 3: The Revised Draft
- All 5 endings reachable

### Deliverables

| Component | Location | Owner |
|-----------|----------|-------|
| All scene files | `content/scenes/` | agent-b |
| State logic | `src/engine/` | agent-c |
| UI polish | `src/ui/` | agent-d |
| Content validation | `scripts/validate.ts` | agent-e |

### Exit Gate: Content Complete

**Functional Requirements:**
- [ ] **All 5 endings** reachable and tested
- [ ] **100% scene link validation** (no dangling references)
- [ ] **Full playthrough coverage**: 3+ canonical paths documented in TEST_PLAYTHROUGHS.md
- [ ] **Save/load regression baseline** established (test save/load at each hub)

**Quality Requirements:**
- [ ] Content validation script passes with 0 errors
- [ ] No unreachable scenes (unless explicitly tagged with justification)
- [ ] All stat checks documented and consistent
- [ ] All inventory items have obtain/loss paths documented

**Documentation:**
- [ ] TEST_PLAYTHROUGHS.md has all ending paths
- [ ] manifest.json tracks implementation status (all `complete`)

---

## Phase 4: Polish & DOS Vibe Pass

**Goal**: UI consistency, audio, transitions, CRT effects.

### Scope

- Typography and spacing refinement per STYLE_GUIDE.md
- Audio SFX and music for key moments
- Scene transition effects
- Optional CRT filter toggle
- Icon polish

### Deliverables

| Component | Location | Owner |
|-----------|----------|-------|
| Style refinement | `src/ui/` | agent-d |
| Audio assets | `src/audio/` | agent-d |
| Transition effects | `src/ui/` | agent-d |

### Exit Gate: Polish Complete

- [ ] STYLE_GUIDE.md fully applied across all UI
- [ ] Audio respects user gesture (no autoplay blocking)
- [ ] Transitions feel smooth and consistent
- [ ] CRT filter (if implemented) is toggleable
- [ ] All QA gates from Content Complete still passing

---

## Phase 5: QA & Release

**Goal**: Full playthrough testing, bug fixes, final build.

### Scope

- Execute all playthrough paths from TEST_PLAYTHROUGHS.md
- Fix softlocks, broken paths, or state bugs
- Performance optimization
- Export final build

### Deliverables

| Component | Location | Owner |
|-----------|----------|-------|
| QA test execution | - | agent-e |
| Bug fixes | varies | all |
| Release build | `/dist/` | agent-c |

### Exit Gate: Release Ready

**Functional Requirements:**
- [ ] **All 5 endings** playtested and verified
- [ ] **No softlocks** outside intentional endings
- [ ] **Save/load regression** tests pass for all hubs
- [ ] **Content validation** passes with 0 errors

**Quality Requirements:**
- [ ] No console errors in any tested path
- [ ] First load completes in reasonable time (<10s on typical connection)
- [ ] Keyboard + mouse navigation fully functional
- [ ] Audio works across all browsers tested

**Documentation:**
- [ ] Release notes drafted
- [ ] Known issues documented (if any)
- [ ] GANG.md reflects actual implementation

---

## Dependencies

### Agent Dependencies

| Agent | Depends On |
|-------|------------|
| agent-b (Content) | manifest.json structure, SCENE_ID_CONVENTIONS.md |
| agent-c (Engine) | State variable definitions from agent-b |
| agent-d (UI) | Engine event system from agent-c |
| agent-e (QA) | TEST_PLAYTHROUGHS.md depends on manifest.json, engine headless runner |

### Phase Dependencies

```
Phase 1 (Inception) → Phase 2 (Vertical Slice) → Phase 3 (Full Content)
                                                                ↓
                                              Phase 4 (Polish) ← ┘
                                                                ↓
                                              Phase 5 (QA & Release)
```

---

## Milestone Tracking

| Phase | Status | Blockers |
|-------|--------|----------|
| Phase 1: Inception | 🟡 In Progress | None |
| Phase 2: Vertical Slice | ⚪ Not Started | Phase 1 completion |
| Phase 3: Full Content | ⚪ Not Started | Phase 2 completion |
| Phase 4: Polish | ⚪ Not Started | Phase 3 completion |
| Phase 5: QA & Release | ⚪ Not Started | Phase 4 completion |

---

## RFCs and Scope Changes

All scope deviations or significant decisions must be documented in `/docs/rfcs/` with:
- RFC ID: `YYYY-MM-DD-topic.md`
- Proposed change
- Rationale
- Impact on Definition of Done
- Approval status

---

Reference: [GANG.md Coordination Contract](../GANG.md)
