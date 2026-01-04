/**
 * Content Validator
 *
 * Validates manifest and scene data for content integrity.
 * Detects broken links, invalid references, and unreachable scenes.
 *
 * Per RFC: Fail-fast with detailed error reporting for dev strictness.
 */

import type {
  GameManifest,
  SceneData,
  SceneId,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ManifestValidationResult,
  UnreachableScene,
  StatId,
  ItemId,
  FlagName,
} from './types.js';
import { ReachabilityValidator } from './reachability-validator.js';

/**
 * Content validator class.
 * Validates manifest structure and scene integrity.
 */
export class ContentValidator {
  private reachabilityValidator: ReachabilityValidator;

  constructor() {
    this.reachabilityValidator = new ReachabilityValidator();
  }
  /**
   * Validate manifest structure and references.
   *
   * @param manifest - Manifest to validate
   * @returns Validation result with errors and warnings
   */
  validateManifest(manifest: GameManifest): ManifestValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required top-level fields
    if (!manifest.gamebook?.title) {
      errors.push({
        type: 'schema-error',
        message: 'Missing gamebook.title',
      });
    }

    if (!manifest.gamebook?.adaptationVersion) {
      errors.push({
        type: 'schema-error',
        message: 'Missing gamebook.adaptationVersion',
      });
    }

    if (!manifest.startingScene) {
      errors.push({
        type: 'schema-error',
        message: 'Missing startingScene',
      });
    }

    // Validate starting scene exists
    if (manifest.startingScene && !(manifest.startingScene in manifest.sceneIndex)) {
      errors.push({
        type: 'broken-link',
        sceneId: manifest.startingScene,
        message: `Starting scene "${manifest.startingScene}" not found in sceneIndex`,
      });
    }

    // Validate endings reference valid scenes
    for (const ending of manifest.endings) {
      if (!(ending.sceneId in manifest.sceneIndex)) {
        errors.push({
          type: 'broken-link',
          sceneId: ending.sceneId,
          message: `Ending scene "${ending.sceneId}" not found in sceneIndex`,
        });
      }
    }

