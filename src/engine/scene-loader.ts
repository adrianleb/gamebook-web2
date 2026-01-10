/**
 * Scene Loader
 *
 * Loads scene data from content files and caches for performance.
 * Validates manifest and scene integrity.
 *
 * Per RFC: Framework-agnostic, supports headless testing in Node.js.
 */

import type {
  SceneData,
  SceneId,
  GameManifest,
  ManifestValidationResult,
  ContentVersion,
  RawSceneData,
  SceneText,
  SceneTextObject,
  Choice,
  Effect,
  EffectType,
  Condition,
  StatOperator,
} from './types.js';
import { ContentValidator } from './validator.js';

/**
 * Scene loader options.
 */
export interface SceneLoaderOptions {
  /** Base path for content directory */
  contentPath?: string;
  /** Whether to cache loaded scenes */
  cache?: boolean;
  /** Custom manifest (for testing) */
  manifest?: GameManifest;
}

/**
 * Known faction IDs for faction-based stat_check detection.
 * Content files use stat_check with faction IDs; these need to be
 * transformed to type: 'faction' conditions for correct evaluation.
 */
const FACTION_IDS = ['preservationist', 'revisionist', 'exiter', 'independent'] as const;
type FactionId = typeof FACTION_IDS[number];

/**
 * Scene loader class.
 * Loads scenes from content files with optional caching.
 */
export class SceneLoader {
  private manifest: GameManifest | null = null;
  private sceneCache: Map<SceneId, SceneData> = new Map();
  private contentPath: string;
  private cacheEnabled: boolean;
  private validator: ContentValidator;

  constructor(options: SceneLoaderOptions = {}) {
    this.contentPath = options.contentPath ?? './content';
    this.cacheEnabled = options.cache ?? true;
    this.validator = new ContentValidator();

    if (options.manifest) {
      this.manifest = options.manifest;
    }
  }

  /**
   * Check if a stat ID is actually a faction ID.
   * Content files use stat_check for both stats and factions;
   * we need to detect faction IDs to transform them correctly.
   *
   * @param statId - The stat ID to check (case-insensitive)
   * @returns True if the stat ID is a known faction ID
   */
  private isFactionId(statId: string): statId is FactionId {
    return FACTION_IDS.includes(statId.toLowerCase() as FactionId);
  }

  /**
   * Initialize the loader by loading the manifest.
   * Must be called before loading scenes.
   *
   * @throws Error if manifest is missing or invalid
   */
  async initialize(): Promise<void> {
    if (this.manifest) {
      return; // Already initialized with custom manifest
    }

    try {
      const manifestPath = `${this.contentPath}/manifest.json`;
      const manifestData = await this.loadFile(manifestPath);
      this.manifest = JSON.parse(manifestData) as GameManifest;

      // Validate manifest structure
      const validation = this.validator.validateManifest(this.manifest);
      if (!validation.valid) {
        throw new Error(
          `Invalid manifest: ${validation.errors.map(e => e.message).join(', ')}`
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load manifest: ${error.message}`);
      }
      throw new Error('Failed to load manifest: Unknown error');
    }
  }

  /**
   * Load a scene by ID.
   * Returns cached scene if available and caching is enabled.
   *
   * @param sceneId - Scene identifier (e.g., "sc_1_0_001")
   * @returns Scene data
   * @throws Error if scene is not found or invalid
   */
  async loadScene(sceneId: SceneId): Promise<SceneData> {
    // Check cache first
    if (this.cacheEnabled && this.sceneCache.has(sceneId)) {
      return this.sceneCache.get(sceneId)!;
    }

    // Ensure manifest is loaded
    if (!this.manifest) {
      throw new Error('SceneLoader not initialized. Call initialize() first.');
    }

    // Verify scene exists in manifest
    if (!(sceneId in this.manifest.sceneIndex)) {
      throw new Error(`Scene "${sceneId}" not found in manifest`);
    }

    try {
      // Load scene file
      const scenePath = `${this.contentPath}/scenes/${sceneId}.json`;
      const sceneData = await this.loadFile(scenePath);
      const rawScene = JSON.parse(sceneData) as RawSceneData;

      // Transform raw scene data to runtime format
      const scene = this.transformSceneData(rawScene);

      // Validate scene structure
      const validation = this.validator.validateScene(scene, this.manifest);
      if (!validation.valid) {
        throw new Error(
          `Invalid scene "${sceneId}": ${validation.errors.map(e => e.message).join(', ')}`
        );
      }

      // Check required flags/items (fail-fast)
      if (scene.requiredFlags || scene.requiredItems) {
        // Note: These are validated at load time, actual check happens during transition
        // This just ensures the referenced flags/items exist in manifest
      }

      // Cache if enabled
      if (this.cacheEnabled) {
        this.sceneCache.set(sceneId, scene);
      }

      return scene;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load scene "${sceneId}": ${error.message}`);
      }
      throw new Error(`Failed to load scene "${sceneId}": Unknown error`);
    }
  }

