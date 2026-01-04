# The Understage - Comprehensive Implementation Roadmap

**Document Version:** 1.2 (Revised)
**Date:** January 4, 2026
**Current Release:** v1.0.0 (MVP - 34 scenes, ~23% of full vision)
**Target:** Complete v2.0.0 (145 scenes, 100% of design vision - HUMAN CONFIRMED)

---

## Executive Summary

This roadmap documents the complete path from the current v1.0.0 MVP (34 scenes) to the full v2.0.0 implementation (145 scenes CONFIRMED by human). The roadmap covers:

1. **Content Expansion** - 111 new scenes across all 3 acts (verified scope)
2. **Content Authoring Patterns** - Using EXISTING engine features (flags, factions, stat_checks)
3. **UI/UX Improvements** - Enhanced DOS aesthetic, animations, visual feedback
4. **Audio & Visual Polish** - Sound design, music, graphics, effects
5. **Technical Infrastructure** - Save migration, testing, performance

**Scope Status:** Human confirmed 145 scenes total with unlimited budget and time.
**Timeline:** Open-ended - focused on quality over schedule.

---

## Part I: Content Expansion Roadmap

### Current Status Analysis

| Metric | Current (v1.0.0) | Target (v2.0.0) | Gap |
|--------|------------------|-----------------|-----|
| **Total Scenes** | 34 scenes | **145 scenes (CONFIRMED)** | **111 scenes** |
| **Act 1** | 15 scenes | 35 scenes | 20 scenes |
| **Act 2** | 9 scenes | 70 scenes | 61 scenes |
| **Act 3** | 10 scenes | 40 scenes | 30 scenes |
| **Endings** | 5 endings (all reachable) | 5 endings × 3 quality tiers = 15 variants | Same endings, deeper content |
| **Playthrough Time** | ~20-30 minutes | ~2-3 hours | 4-6x expansion |
| **Branching Depth** | 2-4 choices per scene | 6-12 choices per scene | 2-3x expansion |

**IMPORTANT:** The engine v1.0.0 is FEATURE-COMPLETE. All mechanics needed for v2.0.0 already exist:
- Quests = flags (e.g., `QUEST_MISSING_SCRIPT_STARTED`, `QUEST_MISSING_SCRIPT_COMPLETE`)
- NPC relationships = factions (e.g., `preservationist` for Maren-aligned content)
- Advanced stat checks = existing `stat_check` with tiered `onSuccess` scenes
- Effective bonuses = `getEffectiveStat()` already combines base stats + item modifiers

---

### Phase 6: Content Expansion - Act 1 Enhancement

**Goal:** Expand Act 1 from 15 scenes to 25-35 scenes by adding intermediate exploration, character development, and atmospheric moments.

#### 6.1: Hub 0 (The Prompter's Booth) Expansion

**Current Scenes (15):**
- sc_1_0_001: The Booth Awakens (hub)
- sc_1_0_002: The Wings (direct path)
- sc_1_0_003: The Threshold Stage (inventory-gated + stat check)
- sc_1_0_004: Maren's Guidance (item acquisition)
- sc_1_0_010-012: Pursuers branch (3 scenes)
- sc_1_0_020-022: Researcher branch (3 scenes)
- sc_1_0_030-032: Negotiator branch (3 scenes)
- sc_1_0_902: Crossing Failed (ending)

**Planned Additions (~10-15 new scenes):**

| Scene ID | Title | Type | Purpose |
|----------|-------|------|---------|
| sc_1_0_005 | The Prop Closet | Exploration | Item discovery + lore (Props category intro) |
| sc_1_0_006 | Costume Rack | Exploration | Item discovery + atmospheric storytelling |
| sc_1_0_007 | Stagehand's Tools | Exploration | Item discovery + practical knowledge |
| sc_1_0_013 | The Corridor of Echoes | Pursuers extension | Complication/test branch |
| sc_1_0_014 | Ambush Point | Pursuers extension | Combat/social check scene |
| sc_1_0_015 | Lost Character | Pursuers extension | NPC encounter + faction choice |
| sc_1_0_023 | Mirror's Edge | Researcher extension | Environmental hazard + stat check |
| sc_1_0_024 | Abandoned Script | Researcher extension | Lore discovery + narrative depth |
| sc_1_0_025 | The Author's Ghost | Researcher extension | Optional supernatural encounter |
| sc_1_0_033 | Maren's Past | Negotiator extension | Character backstory |
| sc_1_0_034 | The First Prompter | Negotiator extension | Lore discovery + worldbuilding |
| sc_1_0_035 | The Oath | Negotiator extension | Commitment ceremony + flag setting |
| sc_1_0_040 | The Threshold Storm | Environmental | Weather/atmosphere scene (optional) |
| sc_1_0_041 | Ghost Lights | Environmental | Eerie atmosphere (optional) |
| sc_1_0_050 | The Rehearsal | Flashback | Optional lore scene |

**Mechanics to Introduce:**
- Item acquisition beyond booth_key (5-6 new items)
- Environmental stat checks (Script for knowledge, Improv for adaptation)
- Optional scenes that reward exploration
- Branch re-convergence points

#### 6.2: Act 1 Climax Enhancement

**Current:** sc_1_1_099 (First Crossing) - single convergence scene

**Planned Additions (~2-3 scenes):**

| Scene ID | Title | Purpose |
|----------|-------|---------|
| sc_1_1_080 | Preparation Scenes | Pre-climax resource gathering |
| sc_1_1_090 | The Crossing Begins | Multi-stage crossing event |
| sc_1_1_095 | Near-Failure Moments | Drama/tension before success |

**Deliverables:**
- [ ] 10-15 new scene files (exact IDs: sc_1_0_005 through sc_1_0_050)
- [ ] 5-6 new items added to items.json
- [ ] Act 1 playthrough time expanded to 30-45 minutes
- [ ] All Hub 0 branches have 4-5 scenes each (not 3)
- [ ] At least 3 optional exploration scenes

#### Phase 6 Test Gate (REQUIRED before Phase 7)

**Automation Gate:**
- [ ] All new scenes pass schema validation (`./scripts/validate-content.js`)
- [ ] No dead ends detected (all new scenes have ≥2 exits or are endings)
- [ ] All existing v1.0.0 playthrough tests still pass (regression check)
- [ ] New scenes added to TEST_PLAYTHROUGHS.md (3 new playthrough paths)

**Manual Gate:**
- [ ] Complete Act 1 playthrough from start to First Crossing
- [ ] Verify all 3 Hub 0 branches (Pursuers, Researcher, Negotiator) are reachable
- [ ] Verify stat check thresholds work correctly (Script/Improv/Stage Presence)
- [ ] Verify new items are acquirable through gameplay

**Code Review Gate:**
- [ ] Engine compatibility verified by agent-c (no new engine features needed)
- [ ] Content quality verified by agent-b (narrative consistency, proper flags)

**Definition of Done for Phase 6:**
Phase 6 is complete when: (1) All 20 new scenes pass schema validation, (2) All 19 baseline + 3 new playthrough tests pass, (3) Manual playthrough completes Act 1 in <45 minutes, (4) No dead ends exist, (5) Code review approved.

---

### Phase 7: Content Expansion - Act 2 Deepening

**Goal:** Expand Act 2 from 9 scenes to 50-70 scenes by adding faction quests, exploration depth, and alliance-building mechanics.

#### 7.1: Hub 2 (The Green Room) Expansion

**Current Scenes (4):**
- sc_2_2_001: Green Room Arrival
- sc_2_2_002: The Director's Guidance
- sc_2_2_010: The Dressing Rooms
- sc_2_2_020: The Call Board

**Planned Additions (~15-20 new scenes):**

##### Quest System (Using Existing Engine Features)

**IMPORTANT:** Quests use the EXISTING flag system. No engine changes needed.

**Quest Flag Convention:**
```
QUEST_<NAME>_<STAGE>

Examples:
- QUEST_MISSING_SCRIPT_STARTED
- QUEST_MISSING_SCRIPT_IN_PROGRESS
- QUEST_MISSING_SCRIPT_COMPLETE
- QUEST_TROUBLED_ACTOR_STARTED
- QUEST_TROUBLED_ACTOR_COMPLETE
```

**Quest Hook Scenes (The Call Board):**
- sc_2_2_021: "Missing Script" quest (Preservationist) → adds flag: QUEST_MISSING_SCRIPT_STARTED
- sc_2_2_022: "Troubled Actor" quest (Revisionist) → adds flag: QUEST_TROUBLED_ACTOR_STARTED
- sc_2_2_023: "Escaped Character" quest (Exiter) → adds flag: QUEST_ESCAPED_CHARACTER_STARTED
- sc_2_2_024: "Balance of Power" quest (Independent) → adds flag: QUEST_BALANCE_STARTED

**Quest Completion Scenes:**
- sc_2_2_031: Missing Script Resolution → condition: has_flag(QUEST_MISSING_SCRIPT_STARTED), effects: add_flag(QUEST_MISSING_SCRIPT_COMPLETE), modify_faction(preservationist, +2), add_item(...)
- sc_2_2_032: Troubled Actor Resolution → condition: has_flag(QUEST_TROUBLED_ACTOR_STARTED), effects: add_flag(QUEST_TROUBLED_ACTOR_COMPLETE), modify_faction(revisionist, +2), add_item(...)
- sc_2_2_033: Escaped Character Resolution → condition: has_flag(QUEST_ESCAPED_CHARACTER_STARTED), effects: add_flag(QUEST_ESCAPED_CHARACTER_COMPLETE), modify_faction(exiter, +2), add_item(...)
- sc_2_2_034: Balance Resolution → condition: has_flag(QUEST_BALANCE_STARTED), effects: add_flag(QUEST_BALANCE_COMPLETE), modify_faction(all, +1)

