# RELEASE_CHECKLIST.md

Pre-release validation checklist for Phase 5 QA & Release.

## Pre-Release Validation

### Functional Requirements

- [ ] **All 5 endings** playtested and verified
  - [ ] Ending 1: Alone (no alliance, low resolve)
  - [ ] Ending 2: The Understudy's Path (alliance with Understudy)
  - [ ] Ending 3: The Director's Favor (high favor, no alliance)
  - [ ] Ending 4: CHORUS Ascendant (high CHORUS stat)
  - [ ] Ending 5: Confrontation Victory (high all stats, alliance)

- [ ] **No softlocks** outside intentional endings
  - [ ] Run `ending-graph.test.ts` - validates no dead ends
  - [ ] Run all 5 ending playthroughs with max choices
  - [ ] Manual spot-check of conditional branches

- [ ] **Save/load regression** tests pass for all hubs
  - [ ] `save-load.test.ts` - 100% pass rate
  - [ ] Forward compatibility: Load Phase 3, Phase 4 saves
  - [ ] Version tagging protocol implemented

- [ ] **Content validation** passes with 0 errors
  - [ ] `content-validation.test.ts` - all scene IDs exist
  - [ ] No broken scene links
  - [ ] All choices valid

### Quality Requirements

- [ ] **No console errors** in any tested path
  - [ ] Run browser DevTools during manual playthrough
  - [ ] CI tests pass (174 tests)

- [ ] **First load completes** in reasonable time
  - [ ] Target: <10 seconds on typical connection
  - [ ] Scene load time: <100ms per scene

- [ ] **Keyboard + mouse navigation** fully functional
  - [ ] Arrow keys navigate choices
  - [ ] Enter confirms selection
  - [ ] Mouse click works on all choices
  - [ ] Focus indicators visible

- [ ] **Audio works** across all browsers tested
  - [ ] Chrome: SFX play on user gesture
  - [ ] Firefox: No autoplay blocking
  - [ ] Safari: Audio context initializes correctly

### Documentation

- [ ] **Release notes drafted**
  - [ ] Version number assigned (e.g., v1.0.0)
  - [ ] Features listed
  - [ ] Known issues documented

- [ ] **Known issues documented** (if any)
  - [ ] Create GitHub Issues for tracking
  - [ ] Severity labels applied
  - [ ] Workarounds documented

- [ ] **GANG.md reflects actual implementation**
  - [ ] Tech stack up to date
  - [ ] Agent roles accurate
  - [ ] Milestones complete

## Cross-Browser Testing Matrix

| Browser | Version | Functional | Audio | Performance | Notes |
|---------|---------|------------|-------|-------------|-------|
| Chrome | Latest | [ ] | [ ] | [ ] | Primary target |
| Firefox | Latest | [ ] | [ ] | [ ] | Secondary target |
| Safari | Latest | [ ] | [ ] | [ ] | macOS/iOS |
| Edge | Latest | [ ] | [ ] | [ ] | Chromium-based |

## Performance Benchmark Verification

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Scene Load Time | <100ms | ___ ms | [ ] |
| Choice Latency | <50ms | ___ ms | [ ] |
| Save/Write Time | <200ms | ___ ms | [ ] |
| Load/Deserialize | <200ms | ___ ms | [ ] |
| Full Playthrough | <5s | ___ s | [ ] |
| Memory Footprint | <50MB | ___ MB | [ ] |

## Build Export Verification

- [ ] **Browser build**: `npm run build` produces `/dist/`
- [ ] **Headless build**: `npm run build:engine` produces CLI
- [ ] **Content files**: Served static, not bundled
- [ ] **Determinism check**: Run playthrough on build vs dev - identical results

## Sign-Off

Before release, ensure:
- [ ] All checkboxes above complete
- [ ] No Critical bugs open
- [ ] At least 2 other agents have reviewed release readiness
- [ ] agent-a (Integrator) gives final approval

---

**Release Status**: ___ DRAFT / APPROVED / RELEASED

Reference: [MILESTONES.md Phase 5](./MILESTONES.md)