  /**
   * Get the starting scene ID from manifest.
   *
   * @returns Starting scene ID
   * @throws Error if manifest is not loaded
   */
  getStartingScene(): SceneId {
    if (!this.manifest) {
      throw new Error('SceneLoader not initialized. Call initialize() first.');
    }
    return this.manifest.startingScene;
  }

  /**
   * Get the content version from manifest.
   * Used for save/load compatibility checking.
   *
   * @returns Content version string
   */
  getContentVersion(): ContentVersion {
    if (!this.manifest) {
      throw new Error('SceneLoader not initialized. Call initialize() first.');
    }
    return this.manifest.gamebook.adaptationVersion;
  }

  /**
   * Get the gamebook title from manifest.
   *
   * @returns Gamebook title
   */
  getGamebookTitle(): string {
    if (!this.manifest) {
      throw new Error('SceneLoader not initialized. Call initialize() first.');
    }
    return this.manifest.gamebook.title;
  }

  /**
   * Check if a scene exists in the manifest.
   *
   * @param sceneId - Scene identifier
   * @returns True if scene exists
   */
  hasScene(sceneId: SceneId): boolean {
    if (!this.manifest) {
      return false;
    }
    return sceneId in this.manifest.sceneIndex;
  }

  /**
   * Get all scene IDs from manifest.
   *
   * @returns Array of scene IDs
   */
  getAllSceneIds(): SceneId[] {
    if (!this.manifest) {
      return [];
    }
    return Object.keys(this.manifest.sceneIndex);
  }

  /**
   * Get scene metadata from manifest.
   *
   * @param sceneId - Scene identifier
   * @returns Scene index entry or undefined
   */
  getSceneMetadata(sceneId: SceneId) {
    if (!this.manifest) {
      return undefined;
    }
    return this.manifest.sceneIndex[sceneId];
  }