##### Faction-Specific Scenes

**Preservationist Path:**
- sc_2_2_040: The Conservator's Office (faction headquarters)
- sc_2_2_041: Archive Tour (lore + item)
- sc_2_2_042: The Sealed Archive (locked content)

**Revisionist Path:**
- sc_2_2_050: The Writer's Room (faction headquarters)
- sc_2_2_051: Improv Workshop (stat training scene)
- sc_2_2_052: The Re-Write Desk (content alteration mechanic)

**Exiter Path:**
- sc_2_2_060: The Threshold Gate (faction headquarters)
- sc_2_2_061: Reality Testing Ground (experimental scenes)
- sc_2_2_062: The Bridge (constructing passage to reality)

**Independent Path:**
- sc_2_2_070: The Neutral Ground (meeting place)
- sc_2_2_071: Council of Three (all faction representatives)
- sc_2_2_072: The Diplomat's Challenge (complex negotiation)

##### NPC Relationship Scenes (Using Existing Faction System)

**IMPORTANT:** NPC relationships use the EXISTING faction system. No new engine features needed.

**NPC-to-Faction Mapping:**
- **Maren** → represents Preservationist path (use `factions.preservationist` for relationship level)
- **The Director** → represents institutional authority (use flags: `MET_DIRECTOR`, `DIRECTOR_CONFIDANT`)
- **CHORUS** → represents collective decision-making (use flags: `CHORUS_MEMBER`, `CHORUS_LEADER`)
- **The Understudy** → represents the cost of revision (use flags: `UNDERSTUDY_TRUSTED`, `UNDERSTUDY_ALLY`)

**Relationship Tiers (using faction levels 0-10):**
- **0-2:** Stranger (basic dialogue available)
- **3-4:** Acquaintance (minor help choices appear)
- **5-6:** Friend (major assistance, quest hooks unlock)
- **7-8:** Ally (combat support, ending bonuses)
- **9-10:** Confidant (intimate knowledge, sacrifice potential)

**The Director Scenes:**
- sc_2_2_080: The Director's Past (backstory, adds flag: MET_DIRECTOR)
- sc_2_2_081: Director's Confidence Check (condition: factions.preservationist >= 5, adds flag: DIRECTOR_CONFIDANT)
- sc_2_2_082: Director's Request (condition: has_flag(DIRECTOR_CONFIDANT), quest hook)

**CHORUS (Collective) Scenes:**
- sc_2_2_090: CHORUS Introduction (mechanic explanation, adds flag: MET_CHORUS)
- sc_2_2_091: Individual Voice (condition: has_flag(MET_CHORUS), meet a CHORUS member)
- sc_2_2_092: CHORUS Consensus (condition: factions.revisionist >= 6, adds flag: CHORUS_MEMBER)

**Genre Representatives:**
- sc_2_2_095: The Comedy Tragedy (dual character scene)
- sc_2_2_096: The Romance Arc (relationship mechanic demo)
- sc_2_2_097: The Mystery Hook (clue system demo)

#### 7.2: Hub 3 (The Archives) Expansion

**Current Scenes (5):**
- sc_2_3_001: The Archives Entry
- sc_2_3_002: The Understudy's Lament
- sc_2_3_010: The Stacks
- sc_2_3_020: The Prop Room
- sc_2_3_099: The Revelation

**Planned Additions (~20-25 scenes):**

##### Discovery Chain System

**Multi-Scene Investigation (4-clue system):**
- sc_2_3_003: The Understudy's Secret (clue 1) → adds flag: CLUE_UNDERSTUDY_SECRET
- sc_2_3_004: Draft Fragments (clue 2) → adds flag: CLUE_DRAFT_FRAGMENTS
- sc_2_3_005: The Critic's Notes (clue 3) → adds flag: CLUE_CRITIC_NOTES
- sc_2_3_006: Author's Margins (clue 4) → adds flag: CLUE_AUTHOR_MARGINS, sets editorState_revealedTruth

**Discovery Chain Tests (Required for regression prevention):**
- test-discovery-chain-order.json: Test finding clues in every permutation
- test-discovery-chain-partial.json: Test reaching revelation with 0, 1, 2, 3, 4 clues
- test-discovery-chain-flag.json: Verify editorState_revealedTruth sets correctly

**Archive Search (Using Existing stat_check with Tiered Scenes):**

**IMPORTANT:** This uses EXISTING `stat_check` conditions. No new engine features needed.

**Archive Search Scenes (tiered by Script stat):**
- sc_2_3_011: Deep Find (condition: stats.script >= 4) - Best discovery
- sc_2_3_012: Standard Search (condition: stats.script >= 2 AND stats.script < 4) - Basic discovery
- sc_2_3_013: Partial Find (condition: stats.script >= 1 AND stats.script < 2) - Fragmented clues
- sc_2_3_014: Lost in Stacks (condition: stats.script < 1) - Alternative path

**Edge Case Handling (Script = 3):**
The tier gap between Script >= 4 (Deep) and Script >= 2 (Standard) means Script = 3 falls to Standard. This is INTENTIONAL - the gap creates narrative tension where players who don't invest heavily in Script miss the best discoveries.

**Boundary Conditions:**
- Script = 4 or higher: sc_2_3_011 (Deep Find)
- Script = 2 or 3: sc_2_3_012 (Standard Search)
- Script = 1: sc_2_3_013 (Partial Find)
- Script = 0: sc_2_3_014 (Lost in Stacks)

**Archive Search Tests (Required):**
- test-archive-boundary.json: Test Script values 0, 1, 2, 3, 4, 5, 10
- test-archive-modify.json: Test Script modification during search (item use, etc.)

##### Archive Locations

**The Stacks Expansion:**
- sc_2_3_015: The Forgotten Wing (optional exploration)
- sc_2_3_016: The Banned Section (dangerous area)
- sc_2_3_017: Living Manuscripts (animated content)

**The Prop Room Expansion:**
- sc_2_3_021: Item Catalog (discovery + item acquisition)
- sc_2_3_022: Cursed Objects (hazard + stat check)
- sc_2_3_023: Legendary Props (high-value items)

**The Author's Desk:**
- sc_2_3_030: Desk Approach (caution/stat check)
- sc_2_3_031: The First Draft (major revelation)
- sc_2_3_032: The Editor's Pen (item acquisition)
- sc_2_3_033: Author's Spirit (boss encounter)

##### The Revelation Enhancement

**Pre-Revelation Build-up:**
- sc_2_3_090: The Understudy's Warning (foreshadowing)
- sc_2_3_091: Signs of Revision (environmental clues)
- sc_2_3_092: The Great Revision (discovery)

**Revelation Variants:**
- sc_2_3_099a: Shallow Revelation (0-2 clues discovered)
- sc_2_3_099b: Standard Revelation (3 clues discovered)
- sc_2_3_099c: Deep Revelation (4+ clues discovered) - Sets editorState_revealedTruth

#### 7.3: Act 2 Side Content

**Exploration Scenes:**
- sc_2_2_100: The Green Room Gardens (atmospheric)
- sc_2_2_101: The Backstage Passage (shortcut/alternative)
- sc_2_3_100: The Archives Basement (secret area)
- sc_2_3_101: The Lost Library (hidden content)

**Deliverables:**
- [ ] 35-45 new scene files for Act 2
- [ ] 4 quest storylines using flag system (QUEST_* flags)
- [ ] Discovery chain system (4-clue investigation with CLUE_* flags)
- [ ] Archive search using existing stat_check (tiered: Deep/Standard/Partial/Lost)
- [ ] NPC relationship flags (DIRECTOR_CONFIDANT, CHORUS_MEMBER, etc.)
- [ ] 10-15 new items (faction tokens, archive artifacts)
- [ ] Act 2 playthrough time expanded to 60-90 minutes

#### Phase 7 Test Gate (REQUIRED before Phase 8)

**Automation Gate:**
- [ ] All new scenes pass schema validation
- [ ] All Act 1 → Act 2 transitions work (First Crossing → Green Room Arrival)
- [ ] Discovery chain regression tests pass (test-discovery-chain-*.json)
- [ ] Archive search boundary tests pass (test-archive-boundary.json)
- [ ] Quest flag tests pass (verify QUEST_* flags set/cleared correctly)

**Manual Gate:**
- [ ] Complete Act 2 playthrough from Green Room to Revelation
- [ ] Test all 4 quest completions (Missing Script, Troubled Actor, Escaped Character, Balance)
- [ ] Test discovery chain with all clue permutations
- [ ] Test archive search with Script values 0, 1, 2, 3, 4, 5
- [ ] Test all 3 revelation variants (shallow/standard/deep)

**Code Review Gate:**
- [ ] Engine compatibility verified by agent-c (no new features needed)
- [ ] Content quality verified by agent-b (narrative consistency)

**Definition of Done for Phase 7:**
Phase 7 is complete when: (1) All 45 new scenes pass schema validation, (2) Act 1 → Act 2 transition works, (3) All quest/chain/search tests pass, (4) Manual playthrough reaches Revelation, (5) Code review approved.

---

