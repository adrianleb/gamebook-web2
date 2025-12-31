# PHASE_5_QA_PLAN.md

## Overview

Phase 5 QA & Release execution plan for *The Understage* gamebook adaptation.

**Goal**: Full playthrough testing, bug fixes, and final build preparation with comprehensive quality gates.

**Scope**: Execute all playthrough paths from TEST_PLAYTHROUGHS.md, fix softlocks/broken paths/state bugs, performance optimization, and export final build.

---

## QA Execution Strategy

Per agent-e (Validator Lens) and agent-c (Engine Lens) perspectives: **70% automated / 30% manual** testing balance.

### Automation Coverage Matrix

| Area | Coverage | Test Location | Execution |
|------|----------|---------------|-----------|
| **Ending Reachability** | 100% automated | `test-playthroughs/` PT-END-001 through PT-END-005 | Headless runner |
| **State Regression** | 100% automated | `tests/engine/` (174 tests) | Vitest CI |
| **Save/Load** | 100% automated | `tests/engine/save-load.test.ts` | Vitest CI |
| **Softlock Detection** | 90% automated | `tests/engine/ending-graph.test.ts` | Graph analysis |
| **Content Validation** | 100% automated | `tests/engine/content-validation.test.ts` | Schema validator |

**Rationale**: The headless runner (`src/headless.ts`) enables deterministic automated playthrough testing. 22 playthroughs in TEST_PLAYTHROUGHS.md cover all critical paths. Manual testing focuses on qualities automation cannot measure.

### Manual Coverage (30%)

| Category | Focus Areas | Manual Test Plan |
|----------|-------------|------------------|
| **User Experience** | Narrative flow, emotional pacing, prose quality | Play each ending path, assess narrative coherence |
| **Visual Polish** | Font scaling, contrast, mobile edge cases | Test on 1280x720, mobile viewport (375x667) |
| **Audio/Performance** | Frame rate, audio sync, loading pauses | DevTools Performance tab, observe audio on each SFX |
| **Browser Specific** | Cross-browser behaviors | Chrome, Firefox, Safari manual smoke test |

**Exit Gate**: All automated tests pass (174+) + 5 ending playthroughs complete + manual review complete.

---

## Test Coverage Matrix

### Ending Path Validation (100% Automated)

Per agent-c feasibility analysis: Headless runner supports automated ending validation with faction alignment parameterization.

| Ending ID | Playthrough Test | Faction Gate | Editor State | Test File |
|-----------|-----------------|--------------|--------------|-----------|
| sc_3_4_901 | PT-END-001 | revisionist >= 7 | defeated | `test-playthroughs/pt-end-001-revised-draft.json` |
| sc_3_4_902 | PT-END-002 | exiter >= 7 | persuaded | `test-playthroughs/pt-end-002-open-book.json` |
| sc_3_4_903 | PT-END-003 | preservationist >= 7 | defeated | `test-playthroughs/pt-end-003-closed-canon.json` |
| sc_3_4_904 | PT-END-004 | none (independent) | revealedTruth | `test-playthroughs/pt-end-004-blank-page.json` |
| sc_3_4_999 | PT-END-005 | none (fail-state) | none | `test-playthroughs/pt-end-005-eternal-rehearsal.json` |

**Test Execution**:
```bash
# Run all ending playthroughs
npm run test:playthroughs

# Run specific ending
npm run test:playthrough -- PT-END-001
```

**Validation**: Each test verifies state at convergence scene (sc_3_4_098), confirms ending choice enabled, validates ending scene reached.

### Save/Load Regression Tests (100% Automated)

Per agent-c: Save/load correctness is a hard requirement for state machine determinism.

| Test | Coverage | Location |
|------|----------|----------|
| **Scene Transition Save** | Save at each hub, load, verify state | `tests/engine/save-load.test.ts` |
| **Round-Trip Integrity** | Save → load → save → load, verify identical | `tests/engine/save-load.test.ts` |
| **Edge Cases** | Mid-scene, with inventory, with flags, at ending | `tests/engine/save-load.test.ts` |
| **Forward Compatibility** | Load Phase 3, Phase 4 saves into current code | `tests/engine/save-load.test.ts` |

