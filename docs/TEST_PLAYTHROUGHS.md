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
    "health": 10,      // 0-10 range
    "courage": 5,      // 0-10 range
    "insight": 3       // 0-10 range
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
| 1 | sc_1_0_001 | (Starting state) | ✅ save_point | `game_started=false`, health=10, courage=5, inventory=[] |
| 2 | sc_1_0_001 | Choose "Go to the wings" | ✅ softlock_check | Choice enabled (no requirements) |
| 3 | sc_1_0_002 | (Arrived) | ✅ save_point | `path_direct=true`, has "wings_pass", health=10 |
| 4 | sc_1_0_002 | Choose "Continue forward" | ✅ softlock_check | Choice enabled |
| 5 | resolution_direct | (End state) | ✅ mechanic_test | Reached resolution, no errors |

**Final State Assertions:**
```json
{
  "stats": { "health": 10, "courage": 5, "insight": 3 },
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
  "stats": { "health": 10, "courage": 5, "insight": 3 },
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

**Tests:** Stat check mechanics (courage >= 5), success branch

**Entry Point:** `sc_1_0_001` (The Booth Awakens)

**Prerequisites:** Must have `booth_key` (combine with PT-VS-002 steps 1-7)

**Path:**
```
sc_1_0_001 ─[With booth_key, courage=5]──> sc_1_0_003 ─[Courage check: SUCCESS]──> resolution_crossing_success
```

**Steps:**

| Step | Scene | Action | Checkpoint | Expected State |
|------|-------|--------|------------|----------------|
| 1 | sc_1_0_001 | (Has booth_key, courage=5) | ✅ save_point | inventory=["booth_key"], courage=5 |
| 2 | sc_1_0_001 | Choose "Unlock the door" | ✅ softlock_check | Choice enabled (has key) |
| 3 | sc_1_0_003 | (At threshold, courage check) | ✅ mechanic_test | Courage check: 5 >= 5 = **SUCCESS** |
| 4 | sc_1_0_003 | (Success branch) | ✅ save_point | `crossing_succeeded=true`, faction+1 |
| 5 | resolution_crossing_success | (End state) | ✅ mechanic_test | Reached success resolution |

**Final State Assertions:**
```json
{
  "stats": { "health": 10, "courage": 5, "insight": 3 },
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
- Stat check evaluation (courage >= 5)
- Success branch execution
- Faction modification on success

**Regression Checkpoints:** Steps 1, 3, 4

---

### PT-VS-004: Stat Check Failure Path

**Tests:** Stat check mechanics, failure branch, health penalty

**Entry Point:** `sc_1_0_001` (The Booth Awakens)

**Prerequisites:** Must have `booth_key`, courage < 5 (manually set for testing)

**Path:**
```
sc_1_0_001 ─[With booth_key, courage=3]──> sc_1_0_003 ─[Courage check: FAILURE]──> resolution_crossing_failure
```

**Steps:**

| Step | Scene | Action | Checkpoint | Expected State |
|------|-------|--------|------------|----------------|
| 1 | sc_1_0_001 | (Has booth_key, courage=3) | ✅ save_point | inventory=["booth_key"], courage=3 |
| 2 | sc_1_0_001 | Choose "Unlock the door" | ✅ softlock_check | Choice enabled (has key) |
| 3 | sc_1_0_003 | (At threshold, courage check) | ✅ mechanic_test | Courage check: 3 >= 5 = **FAILURE** |
| 4 | sc_1_0_003 | (Failure branch) | ✅ save_point | `crossing_failed=true`, health-1 |
| 5 | resolution_crossing_failure | (End state) | ✅ mechanic_test | Reached failure resolution |

**Final State Assertions:**
```json
{
  "stats": { "health": 9, "courage": 3, "insight": 3 },
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
- Health stat modification (penalty)

**Regression Checkpoints:** Steps 1, 3, 4

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
| 5 | sc_1_0_002 | Verify state | `path_direct=true`, has "wings_pass", health=10 |

**State Snapshot (Slot 1):**
```json
{
  "stats": { "health": 10, "courage": 5, "insight": 3 },
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
  "stats": { "health": 10, "courage": 5, "insight": 3 },
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
- Low courage (0): Should still have 2+ choices available
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
1. Start new game with courage=0 (manually set for testing)
2. Navigate through direct path (PT-VS-001)
3. Expected: Can reach resolution without stat check issues

---

### PT-EDGE-003: Maximum Stats Navigation

**Tests:** Game is playable with maximum stat values

**Procedure:**
1. Start new game with all stats=10
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
        "stats": { "health": 10, "courage": 5, "insight": 3 },
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

### Stats (0-10 range)
| Stat | Starting | Description |
|------|----------|-------------|
| health | 10 | Player's health points |
| courage | 5 | Bravery for risky actions |
| insight | 3 | Perception and understanding |

### Flags
| Flag | Type | Purpose |
|------|------|---------|
| game_started | bool | Set on first scene load |
| location_booth_visited | bool | Tracks if player visited booth |
| path_direct | bool | Took direct path to wings |
| crossing_succeeded | bool | Successfully crossed threshold |
| crossing_failed | bool | Failed the crossing stat check |
| met_maren | bool | Spoke with Maren character |

### Inventory Items
| Item ID | Display Name | Description |
|---------|--------------|-------------|
| booth_key | Booth Key | Unlocks the prompter's booth door |
| wings_pass | Wings Pass | Temporary access to theatre wings |

### Factions (0-10 range)
| Faction | Starting | Description |
|---------|----------|-------------|
| preservationist | 0 | Faction favoring separation of worlds |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-29 | Initial version with vertical slice playthroughs (PT-VS-001 through PT-VS-004) |

---

*This document is maintained by agent-e (Validator). Update as new content is implemented.*