### Phase 8: Content Expansion - Act 3 Culmination

**Goal:** Expand Act 3 from 10 scenes to 30-40 scenes by adding ally reunion, preparation, and multi-stage confrontation mechanics.

#### 8.1: Hub 4 (The Mainstage) Enhancement

**Current Scenes (10):**
- sc_3_4_001: Mainstage Descent
- sc_3_4_010: The Empty Desk
- sc_3_4_020: The Council of Shadows
- sc_3_4_030: The Wings of Memory
- sc_3_4_098: The Last Curtain Call
- sc_3_4_901-904, 999: 5 endings

**Planned Additions (~20-30 scenes):**

##### Pre-Confrontation Preparation

**The Approach Variants:**
- sc_3_4_002: Stealth Approach (Improv path)
- sc_3_4_003: Diplomatic Approach (Stage Presence path)
- sc_3_4_004: Direct Confrontation (Script path)
- sc_3_4_005: Combined Approach (all stats high)

**Ally Reunion System:**
- sc_3_4_011: Maren's Return (if relationship established)
- sc_3_4_012: Director's Entrance (if Director allied)
- sc_3_4_013: CHORUS Amplification (if CHORUS allied)
- sc_3_4_014: The Understudy's Sacrifice (if alliance built)

**Council of Shadows Expansion:**
- sc_3_4_021: No Allies Present (solo confrontation prep)
- sc_3_4_022: Single Ally (one companion)
- sc_3_4_023: Two Allies (small council)
- sc_3_4_024: Full Council (all allies - optimal path)

##### The Wings of Memory Expansion

**Memory Recovery:**
- sc_3_4_031: Failed Stories (tragic memories)
- sc_3_4_032: Abandoned Characters (emotional beats)
- sc_3_4_033: The Editor's Victims (dark revelations)
- sc_3_4_034: Your Own Memories (personal connection)

**Item Discovery:**
- sc_3_4_035: Maren's Signet (ally item)
- sc_3_4_036: Conductor's Baton (powerful item)
- sc_3_4_037: Audience Favor (advantage item)

##### Multi-Stage Confrontation

**Stage 1: The Challenge**
- sc_3_4_040: The Editor Appears (boss intro)
- sc_3_4_041: First Exchange (combat/social)
- sc_3_4_042: Editor's Power (mechanic reveal)

**Stage 2: The Debate**
- sc_3_4_043: Philosophical Clash (faction alignment test)
- sc_3_4_044: Evidence Presentation (clue usage)
- sc_3_4_045: Ally Interventions (if allies present)

**Stage 3: The Resolution**
- sc_3_4_046: Weakening the Editor (stat checks)
- sc_3_4_047: The Sacrifice (NPC sacrifice mechanic)
- sc_3_4_048: The Final Choice (gates to endings)

**Multi-Stage Confrontation Edge Cases:**
- **What if player FAILS Stage 1?** → sc_3_4_090: Defeated Path (leads to ending 999c - Refused to Choose)
- **What if player has NO allies?** → sc_3_4_021: Solo Confrontation (harder stat checks)
- **What if player has ALL allies?** → sc_3_4_024: Full Council (optimal path, easier stat checks)

**Sacrifice Mechanic (Using Existing Effects):**
**IMPORTANT:** The sacrifice uses EXISTING `modify_stat` effect with negative values. No new engine features needed.

**Example - sc_3_4_047: The Sacrifice:**
```json
{
  "choices": [
    {
      "text": "Sacrifice Maren to weaken The Editor",
      "condition": { "has_flag": "MAREN_ALLY" },
      "effects": [
        { "remove_flag": "MAREN_ALLY" },
        { "modify_stat": { "stat": "stage_presence", "value": -2 } },
        { "add_flag": "SACRIFICED_MAREN" }
      ],
      "nextScene": "sc_3_4_048"
    }
  ]
}
```

**Sacrifice Edge Cases:**
- **What if player sacrifices an NPC they never met?** → Condition `has_flag` prevents this
- **Can sacrifice be reversed?** → No, this is intentional narrative weight
- **Does sacrifice affect ending?** → Yes, certain quality tiers require "no casualties"

##### Ending Quality Tiers

**Each ending needs 3 quality variants:**

**Ending 1: The Revised Draft (Revisionist)**
- sc_3_4_901a: Perfect (condition: factions.revisionist >= 9 AND has_flag(MAREN_ALLY) AND has_flag(DIRECTOR_CONFIDANT) AND NOT has_flag(SACRIFICED_*))
- sc_3_4_901b: Good (condition: factions.revisionist >= 7)
- sc_3_4_901c: Other (condition: factions.revisionist >= 5 AND factions.revisionist < 7)

**Ending 2: The Open Book (Exiter)**
- sc_3_4_902a: Perfect (condition: factions.exiter >= 9 AND has_flag(CHORUS_ALLY) AND has_flag(PEACEFUL_RESOLUTION))
- sc_3_4_902b: Good (condition: factions.exiter >= 7)
- sc_3_4_902c: Other (condition: factions.exiter >= 5 AND factions.exiter < 7)

**Ending 3: The Closed Canon (Preservationist)**
- sc_3_4_903a: Perfect (condition: factions.preservationist >= 9 AND has_flag(COMPLETE_SEAL) AND NOT has_flag(SACRIFICED_*))
- sc_3_4_903b: Good (condition: factions.preservationist >= 7)
- sc_3_4_903c: Other (condition: factions.preservationist >= 5 AND factions.preservationist < 7)

**Ending 4: The Blank Page (Independent)**
- sc_3_4_904a: Perfect (condition: has_flag(editorState_revealedTruth) AND all factions <= 3 AND has_flag(SACRIFICED_UNDERSTUDY))
- sc_3_4_904b: Good (condition: has_flag(editorState_revealedTruth) AND factions.preservationist = factions.revisionist = factions.exiter ±1)
- sc_3_4_904c: Other (condition: has_flag(editorState_revealedTruth))

**Ending 5: The Eternal Rehearsal**
- sc_3_4_999a: Voluntary Rehearsal (player choice from sc_3_4_098)
- sc_3_4_999b: Failed Challenge (reached via sc_3_4_090: Defeated Path)
- sc_3_4_999c: Refused to Choose (no faction >= 5 at sc_3_4_098)

**Ending Quality Tier Test Matrix (Required):**
```
tests/playthroughs/endings/
├── ending-901-tier-perfect.json    (revisionist=10, allies=yes, items=yes, no_sacrifice)
├── ending-901-tier-good.json       (revisionist=8, basic setup)
├── ending-901-tier-other.json      (revisionist=6, minimal)
├── ending-902-tier-perfect.json    (exiter=10, peaceful=yes, allies=yes)
├── ending-902-tier-good.json       (exiter=8, basic setup)
├── ending-902-tier-other.json      (exiter=6, minimal)
├── ending-903-tier-perfect.json    (preservationist=10, seal=yes, no_casualties)
├── ending-903-tier-good.json       (preservationist=8, basic setup)
├── ending-903-tier-other.json      (preservationist=6, minimal)
├── ending-904-tier-perfect.json    (revealedTruth=yes, balanced=yes, sacrifice=yes)
├── ending-904-tier-good.json       (revealedTruth=yes, balanced=yes)
├── ending-904-tier-other.json      (revealedTruth=yes, unbalanced)
├── ending-999-tier-voluntary.json  (player choice at sc_3_4_098)
├── ending-999-tier-failed.json     (defeated at confrontation)
└── ending-999-tier-refused.json    (no faction >= 5)
```

**Mathematical Feasibility Validation:**
- **Can player reach faction >= 9?** → YES: Starting stats (4) + item bonuses (+3) + faction modifications (+2) = 9 maximum
- **Can player reach "no casualties"?** → YES: Avoid sacrifice choices in confrontation
- **Can all 15 ending variants be reached?** → TO BE VALIDATED by tests above

