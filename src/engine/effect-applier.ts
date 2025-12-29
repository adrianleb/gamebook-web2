/**
 * Effect Applier
 *
 * Applies effects to game state and emits state change events.
 * Mutates state synchronously and returns events for UI reactivity.
 *
 * Per RFC: All effects are applied synchronously for determinism.
 * Per agent-d: Events include renderScope and urgency.
 * Per agent-e: Checkpoint types for save/load regression.
 */

import type {
  Effect,
  EffectType,
  GameState,
  StateChangeEvent,
  RenderScope,
  RenderUrgency,
  CheckpointType,
  SceneHistoryEntry,
  ItemId,
} from './types.js';

/**
 * Effect applier class.
 * Applies effects to state and returns state change events.
 */
export class EffectApplier {
  /**
   * Apply a single effect to the state.
   * Returns state change event for UI updates.
   *
   * @param effect - Effect to apply
   * @param state - Game state to mutate
   * @param checkpoint - Optional checkpoint type for save/load regression
   * @returns State change event
   */
  apply(
    effect: Effect,
    state: GameState,
    checkpoint?: CheckpointType
  ): StateChangeEvent {
    const timestamp = Date.now();

    switch (effect.type) {
      case 'set-stat':
        return this.applySetStat(effect, state, timestamp, checkpoint);
      case 'modify-stat':
        return this.applyModifyStat(effect, state, timestamp, checkpoint);
      case 'set-flag':
        return this.applySetFlag(effect, state, timestamp, checkpoint);
      case 'clear-flag':
        return this.applyClearFlag(effect, state, timestamp, checkpoint);
      case 'add-item':
        return this.applyAddItem(effect, state, timestamp, checkpoint);
      case 'remove-item':
        return this.applyRemoveItem(effect, state, timestamp, checkpoint);
      case 'goto':
        return this.applyGoto(effect, state, timestamp, checkpoint);
      case 'modify-faction':
        return this.applyModifyFaction(effect, state, timestamp, checkpoint);
      default:
        // Unknown effect type - return no-op event
        return this.createNoOpEvent(effect.type as EffectType, timestamp);
    }
  }

  /**
   * Apply multiple effects in sequence.
   * Returns array of state change events.
   *
   * @param effects - Array of effects to apply
   * @param state - Game state to mutate
   * @param checkpoint - Optional checkpoint type
   * @returns Array of state change events
   */
  applyAll(
    effects: Effect[],
    state: GameState,
    checkpoint?: CheckpointType
  ): StateChangeEvent[] {
    return effects.map(effect => this.apply(effect, state, checkpoint));
  }

  /**
   * Set stat to exact value.
   */
  private applySetStat(
    effect: Effect,
    state: GameState,
    timestamp: number,
    checkpoint?: CheckpointType
  ): StateChangeEvent {
    const { stat, value } = effect;
    if (!stat || value === undefined) {
      return this.createNoOpEvent('set-stat', timestamp);
    }

    const path = `stats.${stat}`;
    const oldValue = state.stats[stat] ?? 0;
    state.stats[stat] = value;

    return {
      type: 'effect-applied',
      path,
      oldValue,
      newValue: value,
      timestamp,
      renderScope: 'status',
      urgency: 'low',
      checkpoint,
    };
  }

  /**
   * Add/subtract from stat value.
   */
  private applyModifyStat(
    effect: Effect,
    state: GameState,
    timestamp: number,
    checkpoint?: CheckpointType
  ): StateChangeEvent {
    const { stat, value } = effect;
    if (!stat || value === undefined) {
      return this.createNoOpEvent('modify-stat', timestamp);
    }

    const path = `stats.${stat}`;
    const oldValue = state.stats[stat] ?? 0;
    state.stats[stat] = oldValue + value;

    return {
      type: 'effect-applied',
      path,
      oldValue,
      newValue: state.stats[stat],
      timestamp,
      renderScope: 'status',
      urgency: 'low',
      checkpoint,
    };
  }

  /**
   * Set a flag to true.
   */
  private applySetFlag(
    effect: Effect,
    state: GameState,
    timestamp: number,
    checkpoint?: CheckpointType
  ): StateChangeEvent {
    const { flag } = effect;
    if (!flag) {
      return this.createNoOpEvent('set-flag', timestamp);
    }

    const path = 'flags';
    const oldValue = state.flags.has(flag);
    state.flags.add(flag);

    return {
      type: 'effect-applied',
      path,
      oldValue: oldValue ? 'set' : 'unset',
      newValue: 'set',
      timestamp,
      renderScope: 'all',
      urgency: 'immediate',
      checkpoint,
    };
  }

