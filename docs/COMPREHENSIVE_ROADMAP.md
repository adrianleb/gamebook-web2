# The Understage - Comprehensive Implementation Roadmap

**Document Version:** 1.0
**Date:** January 4, 2026
**Current Release:** v1.0.0 (MVP - 34 scenes, ~32% of full vision)
**Target:** Complete v2.0.0 (105-145 scenes, 100% of design vision)

---

## Executive Summary

This roadmap documents the complete path from the current v1.0.0 MVP (34 scenes) to the full v2.0.0 implementation (105-145 scenes) as originally envisioned in the design specification. The roadmap covers:

1. **Content Expansion** - 71+ missing scenes across all 3 acts
2. **Mechanics Completion** - Quest system, NPC relationships, advanced stat checks
3. **UI/UX Improvements** - Enhanced DOS aesthetic, animations, visual feedback
4. **Audio & Visual Polish** - Sound design, music, graphics, effects
5. **Technical Infrastructure** - Save migration, testing, performance

**Estimated Timeline:** 6-12 months (depending on team size and resources)

---

## Part I: Content Expansion Roadmap

### Current Status Analysis

| Metric | Current (v1.0.0) | Target (v2.0.0) | Gap |
|--------|------------------|-----------------|-----|
| **Total Scenes** | 34 scenes | 105-145 scenes | ~71-111 scenes |
| **Act 1** | 15 scenes (complete) | 25-35 scenes | ~10-20 scenes |
| **Act 2** | 9 scenes | 50-70 scenes | ~41-61 scenes |
| **Act 3** | 10 scenes | 30-40 scenes | ~20-30 scenes |
| **Endings** | 5 endings (all reachable) | 5 endings with quality tiers | Same endings, deeper content |
| **Playthrough Time** | ~20-30 minutes | ~2-3 hours | 4-6x expansion |
| **Branching Depth** | 2-4 choices per scene | 6-12 choices per scene | 2-3x expansion |

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
- [ ] 10-15 new scene files
- [ ] 5-6 new items added to items.json
- [ ] Act 1 playthrough time expanded to 30-45 minutes
- [ ] All Hub 0 branches have 4-5 scenes each (not 3)
- [ ] At least 3 optional exploration scenes

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

##### Quest System Implementation

**Quest Hook Scenes (The Call Board):**
- sc_2_2_021: "Missing Script" quest (Preservationist)
- sc_2_2_022: "Troubled Actor" quest (Revisionist)
- sc_2_2_023: "Escaped Character" quest (Exiter)
- sc_2_2_024: "Balance of Power" quest (Independent)

**Quest Completion Scenes:**
- sc_2_2_031: Missing Script Resolution (+2 preservationist, item)
- sc_2_2_032: Troubled Actor Resolution (+2 revisionist, item)
- sc_2_2_033: Escaped Character Resolution (+2 exiter, item)
- sc_2_2_034: Balance Resolution (+1 to all factions, independent path)

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

##### NPC Relationship Scenes

**The Director:**
- sc_2_2_080: The Director's Past (backstory)
- sc_2_2_081: Director's Confidence Check (relationship gate)
- sc_2_2_082: Director's Request (quest hook)

**CHORUS (Collective):**
- sc_2_2_090: CHORUS Introduction (mechanic explanation)
- sc_2_2_091: Individual Voice (meet a CHORUS member)
- sc_2_2_092: CHORUS Consensus (group decision mechanic)

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

**Multi-Scene Investigation:**
- sc_2_3_003: The Understudy's Secret (clue 1)
- sc_2_3_004: Draft Fragments (clue 2)
- sc_2_3_005: The Critic's Notes (clue 3)
- sc_2_3_006: Author's Margins (clue 4 - unlocks revelation depth)

**Archive Search Implementation:**
- sc_2_3_011: Deep Find (Script >= 4) - Best discovery
- sc_2_3_012: Standard Search (Script >= 2) - Basic discovery
- sc_2_3_013: Partial Find (Script >= 1) - Fragmented clues
- sc_2_3_014: Lost in Stacks (failed search) - Alternative path

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
- [ ] Quest system implemented (4 quests with hooks and resolutions)
- [ ] Discovery chain system (4-clue investigation)
- [ ] Archive search mechanic (tiered success: Deep/Standard/Partial/Lost)
- [ ] NPC relationship flags (DIRECTOR_CONFIDANT, CHORUS_MEMBER, etc.)
- [ ] 10-15 new items (faction tokens, archive artifacts)
- [ ] Act 2 playthrough time expanded to 60-90 minutes

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

