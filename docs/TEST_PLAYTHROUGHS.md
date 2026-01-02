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
      stats: { health: 10, courage: 5 }
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

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.6 | 2026-01-02 | **FIXED** PT-END-001 through PT-END-005 ending gate documentation to match actual sc_3_4_098 implementation. Removed incorrect editorState enum requirements (defeated/persuaded) from faction endings. Changed PT-END-004 to use editorState_revealedTruth boolean flag instead of enum. Updated Ending Gate Validation Summary table and State Variable Reference with clarification that combined faction+editorState AND gates are DEFERRED per MILESTONES.md Issue #129. |
| 1.5 | 2026-01-01 | Added PT-SL-001, PT-SL-002 (Save/Load regression tests) - tests state persistence across scene transitions and complex states using save_snapshot/load_snapshot actions. Added PT-EDGE-001, PT-EDGE-002, PT-EDGE-003 (Edge case tests) - validates empty inventory navigation, minimum stats (courage=0), and maximum stats (courage=10, insight=10) edge cases. NOTE: PT-END-001 through PT-END-005 exist in tests/playthroughs/endings/ directory with different schema (factions field, editorState). PT-LOCK and PT-P4-ACC tests require different testing approaches (softlockDetection config covers softlock tests, Phase 4 accessibility tests require unit/integration testing). |
| 1.4 | 2025-12-30 | Added Phase 4 accessibility tests (PT-P4-ACC-001 through PT-P4-ACC-005) |
| 1.3 | 2025-12-29 | Added PT-END-001 through PT-END-005 (Act 3 Ending validation) - validates all 5 endings (sc_3_4_901 through sc_3_4_904, sc_3_4_999), faction gates (>=7), editorState requirements (defeated/persuaded/revealedTruth), and fail-state fallback ending. Updated State Variable Reference with editorState flag and all 4 factions. |
| 1.2 | 2025-12-29 | Added PT-VS-006 (Act 2 Hub 3 Entry) and PT-VS-007 (Act 2 Climax Alliance Check) - validates sc_2_3_001 Archives Entry and sc_2_3_099 The Revelation scenes, documents all 4 faction states (preservationist, revisionist, exiter, independent), and adds faction alliance acknowledgment test variants |
| 1.1 | 2025-12-29 | Added PT-VS-005 (Act 1 Climax Convergence) - validates sc_1_1_099 First Crossing scene, Act 1→Act 2 transition, and new state variables (act1_complete, first_crossing_reached) |
| 1.0 | 2025-12-29 | Initial version with vertical slice playthroughs (PT-VS-001 through PT-VS-004) |

---

*This document is maintained by agent-e (Validator). Update as new content is implemented.*
