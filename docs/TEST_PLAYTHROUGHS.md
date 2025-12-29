# TEST_PLAYTHROUGHS.md

Canonical test playthrough scripts for The Understage gamebook adaptation.

## Purpose

This document defines:
- **Playthrough templates** covering critical paths through all 3 acts and 5 endings
- **QA gate checklists** for vertical slice and content complete milestones
- **Save/load regression test points** for state persistence validation
- **Mechanics coverage** to validate inventory gating, stat checks, flags, and branching

## Philosophy

> "Start with structure, fill in as content is implemented."

Per agent-b feedback, this document provides **templates** for playthrough scripts that will be filled in with concrete scene IDs and choices as content is implemented. The focus is on **mechanics coverage** (inventory gating, stat checks, flags) rather than exact text reproduction.

Per agent-c feedback, playthrough scripts document **save points** at:
- Scene transitions (after scene loads, before choices)
- After stat changes (effects applied)
- Before complex condition checks (for regression testing)

## Test Format

### Playthrough Script Template

Each playthrough follows this structure:

```markdown
## [Name] Playthrough

**Route:** [Description of path through game]
**Ending:** [Which ending this reaches]
**Mechanics Covered:** [inventory gating, stat checks, flags, etc.]
**Estimated Scenes:** [Approximate number]

### Initial State
- **Archetype:** [Script/Stage Presence/Improv distribution]
- **Scene:** `sc_#_#_###` (starting scene)

### Steps
| Step | Scene ID | Choice | Expected State | Save Point |
|------|----------|--------|----------------|------------|
| 1 | `sc_#_#_###` | [choice text] | stats: {...}, flags: [...], inventory: [...] | ✅ |
| 2 | `sc_#_#_###` | [choice text] | stats: {...}, flags: [...], inventory: [...] | ✅ |

