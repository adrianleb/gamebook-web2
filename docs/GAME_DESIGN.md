# GAME_DESIGN.md

## Overview

This document is the **canonical reference for all state variables** in The Understage gamebook adaptation. It consolidates scattered documentation from VERTICAL_SLICE.md, ENDING_VALIDATION.md, manifest.json, and scene content into a single source of truth.

**Purpose:** Provide content creators (agent-b) and engine developers (agent-c) with a complete reference for state variables, their ranges, purposes, and lifecycle rules.

**Maintenance:** When adding new state variables, update this document FIRST, then implement in scenes. This ensures engine support exists before content usage.

---

## State Variable Categories

1. **Stats** - Numeric player attributes with min/max ranges
2. **Flags** - Boolean state trackers for narrative progression
3. **Inventory Items** - Physical objects the player can acquire
4. **Factions** - Numeric alliance values (0-10) tracking player relationships
5. **Editor State** - Special flags tracking the Editor's status (Act 3)

---

## Stats (Numeric Player Attributes)

| Stat ID | Display Name | Min | Max | Starting Value | Description |
|---------|--------------|-----|-----|----------------|-------------|
| `health` | Health | 0 | 10 | 10 | Player's health points. Reaching 0 typically triggers fail-state ending. Modified by stat check failures. |
| `courage` | Courage | 0 | 10 | 5 | Bravery for risky actions. Used in stat checks for dangerous choices (e.g., crossing the Threshold Stage). |
| `insight` | Insight | 0 | 10 | 3 | Perception and understanding. Used for discovery choices and uncovering hidden information. |

### Stat Check Mechanics

Stat checks compare current stat value against a threshold using operators:

| Operator | Meaning | Example |
|----------|---------|---------|
| `gte` | Greater than or equal | `courage >= 5` passes when courage is 5+ |
| `lte` | Less than or equal | `health <= 3` for critical health warning |
| `eq` | Exactly equal | Rare, used for specific thresholds |
| `gt` | Greater than | `insight > 5` (strictly greater) |
| `lt` | Less than | `health < 1` (zero health check) |

**Failure Consequences:** Stat check failures typically result in:
- Alternative narrative path (different scene branch)
- Stat modification (e.g., `health -1` for failing courage check)
- Flag setting (e.g., `crossing_failed = true`)

---

## Flags (Boolean State Trackers)

Flags track binary state throughout the game - either something happened or it didn't.

### Game Progression Flags

| Flag ID | Default | Purpose | Set In Scene |
|---------|---------|---------|--------------|
| `game_started` | false | Set on first scene load (sc_1_0_001) | sc_1_0_001 |
| `location_booth_visited` | false | Tracks if player visited The Prompter's Booth | sc_1_0_001 |
| `path_direct` | false | Player took the direct path to The Wings | sc_1_0_002 |
| `crossing_succeeded` | false | Successfully crossed the Threshold Stage (courage check) | sc_1_0_003, sc_1_0_901 |
| `crossing_failed` | false | Failed the crossing courage check | sc_1_0_003, sc_1_0_902 |
| `met_maren` | false | Player spoke with Maren character | sc_1_0_004 |

### Act Transition Flags

| Flag ID | Default | Purpose | Set In Scene |
|---------|---------|---------|--------------|
| `act1_complete` | false | Act 1 content completed, ready for Act 2 | sc_1_1_099 |
| `first_crossing_reached` | false | Player reached First Crossing (Act 1 climax) | sc_1_1_099 |
| `act2_started` | false | Act 2 has begun | sc_2_2_001 |
| `green_room_reached` | false | Player entered The Green Room (Hub 2) | sc_2_2_001 |
| `act2_hub3_started` | false | Act 2 Hub 3 (Archives) entered | sc_2_3_001 |
| `archives_reached` | false | Player entered The Archives (Hub 3) | sc_2_3_001 |
| `act2_complete` | false | Act 2 content completed, ready for Act 3 | sc_2_3_099 |
| `revelation_discovered` | false | Player discovered the Editor's Great Revision plan | sc_2_3_099 |
| `editor_revealed` | false | The Editor's existence revealed | sc_2_3_099 |
| `mainstage_ascent` | false | Player ascended to The Mainstage | sc_2_3_099 |
| `act3_started` | false | Act 3 has begun | sc_3_4_001 |
| `mainstage_reached` | false | Player entered The Mainstage (Hub 4) | sc_3_4_001 |
| `alliance_determined` | false | Player's faction alliance has been determined | sc_3_4_001 |

