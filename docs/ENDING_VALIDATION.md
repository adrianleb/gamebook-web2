# ENDING_VALIDATION.md

## Overview

This document specifies the validation framework for Phase 3 ending graph verification. It ensures all 5 endings are reachable from the start scene, faction gates work correctly, and ending requirements are properly documented.

**Purpose:** Prevent softlock bugs in ending paths before Chunk 4 (Act 3) content implementation begins.

**Status:** Framework definition (Phase 3). Automated tests will be created when Chunk 4 scenes are implemented.

**⚠️ SCOPE NOTE:** This document describes **full Act 3** validation requirements. Chunk 4 implements only **Act 3 Hub 4**. See [ENDING_VALIDATION_CHUNK_4.md](./ENDING_VALIDATION_CHUNK_4.md) for scope clarification on how faction gates work with partial Act 3 implementation.

---

## Ending Definitions (Canonical Source)

**All ending requirements are canonically defined in `content/manifest.json` lines 161-218.**

This validation document references those definitions; any changes to ending requirements must be made in manifest.json first.

### Ending Summary

| ID | Scene | Title | Tier | Faction | Level | Editor State |
|----|-------|-------|------|---------|-------|--------------|
| 1 | sc_3_4_901 | The Revised Draft | bittersweet | revisionist | 7 | defeated |
| 2 | sc_3_4_902 | The Open Book | hopeful | exiter | 7 | persuaded |
| 3 | sc_3_4_903 | The Closed Canon | melancholic | preservationist | 7 | defeated |
| 4 | sc_3_4_904 | The Blank Page | tragic | independent | - | revealedTruth |
| 5 | sc_3_4_999 | The Eternal Rehearsal | ambiguous | - | - | failed_or_refused |

**Convergence Scene:** `sc_3_4_098` (The Last Curtain Call) - all endings branch from this scene.

---

## State Variable Reference

### Faction Variables (0-10 range)

Defined in `content/manifest.json` lines 80-104 (Act 2 Hub 2: The Green Room).

| Variable | Description | Starting | Notes |
|----------|-------------|----------|-------|
| `preservationist` | Keep Understage separate from reality | 0 | Accumulates through Act 2 choices |
| `revisionist` | Stories can and should be improved | 0 | Accumulates through Act 2 choices |
| `exiter` | Fictional beings deserve real existence | 0 | Accumulates through Act 2 choices |
| `independent` | Balance between factions | 0 | No explicit factionLevel requirement |

### Editor State Transitions

The `editorState` flag transitions through Act 3 scenes:

| State | Description | Path |
|-------|-------------|------|
| `defeated` | Editor defeated in conflict | Combat/confrontation path |
| `persuaded` | Editor persuaded diplomatically | Social/negotiation path |
| `revealedTruth` | Learned the deeper truth | Investigation/exploration path |

**Validation requirement:** Verify state transitions are achievable through Act 3 scene choices.

---

## Ending Requirements Analysis

### Faction Endings (IDs 1-3)

**Pattern:** `faction >= 7` AND `editorState` match

**Reachability Validation:**
1. Verify faction can reach level 7 through Act 2 choices
2. Verify corresponding `editorState` is achievable in Act 3
3. Verify no softlock behind mutually exclusive conditions

**Threshold Validation:**
- Faction levels use 0-10 scale (standard stat check scale)
- Level 7 requires ~70% investment in that faction
- Players must prioritize one faction over others

**Ending 1: The Revised Draft (Revisionist)**
```yaml
requirements:
  faction: revisionist
  factionLevel: 7
  editorState: defeated
validation:
  - revisionist >= 7 achievable in Act 2
  - editorState == defeated achievable in Act 3
  - scene sc_3_4_901 exists and is reachable from sc_3_4_098
```

**Ending 2: The Open Book (Exiter)**
```yaml
requirements:
  faction: exiter
  factionLevel: 7
  editorState: persuaded
validation:
  - exiter >= 7 achievable in Act 2
  - editorState == persuaded achievable in Act 3
  - scene sc_3_4_902 exists and is reachable from sc_3_4_098
```

**Ending 3: The Closed Canon (Preservationist)**
```yaml
requirements:
  faction: preservationist
  factionLevel: 7
  editorState: defeated
validation:
  - preservationist >= 7 achievable in Act 2
  - editorState == defeated achievable in Act 3
  - scene sc_3_4_903 exists and is reachable from sc_3_4_098
```

### Independent Ending (ID 4)

**Pattern:** No explicit factionLevel, only `editorState`

**Reachability Validation:**
1. Verify `editorState: revealedTruth` is achievable without high faction investment
2. Verify this path represents "balance" (no faction dominance)

**Ending 4: The Blank Page (Independent)**
```yaml
requirements:
  faction: independent
  editorState: revealedTruth
validation:
  - No factionLevel requirement (balance path)
  - editorState == revealedTruth achievable in Act 3
  - scene sc_3_4_904 exists and is reachable from sc_3_4_098
```

### Fail-State Ending (ID 5)

**Pattern:** Pure boolean flag (catch-all for failed/refused final choice)

**Reachability Validation:**
1. Verify this is always reachable (no blocking conditions)
2. Verify this serves as fallback for invalid states

**Ending 5: The Eternal Rehearsal (Fail)**
```yaml
requirements:
  finalChoice: failed_or_refused
validation:
  - Always reachable from sc_3_4_098
  - No blocking conditions
  - scene sc_3_4_999 exists and is reachable from sc_3_4_098
```

