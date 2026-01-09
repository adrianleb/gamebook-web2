/**
 * WCAG 2.0 Contrast Ratio Utilities
 *
 * Provides standardized contrast calculation functions for use in
 * runtime display code, tests, and CI validation.
 *
 * WCAG 2.0 Definitions:
 * @see https://www.w3.org/TR/WCAG20/#relativeluminancedef
 * @see https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 *
 * @module src/ui/utils/contrast
 */

/**
 * RGB color interface.
 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * CSS Color Tokens from shell.css and phase112-styles.css.
 *
 * This is the SINGLE SOURCE OF TRUTH for color values used in:
 * - CI validation (scripts/validate-wcag-contrast.ts)
 * - Test suites (tests/phase11/wcag-css-token-validation.test.ts)
 *
 * IMPORTANT: When adding new CSS color tokens, update this constant.
 * Do NOT duplicate these values elsewhere - import from here instead.
 *
 * Source of truth: src/ui/shell.css:25-39
 */
export const CSS_TOKENS: Record<string, string> = {
  // Background colors
  '--bg-primary': '#000000',
  '--bg-secondary': '#1a1a2e',
  '--bg-tertiary': '#16213e',
  '--bg-highlight': '#0f3460',

  // Text colors
  '--text-primary': '#e8e8e8',
  '--text-secondary': '#a0a0a0',
  '--text-accent': '#ffd700',
  '--text-danger': '#ff6b6b',  // ✅ FIXED - Now passes WCAG AA (4.50:1 on --bg-highlight)
  '--text-info': '#5dade2',

  // Border colors
  '--border-primary': '#4a4a4a',
  '--border-accent': '#ffd700',
  '--border-dim': '#2a2a2a',
  '--border-focus': '#ffff00',

  // Faction colors
  '--faction-preservationist': '#ffd700',
  '--faction-revisor': '#ff4757',
  '--faction-neutral': '#e8e8e8',
} as const;

/**
 * WCAG AA contrast thresholds.
 */
export const WCAG_AA = {
  /** Normal text (< 18px / 14pt): 4.5:1 */
  NORMAL_TEXT: 4.5,
  /** Large text (≥ 18px / 14pt or bold ≥ 14px / 10.5pt): 3:1 */
  LARGE_TEXT: 3.0,
  /** UI components/graphics: 3:1 */
  GRAPHICS: 3.0,
} as const;

/**
 * Parse hex color to RGB.
 *
 * Supports both 3-digit (#fff) and 6-digit (#ffffff) formats.
 *
 * @param hex - Hex color string with or without # prefix
 * @returns RGB object with values 0-255
 * @throws Error if hex format is invalid
 */
export function parseHex(hex: string): RGB {
  const clean = hex.replace('#', '');

  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }

  if (clean.length === 6) {
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  }

  throw new Error(`Invalid hex color format: ${hex}`);
}

/**
 * Calculate relative luminance (WCAG 2.0 definition).
 *
 * Luminance is the relative brightness of any point in a colorspace,
 * normalized to 0 for darkest black and 1 for lightest white.
 *
 * @param rgb - RGB color with values 0-255
 * @returns Relative luminance value between 0 and 1
 *
 * @see https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function relativeLuminance(rgb: RGB): number {
  const { r, g, b } = rgb;

  // Normalize to 0-1 range
  const rsRGB = r / 255;
  const gsRGB = g / 255;
  const bsRGB = b / 255;

  // Apply gamma correction for sRGB colorspace
  const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  // Calculate luminance using sRGB coefficients
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors.
 *
 * Contrast ratio is (L1 + 0.05) / (L2 + 0.05) where L1 is the
 * relative luminance of the lighter color and L2 is the relative
 * luminance of the darker color.
 *
 * Results range from 1:1 (same color) to 21:1 (white on black).
 *
 * @param foreground - Foreground color as hex string
 * @param background - Background color as hex string
 * @returns Contrast ratio (higher = more contrast)
 *
 * @see https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
export function contrastRatio(foreground: string, background: string): number {
  const fg = parseHex(foreground);
  const bg = parseHex(background);

  const fgLum = relativeLuminance(fg);
  const bgLum = relativeLuminance(bg);

  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a color pair meets WCAG AA threshold.
 *
 * @param foreground - Foreground color as hex string
 * @param background - Background color as hex string
 * @param threshold - WCAG AA threshold (4.5 for normal text, 3.0 for large/UI)
 * @returns true if contrast meets or exceeds threshold
 */
export function meetsWCAG_AA(foreground: string, background: string, threshold: number = WCAG_AA.NORMAL_TEXT): boolean {
  return contrastRatio(foreground, background) >= threshold;
}

/**
 * Get the WCAG AA compliance level for a color pair.
 *
 * @param foreground - Foreground color as hex string
 * @param background - Background color as hex string
 * @returns Compliance status object with ratio and pass/fail for each level
 */
export function getWCAGCompliance(foreground: string, background: string): {
  ratio: number;
  normalText: boolean;
  largeText: boolean;
  graphics: boolean;
} {
  const ratio = contrastRatio(foreground, background);
  return {
    ratio,
    normalText: ratio >= WCAG_AA.NORMAL_TEXT,
    largeText: ratio >= WCAG_AA.LARGE_TEXT,
    graphics: ratio >= WCAG_AA.GRAPHICS,
  };
}