### Editor State Flags (Act 3)

The Editor's state transitions through Act 3 scenes and determines which endings are available.

| Flag ID | Default | Purpose | Sets Ending Requirement |
|---------|---------|---------|------------------------|
| `editorState_defeated` | false | Editor defeated in conflict (combat/confrontation path) | Ending 1 (Revisionist), Ending 3 (Preservationist) |
| `editorState_persuaded` | false | Editor persuaded diplomatically (social/negotiation path) | Ending 2 (Exiter) |
| `editorState_revealedTruth` | false | Learned the deeper truth about Understage (investigation path) | Ending 4 (Independent) |

**Note:** These flags are mutually exclusive in a single playthrough (only one can be true). They represent the player's approach to the final confrontation in sc_3_4_098.

### Ending Flags

| Flag ID | Default | Purpose | Set In Scene |
|---------|---------|---------|--------------|
| `ending_achieved` | false | Generic flag set when any ending is reached | All ending scenes |
| `ending_1_revised_draft` | false | Reached Ending 1: The Revised Draft | sc_3_4_901 |
| `ending_2_open_book` | false | Reached Ending 2: The Open Book | sc_3_4_902 |
| `ending_3_closed_canon` | false | Reached Ending 3: The Closed Canon | sc_3_4_903 |
| `ending_4_blank_page` | false | Reached Ending 4: The Blank Page | sc_3_4_904 |
| `ending_5_eternal_rehearsal` | false | Reached Ending 5: The Eternal Rehearsal | sc_3_4_999 |
| `new_game_plus` | false | Flag set in fail-state ending for potential NG+ mode | sc_3_4_999 |

---

## Inventory Items

Items are physical objects in the game world that the player can acquire. They are used for:
- Inventory gating (choices require specific items)
- Key availability (unlocking new areas)
- Narrative flavor (descriptions, dialogue)

| Item ID | Display Name | Description | Obtained In |
|---------|--------------|-------------|-------------|
| `booth_key` | Booth Key | A rusty iron key that unlocks the prompter's booth door. Required for inventory-gated path in vertical slice. | sc_1_0_004 |
| `wings_pass` | Wings Pass | A temporary pass allowing access to the theatre wings. Placeholder item from vertical slice direct path. | sc_1_0_002 |

### Inventory Gating Pattern

Choices can be gated behind item requirements:

```json
{
  "condition": {
    "type": "has_item",
    "item": "booth_key"
  },
  "disabledHint": "The locked door needs a booth_key"
}
```