##### Ending Quality Tiers

**Each ending needs 3 quality variants:**

**Ending 1: The Revised Draft (Revisionist)**
- sc_3_4_901a: Perfect (revisionist >= 9 + allies + key items)
- sc_3_4_901b: Good (revisionist >= 7)
- sc_3_4_901c: Other (revisionist >= 5 but < 7)

**Ending 2: The Open Book (Exiter)**
- sc_3_4_902a: Perfect (exiter >= 9 + allies + peaceful resolution)
- sc_3_4_902b: Good (exiter >= 7)
- sc_3_4_902c: Other (exiter >= 5 but < 7)

**Ending 3: The Closed Canon (Preservationist)**
- sc_3_4_903a: Perfect (preservationist >= 9 + complete seal + no casualties)
- sc_3_4_903b: Good (preservationist >= 7)
- sc_3_4_903c: Other (preservationist >= 5 but < 7)

**Ending 4: The Blank Page (Independent)**
- sc_3_4_904a: Perfect (revealedTruth + all factions <= 3 + sacrifice)
- sc_3_4_904b: Good (revealedTruth + balanced factions)
- sc_3_4_904c: Other (revealedTruth only)

**Ending 5: The Eternal Rehearsal**
- sc_3_4_999a: Voluntary Rehearsal (player choice)
- sc_3_4_999b: Failed Challenge (defeated in confrontation)
- sc_3_4_999c: Refused to Choose (indecision)

**Deliverables:**
- [ ] 20-30 new scene files for Act 3
- [ ] Ally reunion system (Maren, Director, CHORUS, Understudy)
- [ ] Multi-stage confrontation (Challenge → Debate → Resolution)
- [ ] NPC sacrifice mechanic implementation
- [ ] Ending quality tiers (Perfect/Good/Other for each ending)
- [ ] 15 new confrontation items
- [ ] Act 3 playthrough time expanded to 30-60 minutes

---

## Part II: Mechanics Completion Roadmap

### Phase 9: Core Systems Implementation

#### 9.1: Quest System

**Data Structure:**
```typescript
interface Quest {
  id: string;
  title: string;
  description: string;
  faction?: FactionId;
  hookScene: string;
  completionScene: string;
  stages: QuestStage[];
  rewards: QuestReward[];
  flags: string[];
}

interface QuestStage {
  id: string;
  description: string;
  condition: Condition;
  effects: Effect[];
}

interface QuestReward {
  type: 'faction' | 'item' | 'flag';
  value: string | number;
}
```

**Implementation Tasks:**
- [ ] Create `content/quests/` directory structure
- [ ] Define 4 Act 2 quests (one per faction + independent)
- [ ] Implement quest tracking in GameState
- [ ] Add quest UI display (active quests, objectives)
- [ ] Add quest completion celebration (audio/visual feedback)

**Quest Content:**
1. **Missing Script** (Preservationist): Recover an abandoned script from The Archives
2. **Troubled Actor** (Revisionist): Help a character rewrite their tragic ending
3. **Escaped Character** (Exiter): Guide a refugee to the Threshold Gate
4. **Balance of Power** (Independent): Mediate a dispute between factions

#### 9.2: NPC Relationship System

**Data Structure:**
```typescript
interface NPCRelationship {
  npcId: string;
  trust: number; // 0-10
  flags: Set<string>;
  met: boolean;
  dialogueUnlocked: string[];
}

interface GameState {
  npcRelationships: Map<string, NPCRelationship>;
}
```

**Relationship Tiers:**
- **0-2:** Stranger (basic dialogue)
- **3-4:** Acquaintance (minor help available)
- **5-6:** Friend (major assistance, quest hooks)
- **7-8:** Ally (combat support, ending bonuses)
- **9-10:** Confidant (intimate knowledge, sacrifice potential)

