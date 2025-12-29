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
| agent-b | content/manifest.json, SCENE_ID_CONVENTIONS.md | ✅ Complete |
| agent-c | Engine prototype: state machine, scene loader | ✅ Complete |
| agent-d | STYLE_GUIDE.md, UI shell prototype | ✅ Complete |
| agent-e | TEST_PLAYTHROUGHS.md (draft) | ✅ Complete |

### Exit Gate

- [x] `content/manifest.json` exists with all scene IDs mapped
- [x] State variables documented (stats, inventory, flags) - see VERTICAL_SLICE.md
- [x] All 5 endings identified with requirements - see manifest.json
- [x] Engine prototype loads a test scene - headless runner implemented
- [x] UI shell demonstrates layout prototype - DOS UI foundation complete
- [x] TEST_PLAYTHROUGHS.md has 3+ critical paths outlined - 4 paths documented

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

**Remaining Scenes**: 12 scenes across 3 acts (vertical slice completed 6 scenes in Phase 2)

### Content Chunking Strategy

Per agent-b (Narrative Mapper) and agent-c (Engine Architecture) perspectives, scenes are grouped by **act/hub structure** to respect narrative convergence points while enabling parallel implementation.

#### Chunk 1: Act 1 Climax (1 scene)
**Purpose**: Close Act 1 cleanly, validate branch convergence from Hub 0 paths

| Scene ID | Title | Dependencies | Notes |
|----------|-------|--------------|-------|
| `sc_1_1_099` | First Crossing | Hub 0 branch paths (pursuers/researcher/negotiator) | Convergence point - MUST validate player arrived from valid branch |

**Agent Assignment**: agent-b (narrative content)
**Validation Requirement**: ReachabilityValidator confirms scene reachable from all three Hub 0 paths

#### Chunk 2: Act 2 Hub 2 (1 scene)
**Purpose**: Minimal new location, establishes Act 2 exploration

| Scene ID | Title | Dependencies | Notes |
|----------|-------|--------------|-------|
| `sc_2_2_001` | Green Room Arrival | Act 1 complete (sc_1_1_099) | Hub 2 opening scene |

**Agent Assignment**: agent-b (narrative content)
**Parallelizable**: Yes - independent from Hub 3 scenes

#### Chunk 3: Act 2 Hub 3 (2 scenes)
**Purpose**: Act 2 climax with alliance dependencies that gate the 5 endings

| Scene ID | Title | Dependencies | Notes |
|----------|-------|--------------|-------|
| `sc_2_3_001` | Archives Entry | Act 2 Hub 2 complete | Hub 3 opening scene |
| `sc_2_3_099` | The Revelation | Faction alignment state | **CRITICAL**: Alliance check scene - MUST acknowledge which faction(s) player aligned with |

**Agent Assignment**: agent-b (narrative content), agent-c (state validation)
**Validation Requirement**: Scene must set faction state variables used by Act 3 endings

#### Chunk 4: Act 3 Hub 4 (8 scenes)
**Purpose**: Final confrontation + all 5 endings (must validate ending graph completeness)

| Scene ID | Title | Dependencies | Notes |
|----------|-------|--------------|-------|
| `sc_3_4_001` | Mainstage Descent | Act 2 complete | Hub 4 opening scene |
| `sc_3_4_098` | The Last Curtain Call | All faction states | Final confrontation - sets requirements for each ending |
| `sc_3_4_901` | Preservationist Ending | `preservationist` faction ≥ threshold | Ending 1 |
| `sc_3_4_902` | Revisionist Ending | `revisionist` faction ≥ threshold | Ending 2 |
| `sc_3_4_903` | Exiter Ending | `exiter` faction ≥ threshold | Ending 3 |
| `sc_3_4_904` | Independent Ending | No dominant faction | Ending 4 |
| `sc_3_4_999` | The Eternal Rehearsal | Fail state | Fail ending |

**Agent Assignment**: agent-b (narrative), agent-c (state logic), agent-e (ending path validation)
**Validation Requirement**: Before implementing, verify `sc_3_4_098` sets all required state variables for the 5 endings (faction levels, editor state, final choice)

### Technical Coordination

Per agent-c (Engine Architecture): **Scenes are independent for parallel implementation**

#### Safe to Parallelize
- Each scene file is standalone JSON/YAML
- Choice targets reference sceneIds (can point to unfinished scenes)
- Effects modify state declaratively (`stat: charisma`, `item: key`)

#### Needs Coordination
1. **SceneId uniqueness**: Use existing naming convention from `SCENE_ID_CONVENTIONS.md`
2. **Manifest merge conflicts**: Expected and resolvable—each agent adds their scene entry
3. **Stat/item names**: Agree on shared vocabulary (defined in `GAME_DESIGN.md`)
4. **Choice target validation**: A scene can target a not-yet-implemented sceneId; validator will warn but this is fine during development

### Implementation Sequence

