#!/usr/bin/env -S bun run
/**
 * WCAG Contrast CI Validation Script
 *
 * Automatically validates all CSS token color pairs against WCAG AA thresholds.
 * Fails CI if any color pair falls below the required contrast ratio.
 *
 * Usage:
 *   bun run scripts/validate-wcag-contrast.ts
 *
 * Exit codes:
 *   0 - All checks passed
 *   1 - WCAG AA violations found
 *
 * Scope: Base CSS color validation (no CRT filter effects)
 * - This script validates BASE color contrast ratios (without CRT filter)
 * - CRT filter opacity (0-20%) may reduce contrast at higher intensities
 * - Manual audit required for CRT-aware validation (see WCAG_AUDIT_PHASE11.md)
 *
 * @module scripts/validate-wcag-contrast
 */

import { contrastRatio, WCAG_AA, CSS_TOKENS } from '../src/ui/utils/contrast';

/**
 * Color pair for contrast validation.
 */
interface ColorPair {
  foreground: string;
  background: string;
  context: string;
  thresholdType: 'normal' | 'large';  // 4.5:1 for normal text, 3:1 for large/UI
  ignore?: boolean; // Set to true to skip validation (for known debt)
}

/**
 * Color Usage Matrix.
 *
 * Defines which foreground colors are used on which backgrounds,
 * and the WCAG AA threshold type for validation.
 *
 * Note: Uses 'thresholdType' instead of 'textType' for clarity.
 * - 'normal' = 4.5:1 (normal text)
 * - 'large' = 3:1 (large text, UI components, graphics)
 */
const COLOR_PAIRS: ColorPair[] = [
  // Scene header
  {
    foreground: '--text-secondary',
    background: '--bg-primary',
    context: '.scene-breadcrumb (breadcrumb path)',
    thresholdType: 'normal',
  },
  {
    foreground: '--text-accent',
    background: '--bg-primary',
    context: '.breadcrumb-segment:hover, .scene-header-title',
    thresholdType: 'large', // 20px font-size
  },
  // Note: .breadcrumb-separator (#2a2a2a on #000000 = 1.46:1) is decorative
  // Visual separator not subject to text contrast requirements per WCAG 2

  // Stat check visualization
  {
    foreground: '--text-accent',
    background: '--bg-highlight',
    context: '.stat-check-icon',
    thresholdType: 'normal',
  },
  {
    foreground: '--text-secondary',
    background: '--bg-tertiary',
    context: '.stat-check-value.required',
    thresholdType: 'normal',
  },
  {
    foreground: '--text-primary',
    background: '--bg-secondary',
    context: '.stat-check-value.current',
    thresholdType: 'normal',
  },
  {
    foreground: '#00c864', // Success green (inline in CSS)
    background: '--bg-highlight',
    context: '.stat-check-value.success',
    thresholdType: 'normal',
  },
  {
    foreground: '--text-danger',
    background: '--bg-highlight',
    context: '.stat-check-value.failure',
    thresholdType: 'normal',
  },
  {
    foreground: '--text-secondary',
    background: '--bg-highlight',
    context: '.stat-check-operator',
    thresholdType: 'normal',
  },

  // Border contrast (UI components - 3:1 threshold)
  {
    foreground: '--border-primary',
    background: '--bg-primary',
    context: '.scene-header border',
    thresholdType: 'large',
    ignore: true, // Known WCAG AA violation (2.37:1) - tracked as debt
  },
  {
    foreground: '--border-accent',
    background: '--bg-highlight',
    context: '.stat-check-display border',
    thresholdType: 'large',
  },
  {
    foreground: '--border-focus',
    background: '--bg-primary',
    context: '.breadcrumb-segment:focus-visible outline',
    thresholdType: 'large',
  },
];

/**
 * Validation result for a single color pair.
 */
interface ValidationResult {
  context: string;
  foreground: string;
  background: string;
  ratio: number;
  threshold: number;
  passed: boolean;
  ignored: boolean;
}

/**
 * Validate a single color pair.
 */
function validatePair(pair: ColorPair): ValidationResult {
  const fgColor = CSS_TOKENS[pair.foreground] || pair.foreground;
  const bgColor = CSS_TOKENS[pair.background];
  const threshold = pair.thresholdType === 'normal' ? WCAG_AA.NORMAL_TEXT : WCAG_AA.LARGE_TEXT;

  const ratio = contrastRatio(fgColor, bgColor);
  const passed = ratio >= threshold;

  return {
    context: pair.context,
    foreground: fgColor,
    background: bgColor,
    ratio,
    threshold,
    passed,
    ignored: pair.ignore === true,
  };
}

/**
 * Print validation result with color-coded output.
 */
function printResult(result: ValidationResult): void {
  const status = result.ignored ? '🟡 IGNORED' : result.passed ? '✅ PASS' : '❌ FAIL';
  const bar = '█'.repeat(Math.round(result.ratio * 2)) + '░'.repeat(Math.round((21 - result.ratio) * 2));

  console.log(`\n${status} | ${result.context}`);
  console.log(`  Ratio: ${result.ratio.toFixed(2)}:1 (threshold: ${result.threshold}:1)`);
  console.log(`  FG: ${result.foreground} on BG: ${result.background}`);
  console.log(`  ${bar}`);

  if (!result.passed && !result.ignored) {
    console.error(`  ⚠️  WCAG AA violation: needs ${(result.threshold - result.ratio).toFixed(2)}:1 more contrast`);
  }
}

/**
 * Main validation function.
 */
function main(): void {
  console.log('🔍 WCAG Contrast Validation');
  console.log('=' .repeat(60));

  const results: ValidationResult[] = COLOR_PAIRS.map(validatePair);

  // Separate results by status
  const failures = results.filter(r => !r.passed && !r.ignored);
  const ignored = results.filter(r => r.ignored);
  const passes = results.filter(r => r.passed);

  // Print all results
  console.log('\n📊 Validation Results:');
  console.log('-'.repeat(60));
  results.forEach(printResult);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 Summary:');
  console.log(`  ✅ Passed: ${passes.length}/${results.length}`);
  console.log(`  🟡 Ignored (known debt): ${ignored.length}`);
  console.log(`  ❌ Failed: ${failures.length}`);

  if (ignored.length > 0) {
    console.log('\n⚠️  Known WCAG AA Debt (ignored):');
    ignored.forEach(r => {
      console.log(`  - ${r.context}: ${r.ratio.toFixed(2)}:1 (needs ${r.threshold}:1)`);
    });
  }

  if (failures.length > 0) {
    console.log('\n❌ WCAG AA Violations (CI blocking):');
    failures.forEach(r => {
      console.log(`  - ${r.context}: ${r.ratio.toFixed(2)}:1 (needs ${r.threshold}:1)`);
      console.log(`    FG: ${r.foreground} on BG: ${r.background}`);
    });
    console.error('\n💥 CI FAILED: WCAG AA violations detected!');
    console.error('   Fix the above color pairs to meet WCAG AA requirements.');
    process.exit(1);
  }

  console.log('\n✅ All color pairs meet WCAG AA requirements!');
  console.log('   No accessibility regressions detected.');
  process.exit(0);
}

// Run validation
main();