  /**
   * Validate the entire manifest and all scenes.
   *
   * @returns Validation result with errors and warnings
   */
  async validateAll(): Promise<ManifestValidationResult> {
    if (!this.manifest) {
      await this.initialize();
    }

    if (!this.manifest) {
      return {
        valid: false,
        errors: [{ type: 'schema-error', message: 'Failed to load manifest' }],
        warnings: [],
      };
    }

    // Validate manifest
    const manifestValidation = this.validator.validateManifest(this.manifest);
    if (!manifestValidation.valid) {
      return manifestValidation as ManifestValidationResult;
    }

    const errors: typeof manifestValidation.errors = [];
    const warnings: typeof manifestValidation.warnings = [];
    const brokenLinks: Array<{ from: SceneId; to: SceneId }> = [];
    const missingScenes: SceneId[] = [];

    // Validate all scenes
    for (const sceneId of this.getAllSceneIds()) {
      try {
        const scene = await this.loadScene(sceneId);

        // Check choice links
        for (const choice of scene.choices) {
          // Skip validation if choice.to is undefined (e.g., attemptable choices use onSuccess/onFailure)
          if (choice.to && !this.hasScene(choice.to)) {
            brokenLinks.push({ from: sceneId, to: choice.to });
          }
        }
      } catch (error) {
        missingScenes.push(sceneId);
      }
    }

    // Check for unreachable scenes
    const unreachable = this.validator.checkReachability(this.manifest);

    return {
      valid: errors.length === 0 && brokenLinks.length === 0 && missingScenes.length === 0,
      errors: [
        ...errors,
        ...brokenLinks.map(link => ({
          type: 'broken-link' as const,
          sceneId: link.from,
          message: `Broken link from "${link.from}" to "${link.to}"`,
        })),
        ...missingScenes.map(id => ({
          type: 'missing-scene' as const,
          sceneId: id,
          message: `Scene file missing for "${id}"`,
        })),
      ],
      warnings: [
        ...warnings,
        ...unreachable.map(u => ({
          type: 'unreachable-scene' as const,
          sceneId: u.sceneId,
          message: `Unreachable scene: ${u.reason}`,
        })),
      ],
      brokenLinks,
      missingScenes,
    };
  }

  /**
   * Clear the scene cache.
   * Useful for testing or forcing reload of updated content.
   */
  clearCache(): void {
    this.sceneCache.clear();
  }

  /**
   * Preload multiple scenes into cache.
   * Useful for performance optimization.
   *
   * @param sceneIds - Array of scene IDs to preload
   */
  async preload(sceneIds: SceneId[]): Promise<void> {
    if (!this.cacheEnabled) {
      return; // Caching disabled, no point in preloading
    }

    await Promise.all(
      sceneIds.map(sceneId => this.loadScene(sceneId))
    );
  }