---

## Validation Tests

### Static Graph Analysis (ReachabilityValidator)

Use the `ReachabilityValidator` class (implemented in PR #86) to verify:

```typescript
// Test: All 5 endings are reachable from convergence scene
const validator = new ReachabilityValidator();
const result = validator.analyze(manifest, scenes, {
  startingScene: "sc_3_4_098",  // Convergence scene
  followGotoEffects: true
});

// Expected: All ending scenes marked as reachable
const expectedEndings = [
  "sc_3_4_901",  // Ending 1
  "sc_3_4_902",  // Ending 2
  "sc_3_4_903",  // Ending 3
  "sc_3_4_904",  // Ending 4
  "sc_3_4_999"   // Ending 5
];

expectedEndings.forEach(ending => {
  assert(result.reachableScenes.has(ending), `${ending} must be reachable`);
});
```

### Ending Path Test Cases

When Chunk 4 is implemented, create JSON playthrough files for each ending:

```json
// tests/playthroughs/endings/ending-1-revised-draft.json
{
  "meta": {
    "name": "Ending 1: The Revised Draft",
    "description": "Tests revisionist faction ending path"
  },
  "startingState": {
    "currentScene": "sc_3_4_098",
    "stats": {
      "revisionist": 7,
      "preservationist": 2,
      "exiter": 1
    },
    "flags": {
      "editorState": "defeated"
    }
  },
  "endingCriteria": {
    "sceneId": "sc_3_4_901"
  }
}
```

**Similar files for endings 2-5.**

### Faction Gate Validation

Verify faction gates prevent incorrect ending access:

```typescript
// Test: Faction gates block access without sufficient level
const testLowFaction = (endingScene: string, faction: string) => {
  const state = {
    currentScene: "sc_3_4_098",
    stats: { [faction]: 3 },  // Below threshold of 7
    flags: {}
  };

  // Expected: Ending choice is disabled
  assert(!isChoiceEnabled(state, endingScene));
};
```

---

## QA Checklist for Chunk 4 Implementation

When Chunk 4 (Act 3 with endings) is assigned, verify:

### Pre-Implementation
- [ ] All 5 ending scenes exist (sc_3_4_901, sc_3_4_902, sc_3_4_903, sc_3_4_904, sc_3_4_999)
- [ ] Convergence scene sc_3_4_098 exists with choices to all endings
- [ ] All faction variables are defined in stats.json (or tracked in code)
- [ ] editorState flag transitions are documented in scene scripts

### Post-Implementation
- [ ] ReachabilityValidator passes: all 5 endings reachable from sc_3_4_098
- [ ] Faction gates work: choices disabled without sufficient faction level
- [ ] Editor state gates work: choices disabled without correct state
- [ ] Ending 5 (fail) is always reachable (no blocking conditions)
- [ ] No orphan scenes in Act 3 content graph
- [ ] No circular references (except intentional narrative loops)
- [ ] All 5 ending path playthroughs pass (JSON tests)

### Manual Playthrough Verification
- [ ] Play through to Ending 1 (revisionist) with revisionist >= 7
- [ ] Play through to Ending 2 (exiter) with exiter >= 7
- [ ] Play through to Ending 3 (preservationist) with preservationist >= 7
- [ ] Play through to Ending 4 (independent) with editorState = revealedTruth
- [ ] Play through to Ending 5 (fail) by refusing final choice
- [ ] Attempt incorrect ending paths (verify blocked by faction/state)

---

## Integration with TEST_PLAYTHROUGHS.md

When Chunk 4 is complete, add ending playthrough sections to TEST_PLAYTHROUGHS.md:

```markdown
## Ending Playthroughs

### PT-END-001: Revisionist Ending

**Tests:** Faction gate (revisionist >= 7), editorState: defeated

**Entry Point:** sc_3_4_098 (The Last Curtain Call)

**Prerequisites:**
- revisionist faction >= 7
- editorState == defeated

**Expected Outcome:** Reach sc_3_4_901 (The Revised Draft)

[... steps and checkpoints ...]
```

---

## Phase 3 Deliverables

- [x] This documentation (ENDING_VALIDATION.md)
- [ ] Automated ReachabilityValidator test (tests/engine/ending-graph.test.ts)
- [ ] Ending path test cases (tests/playthroughs/endings/*.json)
- [ ] Update TEST_PLAYTHROUGHS.md with ending playthroughs

---

## Appendix: Validation Tooling

### ReachabilityValidator Usage

```typescript
import { ReachabilityValidator } from '../src/engine/reachability-validator.js';
import { readFileSync } from 'fs';

// Load content
const manifest = JSON.parse(readFileSync('content/manifest.json', 'utf8'));
const scenes = loadScenes(); // Your scene loader

// Run validation
const validator = new ReachabilityValidator();
const result = validator.analyze(manifest, scenes, {
  startingScene: 'sc_1_0_001',
  followGotoEffects: true
});

// Check results
console.log('Reachable scenes:', result.reachableScenes.size);
console.log('Unreachable scenes:', result.unreachableScenes);
console.log('Circular references:', result.circularReferences);
```

### Manual Validation Command

```bash
# Quick validation of ending graph reachability
node scripts/validate-endings.js
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-29 | Initial framework definition for Phase 3 ending validation |

---

*This document is maintained by agent-e (Validator). Update as ending requirements change.*