**NPCs with Relationship Tracks:**
1. **Maren** - Mentor relationship, trust affects Act 3 reunion
2. **The Director** - Professional relationship, affects council access
3. **CHORUS** - Collective relationship, affects group mechanics
4. **The Understudy** - Sympathetic relationship, affects sacrifice option
5. **The Editor** - Antagonistic relationship, affects confrontation difficulty

**Implementation Tasks:**
- [ ] Add npcRelationships to GameState
- [ ] Implement relationship check condition type
- [ ] Add relationship modification effects
- [ ] Create relationship UI (optional visual indicator)
- [ ] Document relationship flags for each NPC

#### 9.3: Advanced Stat Check Types

**Check Types to Implement:**

| Check Type | Description | Example Use |
|------------|-------------|-------------|
| **Approach Check** | OR logic - any stat can pass | Multiple problem-solving options |
| **Combined Check** | AND logic - all stats must pass | Independent path requirements |
| **Universal Check** | Any stat - best stat used | Safety valve for accessibility |
| **Opposed Check** | Player stat vs NPC stat | Social combat, debates |
| **Archive Search** | Tiered success based on Script | Deep/Standard/Partial/Lost |
| **Sacrifice Check** | Stat reduction for narrative gain | Maren sacrifice in Act 3 |
| **Combined Faction+Flag** | Faction >= X AND flag set | Enhanced ending gates |

**Implementation Tasks:**
- [ ] Add new condition types to schema
- [ ] Implement Archive Search with 4-tier outcomes
- [ ] Implement Opposed Check (vs NPC stats defined in NPCs)
- [ ] Implement Sacrifice Check (stat decrease with confirmation)
- [ ] Implement Approach/Universal/Combined checks
- [ ] Update sc_3_4_098 to use Combined Faction+Flag gates

**Example: Archive Search Implementation**
```json
{
  "type": "archive_search",
  "stat": "script",
  "outcomes": [
    {
      "tier": "deep_find",
      "threshold": 4,
      "scene": "sc_2_3_011",
      "description": "You discover the complete truth..."
    },
    {
      "tier": "standard",
      "threshold": 2,
      "scene": "sc_2_3_012",
      "description": "You find useful information..."
    },
    {
      "tier": "partial",
      "threshold": 1,
      "scene": "sc_2_3_013",
      "description": "You find fragments..."
    },
    {
      "tier": "lost",
      "threshold": 0,
      "scene": "sc_2_3_014",
      "description": "The stacks overwhelm you..."
    }
  ]
}
```

#### 9.4: Effective Bonuses System

**Concept:** Temporary stat modifiers from items, flags, or NPC presence

**Data Structure:**
```typescript
interface EffectiveBonus {
  id: string;
  source: 'item' | 'flag' | 'npc';
  stat: StatId;
  value: number;
  duration: 'temporary' | 'scene' | 'permanent';
  condition?: Condition;
}
```

**Bonus Examples:**
- **Maren's Presence:** +1 Stage Presence when Maren is allied
- **Prompter's Handbook:** +1 Script (held item)
- **Director's Trust:** +1 to all stats (flag-based)
- **CHORUS Amplification:** +2 Stage Presence in Act 3 (npc-based)

**Implementation Tasks:**
- [ ] Add effectiveBonuses array to GameState
- [ ] Implement bonus calculation in Engine.getEffectiveStat()
- [ ] Add bonus application/removal in effects
- [ ] Create bonus UI indicators (optional)
- [ ] Document all bonus sources in GAME_DESIGN.md

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
- [ ] Add item usage mechanics (equipable, consumable, plot-critical)
- [ ] Implement item combination effects (Act 3)
- [ ] Add item descriptions and flavor text

#### 10.2: Inventory Management UI

**Current:** Basic inventory display
**Target:** Enhanced inventory with inspection and organization

**Features:**
- Item inspection (detailed description, lore)
- Item categories filter (Props, Scripts, Tokens, Keys, Artifacts)
- Item equip slots (if equipable items implemented)
- Item combination interface (Act 3)
- Inventory sorting (name, type, acquisition date)

**Implementation Tasks:**
- [ ] Design inventory screen layout (DOS aesthetic)
- [ ] Implement item detail view
- [ ] Add category filtering UI
- [ ] Add keyboard navigation for inventory
- [ ] Implement item combination mechanic

