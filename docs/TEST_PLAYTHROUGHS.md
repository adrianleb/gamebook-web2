# TEST_PLAYTHROUGHS.md

## Overview

This document contains canonical playthrough scripts for testing and validation. Each playthrough defines:
- Entry point and expected path through scenes
- State assertions at checkpoints (stats, flags, inventory)
- Expected behaviors for mechanics (inventory gating, stat checks, save/load)
- Regression test points for catching bugs

**Purpose:** These scripts serve as both manual testing guides and the specification for automated headless runner tests (see agent-c's headless runner implementation).

---

## Playthrough Script Format

Each playthrough script follows this structure:

```yaml
playthrough_id: "PT-001"
name: "Descriptive Name"
description: "What this path tests and why it matters"

entry_point: "sc_1_0_001"
expected_endings: ["resolution_x", "resolution_y"]

steps:
  - scene: "sc_1_0_001"
    action: "Choose '{choice_label}'"
    checkpoint: true
    expected_state:
      stats: { script: 2, stage_presence: 2, improv: 2 }
      flags: { game_started: true }
      inventory: []
      current_scene: "sc_1_0_002"
```

### Schema Definitions

#### State Assertion Schema
```json
{
  "stats": {
    "script": 2,           // 1-4 range
    "stage_presence": 2,   // 1-4 range
    "improv": 2            // 1-4 range
  },
  "flags": {
    "game_started": true,
    "location_booth_visited": true
  },
  "inventory": [
    "booth_key",
    "wings_pass"
  ],
  "factions": {
    "preservationist": 1    // 0-10 range
  },
  "current_scene": "sc_1_0_002"
}
```

#### Checkpoint Types
- **save_point**: State snapshot for save/load regression testing
- **softlock_check**: Verify at least one valid choice exists
- **mechanic_test**: Verify specific mechanic (inventory gating, stat check)

---

## Vertical Slice Playthroughs

The following playthroughs test the Phase 2 Vertical Slice (Act 1 Hub 0: The Prompter's Booth).

### PT-VS-001: Direct Route (Baseline Navigation)

**Tests:** Choice navigation, basic scene transitions, no gating mechanics

**Entry Point:** `sc_1_0_001` (The Booth Awakens)

**Path:**
```
sc_1_0_001 ─[Choose: "Go to the wings"]──> sc_1_0_002 ─[Choose: "Continue forward"]──> resolution_direct
```

**Steps:**

| Step | Scene | Action | Checkpoint | Expected State |
|------|-------|--------|------------|----------------|
| 1 | sc_1_0_001 | (Starting state) | ✅ save_point | `game_started=false`, script=2, stage_presence=2, improv=2, inventory=[] |
| 2 | sc_1_0_001 | Choose "Go to the wings" | ✅ softlock_check | Choice enabled (no requirements) |
| 3 | sc_1_0_002 | (Arrived) | ✅ save_point | `path_direct=true`, has "wings_pass", script=2, stage_presence=2, improv=2 |
| 4 | sc_1_0_002 | Choose "Continue forward" | ✅ softlock_check | Choice enabled |
| 5 | resolution_direct | (End state) | ✅ mechanic_test | Reached resolution, no errors |

**Final State Assertions:**
```json
{
  "stats": { "script": 2, "stage_presence": 2, "improv": 2 },
  "flags": {
    "game_started": true,
    "location_booth_visited": true,
    "path_direct": true
  },
  "inventory": ["wings_pass"],
  "factions": { "preservationist": 0 }
}
```

**Regression Checkpoints:** Steps 1, 3, 5

---

### PT-VS-002: Inventory-Gated Route

**Tests:** Inventory gating, disabled choice hints, item acquisition

**Entry Point:** `sc_1_0_001` (The Booth Awakens)

**Path:**
```
sc_1_0_001 ─[Choose: "Talk to Maren"]──> sc_1_0_004 ─[Receive key]──> sc_1_0_001 ─[Choose: "Unlock the door"]──> sc_1_0_003
```

**Steps:**

| Step | Scene | Action | Checkpoint | Expected State |
|------|-------|--------|------------|----------------|
| 1 | sc_1_0_001 | (Starting state) | ✅ save_point | `game_started=false`, inventory=[] |
| 2 | sc_1_0_001 | Hover "Unlock the door" | ✅ mechanic_test | Choice **disabled**, hint: "Requires booth_key" |
| 3 | sc_1_0_001 | Choose "Talk to Maren" | ✅ softlock_check | Choice enabled |
| 4 | sc_1_0_004 | (Arrived, dialogue) | ✅ save_point | `met_maren=true` |
| 5 | sc_1_0_004 | Receive "booth_key" | ✅ mechanic_test | Inventory now contains "booth_key" |
| 6 | sc_1_0_004 | Choose "Return to booth" | ✅ softlock_check | Choice enabled |
| 7 | sc_1_0_001 | (Returned) | ✅ save_point | `met_maren=true`, has "booth_key" |
| 8 | sc_1_0_001 | Hover "Unlock the door" | ✅ mechanic_test | Choice **enabled** (now has key) |
| 9 | sc_1_0_001 | Choose "Unlock the door" | ✅ softlock_check | Transitions to sc_1_0_003 |
| 10 | sc_1_0_003 | (Arrived at threshold) | ✅ save_point | Has "booth_key", at threshold scene |

**Final State Assertions:**
```json
{
  "stats": { "script": 2, "stage_presence": 2, "improv": 2 },
  "flags": {
    "game_started": true,
    "location_booth_visited": true,
    "met_maren": true
  },
  "inventory": ["booth_key"],
  "factions": { "preservationist": 0 },
  "current_scene": "sc_1_0_003"
}
```

**Critical Mechanics Validated:**
- Disabled choice shows hint text ("Requires booth_key")
- Acquiring item enables previously disabled choice
- Inventory panel updates immediately on item acquisition

**Regression Checkpoints:** Steps 1, 4, 7, 10

---

### PT-VS-003: Stat Check Success Path

**Tests:** Stat check mechanics (stage_presence >= 2), success branch

**Entry Point:** `sc_1_0_001` (The Booth Awakens)

**Prerequisites:** Must have `booth_key` (combine with PT-VS-002 steps 1-7)

**Path:**
```
sc_1_0_001 ─[With booth_key, stage_presence=2]──> sc_1_0_003 ─[Stage Presence check: SUCCESS]──> resolution_crossing_success
```

**Steps:**

| Step | Scene | Action | Checkpoint | Expected State |
|------|-------|--------|------------|----------------|
| 1 | sc_1_0_001 | (Has booth_key, stage_presence=2) | ✅ save_point | inventory=["booth_key"], stage_presence=2 |
| 2 | sc_1_0_001 | Choose "Unlock the door" | ✅ softlock_check | Choice enabled (has key) |
| 3 | sc_1_0_003 | (At threshold, stage presence check) | ✅ mechanic_test | Stage Presence check: 2 >= 2 = **SUCCESS** |
| 4 | sc_1_0_003 | (Success branch) | ✅ save_point | `crossing_succeeded=true`, faction+1 |
| 5 | resolution_crossing_success | (End state) | ✅ mechanic_test | Reached success resolution |

**Final State Assertions:**
```json
{
  "stats": { "script": 2, "stage_presence": 2, "improv": 2 },
  "flags": {
    "game_started": true,
    "location_booth_visited": true,
    "met_maren": true,
    "crossing_succeeded": true
  },
  "inventory": ["booth_key"],
  "factions": { "preservationist": 1 }
}
```

**Critical Mechanics Validated:**
- Stat check evaluation (stage_presence >= 2)
- Success branch execution
- Faction modification on success

**Regression Checkpoints:** Steps 1, 3, 4

---

### PT-VS-004: Stat Check Failure Path

**Tests:** Stat check mechanics, failure branch

**Entry Point:** `sc_1_0_001` (The Booth Awakens)

**Prerequisites:** Must have `booth_key`, stage_presence < 2 (manually set for testing)

**Path:**
```
sc_1_0_001 ─[With booth_key, stage_presence=1]──> sc_1_0_003 ─[Stage Presence check: FAILURE]──> resolution_crossing_failure
```

**Steps:**

| Step | Scene | Action | Checkpoint | Expected State |
|------|-------|--------|------------|----------------|
| 1 | sc_1_0_001 | (Has booth_key, stage_presence=1) | ✅ save_point | inventory=["booth_key"], stage_presence=1 |
| 2 | sc_1_0_001 | Choose "Unlock the door" | ✅ softlock_check | Choice enabled (has key) |
| 3 | sc_1_0_003 | (At threshold, stage presence check) | ✅ mechanic_test | Stage Presence check: 1 >= 2 = **FAILURE** |
| 4 | sc_1_0_003 | (Failure branch) | ✅ save_point | `crossing_failed=true` |
| 5 | resolution_crossing_failure | (End state) | ✅ mechanic_test | Reached failure resolution |

**Final State Assertions:**
```json
{
  "stats": { "script": 2, "stage_presence": 1, "improv": 2 },
  "flags": {
    "game_started": true,
    "location_booth_visited": true,
    "met_maren": true,
    "crossing_failed": true
  },
  "inventory": ["booth_key"],
  "factions": { "preservationist": 0 }
}
```

**Critical Mechanics Validated:**
- Stat check evaluation failure condition
- Failure branch execution

**Regression Checkpoints:** Steps 1, 3, 4

---

### PT-VS-005: Act 1 Climax Convergence

**Tests:** Act 1→Act 2 transition, convergence scene from all Hub 0 paths, state flag propagation

**Entry Point:** `sc_1_1_099` (The First Crossing)

**Path:**
```
sc_1_1_099 ─[Choose: "Cross into the Understage"]──> sc_2_2_001
```

**Steps:**

| Step | Scene | Action | Checkpoint | Expected State |
|------|-------|--------|------------|----------------|
| 1 | sc_1_1_099 | (Arrived from any Hub 0 path) | ✅ save_point | Scene loaded, narrative displayed |
| 2 | sc_1_1_099 | Verify flags set on entry | ✅ mechanic_test | `act1_complete=true`, `first_crossing_reached=true` |
| 3 | sc_1_1_099 | Choose "Cross into the Understage - Begin Act 2" | ✅ softlock_check | Choice enabled (no requirements) |
| 4 | sc_2_2_001 | (Arrived at Green Room) | ✅ save_point | `act1_complete=true` persists, at Act 2 scene |

**Final State Assertions:**
```json
{
  "stats": { "script": 2, "stage_presence": 2, "improv": 2 },
  "flags": {
    "game_started": true,
    "act1_complete": true,
    "first_crossing_reached": true
  },
  "inventory": [],
  "factions": { "preservationist": 0 },
  "current_scene": "sc_2_2_001"
}
```

**Critical Mechanics Validated:**
- Convergence scene accepts arrival from any Hub 0 path (`flags.requires` is empty)
- Entry effects set flags correctly (`act1_complete`, `first_crossing_reached`)
- Forward transition to Act 2 works (`sc_2_2_001` is valid pending scene)
- No softlock at convergence (single forward choice always enabled)

**Regression Checkpoints:** Steps 1, 2, 4

**Note:** When Hub 0 branch paths (pursuers/researcher/negotiator) are implemented, this test should be expanded to verify path-specific conditional narrative acknowledging arrival route.

---

## Save/Load Regression Tests

These playthroughs specifically test state persistence across save/load operations.

### PT-SL-001: Scene Transition Save Point

**Tests:** Saving during scene transition, state restoration

**Entry Point:** `sc_1_0_001` (The Booth Awakens)

**Steps:**

| Step | Scene | Action | Expected State After Load |
|------|-------|--------|---------------------------|
| 1 | sc_1_0_001 | Choose "Go to the wings" | Transition to sc_1_0_002 |
| 2 | sc_1_0_002 | **SAVE to Slot 1** | Save file created |
| 3 | sc_1_0_002 | Choose "Continue forward" | Reach resolution |
| 4 | resolution | **LOAD from Slot 1** | Back at sc_1_0_002 |
| 5 | sc_1_0_002 | Verify state | `path_direct=true`, has "wings_pass", script=2, stage_presence=2, improv=2 |

**State Snapshot (Slot 1):**
```json
{
  "stats": { "script": 2, "stage_presence": 2, "improv": 2 },
  "flags": {
    "game_started": true,
    "location_booth_visited": true,
    "path_direct": true
  },
  "inventory": ["wings_pass"],
  "factions": { "preservationist": 0 },
  "current_scene": "sc_1_0_002",
  "scene_history": ["sc_1_0_001"]
}
```

**Validation Points:**
- [ ] Current scene is sc_1_0_002
- [ ] All flags match snapshot
- [ ] All stats match snapshot
- [ ] All inventory items match snapshot
- [ ] Can continue from saved state (no softlock)

---

### PT-SL-002: Complex State Save Point

**Tests:** Saving with complex state (items, flags, factions)

**Entry Point:** sc_1_0_001 (after completing PT-VS-003)

**Steps:**

| Step | Scene | Action | Expected State After Load |
|------|-------|--------|---------------------------|
| 1 | resolution_success | **SAVE to Slot 2** | Save file created |
| 2 | resolution_success | **LOAD from Slot 2** | Back at resolution_success |
| 3 | resolution_success | Verify state | All complex state preserved |

**State Snapshot (Slot 2):**
```json
{
  "stats": { "script": 2, "stage_presence": 2, "improv": 2 },
  "flags": {
    "game_started": true,
    "location_booth_visited": true,
    "met_maren": true,
    "crossing_succeeded": true
  },
  "inventory": ["booth_key"],
  "factions": { "preservationist": 1 },
  "current_scene": "resolution_crossing_success",
  "scene_history": ["sc_1_0_001", "sc_1_0_004", "sc_1_0_001", "sc_1_0_003"]
}
```

---

## Softlock Detection Tests

These playthroughs test for softlock conditions (scenes with no valid choices).

### PT-LOCK-001: Hub Scene Always Has Exit

**Tests:** Hub scenes maintain at least one valid choice

**Entry Point:** `sc_1_0_001` (The Booth Awakens)

**Test Procedure:**
1. At sc_1_0_001, verify at least 3 choices are available
2. Disable each choice one by one (by manipulating state)
3. Verify that at least one choice remains enabled at all times
4. Expected: "Go to the wings" is always enabled (no requirements)

**Invalid States to Test:**
- Empty inventory: Should still have 2+ choices available
- Low stage_presence (1): Should still have 2+ choices available
- All flags false: Should still have 2+ choices available

---

### PT-LOCK-002: Gated Scene Softlock Prevention

**Tests:** Gated scenes don't softlock if requirements aren't met

**Entry Point:** `sc_1_0_001` → attempt to enter `sc_1_0_003` without key

**Test Procedure:**
1. At sc_1_0_001 without "booth_key"
2. Attempt to select "Unlock the door" choice
3. Expected: Choice is disabled with hint "Requires booth_key"
4. Verify: At least 2 other choices remain available

---

## Ending Playthroughs

The following playthroughs test the Phase 3 Ending graph (Act 3 Hub 4: The Last Curtain Call).

### PT-END-001: Revisionist Ending (The Revised Draft)

**Tests:** Faction gate (revisionist >= 7), ending reachability

**Entry Point:** `sc_3_4_098` (The Last Curtain Call)

**Prerequisites:**
- revisionist faction >= 7

**Path:**
```
sc_3_4_098 ─[Choose: "The Revised Draft (Revisionist)"]──> sc_3_4_901
```

**Steps:**

| Step | Scene | Action | Checkpoint | Expected State |
|------|-------|--------|------------|----------------|
| 1 | sc_3_4_098 | (Arrived, revisionist=7) | ✅ save_point | High revisionist alignment |
| 2 | sc_3_4_098 | Hover "The Revised Draft" | ✅ mechanic_test | Choice **enabled** (revisionist >= 7) |
| 3 | sc_3_4_098 | Choose "The Revised Draft" | ✅ softlock_check | Transitions to sc_3_4_901 |
| 4 | sc_3_4_901 | (Arrived at ending) | ✅ mechanic_test | Reached ending 1, narrative displays |

**Final State Assertions:**
```json
{
  "stats": { "script": 2, "stage_presence": 2, "improv": 2 },
  "flags": {
    "game_started": true,
    "act1_complete": true,
    "act2_complete": true,
    "ending_achieved": "revised_draft"
  },
  "inventory": [],
  "factions": {
    "preservationist": 2,
    "revisionist": 7,
    "exiter": 1,
    "independent": 2
  },
  "current_scene": "sc_3_4_901"
}
```

**Critical Mechanics Validated:**
- Faction gate: revisionist >= 7 enables ending choice
- No softlock: At least one ending choice always enabled
- Ending scene reachable from convergence scene

**Regression Checkpoints:** Steps 1, 2, 4

---

### PT-END-002: Exiter Ending (The Open Book)

**Tests:** Faction gate (exiter >= 7), ending reachability

**Entry Point:** `sc_3_4_098` (The Last Curtain Call)

**Prerequisites:**
- exiter faction >= 7

**Path:**
```
sc_3_4_098 ─[Choose: "The Open Book (Exiter)"]──> sc_3_4_902
```

**Steps:**

| Step | Scene | Action | Checkpoint | Expected State |
|------|-------|--------|------------|----------------|
| 1 | sc_3_4_098 | (Arrived, exiter=7) | ✅ save_point | High exiter alignment |
| 2 | sc_3_4_098 | Hover "The Open Book" | ✅ mechanic_test | Choice **enabled** (exiter >= 7) |
| 3 | sc_3_4_098 | Choose "The Open Book" | ✅ softlock_check | Transitions to sc_3_4_902 |
| 4 | sc_3_4_902 | (Arrived at ending) | ✅ mechanic_test | Reached ending 2, narrative displays |

**Final State Assertions:**
```json
{
  "stats": { "script": 2, "stage_presence": 2, "improv": 2 },
  "flags": {
    "game_started": true,
    "act1_complete": true,
    "act2_complete": true,
    "ending_achieved": "open_book"
  },
  "inventory": [],
  "factions": {
    "preservationist": 1,
    "revisionist": 2,
    "exiter": 7,
    "independent": 2
  },
  "current_scene": "sc_3_4_902"
}
```

**Critical Mechanics Validated:**
- Faction gate: exiter >= 7 enables ending choice
- No softlock: At least one ending choice always enabled
- Ending scene reachable from convergence scene

**Regression Checkpoints:** Steps 1, 2, 4

---

### PT-END-003: Preservationist Ending (The Closed Canon)

**Tests:** Faction gate (preservationist >= 7), ending reachability

**Entry Point:** `sc_3_4_098` (The Last Curtain Call)

**Prerequisites:**
- preservationist faction >= 7

**Path:**
```
sc_3_4_098 ─[Choose: "The Closed Canon (Preservationist)"]──> sc_3_4_903
```

**Steps:**

| Step | Scene | Action | Checkpoint | Expected State |
|------|-------|--------|------------|----------------|
| 1 | sc_3_4_098 | (Arrived, preservationist=7) | ✅ save_point | High preservationist alignment |
| 2 | sc_3_4_098 | Hover "The Closed Canon" | ✅ mechanic_test | Choice **enabled** (preservationist >= 7) |
| 3 | sc_3_4_098 | Choose "The Closed Canon" | ✅ softlock_check | Transitions to sc_3_4_903 |
| 4 | sc_3_4_903 | (Arrived at ending) | ✅ mechanic_test | Reached ending 3, narrative displays |

**Final State Assertions:**
```json
{
  "stats": { "script": 2, "stage_presence": 2, "improv": 2 },
  "flags": {
    "game_started": true,
    "act1_complete": true,
    "act2_complete": true,
    "ending_achieved": "closed_canon"
  },
  "inventory": [],
  "factions": {
    "preservationist": 7,
    "revisionist": 1,
    "exiter": 2,
    "independent": 2
  },
  "current_scene": "sc_3_4_903"
}
```

**Critical Mechanics Validated:**
- Faction gate: preservationist >= 7 enables ending choice
- No softlock: At least one ending choice always enabled
- Ending scene reachable from convergence scene

**Regression Checkpoints:** Steps 1, 2, 4

---

### PT-END-004: Independent Ending (The Blank Page)

**Tests:** Independent path (no faction threshold), flag requirement (editorState_revealedTruth), ending reachability

**Entry Point:** `sc_3_4_098` (The Last Curtain Call)

**Prerequisites:**
- No dominant faction (all <= 5)
- editorState_revealedTruth flag set to true

**Path:**
```
sc_3_4_098 ─[Choose: "The Blank Page (Independent)"]──> sc_3_4_904
```

**Steps:**

| Step | Scene | Action | Checkpoint | Expected State |
|------|-------|--------|------------|----------------|
| 1 | sc_3_4_098 | (Arrived, balanced factions) | ✅ save_point | All factions <= 5, editorState_revealedTruth=true |
| 2 | sc_3_4_098 | Hover "The Blank Page" | ✅ mechanic_test | Choice **enabled** (editorState_revealedTruth flag set) |
| 3 | sc_3_4_098 | Choose "The Blank Page" | ✅ softlock_check | Transitions to sc_3_4_904 |
| 4 | sc_3_4_904 | (Arrived at ending) | ✅ mechanic_test | Reached ending 4, narrative displays |

**Final State Assertions:**
```json
{
  "stats": { "script": 2, "stage_presence": 2, "improv": 2 },
  "flags": {
    "game_started": true,
    "act1_complete": true,
    "act2_complete": true,
    "editorState_revealedTruth": true,
    "ending_achieved": "blank_page"
  },
  "inventory": [],
  "factions": {
    "preservationist": 3,
    "revisionist": 3,
    "exiter": 3,
    "independent": 4
  },
  "current_scene": "sc_3_4_904"
}
```

**Critical Mechanics Validated:**
- No faction threshold: Independent path available regardless of faction levels
- Flag requirement: editorState_revealedTruth flag required for this ending
- Balance path: Represents "no dominant alliance" playthrough
- Ending scene reachable from convergence scene

**Regression Checkpoints:** Steps 1, 2, 4

**Note:** This ending validates the independent/balance path where players didn't strongly align with any single faction during Act 2.

---

### PT-END-005: Fail-State Ending (The Eternal Rehearsal)

**Tests:** Fail-state ending (always reachable), no blocking conditions, catch-all for invalid states

**Entry Point:** `sc_3_4_098` (The Last Curtain Call)

**Prerequisites:** None (this ending should always be reachable)

**Path:**
```
sc_3_4_098 ─[Choose: "Refuse" / "The Eternal Rehearsal"]──> sc_3_4_999
```

**Steps:**

| Step | Scene | Action | Checkpoint | Expected State |
|------|-------|--------|------------|----------------|
| 1 | sc_3_4_098 | (Arrived, any state) | ✅ save_point | Convergence scene loaded |
| 2 | sc_3_4_098 | Hover "Refuse / The Eternal Rehearsal" | ✅ mechanic_test | Choice **enabled** (no requirements) |
| 3 | sc_3_4_098 | Choose "The Eternal Rehearsal" | ✅ softlock_check | Transitions to sc_3_4_999 |
| 4 | sc_3_4_999 | (Arrived at fail ending) | ✅ mechanic_test | Reached ending 5, failure narrative displays |

**Final State Assertions:**
```json
{
  "stats": { "script": 2, "stage_presence": 2, "improv": 2 },
  "flags": {
    "game_started": true,
    "act1_complete": true,
    "act2_complete": true,
    "ending_achieved": "eternal_rehearsal"
  },
  "inventory": [],
  "factions": {
    "preservationist": 2,
    "revisionist": 2,
    "exiter": 2,
    "independent": 2
  },
  "current_scene": "sc_3_4_999"
}
```

**Critical Mechanics Validated:**
- **Always reachable**: This ending must have NO blocking conditions
- **Fallback**: Serves as catch-all for players who don't qualify for other endings
- **Refusal path**: Valid for players who refuse to make a final choice
- **No softlock guarantee**: At minimum, this ending ensures forward progress

**Regression Checkpoints:** Steps 1, 2, 4

**Test Variants (Invalid State Validation):**

**Variant A: Low faction levels**
| Step | Scene | Action | Expected Result |
|------|-------|--------|-----------------|
| 1 | sc_3_4_098 | (all factions < 7) | ✅ save_point |
| 2 | sc_3_4_098 | Hover faction endings | All faction choices **disabled** (below threshold) |
| 3 | sc_3_4_098 | Hover "The Eternal Rehearsal" | Choice **enabled** (always available) |

**Variant B: Missing flag for Independent ending**
| Step | Scene | Action | Expected Result |
|------|-------|--------|-----------------|
| 1 | sc_3_4_098 | (balanced factions, editorState_revealedTruth not set) | ✅ save_point |
| 2 | sc_3_4_098 | Hover "The Blank Page" | Choice **disabled** (missing flag) |
| 3 | sc_3_4_098 | Hover "The Eternal Rehearsal" | Choice **enabled** (always available) |

**Note:** This is the CRITICAL fallback ending per ENDING_VALIDATION.md. It MUST always be reachable regardless of player state. If all other endings are gated (wrong faction level, missing flag), this ending ensures the player can always complete the game.

---

### Ending Gate Validation Summary

| Ending | Scene | Faction | Level | Flag/State | Gate Condition |
|--------|-------|---------|-------|------------|----------------|
| PT-END-001 | sc_3_4_901 | revisionist | >= 7 | - | revisionist >= 7 |
| PT-END-002 | sc_3_4_902 | exiter | >= 7 | - | exiter >= 7 |
| PT-END-003 | sc_3_4_903 | preservationist | >= 7 | - | preservationist >= 7 |
| PT-END-004 | sc_3_4_904 | independent | - | editorState_revealedTruth | editorState_revealedTruth flag set (no faction gate) |
| PT-END-005 | sc_3_4_999 | - | - | - | **Always enabled** (no conditions) |

**Critical Validation Requirements:**
- Faction endings (1-3): Require faction level >= 7 only
- Independent ending (4): No faction gate, requires editorState_revealedTruth flag
- Fail ending (5): **NO conditions** - must always be enabled
- At minimum: Ending 5 must always be available to prevent softlock

---

## Ending Quality Tier Tests (v2.0.0 ROADMAP - Future Implementation)

**IMPORTANT:** Quality tiers are planned for v2.0.0 (Phase 8 content expansion). The current v1.0.0 implementation has single-tier endings only. This section documents the FUTURE test infrastructure for ending quality tiers.

### Overview

The v2.0.0 roadmap specifies 15 ending variants: 5 endings × 3 quality tiers (Perfect/Good/Other) for faction endings, and single variants for Independent and Fail endings.

**Test Generation:** Quality tier tests are generated automatically from `manifest.json` using:
```bash
npm run test:generate-ending-tests
```

**Feasibility Validation:** All quality tier requirements are mathematically feasible (faction caps 0-10, no mutually exclusive conditions).

---

### Generated Test Files

The following test files are generated in `tests/playthroughs/endings/generated/`:

| Ending | Scene | Perfect Tier | Good Tier | Other Tier |
|--------|-------|--------------|----------|------------|
| 1: The Revised Draft | sc_3_4_901 | ending-1-perfect.json | ending-1-good.json | ending-1-other.json |
| 2: The Open Book | sc_3_4_902 | ending-2-perfect.json | ending-2-good.json | ending-2-other.json |
| 3: The Closed Canon | sc_3_4_903 | ending-3-perfect.json | ending-3-good.json | ending-3-other.json |
| 4: The Blank Page | sc_3_4_904 | N/A | N/A | ending-4-other.json |
| 5: The Eternal Rehearsal | sc_3_4_999 | N/A | N/A | ending-5-other.json |

**Note:** Endings 4 (Independent) and 5 (Fail) do not have quality tiers - single variant only per COMPREHENSIVE_ROADMAP.md design.

---

### Quality Tier Requirements

#### Ending 1: The Revised Draft (Revisionist)

| Tier | Faction Level | Additional Flags | Allies | No Casualties |
|------|--------------|------------------|--------|---------------|
| Perfect | revisionist >= 9 | MAREN_ALLY, DIRECTOR_CONFIDANT | 2+ | Yes |
| Good | revisionist >= 7 | - | - | - |
| Other | revisionist >= 5 | - | - | - |

**Feasibility:** ✅ All tiers achievable (max faction 10, Perfect tier requires 9)

---

#### Ending 2: The Open Book (Exiter)

| Tier | Faction Level | Additional Flags | Allies | No Casualties |
|------|--------------|------------------|--------|---------------|
| Perfect | exiter >= 9 | CHORUS_ALLY, PEACEFUL_RESOLUTION | 1+ | Yes |
| Good | exiter >= 7 | - | - | - |
| Other | exiter >= 5 | - | - | - |

**Feasibility:** ✅ All tiers achievable (max faction 10, Perfect tier requires 9)

---

#### Ending 3: The Closed Canon (Preservationist)

| Tier | Faction Level | Additional Flags | Allies | No Casualties |
|------|--------------|------------------|--------|---------------|
| Perfect | preservationist >= 9 | COMPLETE_SEAL | 0 | Yes |
| Good | preservationist >= 7 | - | - | - |
| Other | preservationist >= 5 | - | - | - |

**Feasibility:** ✅ All tiers achievable (max faction 10, Perfect tier requires 9)

---

#### Ending 4: The Blank Page (Independent)

**Single variant only** - No quality tiers per roadmap design.

| Tier | Faction Level | Additional Flags | Allies | No Casualties |
|------|--------------|------------------|--------|---------------|
| Other | None | editorState_revealedTruth | - | - |

**Rationale:** Independent path represents "truth discovered" narrative, not quality of faction alignment.

---

#### Ending 5: The Eternal Rehearsal (Fail)

**Single variant only** - Always reachable, no quality tiers.

| Tier | Faction Level | Additional Flags | Allies | No Casualties |
|------|--------------|------------------|--------|---------------|
| Other | None | None | - | - |

**Rationale:** Fail-state ending serves as catch-all fallback, must always be reachable.

---

### Tier Fallthrough Logic

**Question:** What happens when players miss Perfect tier requirements?

**Per COMPREHENSIVE_ROADMAP.md:**
- If Perfect requirements not met → Fall through to Good tier (if faction >= 7)
- If Good requirements not met → Fall through to Other tier (if faction >= 5)
- If Other requirements not met → Ending unavailable, must choose different ending

**Example:** Player with revisionist=8, no allies:
- ❌ Perfect: Requires revisionist >= 9 + MAREN_ALLY + DIRECTOR_CONFIDANT
- ✅ Good: Revisionist >= 7, no other requirements
- → Player gets "Good" tier variant of Ending 1

**Edge Case:** What if player has revisionist=9 but sacrificed Maren (SACRIFICED_MAREN flag set)?
- ❌ Perfect: Requires noCasualties=true (SACRIFICED_* flags not set)
- ✅ Good: Revisionist >= 7, no sacrifice restriction
- → Player gets "Good" tier variant despite high faction level

---

### Automated Validation

**Run feasibility validation:**
```bash
npm run test:validate-ending-feasibility
```

**Validation checks:**
1. Faction levels within stat cap (0-10)
2. No mutually exclusive flags (noCasualties + SACRIFICED_*)
3. Perfect tier significantly harder than Good tier (level gap >= 2)
4. Independent/Fail endings don't have quality tiers

**Output:**
```
✅ Generated 11 ending playthrough tests
📁 Output directory: tests/playthroughs/endings/generated
✅ All quality tier requirements are mathematically feasible
```

---

### Phase 8.5: Ending Quality Tier Validation (REQUIRED GATE)

**When to run:** After Phase 8 content expansion completes, before Phase 11 UI/UX work begins.

**Required validations:**
- [ ] All 11 generated ending tests pass (via headless runner)
- [ ] All 15 ending variants (5 × 3 tiers + 2 single-variant) are mathematically reachable
- [ ] Perfect tier requirements don't create impossible stat combinations
- [ ] Tier fallthrough logic works correctly (Perfect → Good → Other → Unavailable)
- [ ] No mutually exclusive tier conditions (e.g., "no casualties" + "must sacrifice NPC")
- [ ] Save/load preserves tier-eligible state (flags, factions, items)

**Automated tests:**
```bash
# Generate all quality tier tests
npm run test:generate-ending-tests

# Run generated tests via headless runner
npm run headless:run-all tests/playthroughs/endings/generated/
```

**Manual validation:**
- [ ] Complete playthrough to each Perfect tier ending (requires max faction + allies + no sacrifices)
- [ ] Verify tier fallthrough (miss Perfect, get Good; miss Good, get Other)
- [ ] Test edge cases (sacrifice NPC with Perfect-tier faction level, reach Perfect with minimal allies)

---

### Metadata-Driven Test Generation

**Design principle:** Tests are generated from `manifest.json` as single source of truth (per agent-b recommendation).

**Benefits:**
1. **Scalability:** Adding new endings automatically generates corresponding tests
2. **Regression prevention:** Manifest changes trigger test regeneration
3. **Maintainability:** Single source of truth for ending definitions

**Generation script:** `tests/generate-ending-tests.ts`
- Reads ending definitions from `manifest.json`
- Applies quality tier configs from `QUALITY_TIER_CONFIGS` constant
- Validates mathematical feasibility before generating tests
- Outputs JSON test files in headless runner schema

**Regeneration workflow:**
```bash
# 1. Update manifest.json with new ending or tier requirements
# 2. Regenerate tests
npm run test:generate-ending-tests
# 3. Commit generated tests to git (reproducibility)
# 4. Run tests via headless runner
npm run headless:run-all tests/playthroughs/endings/generated/
```

---

### Edge Cases: Quality Tier Interactions

#### Case 1: Sacrifice NPC with Perfect-Tier Faction Level

**Scenario:** Player has revisionist=9 but sacrificed Maren (SACRIFICED_MAREN flag set)

**Expected behavior:**
- ❌ Perfect tier: Requires noCasualties=true
- ✅ Good tier: revisionist=9 >= 7, no sacrifice restriction
- → Player gets "Good" variant despite high faction level

**Test file:** `tests/playthroughs/endings/generated/ending-1-perfect.json` (modified with sacrifice flag)

---

#### Case 2: Mutually Exclusive Allies

**Scenario:** Perfect tier requires 2+ allies, but ally flags are mutually exclusive (e.g., MAREN_ALLY and UNDERSTUDY_ALLY cannot both be true due to narrative)

**Current status:** ✅ No mutual exclusivity detected in current flag design
- MAREN_ALLY and DIRECTOR_CONFIDANT can coexist
- CHORUS_ALLY is independent of faction allies
- Future content additions should validate flag compatibility

---

#### Case 3: Save/Load Preserves Tier-Eligible State

**Scenario:** Player saves at sc_3_4_098 with Perfect-tier requirements, reloads, and chooses ending

**Expected behavior:**
- All Perfect-tier flags persist (MAREN_ALLY, DIRECTOR_CONFIDANT, etc.)
- Faction levels persist (revisionist=9)
- No sacrifice flags (SACRIFICED_*) appear after load
- → Perfect tier ending is reachable after save/load

**Test validation:** Generated tests include `endingCriteria` with `flagsRequired` array for persistence validation

---

## Edge Case Tests

### PT-EDGE-001: Empty Inventory Navigation

**Tests:** Game is playable with empty inventory

**Procedure:**
1. Start new game (inventory empty)
2. Attempt only paths that don't require items
3. Expected: Can reach resolution via "Go to the wings" path

---

### PT-EDGE-002: Minimum Stats Navigation

**Tests:** Game is playable with minimum stat values

**Procedure:**
1. Start new game with stage_presence=1, improv=1, script=1 (manually set for testing)
2. Navigate through direct path (PT-VS-001)
3. Expected: Can reach resolution without stat check issues

---

### PT-EDGE-003: Maximum Stats Navigation

**Tests:** Game is playable with maximum stat values

**Procedure:**
1. Start new game with all stats=4
2. Navigate through stat check path (PT-VS-003)
3. Expected: Stat check passes, appropriate success branch

---

## Headless Runner Integration

For automated testing, these playthrough scripts map to executable JSON files in `tests/playthroughs/`.

### JSON Playthrough Format

```json
{
  "playthrough_id": "PT-VS-001",
  "name": "Direct Route (Baseline Navigation)",
  "entry_point": "sc_1_0_001",
  "steps": [
    {
      "step": 1,
      "scene": "sc_1_0_001",
      "action": "choose",
      "choice_label": "Go to the wings",
      "checkpoint": true,
      "assertions": {
        "stats": { "script": 2, "stage_presence": 2, "improv": 2 },
        "flags": { "game_started": true, "location_booth_visited": true },
        "inventory": ["wings_pass"],
        "current_scene": "sc_1_0_002"
      }
    }
  ]
}
```

### Running Automated Tests

```bash
# Run all playthroughs
npm run test:playthroughs

# Run specific playthrough
npm run test:playthrough -- PT-VS-001

# Run with CI mode (junit output)
npm run test:playthroughs -- --ci --junit-report
```

### Softlock Detection Thresholds

The headless runner uses these thresholds for detecting potential softlocks:

| Threshold | Value | Description |
|-----------|-------|-------------|
| `maxSceneRevisits` | 3 | Max times to revisit same scene before flagging potential loop |
| `maxStepsWithoutProgress` | 15 | Max steps without new flags/items before flagging stagnation |

---

## QA Checklist for New Content

When adding new scenes or mechanics, use this checklist:

### Pre-Implementation
- [ ] Scene ID follows convention (`sc_<chapter>_<slug>`)
- [ ] All referenced scenes exist in manifest.json
- [ ] All condition schemas match engine expectations
- [ ] All effect schemas match engine expectations

### Post-Implementation
- [ ] Scene is reachable from starting point
- [ ] All choices have valid `to` targets
- [ ] Disabled choices have `disabledHint` text
- [ ] Gated choices have appropriate condition checks
- [ ] Effects apply correctly (flags, items, stats)
- [ ] Playthrough script exists for new content
- [ ] Save/load checkpoint identified for new content
- [ ] Softlock check performed (at least one valid choice)

---

## Appendix: State Variable Reference

### Stats (1-4 range)
| Stat | Starting | Description |
|------|----------|-------------|
| script | 2 | Knowledge of narrative patterns, genre awareness, preparation |
| stage_presence | 2 | Force of personality, dramatic timing, command of attention |
| improv | 2 | Adaptability, quick thinking, unorthodox solutions |

### Flags
| Flag | Type | Purpose |
|------|------|---------|
| game_started | bool | Set on first scene load |
| location_booth_visited | bool | Tracks if player visited booth |
| path_direct | bool | Took direct path to wings |
| crossing_succeeded | bool | Successfully crossed threshold |
| crossing_failed | bool | Failed the crossing stat check |
| met_maren | bool | Spoke with Maren character |
| act1_complete | bool | Set when reaching sc_1_1_099 First Crossing (Act 1 Climax) |
| first_crossing_reached | bool | Set when arriving at First Crossing scene |
| act2_started | bool | Set when entering Act 2 (sc_2_2_001 Green Room) |
| green_room_reached | bool | Set when arriving at Green Room |
| archives_entered | bool | Set when entering Archives (sc_2_3_001) |
| act2_hub3_started | bool | Set when entering Act 2 Hub 3 |
| archives_reached | bool | Tracks Archives Hub 3 content access |
| revelation_discovered | bool | Set when reaching sc_2_3_099 The Revelation |
| act2_complete | bool | Set when completing Act 2 content |
| editor_revealed | bool | Set when Editor character is revealed |
| mainstage_ascent | bool | Set when ascending to Mainstage (Act 3) |
| editorState_revealedTruth | bool | Set when player discovers deeper truth about The Editor (Independent ending gate) |
| ending_achieved | string | Set when reaching an ending scene |

### Inventory Items
| Item ID | Display Name | Description |
|---------|--------------|-------------|
| booth_key | Booth Key | Unlocks the prompter's booth door |
| wings_pass | Wings Pass | Temporary access to theatre wings |

### Factions (0-10 range)
| Faction | Starting | Description |
|---------|----------|-------------|
| preservationist | 0 | Faction favoring separation of worlds (Preservationist ending requires >=7) |
| revisionist | 0 | Faction favoring rewriting stories (Revisionist ending requires >=7) |
| exiter | 0 | Faction favoring escaping narrative (Exiter ending requires >=7) |
| independent | 0 | Balanced path between factions (Independent ending requires editorState_revealedTruth flag) |

**Note:** The `editorState` enum (defeated/persuaded/revealedTruth) referenced in earlier design documents is NOT implemented in sc_3_4_098. Current implementation uses:
- Faction stat checks (>= 7) for faction endings
- Boolean flag `editorState_revealedTruth` for Independent ending
- No conditions for fail-state ending
- Combined faction + editorState AND gates are DEFERRED per MILESTONES.md Issue #129

---

## Phase 4 Accessibility Tests

The following tests validate Phase 4 Polish accessibility features. These are UI-layer concerns that do not affect engine state determinism.

### PT-P4-ACC-001: CRT Filter Desktop-Only Behavior

**Tests:** CRT filter enables on desktop, disables on mobile

**UI Components:** `src/ui/crt-filter.ts`, `src/ui/shell.css`

**Test Procedure:**
1. Load game on desktop viewport (≥768px)
2. Expected: CRT filter enabled by default (scanlines, text glow)
3. Load game on mobile viewport (<768px)
4. Expected: CRT filter disabled (no overlay effects)

**CSS Validation Points:**
- [ ] `@media (min-width: 768px)` enables CRT effects
- [ ] `@media (max-width: 767px)` disables CRT effects
- [ ] Toggle button: `getCRTFilter().toggle()` switches state
- [ ] Respects `prefers-reduced-motion` (auto-disabled)

---

### PT-P4-ACC-002: Reduced Motion Instant Mode

**Tests:** Scene transitions bypass animations when `prefers-reduced-motion` is active

**UI Components:** `src/ui/shell.css` (`.instant-mode` class)

**Test Procedure:**
1. Enable OS-level reduced motion preference
2. Navigate through any scene transition
3. Expected: `.instant-mode` class applied, zero animation delay

**CSS Validation Points:**
- [ ] `@media (prefers-reduced-motion: reduce)` applies `.instant-mode`
- [ ] Scene fade transitions disabled (0ms duration)
- [ ] Choice hover animations disabled
- [ ] No motion-based visual effects

**Engine Validation:** See `tests/engine/accessibility.test.ts` for state determinism verification.

---

### PT-P4-ACC-003: Audio SFX Respect Preferences

**Tests:** Audio disabled when reduced motion preference active

**UI Components:** `src/ui/audio-manager.ts`

**Test Procedure:**
1. Enable OS-level reduced motion preference
2. Trigger any SFX (choice select, scene load, save/load)
3. Expected: No audio playback

**Validation Points:**
- [ ] `AudioManager.setEnabled(false)` when reduced motion detected
- [ ] User gesture required for initialization (browser autoplay policy)
- [ ] Volume control: `setVolume(0.0 - 1.0)` works
- [ ] Mute toggle: `setEnabled(false)` silences all SFX

---

### PT-P4-ACC-004: Focus Indicators

**Tests:** High-contrast focus indicators for keyboard navigation

**UI Components:** `src/ui/shell.css`

**Validation Points:**
- [ ] All interactive elements have `:focus` state (3px yellow outline)
- [ ] Skip-to-content link present (`href="#main-content"`)
- [ ] Focus order matches DOM order
- [ ] Visible focus ring on all buttons, links, choices

---

### PT-P4-ACC-005: Phase 3 Regression Prevention

**Tests:** Phase 4 UI changes do not break Phase 3 functionality

**Engine Tests:** `tests/engine/accessibility.test.ts`

**Validation Points:**
- [ ] All Phase 3 ending paths still reachable
- [ ] Save/load state persistence unchanged
- [ ] Stat/flag/inventory mechanics unaffected
- [ ] Scene history tracking accurate

**Automated Test Command:**
```bash
npm run test tests/engine/accessibility.test.ts
```

---

### PT-A11Y-001: WCAG 2.5.5 Touch Target Size (44x44px Minimum)

**Tests:** Touch targets meet WCAG 2.5.5 Success Criterion 2.5.5 (Target Size)

**Reference:** PR #403 - `src/ui/shell.css` (`.slot-action-btn`)

**UI Components:** Save/load slot action buttons (Save, Load, Delete)

**WCAG Requirement:**
- Touch targets must be at least 44x44px CSS pixels
- Exception: inline controls, essential controls, or 24px spacing-equivalent separation

**Test Procedure:**
1. Open save/load menu
2. Measure `.slot-action-btn` dimensions (Save, Load, Delete buttons)
3. Expected: `min-height: 44px`, `min-width: 80px` (or implicit from layout)

**Validation Points:**
- [ ] `.slot-action-btn` has `min-height: 44px` (WCAG 2.5.5 compliance)
- [ ] Button width is >=44px (explicit `min-width` or layout constraint)
- [ ] Spacing between buttons <24px (spacing exception does NOT apply, full 44x44px required)

**CSS Validation:**
```css
.slot-action-btn {
  min-height: 44px; /* WCAG 2.5.5: 44x44px min touch target */
  padding: var(--space-1) var(--space-2);
}
```

**Regression Risk:**
- Future CSS changes could reduce height below 44px
- No automated test - manual QA or visual regression test required

---

### PT-A11Y-002: WCAG 2.1.1 Keyboard Interface (No tabindex on Non-Interactive)

**Tests:** Non-interactive elements do not have keyboard focus

**Reference:** PR #403 - `src/ui/game-renderer.ts` (inventory items), `src/ui/shell.css`

**UI Components:** Inventory items (`.inventory-item`)

**WCAG Requirement:**
- WCAG 2.1.1 Success Criterion: All interactive functionality must be operable through a keyboard interface
- **Corollary:** Non-interactive elements MUST NOT have `tabindex="0"` (creates keyboard trap)

**Test Procedure:**
1. Add items to inventory via console: `engine.state.inventory.addItem('wayfinder', 1)`
2. Press Tab key to navigate interface
3. Expected: Inventory items do NOT receive keyboard focus
4. Verify: No `cursor: pointer` on inventory items

**Validation Points:**
- [ ] `.inventory-item` does NOT have `tabindex="0"` (non-interactive display-only)
- [ ] `.inventory-item` does NOT have `cursor: pointer` (misleading for non-interactive)
- [ ] `.inventory-item` does NOT have `:focus` styles (no keyboard focus without tabindex)
- [ ] Tab order flows: Text → Choices → Stats → Save/Load buttons (skips inventory)

**Code Validation:**
```typescript
// game-renderer.ts:806-807
// Phase 10 infrastructure: Not yet interactive - remove tabindex until click handler is added
// TODO: Add click handler, ARIA semantics (role="button"), aria-label, and tabindex="0" when Phase 10 is implemented
```

**CSS Validation:**
```css
/* shell.css - NO cursor: pointer on .inventory-item */
/* shell.css - NO :focus styles for .inventory-item */
```

**Phase 10 Requirements:**
When inventory items become interactive, developers MUST add:
- [ ] Click handler (e.g., item inspection modal)
- [ ] `tabindex="0"` for keyboard focus
- [ ] `role="button"` or `role="option"` for ARIA semantics
- [ ] `aria-label` with item name
- [ ] `:hover` and `:focus` visual styles

---

### PT-A11Y-003: WCAG 2.5.5 Comprehensive Touch Target Audit

**Tests:** ALL interactive elements meet WCAG 2.5.5 44x44px minimum touch target requirement

**Scope:** Complete audit of all interactive UI components in the codebase

**Audit Date:** 2026-01-06 (post-PR #403)

**Reference:**
- WCAG 2.5.5 Success Criterion: Touch targets must be at least 44x44px CSS pixels
- Exception: Inline, essential, or spacing-equivalent (24px gap between targets)

**Audit Results:**

| Component | CSS Selector | Height | Width | Location | Status |
|-----------|--------------|--------|-------|----------|--------|
| Choice buttons | `.choice-button` | `min-height: 44px` | 100% | shell.css:405 | ✅ Compliant |
| Save/load slot buttons | `.slot-action-btn` | `min-height: 44px` | implicit | shell.css:1067 | ✅ Compliant (fixed PR #403) |
| Error buttons | `.error-button` | `min-height: 44px` | implicit | shell.css:779 | ✅ Compliant |
| Menu option buttons | `.menu-option-btn` | `min-height: 48px` | implicit | shell.css:1144 | ✅ Compliant |
| Modal close button | `.modal-close-btn` | `min-height: 44px` | `min-width: 100px` | shell.css:970 | ✅ Compliant |
| Modal confirm button | `.modal-confirm-btn` | `min-height: 44px` | `min-width: 100px` | shell.css:970 | ✅ Compliant |
| Notification dismiss | `.notification-dismiss` | `28px + 16px padding = 44px` | `28px + 16px padding = 44px` | phase11-styles.css:183 | ✅ Compliant |

**Summary:** All interactive elements in the codebase meet WCAG 2.5.5 requirements. The only violation was `.slot-action-btn` (36px), which was fixed to 44px in PR #403.

**Verification Procedure:**
1. Open browser DevTools Inspector
2. For each component above, inspect the computed `height` and `width`
3. Verify: `height >= 44px` AND `width >= 44px` OR effective target size (element + padding) >= 44px
4. For `.notification-dismiss`: Verify `28px` element + `8px` padding on all sides = `44px` effective

**Spacing Exception Check:**
WCAG 2.5.5 allows smaller targets if 24px spacing-equivalent separation exists. Audit findings:
- `.slot-action-btn` gap: `var(--space-1) = 8px` ❌ Exception does NOT apply (needs 24px)
- `.choice-button` gap: None (stacked vertically) ❌ Exception does NOT apply
- `.menu-option-btn` gap: `var(--space-2) = 16px` ❌ Exception does NOT apply

**Conclusion:** No components qualify for spacing exception. All must meet 44x44px minimum, which they do.

**Regression Prevention:**
- Manual QA: Re-run this audit after any CSS changes to button/interactive element sizing
- Automated testing: See Intent #418 (blocked - requires browser-based testing for true regression prevention)
- Developer checklist: Before merging UI changes, verify touch target sizes meet WCAG 2.5.5

**Future Components:**
When adding new interactive elements, developers MUST:
- [ ] Set `min-height: 44px` OR ensure effective target size (element + padding) >= 44px
- [ ] Set `min-width: 44px` OR ensure effective target size >= 44px
- [ ] Add to this audit table with CSS selector and location
- [ ] Run manual verification against PT-A11Y-001/003 validation points

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.10 | 2026-01-06 | **ADDED** PT-A11Y-003 (WCAG 2.5.5 Comprehensive Touch Target Audit) - complete audit of all interactive UI components (choice buttons, slot buttons, error buttons, menu options, modal buttons, notification dismiss). Documents that all components meet 44x44px minimum requirement. Only violation was `.slot-action-btn` (36px) fixed in PR #403. Addresses reviewer concern about incomplete scope in PT-A11Y-001. |
| 1.9 | 2026-01-06 | **ADDED** PT-A11Y-001 (WCAG 2.5.5 Touch Target Size) and PT-A11Y-002 (WCAG 2.1.1 Keyboard Interface) accessibility test documentation. Documents PR #403 fixes: `.slot-action-btn` 44x44px minimum touch target for save/load slot buttons, and removal of `tabindex="0"` from non-interactive `.inventory-item` elements. Includes Phase 10 interactivity requirements checklist for when inventory items become interactive. |
| 1.8 | 2026-01-04 | **ADDED** Ending Quality Tier Tests section documenting v2.0.0 roadmap test infrastructure for 15 ending variants (5 endings × 3 quality tiers for faction endings, single variants for Independent/Fail). Includes generated test file reference table, quality tier requirements matrix, tier fallthrough logic, automated validation commands, Phase 8.5 Required Gate checklist, metadata-driven test generation design, and edge case documentation. **ADDED** `tests/generate-ending-tests.ts` script for automated test generation from manifest.json with mathematical feasibility validation. |
| 1.7 | 2026-01-03 | **FIXED** YAML template example (line 32) to use canonical stats (script, stage_presence, improv with 1-4 range) instead of legacy stats (health, courage) for documentation consistency. |
| 1.6 | 2026-01-02 | **FIXED** PT-END-001 through PT-END-005 ending gate documentation to match actual sc_3_4_098 implementation. Removed incorrect editorState enum requirements (defeated/persuaded) from faction endings. Changed PT-END-004 to use editorState_revealedTruth boolean flag instead of enum. Updated Ending Gate Validation Summary table and State Variable Reference with clarification that combined faction+editorState AND gates are DEFERRED per MILESTONES.md Issue #129. |
| 1.5 | 2026-01-01 | Added PT-SL-001, PT-SL-002 (Save/Load regression tests) - tests state persistence across scene transitions and complex states using save_snapshot/load_snapshot actions. Added PT-EDGE-001, PT-EDGE-002, PT-EDGE-003 (Edge case tests) - validates empty inventory navigation, minimum stats (courage=0), and maximum stats (courage=10, insight=10) edge cases. NOTE: PT-END-001 through PT-END-005 exist in tests/playthroughs/endings/ directory with different schema (factions field, editorState). PT-LOCK and PT-P4-ACC tests require different testing approaches (softlockDetection config covers softlock tests, Phase 4 accessibility tests require unit/integration testing). |
| 1.4 | 2025-12-30 | Added Phase 4 accessibility tests (PT-P4-ACC-001 through PT-P4-ACC-005) |
| 1.3 | 2025-12-29 | Added PT-END-001 through PT-END-005 (Act 3 Ending validation) - validates all 5 endings (sc_3_4_901 through sc_3_4_904, sc_3_4_999), faction gates (>=7), editorState requirements (defeated/persuaded/revealedTruth), and fail-state fallback ending. Updated State Variable Reference with editorState flag and all 4 factions. |
| 1.2 | 2025-12-29 | Added PT-VS-006 (Act 2 Hub 3 Entry) and PT-VS-007 (Act 2 Climax Alliance Check) - validates sc_2_3_001 Archives Entry and sc_2_3_099 The Revelation scenes, documents all 4 faction states (preservationist, revisionist, exiter, independent), and adds faction alliance acknowledgment test variants |
| 1.1 | 2025-12-29 | Added PT-VS-005 (Act 1 Climax Convergence) - validates sc_1_1_099 First Crossing scene, Act 1→Act 2 transition, and new state variables (act1_complete, first_crossing_reached) |
| 1.0 | 2025-12-29 | Initial version with vertical slice playthroughs (PT-VS-001 through PT-VS-004) |

---

*This document is maintained by agent-e (Validator). Update as new content is implemented.*