    // Validate acts structure
    for (const act of manifest.acts) {
      for (const hub of act.hubs) {
        if (hub.convergenceScene && !(hub.convergenceScene in manifest.sceneIndex)) {
          errors.push({
            type: 'broken-link',
            sceneId: hub.convergenceScene,
            message: `Convergence scene "${hub.convergenceScene}" for hub "${hub.title}" not found`,
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate scene structure and references.
   *
   * @param scene - Scene to validate
   * @param manifest - Manifest for reference checking
   * @returns Validation result
   */
  validateScene(scene: SceneData, manifest: GameManifest): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required fields
    if (!scene.id) {
      errors.push({ type: 'schema-error', message: 'Missing scene.id' });
    }

    if (!scene.title) {
      errors.push({ type: 'schema-error', sceneId: scene.id, message: 'Missing scene.title' });
    }

    if (!scene.text) {
      errors.push({ type: 'schema-error', sceneId: scene.id, message: 'Missing scene.text' });
    }

    // Validate choices
    if (!scene.choices || scene.choices.length === 0) {
      warnings.push({
        type: 'unreachable-scene',
        sceneId: scene.id,
        message: 'Scene has no choices (dead end or ending)',
      });
    } else {
      for (let i = 0; i < scene.choices.length; i++) {
        const choice = scene.choices[i];
        const choicePrefix = `Choice ${i} (${choice.label})`;

        if (!choice.label) {
          errors.push({
            type: 'schema-error',
            sceneId: scene.id,
            message: `${choicePrefix}: Missing label`,
          });
        }

        // Check if this is an attemptable stat check (has onSuccess/onFailure)
        const isAttemptable = choice.onSuccess || choice.onFailure;

        if (isAttemptable) {
          // Attemptable stat check: validate onSuccess/onFailure structure

          // choice.to should NOT exist when attemptable (prevents ambiguity)
          if (choice.to) {
            errors.push({
              type: 'schema-error',
              sceneId: scene.id,
              message: `${choicePrefix}: Attemptable choice has 'to' field - use onSuccess.to/onFailure.to instead`,
            });
          }

          // Validate onSuccess branch (required for attemptable)
          if (!choice.onSuccess) {
            errors.push({
              type: 'schema-error',
              sceneId: scene.id,
              message: `${choicePrefix}: Attemptable choice missing 'onSuccess' branch`,
            });
          } else {
            if (!choice.onSuccess.to) {
              errors.push({
                type: 'schema-error',
                sceneId: scene.id,
                message: `${choicePrefix}: onSuccess.to is required for attemptable choices`,
              });
            } else if (!(choice.onSuccess.to in manifest.sceneIndex)) {
              errors.push({
                type: 'broken-link',
                sceneId: scene.id,
                message: `${choicePrefix}: onSuccess.to target "${choice.onSuccess.to}" not found in manifest`,
              });
            }
          }

          // Validate onFailure branch (required for attemptable)
          if (!choice.onFailure) {
            errors.push({
              type: 'schema-error',
              sceneId: scene.id,
              message: `${choicePrefix}: Attemptable choice missing 'onFailure' branch`,
            });
          } else {
            // onFailure must have either 'to' or 'effects' (or both)
            const hasTo = choice.onFailure.to !== undefined;
            const hasEffects = choice.onFailure.effects && choice.onFailure.effects.length > 0;

            if (!hasTo && !hasEffects) {
              errors.push({
                type: 'schema-error',
                sceneId: scene.id,
                message: `${choicePrefix}: onFailure must have either 'to' or 'effects'`,
              });
            } else if (hasTo && !(choice.onFailure.to in manifest.sceneIndex)) {
              errors.push({
                type: 'broken-link',
                sceneId: scene.id,
                message: `${choicePrefix}: onFailure.to target "${choice.onFailure.to}" not found in manifest`,
              });
            }
          }
        } else {
          // Simple choice: require choice.to
          if (!choice.to) {
            errors.push({
              type: 'schema-error',
              sceneId: scene.id,
              message: `${choicePrefix}: Missing target scene`,
            });
          } else if (!(choice.to in manifest.sceneIndex)) {
            errors.push({
              type: 'broken-link',
              sceneId: scene.id,
              message: `${choicePrefix}: Target scene "${choice.to}" not found in manifest`,
            });
          }
        }

        // Validate conditions
        if (choice.conditions) {
          for (const condition of choice.conditions) {
            const conditionErrors = this.validateCondition(condition, scene.id, manifest);
            errors.push(...conditionErrors);
          }
        }
      }
    }

    // Validate effects
    if (scene.effects) {
      for (const effect of scene.effects) {
        const effectErrors = this.validateEffect(effect, scene.id, manifest);
        errors.push(...effectErrors);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate condition structure and references.
   */
  private validateCondition(
    condition: any,
    sceneId: SceneId,
    manifest: GameManifest
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Handle null/undefined conditions
    if (!condition || typeof condition !== 'object') {
      errors.push({
        type: 'schema-error',
        sceneId,
        message: 'Condition must be an object',
      });
      return errors;
    }

    if (!condition.type) {
      errors.push({
        type: 'schema-error',
        sceneId,
        message: 'Condition missing type',
      });
      return errors;
    }

    // Accept both schema-format and runtime-format condition types
    // Schema types (from content files): has_item, stat_check, flag_check, faction_check, NOT, AND, OR, visited, choice_made
    // Runtime types (after SceneLoader normalization): item, stat, flag, faction, not, and, or
    // visited and choice_made are schema-defined but not yet implemented in runtime
    const validSchemaTypes = ['has_item', 'stat_check', 'flag_check', 'faction_check', 'NOT', 'AND', 'OR', 'visited', 'choice_made'];
    const validRuntimeTypes = ['stat', 'flag', 'item', 'faction', 'and', 'or', 'not'];
    const validTypes = [...validSchemaTypes, ...validRuntimeTypes];

    if (!validTypes.includes(condition.type)) {
      errors.push({
        type: 'schema-error',
        sceneId,
        message: `Invalid condition type: ${condition.type}`,
      });
    }

    // Normalize condition type to runtime format for validation logic
    // This handles both schema-format (stat_check, has_item, etc.) and runtime-format (stat, item, etc.)
    const normalizedType = this.normalizeConditionType(condition.type);

    // Validate stat references (will need stats.json when available)
    if (normalizedType === 'stat') {
      const statField = condition.type === 'stat_check' || condition.type === 'stat' ? 'stat' : 'stat';
      if (!condition[statField]) {
        errors.push({
          type: 'invalid-stat',
          sceneId,
          message: 'Stat condition missing stat field',
        });
      }
      if (condition.operator === undefined) {
        errors.push({
          type: 'schema-error',
          sceneId,
          message: 'Stat condition missing operator',
        });
      }
      if (condition.value === undefined) {
        errors.push({
          type: 'schema-error',
          sceneId,
          message: 'Stat condition missing value',
        });
      }
    }

    // Validate flag references
    if (normalizedType === 'flag') {
      const flagField = condition.type === 'flag_check' || condition.type === 'flag' ? 'flag' : 'flag';
      if (!condition[flagField]) {
        errors.push({
          type: 'schema-error',
          sceneId,
          message: 'Flag condition missing flag field',
        });
      }
    }

    // Validate item references (will need items.json when available)
    if (normalizedType === 'item') {
      const itemField = condition.type === 'has_item' || condition.type === 'item' ? 'item' : 'item';
      if (!condition[itemField]) {
        errors.push({
          type: 'invalid-item',
          sceneId,
          message: 'Item condition missing item field',
        });
      }
    }

    // Validate faction references
    if (normalizedType === 'faction') {
      const factionField = condition.type === 'faction_check' || condition.type === 'faction' ? 'faction' : 'faction';
      if (!condition[factionField]) {
        errors.push({
          type: 'schema-error',
          sceneId,
          message: 'Faction condition missing faction field',
        });
      }
    }

    // Validate nested conditions (AND, OR, NOT in schema; and, or, not in runtime)
    if (['and', 'or', 'not', 'AND', 'OR', 'NOT'].includes(condition.type)) {
      if (!condition.conditions || condition.conditions.length === 0) {
        errors.push({
          type: 'schema-error',
          sceneId,
          message: `${condition.type.toUpperCase()} condition must have nested conditions`,
        });
      } else {
        for (const nested of condition.conditions) {
          errors.push(...this.validateCondition(nested, sceneId, manifest));
        }
      }
    }

    // Validate visited condition (schema-defined, not yet implemented)
    if (condition.type === 'visited') {
      if (!condition.sceneId) {
        errors.push({
          type: 'schema-error',
          sceneId,
          message: 'Visited condition missing sceneId field',
        });
      }
    }

    // Validate choice_made condition (schema-defined, not yet implemented)
    if (condition.type === 'choice_made') {
      if (!condition.choiceId) {
        errors.push({
          type: 'schema-error',
          sceneId,
          message: 'choice_made condition missing choiceId field',
        });
      }
    }

    return errors;
  }

  /**
   * Normalize schema-format condition type to runtime format.
   * Matches the normalization logic in SceneLoader.typeMap.
   *
   * @param type - Condition type (schema or runtime format)
   * @returns Normalized runtime type
   */
  private normalizeConditionType(type: string): string {
    const typeMap: Record<string, string> = {
      'has_item': 'item',
      'stat_check': 'stat',
      'flag_check': 'flag',
      'faction_check': 'faction',
      'NOT': 'not',
      'AND': 'and',
      'OR': 'or',
      'visited': 'visited', // Not implemented in runtime yet
      'choice_made': 'choice_made', // Not implemented in runtime yet
    };
    return typeMap[type] || type;
  }

  /**
   * Validate effect structure and references.
   */
  private validateEffect(
    effect: any,
    sceneId: SceneId,
    manifest: GameManifest
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Handle null/undefined effects
    if (!effect || typeof effect !== 'object') {
      errors.push({
        type: 'schema-error',
        sceneId,
        message: 'Effect must be an object',
      });
      return errors;
    }

    if (!effect.type) {
      errors.push({
        type: 'schema-error',
        sceneId,
        message: 'Effect missing type',
      });
      return errors;
    }

    const validTypes = ['set-stat', 'modify-stat', 'set-flag', 'clear-flag', 'add-item', 'remove-item', 'goto', 'modify-faction'];
    if (!validTypes.includes(effect.type)) {
      errors.push({
        type: 'schema-error',
        sceneId,
        message: `Invalid effect type: ${effect.type}`,
      });
    }

    // Validate stat effects
    if (['set-stat', 'modify-stat'].includes(effect.type)) {
      if (!effect.stat) {
        errors.push({
          type: 'invalid-stat',
          sceneId,
          message: `${effect.type} missing stat field`,
        });
      }
      if (effect.value === undefined) {
        errors.push({
          type: 'schema-error',
          sceneId,
          message: `${effect.type} missing value`,
        });
      }
    }

    // Validate flag effects
    if (['set-flag', 'clear-flag'].includes(effect.type)) {
      if (!effect.flag) {
        errors.push({
          type: 'schema-error',
          sceneId,
          message: `${effect.type} missing flag field`,
        });
      }
    }

    // Validate item effects
    if (['add-item', 'remove-item'].includes(effect.type)) {
      if (!effect.item) {
        errors.push({
          type: 'invalid-item',
          sceneId,
          message: `${effect.type} missing item field`,
        });
      }
    }

    // Validate goto effects
    if (effect.type === 'goto') {
      if (!effect.sceneId) {
        errors.push({
          type: 'broken-link',
          sceneId,
          message: 'Goto effect missing sceneId',
        });
      } else if (!(effect.sceneId in manifest.sceneIndex)) {
        errors.push({
          type: 'broken-link',
          sceneId,
          message: `Goto effect target "${effect.sceneId}" not found in manifest`,
        });
      }
    }

    // Validate faction effects
    if (effect.type === 'modify-faction') {
      if (!effect.faction) {
        errors.push({
          type: 'schema-error',
          sceneId,
          message: 'modify-faction missing faction field',
        });
      }
    }

    return errors;
  }

  /**
   * Check for unreachable scenes using graph traversal.
   * Returns scenes that cannot be reached from the starting scene.
   *
   * @param manifest - Manifest to analyze
   * @param scenes - Map of scene ID to scene data (optional, for full analysis)
   * @returns Array of unreachable scenes
   */
  checkReachability(manifest: GameManifest, scenes?: Map<SceneId, SceneData>): UnreachableScene[] {
    if (!scenes) {
      // Without scene data, we can't do reachability analysis
      // Return empty for backward compatibility
      return [];
    }

    const result = this.reachabilityValidator.analyze(manifest, scenes);
    return result.unreachableScenes;
  }

  /**
   * Validate stats reference valid stat IDs from stats.json.
   * Called when stats.json is available.
   *
   * stats.json structure: { stats: [{id, name, ...}, ...] }
   * We extract valid stat IDs from the stats array.
   *
   * @param stats - Loaded stats.json content
   * @param manifest - Game manifest
   * @param scenes - Optional map of loaded scenes for full validation
   * @returns Validation result with stat reference errors
   */
  validateStats(
    stats: Record<string, unknown>,
    manifest: GameManifest,
    scenes?: Map<SceneId, SceneData>
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const validStatIds = new Set<string>();

    // Extract valid stat IDs from stats.json structure
    // stats.json has format: { stats: [{id: "script", ...}, {id: "stage_presence", ...}, ...] }
    const statsArray = stats.stats as Array<{id: string}>;
    if (Array.isArray(statsArray)) {
      for (const stat of statsArray) {
        if (stat.id) {
          validStatIds.add(stat.id);
        }
      }
    }

    // If scenes provided, validate all stat references in scene content
    if (scenes) {
      for (const [sceneId, scene] of scenes) {
        const statRefs = this.collectStatReferences(scene);
        for (const statRef of statRefs) {
          if (!validStatIds.has(statRef)) {
            errors.push({
              type: 'invalid-stat',
              sceneId,
              message: `Stat '${statRef}' not defined in stats.json (valid: ${Array.from(validStatIds).join(', ')})`,
            });
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Validate items reference valid item IDs from items.json.
   * Called when items.json is available.
   *
   * items.json structure: { items: { vertical_slice: [{id, ...}, ...], act1: [...], ... } }
   * We extract valid item IDs from all nested arrays in the items object.
   *
   * @param items - Loaded items.json content
   * @param manifest - Game manifest
   * @param scenes - Optional map of loaded scenes for full validation
   * @returns Validation result with item reference errors
   */
  validateItems(
    items: Record<string, unknown>,
    manifest: GameManifest,
    scenes?: Map<SceneId, SceneData>
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const validItemIds = new Set<string>();

    // Extract valid item IDs from items.json structure
    // items.json has format: { items: { vertical_slice: [{id: "booth_key", ...}, ...], act1: [...], ... } }
    const itemsObj = items.items as Record<string, Array<{id: string}>>;
    if (itemsObj && typeof itemsObj === 'object') {
      for (const category of Object.values(itemsObj)) {
        if (Array.isArray(category)) {
          for (const item of category) {
            if (item.id) {
              validItemIds.add(item.id);
            }
          }
        }
      }
    }

    // If scenes provided, validate all item references in scene content
    if (scenes) {
      for (const [sceneId, scene] of scenes) {
        const itemRefs = this.collectItemReferences(scene);
        for (const itemRef of itemRefs) {
          if (!validItemIds.has(itemRef)) {
            errors.push({
              type: 'invalid-item',
              sceneId,
              message: `Item '${itemRef}' not defined in items.json (valid: ${Array.from(validItemIds).sort().slice(0, 10).join(', ')}${validItemIds.size > 10 ? '...' : ''})`,
            });
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Collect stat references from a scene for validation.
   * Returns all stat IDs referenced in conditions and effects.
   */
  private collectStatReferences(scene: SceneData): Set<string> {
    const refs = new Set<string>();

    // Check choices for stat references in conditions
    if (scene.choices) {
      for (const choice of scene.choices) {
        // Choice conditions
        if (choice.conditions) {
          this.collectStatsFromConditions(choice.conditions, refs);
        }
      }
    }

    // Check scene-level effects for stat references
    if (scene.effects) {
      this.collectStatsFromEffects(scene.effects, refs);
    }

    // Check choice effects (including onSuccess/onFailure branches)
    if (scene.choices) {
      for (const choice of scene.choices) {
        if (choice.effects) {
          this.collectStatsFromEffects(choice.effects, refs);
        }
        if (choice.onSuccess?.effects) {
          this.collectStatsFromEffects(choice.onSuccess.effects, refs);
        }
        if (choice.onFailure?.effects) {
          this.collectStatsFromEffects(choice.onFailure.effects, refs);
        }
      }
    }

    return refs;
  }

  /**
   * Collect stat IDs from condition tree.
   * Handles both schema-format (stat_check) and runtime-format (stat) condition types.
   */
  private collectStatsFromConditions(conditions: unknown, refs: Set<string>): void {
    if (!conditions) return;

    if (Array.isArray(conditions)) {
      for (const cond of conditions) {
        this.collectStatsFromConditions(cond, refs);
      }
      return;
    }

    const cond = conditions as Record<string, unknown>;
    const type = cond.type as string;

    // Stat condition - handle both schema-format (stat_check) and runtime-format (stat)
    if ((type === 'stat' || type === 'stat_check') && cond.stat && typeof cond.stat === 'string') {
      refs.add(cond.stat);
    }

    // Nested conditions (and, or, not, AND, OR, NOT)
    if ((type === 'and' || type === 'or' || type === 'not' || type === 'AND' || type === 'OR' || type === 'NOT') && cond.conditions) {
      this.collectStatsFromConditions(cond.conditions, refs);
    }
  }

  /**
   * Collect stat IDs from effects array.
   */
  private collectStatsFromEffects(effects: unknown, refs: Set<string>): void {
    if (!effects) return;

    const effectArray = Array.isArray(effects) ? effects : [effects];
    for (const effect of effectArray) {
      const eff = effect as Record<string, unknown>;
      const type = eff.type as string;

      // Stat effects: set-stat, modify-stat
      if ((type === 'set-stat' || type === 'modify-stat') && eff.stat && typeof eff.stat === 'string') {
        refs.add(eff.stat as string);
      }
    }
  }

  /**
   * Collect item references from a scene for validation.
   * Returns all item IDs referenced in conditions and effects.
   */
  private collectItemReferences(scene: SceneData): Set<string> {
    const refs = new Set<string>();

    // Check choices for item references in conditions
    if (scene.choices) {
      for (const choice of scene.choices) {
        // Choice conditions
        if (choice.conditions) {
          this.collectItemsFromConditions(choice.conditions, refs);
        }
      }
    }

    // Check scene-level effects for item references
    if (scene.effects) {
      this.collectItemsFromEffects(scene.effects, refs);
    }

    // Check choice effects (including onSuccess/onFailure branches)
    if (scene.choices) {
      for (const choice of scene.choices) {
        if (choice.effects) {
          this.collectItemsFromEffects(choice.effects, refs);
        }
        if (choice.onSuccess?.effects) {
          this.collectItemsFromEffects(choice.onSuccess.effects, refs);
        }
        if (choice.onFailure?.effects) {
          this.collectItemsFromEffects(choice.onFailure.effects, refs);
        }
      }
    }

    return refs;
  }

  /**
   * Collect item IDs from condition tree.
   * Handles both schema-format (has_item) and runtime-format (item) condition types.
   */
  private collectItemsFromConditions(conditions: unknown, refs: Set<string>): void {
    if (!conditions) return;

    if (Array.isArray(conditions)) {
      for (const cond of conditions) {
        this.collectItemsFromConditions(cond, refs);
      }
      return;
    }

    const cond = conditions as Record<string, unknown>;
    const type = cond.type as string;

    // Item condition - handle both schema-format (has_item) and runtime-format (item)
    if ((type === 'item' || type === 'has_item') && cond.item && typeof cond.item === 'string') {
      refs.add(cond.item);
    }

    // Nested conditions (and, or, not, AND, OR, NOT)
    if ((type === 'and' || type === 'or' || type === 'not' || type === 'AND' || type === 'OR' || type === 'NOT') && cond.conditions) {
      this.collectItemsFromConditions(cond.conditions, refs);
    }
  }

  /**
   * Collect item IDs from effects array.
   */
  private collectItemsFromEffects(effects: unknown, refs: Set<string>): void {
    if (!effects) return;

    const effectArray = Array.isArray(effects) ? effects : [effects];
    for (const effect of effectArray) {
      const eff = effect as Record<string, unknown>;
      const type = eff.type as string;

      // Item effects: add-item, remove-item
      if ((type === 'add-item' || type === 'remove-item') && eff.item && typeof eff.item === 'string') {
        refs.add(eff.item as string);
      }
    }
  }
}

/**
 * Singleton instance for convenient use.
 */
export const contentValidator = new ContentValidator();
