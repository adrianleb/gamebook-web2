/**
 * StatCheckVisualization - Stat check display component
 *
 * Per agent-d (Intent #af3d7379): Visual stat check comparison showing
 * required threshold vs. current player stat in DOS-style format.
 *
 * Features:
 * - Displays stat check requirements (e.g., "Script 3+")
 * - Shows current player stat for comparison
 * - Success/failure visual states
 * - WCAG AA accessible with proper ARIA labels
 *
 * @module ui/stat-check-visualization
 */

import type { Condition, ReadonlyState } from '../engine/types.js';

/**
 * Stat check display data
 */
export interface StatCheckDisplay {
  /** Stat ID (e.g., "script", "stagePresence") */
  statId: string;
  /** Formatted stat name for display */
  statName: string;
  /** Required value */
  requiredValue: number;
  /** Current player stat value */
  currentValue: number;
  /** Comparison operator */
  operator: string;
  /** Whether the check passes (current >= required for gte) */
  passes: boolean;
  /** Display operator symbol */
  operatorSymbol: string;
}

/**
 * StatCheckVisualization - Creates and renders stat check displays
 *
 * @example
 * ```typescript
 * const viz = new StatCheckVisualization();
 * const element = viz.createDisplay(condition, currentState);
 * choiceButton.appendChild(element);
 * ```
 */
export class StatCheckVisualization {
  /**
   * Create a stat check display element.
   *
   * @param condition - Stat check condition
   * @param state - Current game state
   * @returns DOM element or null if not a stat check
   */
  createDisplay(condition: Condition, state: ReadonlyState): HTMLElement | null {
    // Validate condition is a stat check
    if (condition.type !== 'stat' || !condition.stat || condition.value === undefined) {
      return null;
    }

    // Build display data
    const display = this.buildDisplay(condition, state);

    // Create DOM element
    const element = document.createElement('span');
    element.className = 'stat-check-display';
    element.setAttribute('data-test-id', 'stat-check-display');
    element.setAttribute('aria-label', this.buildAriaLabel(display));

    // Icon
    const icon = document.createElement('span');
    icon.className = 'stat-check-icon';
    icon.textContent = display.passes ? '✓' : '?';
    icon.setAttribute('aria-hidden', 'true');
    element.appendChild(icon);

    // Comparison container
    const comparison = document.createElement('span');
    comparison.className = 'stat-check-comparison';
    element.appendChild(comparison);

    // Required value
    const required = document.createElement('span');
    required.className = 'stat-check-value required';
    required.textContent = `${display.statName} ${display.operatorSymbol}${display.requiredValue}`;
    required.setAttribute('aria-label', `Required ${display.statName} ${display.operatorSymbol} ${display.requiredValue}`);
    comparison.appendChild(required);

    // Separator
    const separator = document.createElement('span');
    separator.className = 'stat-check-operator';
    separator.textContent = '|';
    separator.setAttribute('aria-hidden', 'true');
    comparison.appendChild(separator);

    // Current value
    const current = document.createElement('span');
    current.className = `stat-check-value current ${display.passes ? 'success' : 'failure'}`;
    current.textContent = display.currentValue.toString();
    current.setAttribute('aria-label', `Your ${display.statName}: ${display.currentValue}`);
    comparison.appendChild(current);

    return element;
  }

  /**
   * Build stat check display data from condition and state.
   *
   * @param condition - Stat check condition
   * @param state - Current game state
   * @returns Stat check display data
   */
  private buildDisplay(condition: Condition, state: ReadonlyState): StatCheckDisplay {
    const statId = condition.stat!;
    const requiredValue = condition.value!;
    const currentValue = state.stats[statId] ?? 0;
    const operator = condition.operator || 'gte';

    // Format stat name for display
    const statName = this.formatStatName(statId);

    // Format operator symbol
    const operatorSymbol = this.formatOperatorSymbol(operator);

    // Determine if check passes
    const passes = this.evaluateCheck(currentValue, requiredValue, operator);

    return {
      statId,
      statName,
      requiredValue,
      currentValue,
      operator,
      passes,
      operatorSymbol,
    };
  }

  /**
   * Format stat ID for display (e.g., "script" -> "Script").
   *
   * @param statId - Stat identifier
   * @returns Formatted stat name
   */
  private formatStatName(statId: string): string {
    return statId
      .split(/(?=[A-Z])/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format operator symbol for display.
   *
   * @param operator - Comparison operator
   * @returns Display symbol
   */
  private formatOperatorSymbol(operator: string): string {
    switch (operator) {
      case 'gte': return '+';
      case 'lte': return '-';
      case 'eq': return '=';
      case 'gt': return '>';
      case 'lt': return '<';
      default: return '+';
    }
  }

  /**
   * Evaluate if the stat check passes.
   *
   * @param current - Current stat value
   * @param required - Required stat value
   * @param operator - Comparison operator
   * @returns True if check passes
   */
  private evaluateCheck(current: number, required: number, operator: string): boolean {
    switch (operator) {
      case 'gte': return current >= required;
      case 'lte': return current <= required;
      case 'eq': return current === required;
      case 'gt': return current > required;
      case 'lt': return current < required;
      default: return current >= required;
    }
  }

  /**
   * Build ARIA label for accessibility.
   *
   * @param display - Stat check display data
   * @returns ARIA label string
   */
  private buildAriaLabel(display: StatCheckDisplay): string {
    const result = display.passes ? 'passes' : 'fails';
    return `${display.statName} check: ${display.currentValue} ${display.operator} ${display.requiredValue}, ${result}`;
  }
}