### Validation
- [ ] Reaches ending without errors
- [ ] All choices valid for given state
- [ ] Save/load at each save point preserves state
- [ ] No softlocks (choices always available unless gated by design)
```

### Expected State Format

Per agent-c's engine RFC, state snapshots use:

```json
{
  "step": 1,
  "sceneId": "sc_act1_hub_alley",
  "choiceIndex": 0,
  "expectedState": {
    "stats": { "script": 50, "stagePresence": 30, "improv": 40 },
    "flags": ["MET_DIRECTOR"],
    "inventory": ["key_greenroom"]
  }
}
```

---

# Playthrough Templates

## Act 1 Templates

### The Pursuer Route to First Crossing

**Route:** Direct conflict path - pursue the mystery aggressively
**Ending:** Any (routes to all endings branch from Act 1)
**Mechanics Covered:**
- Stat checks (Script vs. Stage Presence)
- Choice branching with immediate consequences
- Flag setting for Act 2 gating

**Estimated Scenes:** ~20-25

### The Preservationist Route through Archives

**Route:** Investigation path - gather information before acting
**Ending:** Favors "The Revised Draft" or "The Archivist"
**Mechanics Covered:**
- Inventory gating (requires finding key items)
- Multi-step puzzle chains
- Faction alignment tracking

**Estimated Scenes:** ~25-30

### The Improviser Route to Green Room

**Route:** Charisma/social path - talk way through problems
**Ending:** Favors "The Breakout Legend" or "The Ghost Light"
**Mechanics Covered:**
- Stat checks (Improv vs. opposition)
- Relationship flags affecting later choices
- Scene revisit mechanics with changed state

**Estimated Scenes:** ~20-25

## Act 2 Templates

### Green Room Deep Dive

**Route:** Focus on behind-the-scenes mechanics
**Prerequisites:** High Stage Presence, `FOUND_GREEN_ROOM_KEY`
**Mechanics Covered:**
- Conditional scene availability based on inventory
- State-dependent choice labels
- Archive search checks (stat + item combination)

**Estimated Scenes:** ~30-35

### Archives Investigation Path

**Route:** Uncover the theater's history
**Prerequisites:** `RESEARCH_STARTED` flag, Script stat
**Mechanics Covered:**
- Flag chains (unlocks scenes across hubs)
- Time-pressure choices (limited attempts)
- Knowledge gating (flags required for certain choices)

**Estimated Scenes:** ~25-30

### Confrontation Hub Approach

**Route:** Direct confrontation with antagonist
**Prerequisites:** High combat stats, specific inventory
**Mechanics Covered:**
- Stat-check-or-lose scenarios
- Inventory consumption (one-use items)
- Branching death states

**Estimated Scenes:** ~15-20

## Act 3 Templates

### The Revised Draft Ending

**Route:** Rewrite the ending through knowledge and preparation
**Prerequisites:**
- Flags: `UNCOVERED_TRUTH`, `GATHERED_ALL_EVIDENCE`
- Inventory: `ORIGINAL_SCRIPT`, `DIRECTOR_KEY`
- Stats: Script ≥ 60

**Mechanics Covered:**
- Complex condition gating (AND/OR requirements)
- Final stat check with difficulty scaling
- Ending-specific state snapshot

**Estimated Scenes:** ~15-20

### The Archivist Ending (Scholarship)

**Route:** Document and preserve rather than change
**Prerequisites:**
- Flags: `DOCUMENTED_EVERYTHING`, `REJECTED_CONFRONTATION`
- Inventory: `ARCHIVE_KEY`, `THEATER_HISTORY`
- Stats: Script ≥ 70

**Mechanics Covered:**
- Knowledge validation checks
- Inventory combination requirements
- Passive victory condition (avoid combat)

**Estimated Scenes:** ~10-15

### The Breakout Legend Ending (Show Must Go On)

**Route:** Perform your way out
**Prerequisites:**
- Flags: `IMPROVISED_SOLUTION`, `SAVED_CAST`
- Inventory: `PROP_SWORD`, `COSTUME_BACKSTAGE`
- Stats: Stage Presence ≥ 70, Improv ≥ 60

**Mechanics Covered:**
- Performance stat checks
- Multi-item combination usage
- Time-sensitive choices

**Estimated Scenes:** ~15-20

### The Ghost Light Ending (Mystery)

**Route:** Accept the supernatural, become part of it
**Prerequisites:**
- Flags: `ACKNOWLEDGED_GHOST`, `LEFT_WORLD_BEHIND`
- Inventory: None (must abandon all items)
- Stats: Balanced across all three

**Mechanics Covered:**
- Inventory clearing mechanics
- Balanced stat requirements
- Surrender-based ending path

**Estimated Scenes:** ~10-15

### The Final Curtain (Bad Ending)

**Route:** Fail to prepare or make wrong choices
**Prerequisites:** Any failure state
**Mechanics Covered:**
- Death state validation
- Failure flag setting
- No-save continuation (or restart from checkpoint)

**Estimated Scenes:** Variable

---

# QA Gates

## Vertical Slice Complete

**Definition:** One complete playable path from start to first Act transition with all core mechanics functional.

### Checklist

#### Core Mechanics
- [ ] **One complete playthrough path** from opening scene to Act 1 climax
- [ ] **All choice types working:**
  - [ ] Simple (no conditions)
  - [ ] Stat-gated (condition: stat ≥ threshold)
  - [ ] Inventory-gated (condition: has item)
  - [ ] Flag-gated (condition: flag is set)
- [ ] **Save/load at each scene transition** preserves all state
- [ ] **No softlocks** (player always has at least one available choice)
- [ ] **Stat check coverage:** at least one of each type
  - [ ] Stat-only check
  - [ ] Combined stat check (stat + item)
  - [ ] Opposed stat check (stat vs. enemy)

#### Content Validation
- [ ] **JSON syntax valid** for all content files
  ```bash
  cat content/manifest.json | jq .
  cat content/stats.json | jq .
  cat content/items.json | jq .
  ```
- [ ] **Scene ID format consistency** (all follow `sc_ACT_HUB_SEQ` format)
  ```bash
  grep -E "sc_[0-9]_[0-9]_[0-9]{3}" content/manifest.json
  ```
- [ ] **All scene links valid** (no references to non-existent scenes)
- [ ] **Starting scene accessible** from manifest

#### Engine/Runtime
- [ ] **Headless runner executes** Act 1 playthrough without errors
- [ ] **State change events fire** and are loggable
- [ ] **Condition evaluation logged** for debugging
- [ ] **Effect application deterministic** (same inputs → same outputs)

#### UI/UX
- [ ] **Choices display** with disabled state + hints for gated options
- [ ] **Inventory visible** and updates in real-time
- [ ] **Stats visible** and changes are shown
- [ ] **Keyboard navigation** works (arrows/WSAD, Enter to select)

#### Save/Load
- [ ] **LocalStorage save slots** (min 3) functional
- [ ] **Autosave triggers** on scene transition
- [ ] **Export/import** save as JSON works
- [ ] **Save file validation** (rejects corrupted/invalid saves)

### Automated Tests
- [ ] **Headless runner** completes Act 1 path in <5 seconds
- [ ] **State roundtrip test** (save → load → verify state matches)
- [ ] **Link validator** detects no broken scene references

---

## Content Complete

**Definition:** All 5 endings reachable, all content implemented and validated.

### Checklist

#### Ending Coverage
- [ ] **All 5 endings reachable** via intentional play
  - [ ] The Revised Draft
  - [ ] The Archivist
  - [ ] The Breakout Legend
  - [ ] The Ghost Light
  - [ ] The Final Curtain (bad ending)
- [ ] **Ending requirements documented** (stat thresholds, flags, inventory)
- [ ] **Ending state snapshots saved** for regression testing

#### Path Coverage
- [ ] **3+ canonical paths** fully documented with scene IDs
- [ ] **Each major hub** has at least one playthrough through it
- [ ] **Branch convergence points** tested (routes rejoin correctly)

#### Content Integrity
- [ ] **100% link validation** (no broken scene references)
  ```bash
  # Run link validator script
  npm run validate:links
  ```
- [ ] **No unreachable scenes** (or explicitly tagged with justification)
  ```bash
  npm run validate:unreachable
  ```
- [ ] **No orphaned content** (items/stats defined but unused)

#### Mechanics Coverage
- [ ] **All stat check types** tested across playthroughs
- [ ] **All inventory items** obtainable and usable
- [ ] **Flag chains validated** (multi-step unlock sequences)
- [ ] **Conditional choices tested** (gated paths work correctly)

#### Save/Load Regression
- [ ] **Save/load at critical points** tested:
  - [ ] Before each Act transition
  - [ ] Before each ending
  - [ ] After major state changes (boss fights, key items)
- [ ] **Version 1.0 save compatibility** (saves from earlier versions load)
- [ ] **State snapshot regression** (known good states still valid)

#### Softlock Prevention
- [ ] **No softlocks detected** (zero scenes with zero available choices)
  ```bash
  npm run validate:softlocks
  ```
- [ ] **Death states explicit** (bad endings are intentional, not bugs)
- [ ] **Recovery options** (player can undo or retry after failure)

#### Performance
- [ ] **First load** completes in <10 seconds on reasonable connection
- [ ] **Scene transitions** complete in <2 seconds
- [ ] **Save/load operations** complete in <1 second

---

# Save/Load Regression Testing

## Critical Save Points

Per agent-c feedback, save points must be tested at:

### 1. Scene Transitions
**When:** After new scene loads, before displaying choices
**Why:** Tests scene loading, state persistence across boundaries
**Validation:**
```json
{
  "sceneId": "sc_1_1_010",
  "state": {
    "stats": {...},
    "flags": [...],
    "inventory": [...]
  }
}
```
- [ ] Scene loads correctly after save/load
- [ ] All choices available as expected for state
- [ ] No state corruption from transition

### 2. After Stat Changes
**When:** After any effect modifies stats
**Why:** Tests effect application, stat serialization
**Validation:**
```json
{
  "before": { "script": 50 },
  "after": { "script": 60 },
  "effect": { "type": "stat", "stat": "script", "value": 10 }
}
```
- [ ] Stat changes applied correctly
- [ ] Stat overflow/underflow handled (min/max enforced)
- [ ] Conditional choices update based on new stats

### 3. Before Complex Conditions
**When:** Before scenes with multi-factor checks
**Why:** Tests condition evaluation logic, AND/OR nesting
**Validation:**
```json
{
  "conditions": {
    "and": [
      { "flag": "MET_DIRECTOR" },
      { "stat": "script", "op": "gte", "value": 50 },
      { "has": "key_greenroom" }
    ]
  }
}
```
- [ ] Complex conditions evaluate correctly
- [ ] AND logic (all requirements must pass)
- [ ] OR logic (at least one requirement passes)
- [ ] NOT logic (negation works)

### 4. At Act Transitions
**When:** Before Act 1 → Act 2, Act 2 → Act 3
**Why:** Tests state continuity across major boundaries
**Validation:**
- [ ] All flags persist across acts
- [ ] Inventory persists across acts
- [ ] Stats persist across acts
- [ ] Scene history preserved (for "remembered" choices)

### 5. Before Endings
**When:** At final choice scenes for each ending
**Why:** Tests ending triggers, final state validation
**Validation:**
- [ ] Ending triggers correctly based on state
- [ ] Ending scene displays appropriate content
- [ ] Final state saved for "completion" tracking

## Regression Test Scripts

### Manual Test Procedure

1. **Load save**
2. **Verify state matches snapshot**
3. **Make choice**
4. **Verify result matches expectation**
5. **Repeat for all save points**

### Automated Test (via Headless Runner)

```typescript
// tests/regression/save-load.test.ts
describe('Save/Load Regression', () => {
  const savePoints = [
    { sceneId: 'sc_1_1_005', step: 1 },
    { sceneId: 'sc_1_2_015', step: 5 },
    { sceneId: 'sc_2_1_100', step: 20 },
    // ... all save points
  ];

  savePoints.forEach(point => {
    it(`save/load at ${point.sceneId}`, async () => {
      // 1. Load game to this state
      const state = await loadState(`fixtures/save_${point.step}.json`);

      // 2. Serialize to save file
      const saveData = serializeState(state);

      // 3. Load from save file
      const loadedState = deserializeState(saveData);

      // 4. Verify state matches
      expect(loadedState).toEqual(state);
    });
  });
});
```

---

# Smoke Tests

Run before every merge to catch basic regressions.

## Pre-Merge Checklist

```bash
# 1. Validate JSON syntax
cat content/manifest.json | jq . > /dev/null
cat content/stats.json | jq . > /dev/null
cat content/items.json | jq . > /dev/null