  /**
   * Set a flag to false.
   */
  private applyClearFlag(
    effect: Effect,
    state: GameState,
    timestamp: number,
    checkpoint?: CheckpointType
  ): StateChangeEvent {
    const { flag } = effect;
    if (!flag) {
      return this.createNoOpEvent('clear-flag', timestamp);
    }

    const path = 'flags';
    const oldValue = state.flags.has(flag);
    state.flags.delete(flag);

    return {
      type: 'effect-applied',
      path,
      oldValue: oldValue ? 'set' : 'unset',
      newValue: 'unset',
      timestamp,
      renderScope: 'all',
      urgency: 'immediate',
      checkpoint,
    };
  }

  /**
   * Add item(s) to inventory.
   */
  private applyAddItem(
    effect: Effect,
    state: GameState,
    timestamp: number,
    checkpoint?: CheckpointType
  ): StateChangeEvent {
    const { item, count = 1 } = effect;
    if (!item) {
      return this.createNoOpEvent('add-item', timestamp);
    }

    const path = `inventory.${item}`;
    const oldValue = state.inventory.get(item) ?? 0;
    const newValue = oldValue + count;
    state.inventory.set(item, newValue);

    return {
      type: 'effect-applied',
      path,
      oldValue,
      newValue,
      timestamp,
      renderScope: 'inventory',
      urgency: 'immediate',
      checkpoint,
    };
  }

  /**
   * Remove item(s) from inventory.
   * Prevents negative counts - clamps at zero.
   */
  private applyRemoveItem(
    effect: Effect,
    state: GameState,
    timestamp: number,
    checkpoint?: CheckpointType
  ): StateChangeEvent {
    const { item, count = 1 } = effect;
    if (!item) {
      return this.createNoOpEvent('remove-item', timestamp);
    }

    const path = `inventory.${item}`;
    const oldValue = state.inventory.get(item) ?? 0;
    const newValue = Math.max(0, oldValue - count);

    if (newValue === 0) {
      state.inventory.delete(item);
    } else {
      state.inventory.set(item, newValue);
    }

    return {
      type: 'effect-applied',
      path,
      oldValue,
      newValue,
      timestamp,
      renderScope: 'inventory',
      urgency: 'immediate',
      checkpoint,
    };
  }

  /**
   * Apply goto effect (scene transition).
   * Note: Actual transition is handled by Engine.transitionTo().
   * This just returns the event for UI notification.
   */
  private applyGoto(
    effect: Effect,
    state: GameState,
    timestamp: number,
    checkpoint?: CheckpointType
  ): StateChangeEvent {
    const { sceneId } = effect;
    if (!sceneId) {
      return this.createNoOpEvent('goto', timestamp);
    }

    const path = 'currentSceneId';
    const oldValue = state.currentSceneId;

    return {
      type: 'effect-applied',
      path,
      oldValue,
      newValue: sceneId,
      timestamp,
      renderScope: 'scene',
      urgency: 'immediate',
      checkpoint,
    };
  }

  /**
   * Modify faction alignment.
   */
  private applyModifyFaction(
    effect: Effect,
    state: GameState,
    timestamp: number,
    checkpoint?: CheckpointType
  ): StateChangeEvent {
    const { faction, amount = 1 } = effect;
    if (!faction) {
      return this.createNoOpEvent('modify-faction', timestamp);
    }

    const path = `factions.${faction}`;
    const oldValue = state.factions[faction] ?? 0;
    const newValue = Math.max(0, Math.min(10, oldValue + amount)); // Clamp 0-10
    state.factions[faction] = newValue;

    return {
      type: 'effect-applied',
      path,
      oldValue,
      newValue,
      timestamp,
      renderScope: 'status',
      urgency: 'low',
      checkpoint,
    };
  }

  /**
   * Create a no-op event for invalid effects.
   */
  private createNoOpEvent(
    effectType: EffectType,
    timestamp: number
  ): StateChangeEvent {
    return {
      type: 'effect-applied',
      path: 'none',
      oldValue: undefined,
      newValue: undefined,
      timestamp,
      renderScope: 'all',
      urgency: 'low',
    };
  }

  /**
   * Get render scope for effect type.
   * Used by UI to determine which components to repaint.
   */
  getRenderScope(effectType: EffectType): RenderScope {
    switch (effectType) {
      case 'set-stat':
      case 'modify-stat':
      case 'modify-faction':
        return 'status';
      case 'add-item':
      case 'remove-item':
        return 'inventory';
      case 'set-flag':
      case 'clear-flag':
        return 'all';
      case 'goto':
        return 'scene';
    }
  }

  /**
   * Get render urgency for effect type.
   * Used by UI to batch updates appropriately.
   */
  getRenderUrgency(effectType: EffectType): RenderUrgency {
    switch (effectType) {
      case 'set-stat':
      case 'modify-stat':
      case 'modify-faction':
        return 'low';
      case 'set-flag':
      case 'clear-flag':
      case 'add-item':
      case 'remove-item':
      case 'goto':
        return 'immediate';
    }
  }
}

/**
 * Singleton instance for convenient use.
 */
export const effectApplier = new EffectApplier();
