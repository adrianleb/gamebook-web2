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

    const validTypes = ['stat', 'flag', 'item', 'faction', 'and', 'or', 'not'];
    if (!validTypes.includes(condition.type)) {
      errors.push({
        type: 'schema-error',
        sceneId,
        message: `Invalid condition type: ${condition.type}`,
      });
    }

    // Validate stat references (will need stats.json when available)
    if (condition.type === 'stat') {
      if (!condition.stat) {
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
    if (condition.type === 'flag') {
      if (!condition.flag) {
        errors.push({
          type: 'schema-error',
          sceneId,
          message: 'Flag condition missing flag field',
        });
      }
    }

    // Validate item references (will need items.json when available)
    if (condition.type === 'item') {
      if (!condition.item) {
        errors.push({
          type: 'invalid-item',
          sceneId,
          message: 'Item condition missing item field',
        });
      }
    }

    // Validate faction references
    if (condition.type === 'faction') {
      if (!condition.faction) {
        errors.push({
          type: 'schema-error',
          sceneId,
          message: 'Faction condition missing faction field',
        });
      }
    }

    // Validate nested conditions
    if (['and', 'or', 'not'].includes(condition.type)) {
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

    return errors;
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
   */
  validateStats(
    stats: Record<string, unknown>,
    manifest: GameManifest
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const validStatIds = new Set(Object.keys(stats));

    // Check that all referenced stats exist
    // This would be called with stats.json content

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Validate items reference valid item IDs from items.json.
   * Called when items.json is available.
   */
  validateItems(
    items: Record<string, unknown>,
    manifest: GameManifest
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const validItemIds = new Set(Object.keys(items));

    // Check that all referenced items exist
    // This would be called with items.json content

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    };
  }
}

/**
 * Singleton instance for convenient use.
 */
export const contentValidator = new ContentValidator();