**Version Tagging Protocol**:
```typescript
interface GameState {
  meta: {
    version: string;      // e.g., "5.0.0"
    savedAt: number;      // Unix timestamp
  };
}
```

### Softlock Detection Methodology

Per agent-e recommendation: **Hybrid Graph Analysis + Automated Playthrough + Manual Spot-Check**

| Level | Method | Coverage | Tool |
|-------|--------|----------|------|
| **Primary** | Graph-Based Detection | All scenes | `ending-graph.test.ts` - ReachabilityValidator |
| **Secondary** | Automated Playthrough | 22 playthroughs | Headless runner with max choices |
| **Tertiary** | Manual Spot-Check | Critical junctions | sc_3_4_098, each ending gate |

**Graph Analysis** (Primary):
- Verify every scene has at least one choice that advances (no dead ends)
- Check all ending paths from convergence scene (sc_3_4_098)
- Validate conditional branches don't create unreachable states

**Automated Playthrough** (Secondary):
- Run all 5 ending playthroughs with max choices (not shortest path)
- Verify no state prevents forward progress
- Track visited scenes to detect loops

**Manual Spot-Check** (Tertiary):
- sc_3_4_098 (The Last Curtain Call) - convergence, all ending choices
- Conditional scenes with faction/stat/inventory checks
- Edge cases: minimum stats, empty inventory, all flags false

**Exit Gate**: All 174 tests pass + 5 ending playthroughs complete + no dead-end scenes detected.

### Performance Benchmarking Criteria

Per agent-c: Baseline-first approach - capture metrics in Phase 5, enforce thresholds in future.

| Metric | Target | Test Method | Status |
|--------|--------|-------------|--------|
| Scene Load Time | <100ms | `performance.now()` in SceneLoader | Baseline capture |
| Choice Selection Latency | <50ms | `performance.now()` on click | Baseline capture |
| Save/Write Time | <200ms | `performance.now()` in SaveManager | Baseline capture |
| Load/Deserialize Time | <200ms | `performance.now()` in Engine.loadState | Baseline capture |
| Full Playthrough Time | <5s | Headless runner timing | Baseline capture |
| Memory Footprint | <50MB | Browser memory profiling | Baseline capture |

**Phase 5 Approach**:
1. Capture baseline metrics on current code (no thresholds yet)
2. Document baseline in `tests/engine/performance.test.ts`
3. Future: Use graduated response (<target optimal, 1-2x acceptable, >2x investigate, >5x critical)

**Test Execution**:
```bash
npm run test:performance
```

**Rationale**: Conservative targets (2-10x acceptable thresholds for visual novels). Headless runner is lightweight; browser performance should stay within 2-3x.

---

## Bug Triage Workflow

See `docs/BUG_TRIAGE.md` for complete triage process.

### Severity Classification

| Severity | Description | Response Time | Release Blocker |
|----------|-------------|---------------|-----------------|
| **Critical** | Blocks release or breaks core functionality | Immediate | YES |
| **Warning** | De graded experience but playable | Within 24 hours | NO (if low impact) |
| **Info** | Nice-to-have improvements or edge cases | Best effort | NO |

### Assignment by Agent Specialty

| Agent | Specialty | Bug Types |
|-------|-----------|-----------|
| **agent-e** | Validator | Test failures, validation errors, regression detection, playthrough blockers |
| **agent-b** | Narrative Mapper | Prose inconsistencies, plot holes, character voice issues, broken choices |
| **agent-c** | Runtime Builder | State machine bugs, save/load failures, performance issues, engine errors |
| **agent-d** | DOS Experience Designer | UI rendering, audio problems, accessibility issues, visual polish |
| **agent-a** | Integrator | Milestone questions, dependency issues, release readiness decisions |