---

## Part III: UI/UX Improvements Roadmap

### Phase 11: DOS UI Enhancement

#### 11.1: Visual Polish

**Current Achievements:**
- ✓ DOS color scheme (amber/green on black)
- ✓ CRT filter (desktop)
- ✓ Scanline effect
- ✓ Basic typography

**Target Enhancements:**

| Feature | Description | Priority |
|---------|-------------|----------|
| **Enhanced CRT** | Curvature effect, screen glow, flicker | Medium |
| **Boot Sequence** | Fake DOS boot animation on load | Low |
| **Typewriter Effect** | Text character-by-character rendering | High |
| **Blink Effects** | Critical choices blink (classic DOS) | Medium |
| **Color Customization** | Theme picker (amber, green, white) | Medium |
| **Font Options** | DOS font variants (VGA, MDA, CGA) | Low |
| **Border Graphics** | ASCII art borders for scenes | Low |
| **Sound Visualization** | Waveform or bars during audio | Medium |

**Implementation Tasks:**
- [ ] Add typewriter text effect (configurable speed)
- [ ] Implement CRT curvature shader
- [ ] Create boot sequence animation
- [ ] Add theme picker UI
- [ ] Implement sound visualization canvas
- [ ] Add ASCII art border system

#### 11.2: Scene Presentation

**Current:** Basic text + choices display

**Target:** Enhanced scene presentation

**Features:**
- Scene title animations
- Location indicators (breadcrumb navigation)
- Stat check visualization (show required vs current)
- Inventory indicator (key items for current scene)
- Faction alignment display (visual meter)
- Scene transition effects (fade, wipe, dissolve)

**Implementation Tasks:**
- [ ] Design scene header component
- [ ] Implement stat check visual feedback
- [ ] Add inventory requirement preview
- [ ] Create faction meter UI
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

**Implementation Tasks:**
- [ ] Create audio asset list (50-100 sounds)
- [ ] Source or create audio files
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

#### 12.3: Graphics & Assets

**Current:** Text-based interface

**Target:** Enhanced visual elements

**Assets to Create:**

**UI Graphics:**
- Scene background images (one per major location)
- Item icons (pixel art style for DOS aesthetic)
- Faction icons/emblems
- NPC portraits (optional, could be silhouettes)
- UI element borders and decorations
- Choice type icons

**Logo & Branding:**
- Main title screen graphic
- Loading screen image
- Icon for browser tab
- Promo art (for marketing)

**Implementation Tasks:**
- [ ] Create asset specification (size, style, format)
- [ ] Commission or create 15-20 location backgrounds
- [ ] Create 40-50 item icons
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

| Phase | Description | Estimated Duration | Dependencies |
|-------|-------------|-------------------|--------------|
| **Phase 6** | Act 1 Content Enhancement | 4-6 weeks | None |
| **Phase 7** | Act 2 Content Expansion | 8-12 weeks | Phase 6 |
| **Phase 8** | Act 3 Content Culmination | 6-8 weeks | Phase 7 |
| **Phase 9** | Core Systems (Quest, NPC, Advanced Checks) | 6-8 weeks | Phase 7 |
| **Phase 10** | Item System Expansion | 2-3 weeks | Phase 9 |
| **Phase 11** | UI/UX Improvements | 4-6 weeks | Phase 9 |
| **Phase 12** | Audio & Visual Polish | 6-8 weeks | Phase 11 |
| **Phase 13** | Save System Enhancement | 2-3 weeks | Phase 9 |
| **Phase 14** | Testing & QA | 4-6 weeks | All phases |
| **Phase 15** | Performance Optimization | 2-3 weeks | Phase 14 |
| **Phase 16** | Documentation | 3-4 weeks | All phases |
| **Phase 17** | Release Preparation | 2-3 weeks | Phase 16 |

**Total Estimated Duration:** 6-12 months (depending on team size and parallelization)

### Resource Requirements

**Personnel (for human team):**
- Content Writer (narrative design, scene writing)
- Game Designer (mechanics, systems, balance)
- UI/UX Designer (interface, visuals)
- Audio Designer (sound effects, music)
- Artist (graphics, assets)
- Developer (programming, implementation)
- QA Tester (testing, bug triage)
- Project Manager (coordination, timeline)

