# Phase 11.2 WCAG AA Manual Audit Documentation

**Intent:** #442 - Complete Phase 11.2 definition-of-done gaps
**Author:** agent-a (Integrator/Delivery Lens)
**Date:** 2026-01-07
**Scope:** Phase 11.2 Scene Presentation enhancements (DOS breadcrumb, stat check visualization, transition effects)

## Purpose

Per agent-e's perspective on WCAG AA validation, automated pixel sampling in JSDOM is unreliable for contrast validation. This document provides:

1. **Known WCAG AA violations** identified by CSS token validation tests
2. **Manual audit procedures** for visual contrast verification
3. **Fix recommendations** for identified violations
4. **Tracking information** for accessibility debt

## WCAG AA Requirements Summary

| Text Type | Minimum Contrast Ratio |
|-----------|------------------------|
| Normal text (< 18px / 14pt) | 4.5:1 |
| Large text (≥ 18px / 14pt or bold ≥ 14px / 10.5pt) | 3:1 |
| UI components / Graphics | 3:1 |

## Known WCAG AA Violations

### ~~1. Danger Text on Highlighted Background (3.74:1)~~ **RESOLVED**

**Status:** ✅ **FIXED** - Changed from `#ff4757` to `#ff6b6b` (achieves 4.50:1)

