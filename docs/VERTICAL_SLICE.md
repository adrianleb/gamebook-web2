# Vertical Slice Specification

## Overview

The **Vertical Slice** demonstrates end-to-end gameplay integration across the engine, UI, and content systems. This milestone validates that all foundational components work together to deliver a playable mini-narrative experience.

**Status:** In Planning
**Phase:** Phase 2 of 5 (Vertical Slice)
**Dependencies:** PRs #6, #7, #11, #12 (all merged)

---

## Objective

Create a complete, playable loop from game start through 2-3 interconnected scenes that demonstrate all core gameplay mechanics: choice navigation, inventory gating, stat checks, and save/load functionality.

## Success Criteria

1. **Playable Loop:** Player can start from `sc_1_0_001`, navigate through 2-3 scenes, and reach a resolution state
2. **All Mechanics Demonstrated:**
   - Choice navigation (branching paths)
   - Inventory gating (item-required choices with disabled hints)
   - Stat checks (attribute tests with success/failure branches)
   - Save/load (state persistence across scene transitions)
3. **UI Integration:** DOS UI shell displays scene text, choices, inventory, and stats correctly
4. **No Regressions:** All QA gates pass (see below)

---

## Selected Scenes

The Vertical Slice will implement scenes from **Act 1: The Breach**, specifically Hub 0 (Intro / The Prompter's Booth). This provides a natural tutorial space with clear narrative boundaries.

### Scene Flow Pattern

```
sc_1_0_001 (The Booth Awakens)
    |
    +-- Choice A: Direct path ──────────────────────> sc_1_0_002 (The Wings)
    |                                                       |
    |                                                       +-- [No requirements] -> Resolution
    |
    +-- Choice B: Inventory-gated path ─────────────> sc_1_0_003 (The Threshold Stage)
    |       [Requires: "booth_key"]                               |
    |                                                             +-- Stat check -> Resolution
    |
    +-- Choice C: Talk to Maren ──────────────────> sc_1_0_004 (Maren's Guidance)
            [Unlocks hint about key]                           |
                                                                 +-- Get "booth_key" -> return to sc_1_0_001
```

### Scene Specifications

#### sc_1_0_001: The Booth Awakens
- **Type:** Hub scene (starting point)
- **Purpose:** Tutorial introduction, establish the setting
- **Mechanics:**
  - 3 branching choices (demonstrates choice navigation)
  - One choice disabled with hint ("The locked door needs a booth_key")
  - Introduction to inventory and stats via UI
- **State Changes:**
  - Set flag: `game_started = true`
  - Set flag: `location_booth_visited = true`

#### sc_1_0_002: The Wings (Direct Path)
- **Type:** Transitional scene
- **Purpose:** Simple navigation demonstration
- **Mechanics:**
  - No requirements (always accessible)
  - Single choice to continue to resolution
- **State Changes:**
  - Set flag: `path_direct = true`
  - Add item: "wings_pass" (placeholder for demo)

#### sc_1_0_003: The Threshold Stage (Inventory + Stat Check)
- **Type:** Gated scene with stat check
- **Purpose:** Demonstrate inventory gating and stat checks
- **Requirements:** Must have item "booth_key"
- **Mechanics:**
  - **Stat Check:** `stage_presence >= 2` to succeed crossing (1-4 range)
  - **Success Path:** Reach resolution, gain faction point
  - **Failure Path:** Different resolution scene
- **State Changes (Success):**
  - Set flag: `crossing_succeeded = true`
  - Modify faction: `preservationist +1`
- **State Changes (Failure):**
  - Set flag: `crossing_failed = true`

#### sc_1_0_004: Maren's Guidance (Item Acquisition)
- **Type:** Information scene
- **Purpose:** Provide player with the key item
- **Mechanics:**
  - No requirements (dialogue choice)
  - Reveals hint: "The booth_key is in the drawer"
  - Grants key item
- **State Changes:**
  - Add item: "booth_key"
  - Set flag: `met_maren = true`
  - Choice to return to sc_1_0_001

---

## Required State Variables

### Stats (Numeric 1-4 range)

| Stat ID | Display Name | Min | Max | Starting Value | Description |
|---------|--------------|-----|-----|----------------|-------------|
| script | Script | 1 | 4 | 2 | Knowledge of narrative patterns, genre awareness |
| stage_presence | Stage Presence | 1 | 4 | 2 | Force of personality, dramatic timing |
| improv | Improv | 1 | 4 | 2 | Adaptability, quick thinking |

### Flags (Boolean)

| Flag ID | Default | Purpose |
|---------|---------|---------|
| game_started | false | Set on first scene load |
| location_booth_visited | false | Tracks if player visited booth |
| path_direct | false | Took direct path to wings |
| crossing_succeeded | false | Successfully crossed threshold |
| crossing_failed | false | Failed the crossing stat check |
| met_maren | false | Spoke with Maren character |

### Inventory Items

| Item ID | Display Name | Description |
|---------|--------------|-------------|
| booth_key | Booth Key | A rusty iron key that unlocks the prompter's booth door |
| wings_pass | Wings Pass | A temporary pass allowing access to the theatre wings |

### Factions (Numeric 0-10)

| Faction ID | Display Name | Starting Value | Description |
|------------|--------------|----------------|-------------|
| preservationist | Preservationists | 0 | Faction favoring separation of worlds |

---

## Integration Checklist

### Engine (agent-c)
- [ ] ConditionEvaluator supports `has-item` checks
- [ ] ConditionEvaluator supports stat checks with operators (gte, lte, eq, gt, lt)
- [ ] EffectApplier supports `add-item`, `remove-item`
- [ ] EffectApplier supports `set-stat`, `modify-stat`
- [ ] EffectApplier supports `set-flag`
- [ ] Save/load serializes full GameState (stats, flags, items, factions, sceneHistory)
- [ ] Content validation detects broken scene links

### UI (agent-d)
- [ ] DOS UI shell renders scene text with proper typography
- [ ] Choices display as clickable buttons with DOS styling
- [ ] Disabled choices show dimmed with hint text (e.g., "Requires booth_key")
- [ ] Inventory panel displays owned items
- [ ] Stats panel displays current stat values
- [ ] Save/load UI creates autosave on scene transition
- [ ] Keyboard navigation: arrow keys to move, Enter to select, Esc for menu

### Content (agent-b)
- [ ] Scene files created for sc_1_0_001, sc_1_0_002, sc_1_0_003, sc_1_0_004
- [ ] Each scene has valid schema: id, title, text, choices
- [ ] Choices have proper conditions and disabledHint where applicable
- [ ] Effects are properly defined for all state mutations
- [ ] manifest.json updated with vertical slice scene entries
- [ ] All scene IDs referenced by choices exist

---

## QA Gates

Vertical Slice is considered **COMPLETE** when all gates pass:

### G1: Playability
- [ ] Can start from sc_1_0_001 and reach a resolution scene
- [ ] All three paths are playable (direct, inventory-gated, stat-checked)
- [ ] No console errors during gameplay
- [ ] No softlocks (all scenes have at least one valid choice)

### G2: Mechanics
- [ ] Choice navigation: Branching choices work correctly
- [ ] Inventory gating: "The Threshold Stage" choice is disabled without booth_key
- [ ] Inventory gating: Choice becomes enabled after acquiring booth_key from Maren
- [ ] Stat check: stage_presence >= 2 succeeds, < 2 fails with different outcome
- [ ] Save/load: Can save at sc_1_0_001, reload, and continue from saved state
- [ ] Save/load: State (items, stats, flags) persists correctly after reload

### G3: UI/UX
- [ ] Disabled choices show hint text ("Requires booth_key")
- [ ] Inventory updates immediately when item is acquired
- [ ] Stats display changes after stat check success/failure
- [ ] DOS styling is consistent across all scenes
- [ ] Keyboard navigation works (arrows, Enter, Esc)

### G4: Content Integrity
- [ ] All scene IDs in choices exist in manifest.json
- [ ] No orphaned scenes (every scene reachable from start)
- [ ] All condition schemas match engine expectations
- [ ] All effect schemas match engine expectations

### G5: Documentation
- [ ] VERTICAL_SLICE.md is complete with scene specifications
- [ ] TEST_PLAYTHROUGHS.md includes vertical slice test paths
- [ ] All state variables documented in GANG.md conventions

---

## Test Playthrough Paths

### Path 1: Direct Route (No mechanics)
1. Start at sc_1_0_001
2. Choose "Go to the wings" (no requirements)
3. Arrive at sc_1_0_002
4. Choose "Continue forward"
5. Reach resolution

**Expected State:**
- `path_direct = true`
- Has item: "wings_pass"
- Script: 2, Stage Presence: 2, Improv: 2

### Path 2: Inventory-Gated Route
1. Start at sc_1_0_001
2. Choose "Talk to Maren"
3. At sc_1_0_004, receive "booth_key"
4. Return to sc_1_0_001
5. Choose "Unlock the door" (now enabled)
6. At sc_1_0_003, pass stage_presence check (stage_presence >= 2)
7. Reach resolution (success)

**Expected State:**
- `met_maren = true`
- `crossing_succeeded = true`
- Has items: "booth_key", "wings_pass"
- Script: 2, Stage Presence: 2, Improv: 2
- Faction preservationist: 1

### Path 3: Failed Stat Check
1. Start at sc_1_0_001
2. Choose "Talk to Maren" → get "booth_key"
3. Return to sc_1_0_001
4. Choose "Unlock the door"
5. At sc_1_0_003, fail stage_presence check (stage_presence < 2, manually reduce for testing)
6. Reach resolution (failure)

**Expected State:**
- `crossing_failed = true`
- Stage Presence: 1 (below threshold)

### Path 4: Save/Load Regression
1. Start at sc_1_0_001
2. Make choice to sc_1_0_002
3. **Save game** to slot 1
4. Continue to resolution
5. **Load game** from slot 1
6. Verify: Back at sc_1_0_002 with same state (items, stats, flags)

---

## Deliverables by Agent

### agent-a (Integrator)
- [x] Create VERTICAL_SLICE.md specification
- [ ] Create tracking issue for vertical slice implementation
- [ ] Validate all components integrate correctly
- [ ] Sign off on QA gates

### agent-b (Narrative Mapper)
- [ ] Create scene content files for all 4 scenes
- [ ] Write scene text with DOS vibe (short paragraphs, action-oriented choices)
- [ ] Define choices with conditions and effects
- [ ] Update manifest.json with scene entries

### agent-c (Engine Runtime)
- [ ] Verify ConditionEvaluator supports all required condition types
- [ ] Verify EffectApplier supports all required effect types
- [ ] Test save/load with vertical slice state schema
- [ ] Run content validation on vertical slice scenes

### agent-d (UI Designer)
- [ ] Implement disabled choice styling with hints
- [ ] Ensure inventory panel updates reactively
- [ ] Ensure stats panel updates reactively
- [ ] Test keyboard navigation across all scenes
- [ ] Apply DOS styling consistently (per STYLE_GUIDE.md)

### agent-e (QA)
- [ ] Execute all test playthrough paths
- [ ] Document any bugs or edge cases
- [ ] Verify save/load regression tests pass
- [ ] Update TEST_PLAYTHROUGHS.md with vertical slice paths

---

## Dependencies on Merged PRs

| PR | Component | Vertical Slice Dependency |
|----|-----------|---------------------------|
| #6 | Engine Architecture RFC | Scene graph structure, event system |
| #7 | Content Skeleton | Scene ID conventions, manifest structure |
| #11 | DOS UI Foundation | Shell layout, component base |
| #12 | Engine Core | ConditionEvaluator, EffectApplier, save/load |

**All dependencies are satisfied** (all PRs merged per agent-a context).

---

## Milestone Definition

The Vertical Slice milestone is **COMPLETE** when:
1. All 4 scenes are implemented with content
2. All QA gates (G1-G5) pass
3. All 4 test playthrough paths are verified
4. At least 2 agents (excluding agent-a) have reviewed and approved
5. agent-a signs off on integration completeness

Upon completion, the project transitions to **Phase 3: Full Content Implementation**.

---

*This specification is a living document. Update as implementation reveals new requirements or constraints.*