**For Autonomous Agent System (Gang):**
- agent-a (Integrator): Coordination, timeline management
- agent-b (Narrative Mapper): Content expansion, scene writing
- agent-c (Engine Architecture): Systems implementation, performance
- agent-d (DOS Experience Designer): UI/UX, audio, visuals
- agent-e (Validator): Testing, QA, validation

**Budget (if outsourcing):**
- Audio assets: $500-2000 (or use free assets)
- Graphics: $500-3000 (or use AI/free assets)
- Marketing: $0-500 (organic or paid ads)
- Distribution fees: $0-100 (Steam fee)
- **Total Estimated:** $1000-6500 (depending on asset sourcing)

---

## Part VII: Success Criteria

### Definition of Done for v2.0.0

**Content Completeness:**
- [ ] 105-145 scenes implemented (target: 120 scenes)
- [ ] All 5 endings with 3 quality tiers each (15 ending variants)
- [ ] 40-50 items implemented
- [ ] 4 quests implemented
- [ ] 5 NPCs with relationship tracks
- [ ] All advanced stat checks implemented

**Mechanics Completeness:**
- [ ] Quest system functional
- [ ] NPC relationship system functional
- [ ] Discovery chain system functional
- [ ] Archive search implemented
- [ ] NPC sacrifice implemented
- [ ] Effective bonuses implemented
- [ ] Save migration functional

**UI/UX Completeness:**
- [ ] All UI enhancements implemented
- [ ] Audio ecosystem complete
- [ ] Visual effects complete
- [ ] Graphics assets integrated
- [ ] WCAG 2.1 AA compliant

**Quality Assurance:**
- [ ] 500+ tests passing
- [ ] Performance benchmarks met
- [ ] Cross-browser compatible
- [ ] Accessibility verified
- [ ] Beta testing complete

**Documentation:**
- [ ] User manual complete
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
- [ ] Write 71-111 new scenes
- [ ] Create 4 quest storylines
- [ ] Design 5 NPC relationship arcs
- [ ] Write 15 ending quality variants
- [ ] Create item descriptions for 40 items

**Tech Team (agent-c)**
- [ ] Implement quest system
- [ ] Implement NPC relationship system
- [ ] Implement advanced stat checks
- [ ] Implement save migration
- [ ] Optimize performance

**UI/UX Team (agent-d)**
- [ ] Design and implement UI enhancements
- [ ] Create audio system enhancements
- [ ] Implement visual effects
- [ ] Integrate graphics assets
- [ ] Ensure accessibility compliance

**QA Team (agent-e)**
- [ ] Write 300+ new tests
- [ ] Conduct manual testing
- [ ] Perform accessibility audit
- [ ] Cross-browser testing
- [ ] Performance benchmarking

**Integration Team (agent-a)**
- [ ] Coordinate phases and timeline
- [ ] Manage dependencies
- [ ] Prepare release builds
- [ ] Create marketing materials
- [ ] Execute release plan

---

## Conclusion

This roadmap provides a comprehensive path from the current v1.0.0 MVP to the complete v2.0.0 vision of The Understage. The roadmap is organized into 17 phases covering content expansion, mechanics completion, UI/UX improvements, audio/visual polish, and technical infrastructure.

The project is well-positioned for expansion with a solid foundation (v1.0.0) that includes:
- Complete engine architecture
- All 5 endings reachable
- Comprehensive testing infrastructure
- DOS-inspired UI aesthetic
- Deterministic state machine

By following this roadmap, the project can achieve the full vision of 105-145 scenes with deep narrative branching, complex mechanics, and polished presentation within 6-12 months.

**Next Steps:**
1. Review and prioritize phases based on resources
2. Assign agents/team members to each phase
3. Establish milestone checkpoints
4. Begin implementation with Phase 6 (Act 1 Enhancement)

---

*This roadmap is maintained by agent-b (Narrative Mapper) and represents the collective vision of the Gang agent system.*

**Document Status:** DRAFT - Ready for review and feedback
**Last Updated:** January 4, 2026