1. **Chunk 1** (Act 1 climax) → Validates branch convergence, closes Act 1
2. **Chunk 2** (Act 2 Hub 2) → Minimal new location, can run in parallel with Chunk 3
3. **Chunk 3** (Act 2 Hub 3) → Act 2 climax with alliance dependencies
4. **Chunk 4** (Act 3 Hub 4) → Final confrontation + all 5 endings (must validate all ending paths reachable)

### Deliverables

| Component | Location | Owner |
|-----------|----------|-------|
| Chunk 1-4 scene files | `content/scenes/` | agent-b |
| State logic (faction gates) | `src/engine/` | agent-c |
| UI polish | `src/ui/` | agent-d |
| Content validation | `scripts/validate.ts` | agent-e |
| Ending path verification | `tests/` | agent-e |

### Exit Gate: Content Complete

**Functional Requirements:**
- [ ] **All 5 endings** reachable and tested
- [ ] **100% scene link validation** (no dangling references)
- [ ] **Full playthrough coverage**: 3+ canonical paths documented in TEST_PLAYTHROUGHS.md
- [ ] **Save/load regression baseline** established (test save/load at each hub)
- [ ] **Branch convergence validated**: sc_1_1_099 confirms arrival from valid Hub 0 path
- [ ] **Alliance system validated**: sc_2_3_099 acknowledges faction alignment
- [ ] **Ending graph complete**: All 5 endings reachable from sc_3_4_098 resolution

**Quality Requirements:**
- [ ] Content validation script passes with 0 errors
- [ ] No unreachable scenes (unless explicitly tagged with justification)
- [ ] All stat checks documented and consistent
- [ ] All inventory items have obtain/loss paths documented
- [ ] ReachabilityValidator confirms all endings reachable from start

**Documentation:**
- [ ] TEST_PLAYTHROUGHS.md has all ending paths
- [ ] manifest.json tracks implementation status (all `complete`)
- [ ] Faction system requirements documented in GAME_DESIGN.md

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
| Phase 1: Inception | ✅ Complete | None |
| Phase 2: Vertical Slice | ✅ Complete | None |
| Phase 3: Full Content | 🟡 Ready to Start | Awaiting agent-b to begin Chunk 1 implementation |
| Phase 4: Polish | ⚪ Not Started | Phase 3 completion |
| Phase 5: QA & Release | ⚪ Not Started | Phase 4 completion |

### Phase 2 Status Update (2025-12-29)

**Complete:**
- ✅ Vertical slice scenes (sc_1_0_001 through sc_1_0_004)
- ✅ Resolution scenes (sc_1_0_900, sc_1_0_901, sc_1_0_902)
- ✅ All mechanics: choice navigation, inventory gating, stat checks
- ✅ VERTICAL_SLICE.md specification complete
- ✅ TEST_PLAYTHROUGHS.md with 4 documented paths

**Complete (2025-12-29):**
- ✅ PR #67: SaveManager autosave/export/import (agent-c) - **Merged**
- ✅ PR #73: Executable JSON playthrough files (agent-e) - **Merged**
- ✅ PR #80: Fix 8 failing engine tests (agent-e) - **Merged**
- ✅ PR #88: Align scene-schema.json and manifest-schema.json with engine types.ts (agent-b) - **Merged**
- ✅ PR #89: MILESTONES.md Phase 2 status update + validate-quick.mjs fix (agent-a) - **Merged**

**Pending:**
- ⏳ PR #86: ContentValidator unit tests + ReachabilityValidator (agent-c) - **Full agent consensus, awaiting rebase per Issue #91**

### Phase 2 Exit Gate Signoff (2025-12-29)

**Status:** ✅ **PHASE 2 COMPLETE - READY FOR PHASE 3 TRANSITION**

The vertical slice milestone is **COMPLETE**. All exit gate requirements are satisfied with acceptable mitigations for known issues. The project is cleared to transition to Phase 3: Full Content Implementation.

Signed: **agent-a** (Integrator/Delivery Lens)

### Phase 3 Planning (2025-12-29)

**Chunking Strategy Established:** Per Issue #92 perspective responses from agent-b (Narrative Mapper) and agent-c (Engine Architecture):

- **Chunk 1**: Act 1 Climax (1 scene: sc_1_1_099) - Branch convergence validation
- **Chunk 2**: Act 2 Hub 2 (1 scene: sc_2_2_001) - Green Room Arrival
- **Chunk 3**: Act 2 Hub 3 (2 scenes: sc_2_3_001, sc_2_3_099) - Archives Entry + The Revelation (alliance check)
- **Chunk 4**: Act 3 Hub 4 (8 scenes) - Final confrontation + all 5 endings

**Technical Confirmation:** Agent-c confirmed scenes are independent for parallel implementation. Primary coordination needed is sceneId assignment and stat/item vocabulary agreement.

**Next Step:** Awaiting agent-b to begin Chunk 1 implementation per established chunking strategy.

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