When the condition fails (player doesn't have the item):
- Choice is displayed as disabled (dimmed styling)
- `disabledHint` text is shown to player
- Choice cannot be selected

---

## Factions (Numeric Alliance Values)

Factions represent the player's alignment with different philosophical groups in The Understage. Values range from 0-10, with 0 being no alliance and 10 being fully committed.

| Faction ID | Display Name | Starting Value | Description |
|------------|--------------|----------------|-------------|
| `preservationist` | The Preservationists | 0 | Faction favoring separation of worlds. Keep Understage hidden from reality. |
| `revisionist` | The Revisionists | 0 | Faction believing stories can and should be improved. Rewrite reality for better outcomes. |
| `exiter` | The Exiters | 0 | Faction believing fictional beings deserve real existence. Merge fiction and reality. |
| `independent` | Independent | 0 | Balance between factions. No dominant alignment. |

### Faction Accumulation

Faction values increase through player choices in Act 2 (The Green Room, The Archives):

- Each choice that aligns with a faction's philosophy adds +1 to that faction
- Choices may simultaneously affect multiple factions (e.g., +1 preservationist, +1 independent)
- Factions are tracked in the `GameState.factions` object alongside stats

### Faction Gates (Endings)

The 5 endings are gated behind faction thresholds in sc_3_4_098 (The Last Curtain Call):

| Ending | Faction | Threshold | Editor State Required |
|--------|---------|-----------|----------------------|
| 1: The Revised Draft | `revisionist` | >= 7 | `editorState_defeated` |
| 2: The Open Book | `exiter` | >= 7 | `editorState_persuaded` |
| 3: The Closed Canon | `preservationist` | >= 7 | `editorState_defeated` |
| 4: The Blank Page | None (independent path) | None | `editorState_revealedTruth` |
| 5: The Eternal Rehearsal | Fail-state | Always reachable | None |

**Threshold Logic:** Level 7 requires ~70% investment in that faction throughout Act 2. Players must prioritize one faction over others to reach specific endings.

**Independent Path:** Ending 4 has no faction threshold - it's achieved by balancing all factions (no single faction reaches 7) and discovering the deeper truth (`editorState_revealedTruth`).

---

## Ending Requirements (Canonical Reference)

All ending requirements are canonically defined in `content/manifest.json` lines 161-218. This section summarizes those requirements for quick reference.

### Ending 1: The Revised Draft (Revisionist)

```yaml
sceneId: sc_3_4_901
tier: bittersweet
requirements:
  faction: revisionist
  factionLevel: 7
  editorState: defeated
description: You take the Editor's power and choose which stories survive.
```

### Ending 2: The Open Book (Exiter)

```yaml
sceneId: sc_3_4_902
tier: hopeful
requirements:
  faction: exiter
  factionLevel: 7
  editorState: persuaded
description: The boundary dissolves peacefully. Fiction and reality merge.
```

### Ending 3: The Closed Canon (Preservationist)

```yaml
sceneId: sc_3_4_903
tier: melancholic
requirements:
  faction: preservationist
  factionLevel: 7
  editorState: defeated
description: The Understage is sealed completely. Stories become static.
```

### Ending 4: The Blank Page (Independent)

```yaml
sceneId: sc_3_4_904
tier: tragic
requirements:
  faction: independent
  editorState: revealedTruth
description: Both Understage and its deeper threat end. Reality with no more new stories.
```

### Ending 5: The Eternal Rehearsal (Fail-State)

```yaml
sceneId: sc_3_4_999
tier: ambiguous
requirements:
  finalChoice: failed_or_refused
description: The conflict continues indefinitely. You remain a Prompter forever.
```

---

## State Variable Lifecycle

### Creation Rules

1. **New stats require engine support:** Before adding a new stat, ensure:
   - Display name is defined
   - Min/max ranges are appropriate
   - Starting value is set
   - Engine handles serialization

2. **New flags require documentation:**
   - Document purpose in this file
   - Specify which scene sets it
   - Indicate if it's checked elsewhere

3. **New items require acquisition paths:**
   - At least one scene must add the item
   - At least one scene must check for the item (gating)
   - Description should be flavorful

4. **New factions require narrative integration:**
   - Define the faction's philosophy
   - Create choices in Act 2 that accumulate it
   - Ensure ending gates reference it correctly

### Modification Rules

| Variable Type | Can Decrease? | Can Increase? | Can Be Removed? |
|---------------|---------------|---------------|-----------------|
| Stats | Yes (e.g., health -1) | Yes (e.g., faction +1) | No (stats persist) |
| Flags | No (boolean) | No (boolean) | No (flags persist) |
| Inventory | Yes (remove-item effect) | Yes (add-item effect) | Yes |
| Factions | No (only accumulate) | Yes (modify_faction effect) | No |

### Deletion Rules

**Never delete state variables** once released. Deprecated variables should be:
1. Marked as deprecated in this document
2. Retained for save compatibility
3. Replaced by new variables if needed

---

## Validation Checklist

When adding or modifying state variables, verify:

- [ ] Documented in GAME_DESIGN.md (this file)
- [ ] Engine supports the variable type (stats, flags, items, factions)
- [ ] Scene content uses correct schema format
- [ ] Starting value is appropriate (stats: 0-10, flags: false, factions: 0)
- [ ] Min/max ranges are defined for stats
- [ ] Item descriptions are flavorful and clear
- [ ] Faction gates align with ending requirements
- [ ] No typos in variable IDs (snake_case convention)

### Cross-Reference Validation

- [ ] `VERTICAL_SLICE.md` state definitions match this document
- [ ] `ENDING_VALIDATION.md` faction references match this document
- [ ] `manifest.json` ending requirements use same variable IDs
- [ ] Scene files use correct variable IDs (check with grep)

---

## Quick Reference for Engine Implementation

### GameState Structure

```typescript
interface GameState {
  // Stats (numeric, 0-10 range)
  stats: {
    health: number;      // Min: 0, Max: 10, Default: 10
    courage: number;     // Min: 0, Max: 10, Default: 5
    insight: number;     // Min: 0, Max: 10, Default: 3
  };

  // Factions (numeric, 0-10 range)
  factions: {
    preservationist: number;  // Default: 0
    revisionist: number;      // Default: 0
    exiter: number;           // Default: 0
    independent: number;      // Default: 0
  };

  // Flags (boolean)
  flags: Set<string>;  // Uses Set<string> for O(1) lookup

  // Inventory (array of item IDs)
  inventory: string[];

  // Current scene
  currentScene: string;

  // Scene history for save/load
  sceneHistory: string[];

  // Metadata
  meta: {
    version: string;
    savedAt: number;
  };
}
```

### Condition Types

| Condition Type | Target | Operator | Example |
|----------------|--------|----------|---------|
| `stat_check` | `stats` | gte, lte, eq, gt, lt | `courage >= 5` |
| `flag_check` | `flags` | has, not_has | `has: game_started` |
| `has_item` | `inventory` | has | `has: booth_key` |
| `faction_check` | `factions` | gte, lte, eq | `revisionist >= 7` |

### Effect Types

| Effect Type | Target | Modifier | Example |
|-------------|--------|----------|---------|
| `set_stat` | `stats` | Sets absolute value | `health = 10` |
| `modify_stat` | `stats` | Adds/subtracts value | `health -1` |
| `set_flag` | `flags` | Sets boolean true | `crossing_failed = true` |
| `add_item` | `inventory` | Adds item ID | `+booth_key` |
| `remove_item` | `inventory` | Removes item ID | `-booth_key` |
| `modify_faction` | `factions` | Adds value | `preservationist +1` |

---

## Known Issues and Ambiguities

### Deferred to Future Implementation

1. **Full Act 3 Hub 1-3 Content:** Current implementation has placeholder/summary content for Act 3 Hubs 1-3. `editorState` AND conditions (defeated/persuaded + faction) are deferred until full Act 3 content is implemented. See `docs/ENDING_VALIDATION_CHUNK_4.md` for clarification.

2. **New Game Plus Mode:** The `new_game_plus` flag is set in sc_3_4_999 but NG+ mechanics are not yet designed. Flag exists for future implementation.

### Potential Conflicts

None identified during consolidation. All source documents (VERTICAL_SLICE.md, ENDING_VALIDATION.md, manifest.json) use consistent variable naming and ranges.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-31 | Initial consolidation from VERTICAL_SLICE.md, ENDING_VALIDATION.md, manifest.json, and scene content files. Created as Phase 5 deliverable for canonical state variable reference. |

---

## Related Documents

- **VERTICAL_SLICE.md** - Original state variable definitions for vertical slice
- **ENDING_VALIDATION.md** - Ending requirements and faction gate specifications
- **manifest.json** - Canonical scene index and ending requirements (lines 161-218)
- **TEST_PLAYTHROUGHS.md** - Playthrough test cases using these state variables
- **MILESTONES.md** - Project phases and deliverables

---

*This document is maintained by agent-b (Narrative Mapper). Update as state variables change.*
