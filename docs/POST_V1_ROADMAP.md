# POST_V1_ROADMAP.md

Post-v1.0.0 roadmap direction for The Understage gamebook web adaptation.

## Context

**Issue:** Intent #317 identified critical scope mismatch between:
- `MILESTONES.md`: Documents Phases 1-5 only (v1.0.0 release with 34 scenes)
- Active agent work: Expansion content (Act 2 Hub 2 quests, v2.0.0 ending tests)
- Missing documentation: No roadmap exists for Phases 6+

**Team Perspectives Gathered (2026-01-04):**

| Agent | Lens | v1.0.0 Ready? | Key Finding |
|-------|------|---------------|--------------|
| agent-b | Narrative Fidelity | **NO** - Needs Hub density for functional gamebook | Current 34 scenes is spine-only; lacks branch density for replayability |
| agent-c | Engine Architecture | **YES** - Technically complete and ship-ready | Engine overbuilt for current scope; no changes needed for expansion |
| agent-d | DOS Experience | **MIXED** - UI-complete for 34 scenes, needs enhancements for expansion | Current UI sufficient for v1.0.0; expansion requires presentation polish |
| agent-e | QA Validation | **NO** - Phase 5 QA gates blocking | Ending playthroughs, softlock validation, save/load tests not executed |

---

## Decision: v1.0.0 Definition and Post-Release Direction

### v1.0.0 Release Scope

**Definition:** v1.0.0 is the **MVP (Minimum Viable Gamebook)** release.

**Scope:**
- 34 scenes across 3 acts (Acts 1-3 Hub 4 only)
- 5 faction-based endings (single-tier, no quality tiers)
- Core gameplay mechanics: flags, factions, items, stat checks
- DOS-inspired UI with CRT filter and audio system
- 206 passing tests with comprehensive validation

**What v1.0.0 IS:**
- A technically complete, playable gamebook
- ~15-30 minute linear experience with minimal branching
- Full engine implementation with all core systems
- Foundation for expansion content

**What v1.0.0 is NOT:**
- A narratively complete gamebook (lacks Hub density)
- A full 145-scene implementation
- Quality tier ending variants (v2.0.0 content)
- Complete faction system depth

### Release Decision: SHIP v1.0.0 as MVP

**Rationale:**
1. **Engine is complete** (agent-c): No technical blockers
2. **QA gates can be satisfied** (agent-e): Execute remaining validation tests
3. **UI is sufficient** (agent-d): DOS aesthetic implemented, polish tracked as Phase 12
4. **Narrative completeness is a scope question, not a blocker** (agent-b): Ship current content, expand in v1.1.0+

**Definition of Done for v1.0.0:**
- [ ] All 5 ending playthroughs execute successfully (PT-END-001 through PT-END-005)
- [ ] Softlock validation passes (PT-LOCK-001, PT-LOCK-002)
- [ ] Save/load regression tests pass (PT-SL-001, PT-SL-002)
- [ ] Content validation passes with 0 errors
- [ ] Release build export verified

---

## Post-v1.0.0 Roadmap: Phases 6-8

### Phase 6: Act 1 Hub Expansion (Scenes 35-55)

**Goal:** Add branch density to Act 1 Hub 0 for replayability.

**Scope:**
- 21 new scenes expanding Hub 0 (sc_1_0_004-099 range)
- Pursuers branch expansion (sc_1_0_011-099: Stagehand pursuit)
- Researcher branch expansion (sc_1_0_021-099: Archive investigation)
- Negotiator branch expansion (sc_1_0_031-099: Council intrigue)
- Fix Intent #316: Add entry point to Stagehand scenes (sc_1_0_040-042)

**Exit Gate:**
- [ ] Hub 0 has 3+ non-dead-end exits from opening scene
- [ ] All 3 branches have 5-7 scene depth before convergence
- [ ] Content validation passes with no unreachable scenes

**Owner:** agent-b (Narrative Mapper)

---

### Phase 7: Act 2 Hub Expansion (Scenes 56-100)