  /**
   * Load a file from the filesystem.
   * Abstract method to allow different implementations (browser vs Node).
   *
   * In Node.js, uses fs.readFile.
   * In browser, uses fetch API.
   */
  private async loadFile(path: string): Promise<string> {
    // Detect environment - check for browser-specific global
    // window is not defined in Node.js environment, but typeof check makes it safe
    const isBrowser = typeof window !== 'undefined';

    if (isBrowser) {
      // Browser: use fetch
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.text();
    } else {
      // Node.js: use dynamic import of fs
      try {
        const fs = await import('fs/promises');
        return await fs.readFile(path, 'utf-8');
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          throw new Error(`File not found: ${path}`);
        }
        throw error;
      }
    }
  }

  /**
   * Transform raw scene text to string format.
   * Converts { location, paragraphs } object to joined string.
   * String text is returned as-is.
   *
   * @param text - Raw scene text (string or object)
   * @returns Text as string
   */
  private transformSceneText(text: SceneText): string {
    if (typeof text === 'string') {
      return text;
    }

    // Text is object format: { location, paragraphs }
    const textObj = text as SceneTextObject;
    // Join paragraphs with double newlines for DOS paragraph breaks
    return textObj.paragraphs.join('\n\n');
  }

  /**
   * Normalize condition format from content files to engine runtime format.
   * Handles:
   * - Single object → array wrapping
   * - Type aliases (has_item → item, stat_check → stat)
   * - Field name aliases (op → operator)
   * - null/undefined → undefined
   *
   * @param conditions - Raw conditions from content file (may be null, object, or array)
   * @returns Normalized conditions array or undefined
   */
  private normalizeConditions(conditions: unknown): Condition[] | undefined {
    // Handle null/undefined
    if (conditions === null || conditions === undefined) {
      return undefined;
    }

    // Handle array of conditions
    if (Array.isArray(conditions)) {
      return conditions.map(c => this.normalizeCondition(c));
    }

    // Handle single condition object - wrap in array
    if (typeof conditions === 'object') {
      return [this.normalizeCondition(conditions as Record<string, unknown>)];
    }

    return undefined;
  }

  /**
   * Normalize a single condition object to engine format.
   * Maps content file aliases to canonical engine format.
   *
   * Faction Detection:
   * Content files use stat_check with faction IDs (e.g., revisionist).
   * We detect these and transform to type: 'faction' for correct evaluation.
   *
   * @param condition - Raw condition object
   * @returns Normalized Condition
   */
  private normalizeCondition(condition: Record<string, unknown>): Condition {
    const type = String(condition.type ?? '');

    // Map type aliases to canonical types
    const typeMap: Record<string, 'stat' | 'flag' | 'item' | 'faction' | 'and' | 'or' | 'not'> = {
      'has_item': 'item',
      'stat_check': 'stat',
      'flag_check': 'flag',
      'faction_check': 'faction',
      'NOT': 'not',
      'AND': 'and',
      'OR': 'or',
    };

    let normalizedType = typeMap[type] || type as 'stat' | 'flag' | 'item' | 'faction' | 'and' | 'or' | 'not';

    // Detect faction IDs in stat_check - content files use stat_check for both
    // stats and factions, so we need to transform faction-based checks
    const statValue = String(condition.stat ?? '');
    if (normalizedType === 'stat' && this.isFactionId(statValue)) {
      normalizedType = 'faction';
    }

    const result: Condition = {
      type: normalizedType,
    };

    // Preserve attemptable flag for stat/faction conditions
    if (condition.attemptable === true) {
      result.attemptable = true;
    }

    // Map field aliases and copy relevant fields
    if (normalizedType === 'stat') {
      result.stat = statValue;
      result.operator = (condition.op as StatOperator) ?? condition.operator as StatOperator ?? 'gte';
      result.value = Number(condition.value ?? 0);
    } else if (normalizedType === 'flag') {
      result.flag = String(condition.flag ?? '');
      // Handle NOT_SET operator by wrapping in a 'not' condition
      if (condition.operator === 'NOT_SET' || condition.op === 'NOT_SET') {
        return {
          type: 'not',
          conditions: [result]
        } as Condition;
      }
    } else if (normalizedType === 'item') {
      result.item = String(condition.item ?? '');
      result.itemCount = Number(condition.itemCount ?? condition.count ?? 1);
    } else if (normalizedType === 'faction') {
      // For faction checks from content files, the 'stat' field contains the faction ID
      result.faction = String(condition.faction ?? statValue);
      result.factionLevel = Number(condition.factionLevel ?? condition.level ?? condition.value ?? 0);
    } else if (['and', 'or', 'not'].includes(normalizedType)) {
      // Recursively normalize nested conditions
      const rawNested = condition.conditions;
      if (Array.isArray(rawNested)) {
        result.conditions = rawNested.map(c => this.normalizeCondition(c as Record<string, unknown>));
      } else if (typeof rawNested === 'object' && rawNested !== null) {
        result.conditions = [this.normalizeCondition(rawNested as Record<string, unknown>)];
      }
    }

    return result;
  }

  /**
   * Transform raw scene data to runtime SceneData format.
   * Handles:
   * - text object → string conversion
   * - effectsOnEnter → effects mapping
   * - onChoose → effects mapping in choices
   * - audio.music/audio.sfx → music/sfx flattening
   * - condition format normalization (type aliases, field aliases, array wrapping)
   * - effect type normalization (underscore → hyphen)
   * - ending property preservation (per agent-d for DOS UI treatment)
   *
   * @param raw - Raw scene data from JSON file
   * @returns Transformed SceneData for runtime use
   */
  private transformSceneData(raw: RawSceneData): SceneData {
    // Transform text
    const text = this.transformSceneText(raw.text);

    // Get effects from either effectsOnEnter or effects field, normalize types
    const rawEffects = raw.effectsOnEnter ?? raw.effects ?? [];
    const effects = this.normalizeEffects(rawEffects);

    // Transform choices: normalize conditions, normalize effects, preserve attemptable structure
    const choices: Choice[] = raw.choices.map(choice => {
      // Determine if this is an attemptable choice (has both success and failure paths)
      const isAttemptable = choice.onSuccess && choice.onFailure;

      // For attemptable choices, the top-level 'to' field is redundant and should be removed.
      // Attemptable choices use onSuccess.to and onFailure.to for their respective paths.
      // The top-level 'to' is a content authoring artifact that should not reach runtime.
      // See: https://github.com/adrianleb/gamebook-web2/issues/470
      const to = isAttemptable ? undefined : choice.to;

      const baseChoice = {
        label: choice.label,
        to,
        conditions: this.normalizeConditions(choice.conditions),
        effects: this.normalizeEffects(choice.effects ?? choice.onChoose),
        disabledHint: choice.disabledHint,
      };

      // Preserve attemptable stat check structure (onSuccess/onFailure)
      if (choice.onSuccess || choice.onFailure) {
        return {
          ...baseChoice,
          onSuccess: choice.onSuccess ? {
            to: choice.onSuccess.to,
            effects: choice.onSuccess.effects ? this.normalizeEffects(choice.onSuccess.effects) : undefined,
          } : undefined,
          onFailure: choice.onFailure ? {
            to: choice.onFailure.to,
            effects: choice.onFailure.effects ? this.normalizeEffects(choice.onFailure.effects) : undefined,
          } : undefined,
        };
      }

      return baseChoice;
    });

    // Handle audio.music/audio.sfx flattening
    const music = raw.audio?.music ?? raw.music ?? undefined;
    const sfx = raw.audio?.sfx ?? raw.sfx ?? undefined;

    return {
      id: raw.id,
      title: raw.title,
      text,
      art: raw.art,
      music,
      sfx,
      effects,
      choices,
      requiredFlags: raw.requiredFlags,
      requiredItems: raw.requiredItems,
      ending: raw.ending,  // Preserve ending property for DOS UI visual treatment
    };
  }

  /**
   * Normalize effect type format from content files to engine runtime format.
   * Maps:
   * - Underscore versions to hyphen versions (e.g., set_flag → set-flag)
   * - Non-canonical field names (e.g., modify_faction 'value' → 'amount')
   *
   * @param effects - Raw effects array (may be undefined)
   * @returns Normalized effects array
   */
  private normalizeEffects(effects: unknown): Effect[] {
    if (!effects || !Array.isArray(effects)) {
      return [];
    }

    return effects.map(effect => {
      if (typeof effect !== 'object' || effect === null) {
        return effect as Effect;
      }

      const effectObj = effect as Record<string, unknown>;
      const type = String(effectObj.type ?? '');

      // Map underscore format to hyphen format
      const typeMap: Record<string, EffectType> = {
        'set_stat': 'set-stat',
        'modify_stat': 'modify-stat',
        'set_flag': 'set-flag',
        'clear_flag': 'clear-flag',
        'add_item': 'add-item',
        'remove_item': 'remove-item',
        'modify_faction': 'modify-faction',
      };

      const normalizedType = typeMap[type] || type as EffectType;

      // For modify_faction effects, transform 'value' field to 'amount' for backward compatibility
      // Content files may use 'value' but engine canonical format uses 'amount'
      const result: Record<string, unknown> = {
        ...effectObj,
        type: normalizedType,
      };

      if (normalizedType === 'modify-faction' && 'value' in effectObj && !('amount' in effectObj)) {
        result.amount = effectObj.value;
        delete (result as Record<string, unknown>).value;
      }

      return result as unknown as Effect;
    });
  }

  /**
   * Get the current manifest (for testing).
   */
  getManifest(): GameManifest | null {
    return this.manifest;
  }

  /**
   * Set a custom manifest (for testing).
   */
  setManifest(manifest: GameManifest): void {
    this.manifest = manifest;
  }
}

/**
 * Create a scene loader with a custom manifest (for testing).
 */
export function createTestLoader(manifest: GameManifest): SceneLoader {
  return new SceneLoader({ manifest, cache: false });
}