### Regression Test Requirements

Per BUG_TRIAGE.md:

| Bug Type | Regression Test Required | Test Location |
|----------|-------------------------|---------------|
| State corruption | Required | `save-load.test.ts` |
| Broken scene link | Required | `content-validation.test.ts` |
| Softlock | Required | `ending-graph.test.ts` or new playthrough |
| UI rendering | Required | Visual snapshot or integration test |
| Audio missing | Best effort | Manual verification |
| Prose typo | Optional | Documentation fix only |

---

## Release Readiness Checklist

See `docs/RELEASE_CHECKLIST.md` for complete pre-release validation.

### Functional Requirements

- [ ] **All 5 endings** playtested and verified (automated playthroughs pass)
- [ ] **No softlocks** outside intentional endings (graph analysis + playthroughs)
- [ ] **Save/load regression** tests pass for all hubs
- [ ] **Content validation** passes with 0 errors

### Quality Requirements

- [ ] **No console errors** in any tested path
- [ ] **First load completes** in reasonable time (<10s on typical connection)
- [ ] **Keyboard + mouse navigation** fully functional
- [ ] **Audio works** across all browsers tested

### Documentation

- [ ] **Release notes drafted** (version number, features, known issues)
- [ ] **Known issues documented** (if any)
- [ ] **GANG.md reflects actual implementation**

### Cross-Browser Testing Matrix

| Browser | Version | Functional | Audio | Performance | Notes |
|---------|---------|------------|-------|-------------|-------|
| Chrome | Latest | [ ] | [ ] | [ ] | Primary target |
| Firefox | Latest | [ ] | [ ] | [ ] | Secondary target |
| Safari | Latest | [ ] | [ ] | [ ] | macOS/iOS |
| Edge | Latest | [ ] | [ ] | [ ] | Chromium-based |

---

## Build Preparation

Per agent-c (Engine Lens) perspective:

### Build Export Process

- **Dual build paths**: `tsc` for Node.js engine (headless CLI), `vite build` for browser UI
- **Content files served static** (not bundled) - critical for fetch() to work
- **Determinism verification**: Release build MUST validate identical behavior across environments

### Environment Parity

- Lock `engines.node` to exact version for release candidates
- Run cross-browser engine tests in CI (Chrome, Firefox, Safari) before release

### Build Commands

```bash
# Browser build
npm run build
# Output: /dist/ directory with bundled assets

# Headless CLI build
npm run build:engine
# Output: /dist/cli/ directory with Node.js executable

# Verify content files
ls content/  # Should be served static, not bundled
```

### Deliverable

Production build in `/dist/` that behaves identically across environments.

---

## Exit Gates

### Phase 5 Exit Gate: Release Ready

**Functional Requirements:**
- [ ] All 5 endings playtested and verified (PT-END-001 through PT-END-005)
- [ ] No softlocks outside intentional endings
- [ ] Save/load regression tests pass for all hubs
- [ ] Content validation passes with 0 errors

**Quality Requirements:**
- [ ] No console errors in any tested path
- [ ] First load completes in reasonable time (<10s on typical connection)
- [ ] Keyboard + mouse navigation fully functional
- [ ] Audio works across all browsers tested

**Documentation:**
- [ ] Release notes drafted
- [ ] Known issues documented (if any)
- [ ] GANG.md reflects actual implementation

---

## References

| Document | Purpose |
|----------|---------|
| `TEST_PLAYTHROUGHS.md` | Canonical playthrough scripts (22 paths) |
| `BUG_TRIAGE.md` | Bug severity classification and agent assignment |
| `RELEASE_CHECKLIST.md` | Pre-release validation checklist |
| `MILESTONES.md` | Phase 5 exit gate requirements |
| `ENDING_VALIDATION.md` | Faction gate and editor state requirements |

---

*Document created by agent-e (Validator) for Phase 5 QA & Release execution.*

*Last updated: 2025-12-31*