**Goal:** Expand Act 2 Hubs 2 and 3 with quest systems and faction content.

**Scope:**
- **Hub 2 Expansion (The Green Room):** 25 new scenes
  - Quest completion content (sc_2_2_031-034 from PR #315 - needs rebase)
  - Preservationist faction scenes (sc_2_2_040-099 from PR #319)
  - Revisionist faction scenes (sc_2_2_050-099)
  - Quest rewards and faction alignment content
- **Hub 3 Expansion (The Archives):** 20 new scenes
  - Exiter faction scenes (sc_2_3_010-099)
  - Alliance system deepening
  - Pre-ending faction checkpoint content

**Exit Gate:**
- [ ] All 4 Act 2 Hub 2 quests have discovery → hook → completion flow
- [ ] Each Hub has 3+ faction-aligned exploration scenes
- [ ] Quest reward items have presentation-layer distinction (Phase 11 follow-up)

**Owner:** agent-b (Narrative Mapper)

**Dependencies:**
- PR #315 must rebased and merged (quest completions)
- PR #319 (Preservationist scenes) to complete
- agent-d presentation enhancements tracked as separate issues

---

### Phase 8: Act 3 Expansion & Quality Tiers (Scenes 101-145)

**Goal:** Complete Act 3 Hubs 1-3 and implement quality tier ending system.

**Scope:**
- **Act 3 Hubs 1-3 (20 scenes):**
  - Hub 1: Mainstage Backstage (preservationist content)
  - Hub 2: Writer's Room (revisionist content)
  - Hub 3: Threshold Gate (exiter content)
  - Establish ally system (MAREN_ALLY, DIRECTOR_CONFIDANT, CHORUS_ALLY flags)
  - Implement casualty tracking (SACRIFICED_* flags, noCasualties mechanic)
- **Quality Tier System (15 ending variants):**
  - Perfect tier: faction >= 9 + allies + noCasualties
  - Good tier: faction >= 7 + key ally
  - Other tier: faction >= 5
  - Endings 4-5 (Independent/Fail) remain single-variant

**Exit Gate:**
- [ ] All 145 scenes implemented and validated
- [ ] Quality tier gates functional (sc_3_4_098 updated with tier conditions)
- [ ] PR #310 ending quality tier tests execute and pass
- [ ] All 15 ending variants reachable

**Owner:** agent-b (Narrative Mapper) with agent-e (QA validation)

**Dependencies:**
- PR #310 schema issue resolved (`verify` action not in headless-schema.json)
- Quality tier mechanics implemented in scene content
- Ending playthrough tests cover all 15 variants

---

## Phase 9: v2.0.0 Release

**Goal:** Full 145-scene gamebook with quality tier endings.

**Scope:**
- Complete narrative with Hub density
- Quality tier ending system (15 variants)
- Full faction alliance system
- Casualty tracking mechanics

**Exit Gate:**
- [ ] All 145 scenes implemented
- [ ] All 15 ending variants validated
- [ ] Full playthrough coverage (PT-END-001 through PT-END-015)
- [ ] Cross-browser testing complete
- [ ] Release build verified

---

## Dependency Sequencing

### Critical Path (Must Complete Sequentially)

```
v1.0.0 Release (Phase 5 completion)
    ↓
Phase 6: Act 1 Hub Expansion (fixes Intent #316)
    ↓
Phase 7: Act 2 Hub Expansion (PR #315, #319)
    ↓
Phase 8: Act 3 Expansion + Quality Tiers (PR #310)
    ↓
v2.0.0 Release (Phase 9)
```

### Parallelizable Work

- **Phase 12 (DOS Asset Polish)** can proceed in parallel with Phases 6-8
  - Audio assets (SFX, music)
  - Background images (VGA-style)
  - CRT filter refinements
- **agent-c engine work** (Issue #237: Save format migration) is non-blocking and can be done anytime
- **agent-d UI enhancements** (quest completion notifications, item display polish) can be tracked as separate issues

---

## Blocking Issues Resolution

### Intent #316: Unreachable Stagehand Scenes

**Blocker:** sc_1_0_040-042 have no entry point

**Resolution:** Add entry point from pursuers branch (sc_1_0_011 or sc_1_0_012) during **Phase 6: Act 1 Hub Expansion**

**Owner:** agent-e (Intent owner) or agent-b (if working Hub 0 expansion)

### PR #310: Ending Quality Tier Tests

**Blocker:** `verify` action not in headless-schema.json

**Options:**
- **Option A (Recommended):** Strip tests to v1.0.0 fidelity (single-tier only), add quality tier generation in Phase 8
- **Option B:** Mark tests as "DO NOT RUN - Phase 8.5 only" with explicit disclaimers
- **Option C:** Add `verify` action to engine (requires agent-c engine work)

**Decision:** **Option A** - Strip to v1.0.0 fidelity for immediate merge, re-add quality tiers when Phase 8 implements content

### PR #315: Act 2 Hub 2 Quest Completions

**Blocker:** Not mergeable (needs rebase by agent-b)

**Resolution:** agent-b rebase PR against latest main, merge as part of **Phase 7: Act 2 Hub Expansion**

**Post-merge follow-ups (non-blocking):**
- Quest completion notification feedback (systemic engine limitation)
- Item display enhancements for consumable/plot-critical indicators (Phase 11-12 UI polish)

---

## QA Testing Strategy Post-v1.0.0

### Phase 6-7: Hub Expansion Testing

**Coverage:**
- Playthrough tests for each Hub branch (PT-H1-001 through PT-H2-003)
- Quest lifecycle tests (discovery → hook → completion)
- Content validation for unreachable scenes

### Phase 8: Quality Tier Validation

**Coverage:**
- All 15 ending variants (PT-END-001-perfect through PT-END-005-other)
- Quality tier mathematical feasibility (faction caps, ally counts, flag exclusivity)
- Ending graph validation for tier gating logic

### Phase 9: v2.0.0 Release Testing

**Coverage:**
- Full 145-scene playthroughs (shortest path and max choices paths)
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Save/load regression across version boundaries
- Performance benchmarks with full content

---

## Version History

| Version | Date | Scope | Scenes |
|---------|------|-------|--------|
| v1.0.0 | TBD | MVP Release (spine-only) | 34 |
| v1.1.0 | TBD | Act 1 Hub Expansion | 55 |
| v1.2.0 | TBD | Act 2 Hub Expansion | 100 |
| v2.0.0 | TBD | Full Gamebook + Quality Tiers | 145 |

---

## Related Documents

- `MILESTONES.md` - Phases 1-5 (v1.0.0) completion status
- `RELEASE_CHECKLIST.md` - v1.0.0 QA gate requirements
- `TEST_PLAYTHROUGHS.md` - Playthrough test specifications
- `docs/GAME_DESIGN.md` - Game mechanics and state variable reference

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-01-04 | agent-a | Initial document - Synthesized team perspectives from Intent #317 |

---

> **agent-a** speaking

## Summary

This document resolves the scope mismatch between MILESTONES.md (v1.0.0 = 34 scenes) and active expansion work (targeting 145 scenes). The decision:

1. **v1.0.0 ships as MVP** - Complete Phase 5 QA gates, release current 34 scenes
2. **Post-v1.0.0 roadmap defined** - Phases 6-8 outline path to full 145-scene gamebook
3. **Blocking issues resolved** - Clear path forward for Intent #316, PR #310, PR #315

**Next Steps:**
- agent-e: Execute remaining Phase 5 QA gates (ending playthroughs, softlock validation)
- agent-b: Rebase PR #315 for Phase 7 inclusion
- agent-e (or agent-b): Resolve PR #310 schema issue (strip to v1.0.0 fidelity)
- agent-a: Update MILESTONES.md with Phase 6-9 definitions after team alignment

---

🤖 Generated by **agent-a** agent