**Previous Issue:**
- **Location:** `.stat-check-value.failure`
- **Color Pair:** `--text-danger` (#ff4757) on `--bg-highlight` (#0f3460)
- **Previous Ratio:** 3.74:1
- **Required:** 4.5:1

**Fix Applied:**
- Changed `--text-danger` from `#ff4757` to `#ff6b6b`
- New contrast ratio: **4.50:1** ✅ (meets WCAG AA)
- CSS Locations:
  - `src/ui/shell.css:25`
  - `src/ui/phase112-styles.css:144-145`

**Note:** PR #447 initially used `#d63031` which regressed to 2.57:1. The correct fix is `#ff6b6b` as recommended in the original WCAG audit.

---

### 2. Scene Header Border on Black Background (2.37:1)

**Location:** `.scene-header` border
**Color Pair:** `--border-primary` (#4a4a4a) on `--bg-primary` (#000000)
**Current Ratio:** 2.37:1
**Required:** 3:1 (UI components)
**Deficit:** 0.63:1 (21% below threshold)

**Impact:** Border may not be clearly visible to users with vision impairments. However, this is a decorative border and the content inside (breadcrumb text, scene title) meets WCAG AA requirements.

**Note:** Per WCAG 2, decorative elements that do not convey information are not subject to contrast requirements. However, if the border is intended to delineate the header area, it should meet the 3:1 threshold.

**Recommended Fixes:**
- **Option A:** Use lighter border `#6a6a6a` or `#808080` (achieves ~3.2:1)
- **Option B:** Remove border entirely (header is already distinct by positioning)
- **Option C:** Accept as-is if border is purely decorative (document in audit)

**CSS Location:** `src/ui/phase112-styles.css:26`

```css
.scene-header {
  border: 2px solid var(--border-primary, #4a4a4a);  /* ← Change this or remove */
}
```

**Test File:** `tests/phase11/wcag-css-token-validation.test.ts:369-374`

---

## Passing Color Combinations (Baseline)

The following Phase 11.2 color combinations meet or exceed WCAG AA requirements:

| Context | Foreground | Background | Ratio | Threshold | Status |
|---------|-----------|------------|-------|-----------|--------|
| Breadcrumb path | `--text-secondary` (#a0a0a0) | `--bg-primary` (#000000) | 8.03:1 | 4.5:1 | ✅ PASS |
| Scene title / breadcrumb hover | `--text-accent` (#ffd700) | `--bg-primary` (#000000) | 14.97:1 | 3:1 (large) | ✅ PASS |
| Stat check icon | `--text-accent` (#ffd700) | `--bg-highlight` (#0f3460) | 9.39:1 | 4.5:1 | ✅ PASS |
| Stat check required | `--text-secondary` (#a0a0a0) | `--bg-tertiary` (#16213e) | 6.61:1 | 4.5:1 | ✅ PASS |
| Stat check current | `--text-primary` (#e8e8e8) | `--bg-secondary` (#1a1a2e) | 13.92:1 | 4.5:1 | ✅ PASS |
| Stat check success | `#00c864` | `--bg-highlight` (#0f3460) | 5.62:1 | 4.5:1 | ✅ PASS |
| Stat check operator | `--text-secondary` (#a0a0a0) | `--bg-highlight` (#0f3460) | 4.78:1 | 4.5:1 | ✅ MARGINAL |
| Focus outline | `--border-focus` (#ffff00) | `--bg-primary` (#000000) | 19.55:1 | 3:1 | ✅ PASS |
| Stat check border | `--border-accent` (#ffd700) | `--bg-highlight` (#0f3460) | 8.91:1 | 3:1 | ✅ PASS |

**Note:** "MARGINAL" indicates the ratio is within 0.5 of the threshold and should be monitored during any CSS changes.

---

## Manual Audit Procedures

### Tools Required

1. **Browser:** Chrome, Firefox, or Safari with DevTools
2. **Contrast Checker:**
   - [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
   - Chrome DevTools Lighthouse accessibility audit
   - axe DevTools extension
3. **Test Devices:** Desktop and mobile (320px - 768px width)

### Procedure

1. **Open the game in a browser**
   - Navigate to any scene with stat checks (e.g., sc_1_0_003)
   - Ensure Phase 11.2 features are visible (breadcrumb, stat checks)

2. **Test danger text contrast**
   - Trigger a stat check failure (use console to modify stats)
   - Use browser DevTools color picker to sample `#ff6b6b` on `#0f3460`
   - Verify contrast ratio is at least 4.5:1

3. **Test border visibility**
   - Inspect the scene header border color
   - Verify the border is distinguishable from the black background
   - If decorative, confirm no information is lost when border is not visible

4. **Test responsive breakpoints**
   - Use DevTools responsive mode (320px, 375px, 414px, 768px)
   - Verify all text remains readable at all sizes
   - Check that touch targets remain 44x44px minimum

### Console Commands for Testing

```javascript
// Trigger a stat check failure
engine.applyEffect({type: 'set-stat', stat: 'stage_presence', value: 0});
// Navigate to a scene with stat checks
engine.loadScene('sc_1_0_003');
```

---

## Automated Test Coverage

The following test file validates CSS token contrast ratios:

**File:** `tests/phase11/wcag-css-token-validation.test.ts`

### Test Suites

1. **CSS Token Definitions** - Validates color parsing and contrast calculation algorithms
2. **WCAG AA Normal Text (4.5:1)** - Validates all text meets 4.5:1 threshold
3. **WCAG AA Large Text (3:1)** - Validates large text meets 3:1 threshold
4. **Critical Color Combinations** - Documents key color pair ratios
5. **Border and UI Component Contrast (3:1)** - Validates UI components
6. **Faction Color Accessibility** - Validates faction colors on backgrounds
7. **Known WCAG AA Baseline Values** - Regression prevention
8. **WCAG AA Violations - Known Debt** - Documents known violations

### Running the Tests

```bash
bun test tests/phase11/wcag-css-token-validation.test.ts
```

---

## Accessibility Debt Tracking

| Violation | Priority | Intent | Status |
|-----------|----------|--------|--------|
| ~~`--text-danger` on `--bg-highlight`~~ | ~~Medium~~ | ~~#442~~ | ✅ **RESOLVED** |
| `--border-primary` on `--bg-primary` | Low | #442 | Open |

**Priority Definitions:**
- **High:** Affects core gameplay, blocks progress
- **Medium:** Affects clarity but doesn't block progress
- **Low:** Decorative or edge case

---

## Recommendations

### Immediate Actions

1. ~~**Fix danger text contrast** (Medium priority)~~ ✅ **COMPLETE**
   - Changed `--text-danger` from `#ff4757` to `#ff6b6b`
   - Automated tests pass (4.50:1 contrast ratio achieved)

2. **Decide on border treatment** (Low priority)
   - Accept as decorative (no fix needed)
   - OR increase border contrast to `#6a6a6a`

### Future Improvements

1. **Add automated visual regression tests** using Playwright
   - Capture screenshots at multiple CRT intensity levels
   - Compare against baseline images
   - Run in CI/CD pipeline

2. ~~**Implement CSS token validation in CI**~~ ✅ **COMPLETE**
   - ~~Fail build if new tokens fall below WCAG AA thresholds~~
   - ~~Pre-commit hook for CSS changes~~

3. **Add user preference for high contrast mode**
   - Respects `prefers-contrast: high` media query (already in CSS)
   - Consider adding a toggle for users who need higher contrast

---

## CI-Level WCAG Contrast Validation

**Status:** ✅ **IMPLEMENTED** (Intent #451)

### Overview

Automated WCAG contrast validation now runs in CI to prevent accessibility regressions. This addresses the learning from PR #447 where a contrast regression was accidentally approved.

### CI Workflow

**File:** `.github/workflows/wcag-contrast.yml`

**Triggers:**
- Pull requests that modify UI files, CSS, or the validation script
- Manual trigger via `workflow_dispatch`
- Daily scheduled run at 00:00 UTC

### Validation Script

**File:** `scripts/validate-wcag-contrast.ts`

**Usage:**
```bash
bun run scripts/validate-wcag-contrast.ts
```

**Exit Codes:**
- `0` - All checks passed
- `1` - WCAG AA violations found (CI fails)

### What Gets Validated

The script validates all Phase 11.2 color pairs from `PHASE112_COLOR_PAIRS`:

1. **Scene header colors** - Breadcrumb path, titles, hover states
2. **Stat check visualization** - Required values, current values, success/failure states
3. **Border and UI components** - Focus outlines, decorative borders

**Known Debt Handling:**

### Ignored Color Pairs (Accessibility Debt)

The following color pairs are marked with `ignore: true` in the CI validation script. These are tracked as known accessibility debt and documented here for transparency:

| Color Pair | Context | Current Ratio | Required Ratio | Why Ignored | Tracking Issue |
|------------|---------|---------------|----------------|-------------|----------------|
| `--border-primary` on `--bg-primary` | `.scene-header` border | 2.37:1 | 3:1 (UI components) | Decorative border - content inside meets WCAG AA | See "Known WCAG AA Violations" section above |

**Why This Is Accepted:**
- The border is decorative and does not convey critical information
- The content within the header (breadcrumb text, scene title) meets WCAG AA requirements
- Per WCAG 2, decorative elements are not subject to contrast requirements if they don't convey information

**Process for Adding New Ignored Pairs:**
1. Document the violation in the "Known WCAG AA Violations" section above
2. Mark with `ignore: true` in `scripts/validate-wcag-contrast.ts`
3. Add entry to this table with justification
4. Create a tracking issue for resolution (if applicable)

**New violations will fail CI** unless documented here with clear justification.

### Shared Utility Module

**File:** `src/ui/utils/contrast.ts`

Extracted WCAG contrast calculation functions for reuse across:
- Runtime display code (potential future use)
- Test suites (`tests/phase11/wcag-css-token-validation.test.ts`)
- CI validation (`scripts/validate-wcag-contrast.ts`)

**Exports:**
- `parseHex()` - Parse hex colors to RGB
- `relativeLuminance()` - Calculate WCAG relative luminance
- `contrastRatio()` - Calculate contrast ratio between two colors
- `meetsWCAG_AA()` - Check if color pair meets threshold
- `getWCAGCompliance()` - Get full compliance status
- `WCAG_AA` - Threshold constants (NORMAL_TEXT: 4.5, LARGE_TEXT: 3.0, GRAPHICS: 3.0)

### How to Add New Color Pairs

1. **Add the color pair** to `COLOR_PAIRS` in `scripts/validate-wcag-contrast.ts`:

```typescript
{
  foreground: '--text-new',
  background: '--bg-highlight',
  context: '.new-component (description)',
  thresholdType: 'normal', // or 'large' for UI components
  // ignore: true, // Set only if tracked as accessibility debt
}
```

2. **Add the token value** to `CSS_TOKENS` in both:
   - `scripts/validate-wcag-contrast.ts`
   - `tests/phase11/wcag-css-token-validation.test.ts`

3. **Run the CI script locally** to verify:
   ```bash
   bun run scripts/validate-wcag-contrast.ts
   ```

4. **Run the test suite** to ensure test coverage:
   ```bash
   bun test tests/phase11/wcag-css-token-validation.test.ts
   ```

### Regression Prevention

This CI validation prevents regressions like PR #447:
- **Before:** Manual review of contrast claims (error-prone)
- **After:** Automated CI check fails on violations (foolproof)

The CI workflow runs on every PR that touches:
- `src/ui/**`
- `shell.css`
- `phase112-styles.css`
- The validation script itself
- The CI workflow file

### Running Locally

**Validate contrast only:**
```bash
bun run scripts/validate-wcag-contrast.ts
```

**Run full WCAG test suite:**
```bash
bun test tests/phase11/wcag-css-token-validation.test.ts
```

**Run all tests:**
```bash
bun test
```

---

## Related Documentation

- **STYLE_GUIDE.md** - Project color system and accessibility guidelines
- **DOS_STYLING_QA.md** - Manual QA procedures for DOS styling
- **tests/phase11/mobile-viewports.test.ts** - Mobile viewport constraint tests
- **tests/phase11/wcag-css-token-validation.test.ts** - Automated CSS token validation

---

## Appendix: CSS Color Tokens Reference

```css
:root {
  /* Backgrounds */
  --bg-primary: #000000;
  --bg-secondary: #1a1a2e;
  --bg-tertiary: #16213e;
  --bg-highlight: #0f3460;

  /* Text */
  --text-primary: #e8e8e8;
  --text-secondary: #a0a0a0;
  --text-accent: #ffd700;
  --text-danger: #ff6b6b;  /* ✅ FIXED - Now passes WCAG AA (4.50:1 on --bg-highlight) */
  --text-info: #5dade2;

  /* Borders */
  --border-primary: #4a4a4a;  /* ← VIOLATION with --bg-primary */
  --border-accent: #ffd700;
  --border-dim: #2a2a2a;
  --border-focus: #ffff00;

  /* Factions */
  --faction-preservationist: #ffd700;
  --faction-revisor: #ff4757;
  --faction-neutral: #e8e8e8;
}
```

---

**End of Document**

🤖 Generated by **agent-a** agent
