/**
 * Condition Evaluator
 *
 * Evaluates conditions against game state deterministically.
 * Pure function - no side effects, no mutations.
 *
 * Per RFC: Supports nested and/or/not for complex logic.
 */

import type {
  Condition,
  ReadonlyState,
  StatOperator,
} from './types.js';

/**
 * Condition evaluator class.
 * All methods are pure - no state mutation.
 */
export class ConditionEvaluator {
  /**
   * Evaluate a condition against the current state.
   * Returns true if condition is satisfied.
   *
   * @param condition - Condition to evaluate
   * @param state - Current game state (read-only)
   * @returns True if condition passes
   */
  evaluate(condition: Condition, state: ReadonlyState): boolean {
    switch (condition.type) {
      case 'stat':
        return this.evaluateStat(condition, state);
      case 'flag':
        return this.evaluateFlag(condition, state);
      case 'item':
        return this.evaluateItem(condition, state);
      case 'faction':
        return this.evaluateFaction(condition, state);
      case 'and':
        return this.evaluateAnd(condition, state);
      case 'or':
        return this.evaluateOr(condition, state);
      case 'not':
        return this.evaluateNot(condition, state);
      default:
        // Unknown condition type - fail safe
        return false;
    }
  }

  /**
   * Evaluate all conditions in an array.
   * Returns true only if ALL conditions pass (AND semantics).
   *
   * @param conditions - Array of conditions to evaluate
   * @param state - Current game state
   * @returns True if all conditions pass
   */
  evaluateAll(conditions: Condition[], state: ReadonlyState): boolean {
    return conditions.every(cond => this.evaluate(cond, state));
  }

  /**
   * Evaluate stat check condition.
   * Compares current stat value against target using operator.
   *
   * Examples:
   * - { type: 'stat', stat: 'courage', operator: 'gte', value: 5 }
   * - { type: 'stat', stat: 'wit', operator: 'lt', value: 10 }
   */
  private evaluateStat(condition: Condition, state: ReadonlyState): boolean {
    if (!condition.stat || condition.operator === undefined || condition.value === undefined) {
      return false;
    }

    const currentValue = state.stats[condition.stat] ?? 0;
    const targetValue = condition.value;

    return this.compareValues(currentValue, targetValue, condition.operator);
  }

  /**
   * Compare two values using the specified operator.
   */
  private compareValues(
    current: number,
    target: number,
    operator: StatOperator
  ): boolean {
    switch (operator) {
      case 'gte':
        return current >= target;
      case 'lte':
        return current <= target;
      case 'eq':
        return current === target;
      case 'gt':
        return current > target;
      case 'lt':
        return current < target;
      default:
        return false;
    }
  }

  /**
   * Evaluate flag check condition.
   * Returns true if flag is set in state.
   *
   * Examples:
   * - { type: 'flag', flag: 'MET_PURSUER' }
   */
  private evaluateFlag(condition: Condition, state: ReadonlyState): boolean {
    if (!condition.flag) {
      return false;
    }
    return state.flags.has(condition.flag);
  }

  /**
   * Evaluate item check condition.
   * Returns true if item is in inventory with sufficient count.
   *
   * Examples:
   * - { type: 'item', item: 'green_room_key' }
   * - { type: 'item', item: 'gold_coin', itemCount: 5 }
   */
  private evaluateItem(condition: Condition, state: ReadonlyState): boolean {
    if (!condition.item) {
      return false;
    }

    const currentCount = state.inventory.get(condition.item) ?? 0;
    const requiredCount = condition.itemCount ?? 1;

    return currentCount >= requiredCount;
  }

  /**
   * Evaluate faction alignment condition.
   * Returns true if faction level meets requirement.
   *
   * Examples:
   * - { type: 'faction', faction: 'preservationist', factionLevel: 7 }
   */
  private evaluateFaction(condition: Condition, state: ReadonlyState): boolean {
    if (!condition.faction || condition.factionLevel === undefined) {
      return false;
    }

    const currentLevel = state.factions[condition.faction] ?? 0;
    return currentLevel >= condition.factionLevel;
  }

  /**
   * Evaluate AND condition (all nested conditions must pass).
   *
   * Examples:
   * - {
   *     type: 'and',
   *     conditions: [
   *       { type: 'stat', stat: 'courage', operator: 'gte', value: 5 },
   *       { type: 'flag', flag: 'HAS_SWORD' }
   *     ]
   *   }
   */
  private evaluateAnd(condition: Condition, state: ReadonlyState): boolean {
    if (!condition.conditions || condition.conditions.length === 0) {
      return true; // Empty AND is vacuously true
    }

    return condition.conditions.every(cond => this.evaluate(cond, state));
  }

  /**
   * Evaluate OR condition (at least one nested condition must pass).
   *
   * Examples:
   * - {
   *     type: 'or',
   *     conditions: [
   *       { type: 'stat', stat: 'courage', operator: 'gte', value: 8 },
   *       { type: 'stat', stat: 'wit', operator: 'gte', value: 8 }
   *     ]
   *   }
   */
  private evaluateOr(condition: Condition, state: ReadonlyState): boolean {
    if (!condition.conditions || condition.conditions.length === 0) {
      return false; // Empty OR is false
    }

    return condition.conditions.some(cond => this.evaluate(cond, state));
  }

  /**
   * Evaluate NOT condition (nested condition must fail).
   *
   * Examples:
   * - { type: 'not', conditions: [{ type: 'flag', flag: 'MET_PURSUER' }] }
   */
  private evaluateNot(condition: Condition, state: ReadonlyState): boolean {
    if (!condition.conditions || condition.conditions.length !== 1) {
      return false; // NOT requires exactly one condition
    }

    return !this.evaluate(condition.conditions[0], state);
  }

  /**
   * Check if a condition references a specific stat.
   * Useful for tracking which stats affect which choices.
   */
  referencesStat(statId: string, condition: Condition): boolean {
    if (condition.type === 'stat' && condition.stat === statId) {
      return true;
    }
    if (condition.conditions) {
      return condition.conditions.some(c => this.referencesStat(statId, c));
    }
    return false;
  }

  /**
   * Check if a condition references a specific flag.
   */
  referencesFlag(flagName: string, condition: Condition): boolean {
    if (condition.type === 'flag' && condition.flag === flagName) {
      return true;
    }
    if (condition.conditions) {
      return condition.conditions.some(c => this.referencesFlag(flagName, c));
    }
    return false;
  }

  /**
   * Check if a condition references a specific item.
   */
  referencesItem(itemId: string, condition: Condition): boolean {
    if (condition.type === 'item' && condition.item === itemId) {
      return true;
    }
    if (condition.conditions) {
      return condition.conditions.some(c => this.referencesItem(itemId, c));
    }
    return false;
  }
}

/**
 * Singleton instance for convenient use.
 * Reusable since evaluator has no internal state.
 */
export const conditionEvaluator = new ConditionEvaluator();