**Deliverables:**
- [ ] 20-30 new scene files for Act 3
- [ ] Ally reunion scenes (Maren, Director, CHORUS, Understudy) using flags
- [ ] Multi-stage confrontation (Challenge → Debate → Resolution)
- [ ] NPC sacrifice using modify_stat effect
- [ ] 15 ending quality tier scenes (sc_3_4_901a-904c, 999a-999c)
- [ ] 15 ending quality tier test files (tests/playthroughs/endings/*.json)
- [ ] 15 new confrontation items
- [ ] Act 3 playthrough time expanded to 30-60 minutes

#### Phase 8 Test Gate (REQUIRED before Phase 11)

**Automation Gate:**
- [ ] All new scenes pass schema validation
- [ ] All Act 2 → Act 3 transitions work (Revelation → Mainstage Descent)
- [ ] All 15 ending quality tier tests pass (tests/playthroughs/endings/*.json)
- [ ] Ending reachability validated (all 15 variants mathematically possible)
- [ ] Multi-stage confrontation tests pass (solo, 1 ally, 2 allies, full council)

**Manual Gate:**
- [ ] Complete Act 3 playthrough from Mainstage to ending
- [ ] Test all 15 ending quality variants (verify each reachable)
- [ ] Test all 4 sacrifice scenarios (Maren, Director, CHORUS, Understudy)
- [ ] Test all confrontation failure paths (Stage 1 failure, no allies, refused to choose)
- [ ] Test save/load at each confrontation stage

**Code Review Gate:**
- [ ] Engine compatibility verified by agent-c (no new features needed)
- [ ] Content quality verified by agent-b (narrative consistency)
- [ ] Ending feasibility verified by agent-e (all 15 variants reachable)

**Definition of Done for Phase 8:**
Phase 8 is complete when: (1) All 30 new scenes pass schema validation, (2) Act 2 → Act 3 transition works, (3) All 15 ending tests pass and are mathematically feasible, (4) Manual playthrough completes all endings, (5) Code review approved.

**Phase 8.5: Ending Quality Tier Validation (NEW - Required Gate)**
This is a CRITICAL sub-phase between content expansion (Phase 8) and UI polish (Phase 11). Before moving to UI/UX work, ALL 15 ending variants must be validated as mathematically reachable.

**Validation Tasks:**
- [ ] Create 15 playthrough test files (one per ending variant)
- [ ] Run automated validation: `npm run test:playthroughs -- endings/`
- [ ] Verify stat caps (0-10) allow reaching Perfect tier requirements
- [ ] Document any impossible tier requirements (adjust sc_3_4_098 gates if needed)
- [ ] Update TEST_PLAYTHROUGHS.md with PT-END-001a through PT-END-005e documentation

---

### Phase 4.5: DOS Asset Standards Definition (NEW - Prerequisite for Content Expansion)

**Why This Phase is Critical:**

Before creating 111 new scenes across Phases 6-8, content authors need to know:
- What audio format to use for ambient sounds? (OGG 8-bit 11kHz for DOS authenticity?)
- What image format/dimensions for backgrounds? (WebP 640x480 VGA resolution?)
- Where do we source 50-100 SFX and 15-20 backgrounds?

Without these standards defined FIRST, content expansion will create assets that:
1. Don't match DOS aesthetic authenticity
2. Exceed web performance budgets
3. Require rework when standards are decided later

**Deliverable: DOS_ASSET_STANDARDS.md**

Create a comprehensive specification document at `docs/DOS_ASSET_STANDARDS.md` with:

#### Audio Specifications

| Asset Type | Format | Bit Depth | Sample Rate | Max Size | Fidelity Notes |
|------------|--------|-----------|-------------|----------|----------------|
| **Ambient Loops** | OGG | 8-bit | 11kHz | 100KB | Low (authentic DOS) |
| **Music Tracks** | OGG | 8-bit | 11kHz | 200KB | Medium (DOS-era MIDI-style) |
| **Sound Effects** | OGG | 8-bit | 11kHz | 50KB | Low (PC speaker style) |
| **UI Sounds** | OGG | 8-bit | 11kHz | 10KB | Minimal (beeps/clicks) |

**DOS Fidelity Rationale:**
- 8-bit @ 11kHz matches early Sound Blaster era (1990-1992)
- Creates authentic "crunchy" DOS audio aesthetic
- Small file sizes for web performance
- OGG format for browser compatibility

#### Image Specifications

| Asset Type | Format | Resolution | Max Size | Style Notes |
|------------|--------|------------|----------|-------------|
| **Location Backgrounds** | WebP | 640x480 (VGA) | 200KB | Pixel art or retro-scan |
| **Item Icons** | PNG | 32x32 | 10KB | Pixel art (DOS GUI style) |
| **Faction Emblems** | PNG | 64x64 | 15KB | Pixel art with transparency |
| **UI Elements** | CSS | N/A | N/A | Generated via code |

**DOS Visual Rationale:**
- VGA resolution (640x480) was the 1990s standard
- Pixel art maintains DOS aesthetic authenticity
- WebP for compression while supporting transparency
- Small files for instant loading on web

#### Asset Sourcing Strategy

**Option A: Free Asset Libraries**
- OpenGameArt.org (pixel art SFX, sprites)
- Freesound.org (retro SFX, filter to 8-bit)
- Itch.io game assets (DOS/Retro themed)

**Option B: Procedural Generation**
- obelisk.js (pixel art generation)
- sfxr (8-bit sound synthesis)
- Chrome Music Lab (simple MIDI-style tracks)

**Option C: Commission (Budget Available)**
- Per agent-d recommendation: $1000-6500 budget for assets
- Commission pixel artist for 40-50 item icons @ $20-50 each
- Commission audio designer for ambient loops @ $50-100 each

**Recommendation:** Start with Option A/B (free + procedural), commission Option C for critical assets if needed.

#### Asset Creation Checklist

**Phase 4.5 Deliverables:**
- [ ] Create `docs/DOS_ASSET_STANDARDS.md` with above specifications
- [ ] Document asset sourcing strategy (free vs. commissioned)
- [ ] Create 3 example assets to validate standards (1 SFX, 1 icon, 1 background)
- [ ] Verify WebP/OGG formats work in target browsers (Chrome, Firefox, Safari)
- [ ] Test asset loading performance (target: <2s for all assets on 3G)

**Phase 4.5 Definition of Done:**
DOS_ASSET_STANDARDS.md is complete when: (1) Audio/image specs are documented, (2) Sourcing strategy is clear, (3) 3 example assets validate the standards, (4) Browser compatibility verified, (5) Performance targets met.

---

## Part II: Content Authoring Patterns (No Engine Changes Needed)

### Engine Status: v1.0.0 is FEATURE-COMPLETE

**IMPORTANT:** The engine already supports ALL mechanics needed for v2.0.0 content expansion. This section documents how to use EXISTING engine features to implement the "new" mechanics described in original roadmap drafts.

**What EXISTS in v1.0.0:**
- ✅ Quest tracking via `GameState.flags` (e.g., `QUEST_MISSING_SCRIPT_STARTED`)
- ✅ NPC relationships via `GameState.factions` (0-10 scale per faction)
- ✅ Advanced stat checks via existing `stat_check` with tiered scenes
- ✅ Item effects (stat modifiers, flags, faction changes)
- ✅ Save/load system (migration deferred to Phase 13)

**What is ACTUALLY needed:**
- Content authoring documentation (how to use flags/factions for quests/NPCs)
- Scene content (111 new scenes)
- Item catalog expansion (30-40 new items)
- Test coverage (15 ending variants, discovery chains, archive search)

---

### Phase 9: Content Authoring Documentation

#### 9.1: Quest System Pattern (Using Flags)

**Engine Feature:** `GameState.flags: Set<string>`

**Quest Flag Convention:**
```
QUEST_<NAME>_<STAGE>

Examples:
- QUEST_MISSING_SCRIPT_STARTED
- QUEST_MISSING_SCRIPT_IN_PROGRESS
- QUEST_MISSING_SCRIPT_COMPLETE
- QUEST_TROUBLED_ACTOR_STARTED
- QUEST_TROUBLED_ACTOR_COMPLETE
```

**Quest Hook Scene Example:**
```json
{
  "sceneId": "sc_2_2_021",
  "title": "Missing Script",
  "choices": [
    {
      "text": "Accept the quest to find the missing script",
      "effects": [
        { "add_flag": "QUEST_MISSING_SCRIPT_STARTED" }
      ],
      "nextScene": "sc_2_2_022"
    }
  ]
}
```

**Quest Completion Scene Example:**
```json
{
  "sceneId": "sc_2_2_031",
  "title": "Missing Script Resolved",
  "condition": {
    "has_flag": "QUEST_MISSING_SCRIPT_STARTED"
  },
  "choices": [
    {
      "text": "Return the script",
      "effects": [
        { "add_flag": "QUEST_MISSING_SCRIPT_COMPLETE" },
        { "modify_faction": { "faction": "preservationist", "value": 2 } },
        { "add_item": "preservationist_pin" }
      ],
      "nextScene": "sc_2_2_001"
    }
  ]
}
```

**Documentation Deliverables:**
- [ ] Create CONTENT_AUTHORING.md with quest pattern documentation
- [ ] Document all 4 Act 2 quests (flag names, scenes, rewards)
- [ ] Provide quest scene templates for content authors

#### 9.2: NPC Relationship Pattern (Using Factions)

**Engine Feature:** `GameState.factions: Record<string, number>` (0-10 scale)

**NPC-to-Faction Mapping:**
- **Maren** → Use `factions.preservationist` for relationship level
- **The Director** → Use flags: `MET_DIRECTOR`, `DIRECTOR_CONFIDANT`
- **CHORUS** → Use flags: `CHORUS_MEMBER`, `CHORUS_LEADER`
- **The Understudy** → Use flags: `UNDERSTUDY_TRUSTED`, `UNDERSTUDY_ALLY`

**Relationship Tier Conditions:**
```json
// Stranger (0-2): Basic dialogue
{
  "condition": { "faction": { "id": "preservationist", "min": 0, "max": 2 } }
}

// Friend (5-6): Quest hooks unlock
{
  "condition": { "faction": { "id": "preservationist", "min": 5, "max": 6 } }
}

// Confidant (9-10): Sacrifice potential
{
  "condition": { "faction": { "id": "preservationist", "min": 9, "max": 10 } }
}
```

**NPC Meeting Scene Example:**
```json
{
  "sceneId": "sc_2_2_080",
  "title": "The Director's Past",
  "choices": [
    {
      "text": "Introduce yourself to The Director",
      "effects": [
        { "add_flag": "MET_DIRECTOR" },
        { "modify_faction": { "faction": "preservationist", "value": 1 } }
      ],
      "nextScene": "sc_2_2_081"
    }
  ]
}
```

**Documentation Deliverables:**
- [ ] Document NPC-to-faction mapping in CONTENT_AUTHORING.md
- [ ] Document relationship tier conditions (0-2, 3-4, 5-6, 7-8, 9-10)
- [ ] Provide NPC scene templates

#### 9.3: Advanced Stat Check Patterns (Using Existing stat_check)

**Engine Feature:** Existing `stat_check` condition with tiered `onSuccess` scenes

**Pattern 1: Archive Search (Tiered by Stat Value)**
```json
{
  "sceneId": "sc_2_3_010",
  "title": "The Stacks",
  "choices": [
    {
      "text": "Search the archives deeply",
      "condition": { "stat_check": { "stat": "script", "min": 4 } },
      "nextScene": "sc_2_3_011"  // Deep Find
    },
    {
      "text": "Search the archives normally",
      "condition": { "stat_check": { "stat": "script", "min": 2 } },
      "nextScene": "sc_2_3_012"  // Standard Search
    },
    {
      "text": "Search casually",
      "condition": { "stat_check": { "stat": "script", "min": 1 } },
      "nextScene": "sc_2_3_013"  // Partial Find
    },
    {
      "text": "Give up",
      "nextScene": "sc_2_3_014"  // Lost in Stacks
    }
  ]
}
```

**Pattern 2: Approach Check (OR Logic - Multiple Stats)**
```json
{
  "choices": [
    {
      "text": "Use Script knowledge",
      "condition": { "stat_check": { "stat": "script", "min": 5 } },
      "nextScene": "sc_2_3_020"
    },
    {
      "text": "Use Stage Presence",
      "condition": { "stat_check": { "stat": "stage_presence", "min": 5 } },
      "nextScene": "sc_2_3_021"  // Same outcome, different stat
    },
    {
      "text": "Use Improv",
      "condition": { "stat_check": { "stat": "improv", "min": 5 } },
      "nextScene": "sc_2_3_022"  // Same outcome, different stat
    }
  ]
}
```

**Pattern 3: Combined Check (AND Logic - Multiple Conditions)**
```json
{
  "text": "Access the Sealed Archive",
  "condition": {
    "and": [
      { "has_flag": "QUEST_MISSING_SCRIPT_COMPLETE" },
      { "stat_check": { "stat": "script", "min": 6 } },
      { "faction": { "id": "preservationist", "min": 7 } }
    ]
  },
  "nextScene": "sc_2_3_100"
}
```

**Pattern 4: Sacrifice (Using modify_stat with Negative Value)**
```json
{
  "text": "Sacrifice Maren to weaken The Editor",
  "condition": { "has_flag": "MAREN_ALLY" },
  "effects": [
    { "remove_flag": "MAREN_ALLY" },
    { "modify_stat": { "stat": "stage_presence", "value": -2 } },
    { "add_flag": "SACRIFICED_MAREN" }
  ],
  "nextScene": "sc_3_4_048"
}
```

**Documentation Deliverables:**
- [ ] Document all stat check patterns in CONTENT_AUTHORING.md
- [ ] Provide scene templates for each pattern
- [ ] Document edge case handling (boundaries, failures)

#### 9.4: Effective Bonuses (Already Implemented)

**Engine Feature:** `Engine.getEffectiveStat()` already combines:
- Base stats from `GameState.stats`
- Item bonuses from `GameState.inventory`
- Faction bonuses from `GameState.factions`

**How It Works:**
```typescript
// This ALREADY EXISTS in engine.ts
getEffectiveStat(statId: string): number {
  let value = this.state.stats[statId] || 0;

  // Add item bonuses
  for (const item of this.state.inventory) {
    const itemData = this.items[item];
    if (itemData.effects?.modify_stat?.stat === statId) {
      value += itemData.effects.modify_stat.value || 0;
    }
  }

  return value;
}
```

**Item with Stat Bonus Example:**
```json
{
  "itemId": "prompters_handbook",
  "name": "Prompter's Handbook",
  "effects": {
    "modify_stat": { "stat": "script", "value": 1 }
  }
}
```

**Documentation Deliverables:**
- [ ] Document getEffectiveStat() behavior in CONTENT_AUTHORING.md
- [ ] List all existing stat-modifying items
- [ ] Provide item template examples

---

### Phase 10: Item System Expansion

#### 10.1: Complete Item Catalog

**Current:** 10 items in content/items.json
**Target:** 40-50 items across all categories

**Item Distribution by Act:**

**Act 1 Items (Current + Additions):**
- Prompter's Handbook ✓ (existing)
- Booth Key ✓ (existing)
- Wings Pass ✓ (existing)
- Rehearsal Candle ✓ (existing)
- Stagehand's Gloves ✓ (existing)
- Genre Compass ✓ (existing)
- Understudy's Mask ✓ (existing)
- **NEW:** Prompter's Signet (key item)
- **NEW:** Threshold Stone (consumable buff)
- **NEW:** Maren's Letter (lore item)

**Act 2 Faction Tokens (Missing):**
- Preservationist Pin (preservationist +1 when equipped)
- Revisionist Pen (revisionist +1 when equipped)
- Exiter's Compass (exiter +1 when equipped)
- Independent's Blank (no faction penalty when equipped)

**Act 2 Archive Artifacts (Missing):**
- First Draft Fragment (clue for discovery chain)
- Understudy's Mirror (reveal NPC intentions)
- Critic's Quill (Archive search +1)
- Author's Margin Notes (lore + revelation hint)
- The Broken Prop (tragic item)
- Sealed Script (locked content key)

**Act 3 Confrontation Items (Missing):**
- Maren's Signet (ally reunion item)
- Director's Trust Seal (ally reunion item)
- CHORUS Key (ally reunion item)
- Conductor's Baton (powerful item)
- Audience Favor (advantage in confrontation)
- Fly System Map (strategic advantage)
- Editor's Original Pen (narrative power)
- Echo of Applause (stat boost)

**Implementation Tasks:**
- [ ] Add 30-40 new items to content/items.json
- [ ] Implement item acquisition scenes for each new item
- [ ] Add item descriptions and flavor text
- [ ] Update TEST_PLAYTHROUGHS.md with item locations

#### 10.2: Inventory Management UI

**Current:** Basic inventory display
**Target:** Enhanced inventory with inspection and organization

**Features:**
- Item inspection (detailed description, lore)
- Item categories filter (Props, Scripts, Tokens, Keys, Artifacts)
- Inventory sorting (name, type, acquisition date)

**Implementation Tasks:**
- [ ] Design inventory screen layout (DOS aesthetic)
- [ ] Implement item detail view
- [ ] Add category filtering UI
- [ ] Add keyboard navigation for inventory

---

## Part III: UI/UX Improvements Roadmap

### Phase 11: DOS UI Enhancement

**DOS Design Philosophy:** The DOS aesthetic is not visual polish—it is the FOUNDATIONAL design language of The Understage. CRT curvature, scanlines, phosphor decay, and command-line metaphors are CORE to the experience, not optional enhancements.

#### 11.1: Visual Polish (HIGH PRIORITY - DOS Foundation)

**Current Achievements:**
- ✓ DOS color scheme (amber/green on black)
- ✓ CRT filter (desktop)
- ✓ Scanline effect
- ✓ Basic typography

**Target Enhancements (DOS Foundation):**

| Feature | Description | Priority | DOS Principle |
|---------|-------------|----------|---------------|
| **CRT Intensity Slider** | 0-100% control of curvature/scanlines | **CRITICAL** | Accessibility compromise |
| **Enhanced CRT** | Curvature effect, screen glow, flicker | **HIGH** | Core DOS aesthetic |
| **Typewriter Effect** | Text character-by-character rendering | **HIGH** | Core DOS metaphor |
| **Boot Sequence** | Fake DOS boot animation on load | Medium | Immersion |
| **Blink Effects** | Critical choices blink (classic DOS) | Medium | Period-accurate |
| **Color Customization** | Theme picker (amber, green, white) | Medium | Hardware variety |
| **Font Options** | DOS font variants (VGA, MDA, CGA) | Low | Hardware accuracy |
| **Border Graphics** | ASCII art borders for scenes | Low | Period-accurate |
| **Sound Visualization** | Waveform or bars during audio | Medium | Audio feedback |

**CRT Intensity Slider (CRITICAL - Accessibility Requirement):**
- **Range:** 0-100%
- **0-20%:** Accessibility mode (minimal effects, WCAG AA compliant)
- **21-50%:** Light DOS (subtle curvature, faint scanlines)
- **51-80%:** Standard DOS (full curvature, visible scanlines)
- **81-100%:** Authentic DOS (heavy curvature, strong flicker, phosphor glow)

**Implementation:** This slider RESOLVES the DOS/aesthetic vs. accessibility tension. Players choose their balance.

**Implementation Tasks:**
- [ ] **IMPLEMENT FIRST:** CRT intensity slider (0-100%) in settings
- [ ] Add typewriter text effect (configurable speed, scene-type aware)
- [ ] Implement CRT curvature shader (variable intensity)
- [ ] Create boot sequence animation (optional skip)
- [ ] Add theme picker UI (amber, green, white with CRT variants)
- [ ] Implement sound visualization canvas
- [ ] Add ASCII art border system

#### 11.2: Scene Presentation

**Current:** Basic text + choices display

**Target:** Enhanced scene presentation with DOS-themed indicators

**Features:**
- Scene title animations (DOS-style reveal)
- Location indicators (breadcrumb navigation: `C:\UNDERSTAGE\ACT1\HUB0`)
- Stat check visualization (show required vs current in DOS format)
- Inventory indicator (key items for current scene)
- Faction alignment display (visual meter)
- Scene transition effects (fade, wipe, dissolve)

**DOS-Themed UI Elements:**
```
C:\UNDERSTAGE\ACT1\HUB0> sc_1_0_001.exe
────────────────────────────────────────────
  THE BOOTH AWAKENS
────────────────────────────────────────────

[STAT] SCRIPT: 4/6  [FACTION] PRESERVATIONIST: 3/10
────────────────────────────────────────────

Your text here...

────────────────────────────────────────────
A) Investigate the prop closet
B) Check the costume rack
C) Exit to the wings
D) View inventory

C:\UNDERSTAGE\ACT1\HUB0> _
```

**Implementation Tasks:**
- [ ] Design scene header component (DOS path format)
- [ ] Implement stat check visual feedback (DOS-style stat display)
- [ ] Add inventory requirement preview
- [ ] Create faction meter UI (progress bar style)
- [ ] Implement multiple transition effects
- [ ] Add scene history navigation (back button)

#### 11.3: Choice Interaction

**Current:** Basic choice list with disabled state

**Target:** Enhanced choice interaction

**Features:**
- Choice hover effects (highlight, sound)
- Choice grouping (related choices visually grouped)
- Choice icons (type indicators: action, dialogue, explore)
- Hidden choices (reveal on condition)
- Timed choices (optional pressure mechanic)
- Choice confirmation (critical choices)

**Implementation Tasks:**
- [ ] Design choice component variations
- [ ] Implement choice type icons
- [ ] Add choice grouping logic
- [ ] Implement hidden choice system
- [ ] Add optional timed choice mechanic
- [ ] Create choice confirmation dialog

#### 11.4: Accessibility Improvements

**Current:** Basic accessibility (keyboard, reduced-motion)

**Target:** WCAG 2.1 AA Compliance

**Enhancements:**
- Screen reader optimization (ARIA labels)
- High contrast mode (enhanced)
- Text scaling (200% zoom support)
- Colorblind mode (pattern indicators)
- Full keyboard navigation (all UI)
- Audio captioning (text alternative)
- Save/load without localStorage (file download)

**Implementation Tasks:**
- [ ] Conduct accessibility audit
- [ ] Add ARIA labels to all interactive elements
- [ ] Implement high contrast theme
- [ ] Test with 200% text zoom
- [ ] Add colorblind mode patterns
- [ ] Implement file-based save/load (not localStorage)
- [ ] Add audio captioning system

---

### Phase 12: Audio & Visual Polish

**IMPORTANT:** Asset standards should be defined BEFORE content expansion (Phase 6-8) completes, so content authors know what assets to plan for.

#### 12.1: Sound Design

**Current:** Basic SFX (choice, scene load, save, load, error)

**Target:** Complete audio ecosystem

**Sound Categories:**

**Ambient Sounds:**
- The Prompter's Booth: Quiet hum, distant theater sounds
- The Wings: Wind echoes, footsteps, creaking
- The Threshold Stage: Dramatic silence, occasional whispers
- The Green Room: Muffled conversations, clinking glasses
- The Archives: Paper rustles, dust settling
- The Mainstage: Vast echo, audience presence

**Music:**
- Main menu: Atmospheric, mysterious
- Act 1: Tense, discovery theme
- Act 2: Political, faction themes
- Act 3: Epic, confrontation theme
- Endings: Unique theme per ending (5 themes)

**Sound Effects:**
- Stat checks: Dramatic sound for check, success/fail feedback
- Item acquisition: Magical/technological chime
- Flag changes: Subtle confirmation sound
- NPC interactions: Character-specific sounds
- Transitions: Scene-specific whoosh/fade
- Choices: Hover, select, confirm sounds

**DOS Audio Fidelity Constraint:**
To maintain DOS-era aesthetic, audio should use lower-fidelity formats:
- **Bit depth:** 8-bit (authentic) or 16-bit (modern)
- **Sample rate:** 11kHz (authentic), 22kHz (balanced), or 44kHz (modern)
- **Format:** OGG Vorbis (web-optimized) or MP3 (fallback)

**Implementation Tasks:**
- [ ] Create audio asset list (50-100 sounds)
- [ ] Source or create audio files (respecting DOS fidelity constraints)
- [ ] Implement audio zone system (location-based ambient)
- [ ] Add music transitions (crossfade between scenes)
- [ ] Implement dynamic music intensity (based on drama)
- [ ] Add sound settings UI (master, music, SFX, mute)
- [ ] Implement audio preloading (smooth playback)

#### 12.2: Visual Effects

**Current:** CRT filter, fade transitions

**Target:** Enhanced visual polish

**Effects to Implement:**

**Scene Effects:**
- Scene-specific overlays (fog for The Stacks, glow for Mainstage)
- Particle effects (dust motes in Archives, sparkles on magic)
- Lighting effects (flickering for horror moments, bright for revelation)
- Screen effects (shake for dramatic moments, vignette for focus)

**Stat Check Visualization:**
- Animated stat bar during check
- Success/fail visual pop
- Stat change notification (+/- indicators)

**Choice Feedback:**
- Selection pulse animation
- Disabled choice gray-out with explanation
- Consequence preview (subtle hint at consequences)

**Ending Screens:**
- Unique visual treatment per ending
- Credits sequence with contributor list
- "The End" animation
- Ending statistics display (time, choices, stats)

**Implementation Tasks:**
- [ ] Design scene overlay system
- [ ] Implement particle effect engine
- [ ] Create lighting effect system
- [ ] Add screen shake and vignette effects
- [ ] Design ending screen templates
- [ ] Implement statistics display
- [ ] Optimize effects for performance

#### 12.3: Graphics & Assets (WITH STANDARDS)

**Current:** Text-based interface

**Target:** Enhanced visual elements

**DOS-ERA ASSET STANDARDS (CRITICAL):**

To maintain DOS aesthetic authenticity AND ensure web performance:

| Asset Type | Format | Resolution | Max Size | Fidelity Constraint |
|------------|--------|------------|----------|-------------------|
| **Location Backgrounds** | WebP (primary), PNG (fallback) | 640x480 (SVGA) or 320x200 (VGA) | 200KB | 8-bit color palette or reduced |
| **Item Icons** | WebP (primary), PNG (fallback) | 32x32 or 64x64 | 10KB | Pixel art style |
| **Faction Emblems** | SVG (scalable) or PNG | 128x128 | 20KB | 2-3 color palette |
| **UI Borders/Decorations** | CSS (preferred) or SVG | N/A | N/A | ASCII art style |
| **Title Screen** | WebP | 640x480 | 300KB | Pixel art or reduced color |

**Audio Asset Standards:**

| Audio Type | Format | Bit Depth | Sample Rate | Max Size | Fidelity |
|------------|--------|-----------|-------------|----------|----------|
| **Ambient Loops** | OGG | 8-bit | 11kHz | 100KB | Low (authentic DOS) |
| **Music Tracks** | OGG | 16-bit | 22kHz | 500KB | Medium |
| **SFX (Short)** | OGG | 8-bit | 11kHz | 20KB | Low (retro feel) |
| **SFX (Long)** | OGG | 16-bit | 22kHz | 100KB | Medium |

**Assets to Create:**

**UI Graphics:**
- Scene background images (one per major location): 15-20 images
- Item icons (pixel art style for DOS aesthetic): 40-50 icons
- Faction icons/emblems: 4 emblems
- NPC portraits (optional, could be silhouettes): 5-10 portraits
- UI element borders and decorations: CSS-based (preferred)
- Choice type icons: 3-5 icons

**Logo & Branding:**
- Main title screen graphic: 1 image
- Loading screen image: 1 image
- Icon for browser tab: 1 icon (SVG)
- Promo art (for marketing): 1-3 images

**Implementation Tasks:**
- [ ] **DO FIRST:** Create DOS_ASSET_STANDARDS.md document with above specifications
- [ ] Commission or create 15-20 location backgrounds (per standards)
- [ ] Create 40-50 item icons (per standards)
- [ ] Design faction emblems (4)
- [ ] Create NPC portraits or silhouettes (5-10)
- [ ] Design title screen graphic
- [ ] Optimize images for web (WebP format, lazy loading)

---

## Part IV: Technical Infrastructure

### Phase 13: Save System Enhancement

#### 13.1: Save Format Migration

**Issue:** See Issue #237 - Save format migration support for version compatibility

**Implementation:**
```typescript
interface SaveMigration {
  fromVersion: string;
  toVersion: string;
  migrate: (state: GameState) => GameState;
}

const migrations: SaveMigration[] = [
  {
    fromVersion: "1.0.0",
    toVersion: "2.0.0",
    migrate: (state) => {
      // Add new fields for quest system
      return {
        ...state,
        quests: state.quests || {},
        npcRelationships: state.npcRelationships || new Map(),
        effectiveBonuses: state.effectiveBonuses || []
      };
    }
  }
];
```

**Implementation Tasks:**
- [ ] Design migration path format
- [ ] Implement migrateSaveState() function
- [ ] Add migrations for v1.0.0 → v2.0.0
- [ ] Update Engine.loadState() to run migration
- [ ] Add migration tests
- [ ] Document migration process in SAVE_FORMAT.md

#### 13.2: Save Management Features

**Current:** Export/import save as file

**Target:** Enhanced save management

**Features:**
- Multiple save slots (3-5 slots)
- Auto-save (every scene transition)
- Quick-save (F5 key) and Quick-load (F9 key)
- Save notes (player can add description)
- Save metadata (timestamp, playtime, location)
- Save deletion with confirmation
- Cloud save support (optional, via browser API)

**Implementation Tasks:**
- [ ] Implement save slot system
- [ ] Add auto-save logic
- [ ] Implement quick-save/load keys
- [ ] Create save management UI
- [ ] Add save notes field
- [ ] Implement save deletion
- [ ] Add cloud save integration (optional)

---

### Phase 14: Testing & Quality Assurance

#### 14.1: Automated Testing

**Current:** 206 tests covering engine, content, playthroughs

**Target:** 500+ tests with comprehensive coverage

**Test Categories to Add:**

**Content Expansion Tests:**
- [ ] Quest system tests (hook, stage, completion)
- [ ] NPC relationship tests (trust levels, flags)
- [ ] Advanced stat check tests (archive search, opposed, sacrifice)
- [ ] Discovery chain tests (clue tracking, revelation variants)
- [ ] Ending quality tier tests (perfect/good/other paths)

**UI/UX Tests:**
- [ ] Component tests (typewriter effect, CRT enhancements)
- [ ] Accessibility tests (screen reader, keyboard navigation)
- [ ] Audio system tests (zones, transitions, settings)
- [ ] Visual effect tests (overlays, particles, lighting)

**Integration Tests:**
- [ ] Full playthrough tests (each quality tier variant)
- [ ] Save/load regression tests (all migration paths)
- [ ] Performance tests (all scenes loaded)
- [ ] Cross-browser tests (Chrome, Firefox, Safari, Edge)

**Implementation Tasks:**
- [ ] Create test plan for Phase 6-14 features
- [ ] Write 300+ new tests
- [ ] Set up CI pipeline for automated testing
- [ ] Add code coverage reporting (target: 90%+)
- [ ] Implement visual regression testing

#### 14.2: Manual Testing

**Test Matrices:**

**Ending Reachability Matrix:**
- [ ] All 5 endings × 3 quality tiers = 15 ending tests
- [ ] Test each ending from clean save
- [ ] Test each ending from mid-game load

**Stat Distribution Matrix:**
- [ ] Test all stat distributions (Script/Stage Presence/Improv variations)
- [ ] Test min-max builds (1-1-4, 4-1-1, etc.)
- [ ] Test balanced builds (2-2-2, 3-3-0, etc.)

**Browser Compatibility Matrix:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest macOS/iOS)
- [ ] Edge (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Android)

**Accessibility Testing:**
- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Keyboard-only navigation
- [ ] High contrast mode
- [ ] 200% text zoom
- [ ] Colorblind simulation

**Implementation Tasks:**
- [ ] Create manual testing checklist
- [ ] Recruit beta testers (if possible)
- [ ] Set up bug tracking system
- [ ] Create testing environment (local dev server)
- [ ] Document test results

---

### Phase 15: Performance Optimization

#### 15.1: Performance Targets

| Metric | Current (v1.0.0) | Target (v2.0.0) |
|--------|------------------|-----------------|
| Scene Load Time | ~0.8ms | <5ms (with more content) |
| Choice Selection | ~0.1ms | <1ms |
| Save/Write | ~0.3ms | <2ms (larger state) |
| Load/Deserialize | ~0.1ms | <1ms |
| Full Playthrough | ~1-2s | <10s (5x longer game) |
| Initial Load | ~1s | <3s |
| Memory Footprint | ~5MB | <20MB |

#### 15.2: Optimization Strategies

**Content Optimization:**
- Lazy load scene files (load on demand)
- Compress content files (gzip/brotli)
- Cache loaded scenes in memory
- Implement scene preloading (predicted paths)

**Asset Optimization:**
- Optimize images (WebP, progressive loading)
- Compress audio files (MP3/OGG with quality settings)
- Implement audio streaming (for long tracks)
- Lazy load assets by scene

**Code Optimization:**
- Code splitting (load engine separately from content)
- Minify JavaScript for production
- Tree-shaking (remove unused code)
- Debounce/throttle expensive operations

**Implementation Tasks:**
- [ ] Profile current performance
- [ ] Implement lazy loading for scenes
- [ ] Add content compression
- [ ] Optimize images and audio
- [ ] Implement code splitting
- [ ] Add performance monitoring
- [ ] Create performance regression tests

---

## Part V: Documentation & Release

### Phase 16: Documentation

#### 16.1: Player Documentation

**Documents to Create:**
- [ ] **User Manual** (PDF and in-game help)
  - Game rules and mechanics
  - Stat system explanation
  - Faction guide
  - Item catalog
  - Ending guide (spoiler-free)

- [ ] **Strategy Guide** (optional, separate)
  - All stat check thresholds
  - All item locations
  - All quest walkthroughs
  - All ending paths (spoilers)

- [ ] **Accessibility Guide**
  - How to use accessibility features
  - Keyboard controls
  - Audio captioning
  - Display settings

#### 16.2: Developer Documentation

**Documents to Create:**
- [ ] **MODDING_GUIDE.md** - How to add custom scenes
- [ ] **CONTENT_AUTHORING.md** - Scene writing best practices
- [ ] **API_REFERENCE.md** - Engine API documentation
- [ ] **CONTRIBUTING.md** - How to contribute to project
- [ ] **ARCHITECTURE.md** - System design overview

#### 16.3: Update Existing Docs

**Documents to Update:**
- [ ] MILESTONES.md - Add Phases 6-16
- [ ] GAME_DESIGN.md - Add new mechanics and items
- [ ] RELEASE_NOTES.md - v2.0.0 release notes
- [ ] STYLE_GUIDE.md - New UI components and patterns

---

### Phase 17: Release Preparation

#### 17.1: Release Checklist

**Pre-Release:**
- [ ] All content scenes implemented (105-145 scenes)
- [ ] All mechanics implemented (quests, NPC relationships, etc.)
- [ ] All UI/UX improvements complete
- [ ] All audio assets integrated
- [ ] All graphics assets integrated
- [ ] All tests passing (500+ tests)
- [ ] Performance benchmarks met
- [ ] Cross-browser testing complete
- [ ] Accessibility audit complete
- [ ] Documentation complete

**Release Candidates:**
- [ ] v2.0.0-rc1 (internal testing)
- [ ] v2.0.0-rc2 (beta testing)
- [ ] v2.0.0-rc3 (release candidate)
- [ ] v2.0.0 (final release)

#### 17.2: Marketing Materials

**Assets to Create:**
- [ ] Trailer video (30-60 seconds)
- [ ] Screenshots (10-15 images showing UI and content)
- [ ] Promo art (banner, featured image)
- [ ] Press kit (description, features, links)
- [ ] Store page text (itch.io, Steam, etc.)

#### 17.3: Distribution

**Distribution Channels:**
- [ ] GitHub Releases (free download)
- [ ] itch.io (free or paid)
- [ ] Personal website (self-hosted)
- [ ] Steam (if greenlit - requires $100 fee)

**Implementation Tasks:**
- [ ] Create release builds (web, desktop if applicable)
- [ ] Set up distribution channels
- [ ] Create store pages
- [ ] Write marketing copy
- [ ] Schedule release date
- [ ] Prepare launch announcement

---

## Part VI: Timeline & Resource Estimation

### Timeline Overview

| Phase | Description | Dependencies | Status |
|-------|-------------|--------------|--------|
| **Phase 6** | Act 1 Content Enhancement (20 scenes) | None | Ready to start |
| **Phase 6 Test Gate** | Validation before Phase 7 | Phase 6 complete | REQUIRED |
| **Phase 7** | Act 2 Content Expansion (45 scenes) | Phase 6 gate passed | Blocked on Phase 6 |
| **Phase 7 Test Gate** | Validation before Phase 8 | Phase 7 complete | REQUIRED |
| **Phase 8** | Act 3 Content Culmination (30 scenes) | Phase 7 gate passed | Blocked on Phase 7 |
| **Phase 8 Test Gate** | Validation before Phase 11 | Phase 8 complete | REQUIRED |
| **Phase 8.5** | Ending Quality Tier Validation | Phase 8 gate passed | CRITICAL GATE |
| **Phase 9** | Content Authoring Documentation | Phase 8 complete | Documentation |
| **Phase 10** | Item System Expansion (30-40 items) | Phase 9 complete | Unblocked |
| **Phase 11** | UI/UX Improvements (DOS Foundation) | Phase 8.5 complete | Unblocked |
| **Phase 12** | Audio & Visual Polish | Phase 11 complete | Unblocked |
| **Phase 13** | Save System Enhancement | Phase 9 complete | Unblocked |
| **Phase 14** | Testing & QA (500+ tests) | All content phases | Unblocked |
| **Phase 15** | Performance Optimization | Phase 14 complete | Unblocked |
| **Phase 16** | Documentation | All phases | Unblocked |
| **Phase 17** | Release Preparation | Phase 16 complete | Unblocked |

**Timeline Status:** HUMAN CONFIRMED unlimited budget and time. Schedule is open-ended—focused on quality completion rather than deadline pressure.

**Critical Path:** Phase 6 → Gate → Phase 7 → Gate → Phase 8 → Gate → Phase 8.5 → Phase 11+

### Resource Requirements

**Status:** Human confirmed unlimited resources. Budget and personnel constraints removed.

**Scope:** 145 scenes total (111 new scenes), all engine features already exist.

**For Autonomous Agent System (Gang):**
- **agent-a (Integrator):** Coordination, milestone gates, merge decisions, release readiness
- **agent-b (Narrative Mapper):** Content expansion (111 scenes), quest storylines, NPC arcs, ending variants
- **agent-c (Engine Architecture):** Performance optimization only (engine is feature-complete)
- **agent-d (DOS Experience Designer):** UI/UX, CRT intensity slider, audio/visual polish, DOS asset standards
- **agent-e (Validator):** Testing (500+ tests), QA, ending validation, accessibility audit

**Content Distribution (111 new scenes):**
- **Phase 6:** 20 new scenes (Act 1)
- **Phase 7:** 45 new scenes (Act 2)
- **Phase 8:** 30 new scenes (Act 3) + 15 ending variants = 45 scenes
- **Special:** 15 ending quality tier tests + discovery chain tests + archive search tests

**Budget:** Unlimited per human. Asset sourcing (audio, graphics) can use premium services if desired.

---

## Part VII: Success Criteria

### Definition of Done for v2.0.0

**Content Completeness:**
- [ ] 145 scenes implemented (CONFIRMED target)
- [ ] All 5 endings with 3 quality tiers each (15 ending variants)
- [ ] 40-50 items implemented
- [ ] 4 quests implemented using flag system (QUEST_* flags)
- [ ] 5 NPCs with relationship tracks using factions + flags
- [ ] Discovery chain system functional (4-clue investigation)
- [ ] Archive search using existing stat_check (tiered outcomes)
- [ ] NPC sacrifice using modify_stat effect

**Mechanics Completeness (Using Existing Engine Features):**
- [ ] Quest system using flags (already exists: GameState.flags)
- [ ] NPC relationships using factions (already exists: GameState.factions)
- [ ] Advanced stat checks using existing stat_check (already exists)
- [ ] Effective bonuses using getEffectiveStat() (already exists)
- [ ] Save migration system (NEW: Phase 13, Issue #237)

**UI/UX Completeness:**
- [ ] CRT intensity slider (0-100%) for accessibility compromise
- [ ] All UI enhancements implemented (typewriter effect, DOS navigation)
- [ ] Audio ecosystem complete (ambient, music, SFX per DOS standards)
- [ ] Visual effects complete (particles, lighting, overlays)
- [ ] Graphics assets integrated (per DOS_ASSET_STANDARDS.md)
- [ ] WCAG 2.1 AA compliant

**Quality Assurance:**
- [ ] 500+ tests passing (206 current + 300+ new)
- [ ] All 15 ending quality tier tests passing (tests/playthroughs/endings/*.json)
- [ ] Discovery chain regression tests passing (test-discovery-chain-*.json)
- [ ] Archive search boundary tests passing (test-archive-boundary.json)
- [ ] Performance benchmarks met (scene load <5ms, choice <1ms)
- [ ] Cross-browser compatible (Chrome, Firefox, Safari, Edge)
- [ ] Accessibility verified (screen reader, keyboard, high contrast)

**Documentation:**
- [ ] User manual complete
- [ ] CONTENT_AUTHORING.md created (quest/NPC/stat check patterns)
- [ ] DOS_ASSET_STANDARDS.md created (audio/image specifications)
- [ ] Developer documentation complete
- [ ] Release notes drafted

**Release Readiness:**
- [ ] Release builds created
- [ ] Distribution channels set up
- [ ] Marketing materials prepared
- [ ] Launch announcement ready

---

## Appendix A: Scene ID Map Expansion

### New Scene ID Ranges

**Act 1 Expansion:**
- sc_1_0_005-050: Hub 0 additional scenes
- sc_1_1_080-095: Act 1 climax enhancement

**Act 2 Expansion:**
- sc_2_2_021-100: Hub 2 expansion (quests, factions, NPCs)
- sc_2_3_003-101: Hub 3 expansion (discovery, investigation)

**Act 3 Expansion:**
- sc_3_4_002-048: Mainstage expansion (preparation, confrontation)
- sc_3_4_901a-999c: Ending quality variants

---

## Appendix B: Quick Reference Implementation Checklist

### Content Team (agent-b)
- [ ] Write 111 new scenes (20 Act 1 + 45 Act 2 + 46 Act 3 including endings)
- [ ] Create 4 quest storylines using flag system (QUEST_* flags)
- [ ] Design NPC relationship arcs using faction system (factions + flags)
- [ ] Write 15 ending quality variants with proper gates
- [ ] Create item descriptions for 40 items
- [ ] Update TEST_PLAYTHROUGHS.md with all new paths

**Documentation Team (agent-b + agent-a)**
- [ ] Create CONTENT_AUTHORING.md with quest/NPC/stat check patterns
- [ ] Document quest flag conventions (QUEST_<NAME>_<STAGE>)
- [ ] Document NPC-to-faction mapping
- [ ] Document all stat check patterns with examples
- [ ] Create DOS_ASSET_STANDARDS.md (audio/image specifications)

**Tech Team (agent-c)**
- [ ] ~~Implement quest system~~ → USE FLAGS (already exists)
- [ ] ~~Implement NPC relationship system~~ → USE FACTIONS (already exists)
- [ ] ~~Implement advanced stat checks~~ → USE EXISTING stat_check (already exists)
- [ ] Implement save migration (Phase 13, Issue #237)
- [ ] Optimize performance (Phase 15)

**UI/UX Team (agent-d)**
- [ ] IMPLEMENT FIRST: CRT intensity slider (0-100%) for accessibility
- [ ] Design and implement UI enhancements (typewriter effect, DOS path navigation)
- [ ] Create audio system enhancements (zones, transitions)
- [ ] Implement visual effects (particles, lighting, overlays)
- [ ] Integrate graphics assets (per DOS_ASSET_STANDARDS.md)
- [ ] Ensure WCAG 2.1 AA compliance (with CRT intensity compromise)

**QA Team (agent-e)**
- [ ] Write 300+ new tests (15 ending tests + discovery chain tests + archive search tests)
- [ ] Create 15 ending quality tier playthrough tests (tests/playthroughs/endings/*.json)
- [ ] Validate mathematical feasibility of all 15 ending variants
- [ ] Conduct manual testing (all endings, stat distributions, browsers)
- [ ] Perform accessibility audit (screen reader, keyboard, high contrast)
- [ ] Performance benchmarking (scene load, choice selection, save/load)

**Integration Team (agent-a)**
- [ ] Coordinate phases and enforce test gates
- [ ] Manage dependencies (Phase 6 → 7 → 8 → 8.5 → 11+)
- [ ] Prepare release builds
- [ ] Create marketing materials
- [ ] Execute release plan
- [ ] Merge PRs when approved (human or agent consensus)

---

## Conclusion

This roadmap provides a comprehensive path from the current v1.0.0 MVP (34 scenes) to the complete v2.0.0 vision (145 scenes CONFIRMED by human). The roadmap is organized into 17 phases covering content expansion, content authoring patterns, UI/UX improvements, audio/visual polish, and technical infrastructure.

**Key Revisions:**

**v1.0 → v1.1:**
1. **Scope Verified:** Human confirmed 145 scenes total with unlimited budget and time
2. **Engine Status Clarified:** v1.0.0 engine is FEATURE-COMPLETE—all mechanics needed for v2.0.0 already exist
3. **Test Gates Added:** Each content phase (6, 7, 8) has a REQUIRED test gate before proceeding
4. **DOS Design Principles:** CRT intensity slider (0-100%) resolves accessibility vs. aesthetic tension
5. **Ending Validation:** Phase 8.5 added to validate all 15 ending variants are mathematically feasible
6. **Agent Assignments Corrected:** Tech team work reduced (quest/NPC/checks already exist), focus on content

**v1.1 → v1.2:**
1. **Phase 4.5 Added:** DOS Asset Standards Definition - critical prerequisite before content expansion
2. **Asset Standards Detailed:** Full audio/image specifications (8-bit 11kHz OGG, VGA 640x480 WebP, pixel art)
3. **Sourcing Strategy:** Three options documented (free libraries, procedural generation, commission)
4. **Critical Path Updated:** Phase 4.5 now precedes content expansion phases

**The project is well-positioned for expansion with a solid foundation (v1.0.0) that includes:**
- Complete engine architecture (no new features needed for v2.0.0)
- All 5 endings reachable
- Comprehensive testing infrastructure (206 tests)
- DOS-inspired UI aesthetic
- Deterministic state machine

**Critical Path:**
Phase 4.5 (Asset Standards) → Phase 6 → Test Gate → Phase 7 → Test Gate → Phase 8 → Test Gate → Phase 8.5 (Ending Validation) → Phase 11+

**Next Steps:**
1. **Complete Phase 4.5:** Create DOS_ASSET_STANDARDS.md with audio/image specifications
2. **Begin Phase 6:** Act 1 Content Enhancement (20 new scenes)
3. **Enforce Test Gates:** No phase proceeds without gate passage
4. **Create CONTENT_AUTHORING.md:** Document quest/NPC/stat check patterns
5. **Validate Endings:** Phase 8.5 ensures all 15 variants are reachable

---

*This roadmap was originally created by agent-b (Narrative Mapper) and revised by agent-a (Integrator) to address feedback from agents-c, d, and e. It represents the collective vision of the Gang agent system.*

**Document Status:** REVISED v1.1 - Addresses all critical feedback from 4 agents
**Last Updated:** January 4, 2026