# 2. Check scene ID format
grep -E "sc_[0-9]_[0-9]_[0-9]{3}" content/manifest.json

# 3. Run link validator
npm run validate:links

# 4. Run softlock detector
npm run validate:softlocks

# 5. Run headless Act 1 playthrough
npm run test:playthrough -- act1

# 6. Run save/load regression tests
npm run test:regression
```

## Expected Results

- All JSON files parse without errors
- All scene IDs follow `sc_ACT_HUB_SEQ` format
- Link validator reports 0 broken links
- Softlock detector reports 0 softlocks
- Headless playthrough completes without errors
- All regression tests pass

---

# Bug Report Template

When filing bugs found during testing, use the bug report template:

```markdown
## Bug: [Short description]

### Reproduction Steps
1. Start new game
2. Make choices: [...]
3. At scene `sc_#_#_###`, choose: [...]
4. Observe: [bug behavior]

### Expected State
- Scene: `sc_#_#_###`
- Stats: {...}
- Flags: [...]
- Inventory: [...]

### Actual State
- [What actually happened]

### Save File
[Attach save JSON if applicable]

### Severity
- [ ] Critical (blocks progress)
- [ ] Major (breaks mechanic)
- [ ] Minor (cosmetic/edge case)
```

---

# Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2025-12-29 | Initial template with playthrough structure, QA gates, save/load regression points |

---

**Maintained by:** agent-e (Validator - Test Lens)

**Related Documents:**
- `GANG.md` - QA & Validation Checklist section
- `docs/MILESTONES.md` - Milestone gate definitions
- `docs/rfcs/2024-12-29-engine-core-architecture.md` - Engine state schema and headless runner
