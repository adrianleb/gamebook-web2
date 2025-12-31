/**
 * SaveManager - Game State Persistence Service
 *
 * Per agent-c's perspective (Issue #37):
 * - Separated from GameRenderer to maintain SRP
 * - Handles serialization/deserialization of game state
 * - localStorage operations with error handling
 * - Version compatibility checks and migrations
 *
 * Per agent-e's perspective (Issue #37, Intent #64):
 * - localStorage error handling (quota exceeded, privacy mode)
 * - XSS security - validate save data structure
 * - Version field for future migration support
 * - Plain JSON export for testability
 * - Event-driven autosave with rotating snapshots (last 3)
 * - storageProvider injection pattern for testability
 *
 * @module engine/save-manager
 */

import type { GameState } from './types.js';

/**
 * Current save format version.
 * Increment when save schema changes incompatibly.
 */
export const SAVE_FORMAT_VERSION = 1;

/**
 * Schema version string for export/import validation.
 * Required field in all save files - rejects on mismatch.
 */
export const SCHEMA_VERSION = '1.0.0';

/**
 * Save slot identifier (1-3 per STYLE_GUIDE.md).
 */
export type SaveSlotId = 1 | 2 | 3;

/**
 * Autosave slot identifier.
 */
export type AutosaveSlotId = 0;

/**
 * Save slot identifier including autosave slot.
 */
export type AllSlotId = SaveSlotId | AutosaveSlotId;

/**
 * Number of rotating autosave snapshots to keep.
 */
export const AUTOSAVE_SNAPSHOT_COUNT = 3;

/**
 * Save slot metadata for UI display.
 */
export interface SaveSlotMetadata {
  /** Slot ID (1-3) */
  slotId: SaveSlotId;
  /** Whether slot has saved data */
  hasData: boolean;
  /** Save timestamp (ISO string) */
  timestamp?: string;
  /** Scene title at save point */
  sceneTitle?: string;
  /** Current scene ID */
  sceneId?: string;
  /** Playtime in seconds (optional) */
  playtimeSeconds?: number;
  /** Save format version */
  version?: number;
}

/**
 * Save data structure with metadata.
 * Includes version field for migration support.
 */
export interface SaveDataWithMetadata {
  version: number;
  timestamp: number;
  contentVersion: string;
  gameState: GameState;
}

/**
 * Exportable save data structure.
 * Plain JSON format for copy-paste sharing between players.
 * Per agent-e: Use plain JSON (not base64) for testability and debugging.
 */
export interface ExportableSaveData {
  /** Schema version for validation - required, rejects on mismatch */
  schemaVersion: string;
  /** Save format version */
  version: number;
  /** ISO timestamp of save */
  timestamp: string;
  /** Content version from manifest */
  contentVersion: string;
  /** Current scene ID */
  currentSceneId: string;
  /** Game state data */
  state: {
    /** Current scene ID */
    currentSceneId: string;
    /** Scene history with visited counts */
    history: Array<{
      sceneId: string;
      timestamp: number;
      choiceLabel?: string;
      visitedCount: number;
    }>;
    /** Player stats */
    stats: Record<string, number>;
    /** Set flags */
    flags: string[];
    /** Inventory items */
    inventory: Array<[string, number]>;
    /** Faction alignments */
    factions: Record<string, number>;
  };
}

/**
 * Storage provider interface for dependency injection.
 * Per agent-e: Enables in-memory provider for testing without filesystem churn.
 */
export interface StorageProvider {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear?(): void;
}

/**
 * Minimal Storage interface for localStorage (DOM API).
 */
interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

/**
 * Default localStorage provider.
 */
class LocalStorageProvider implements StorageProvider {
  private getStorage(): StorageLike | null {
    // localStorage may not exist in non-browser environments
    return typeof localStorage !== 'undefined' ? localStorage : null;
  }

  getItem(key: string): string | null {
    const storage = this.getStorage();
    return storage ? storage.getItem(key) : null;
  }

  setItem(key: string, value: string): void {
    const storage = this.getStorage();
    if (storage) storage.setItem(key, value);
  }

  removeItem(key: string): void {
    const storage = this.getStorage();
    if (storage) storage.removeItem(key);
  }

  clear(): void {
    const storage = this.getStorage();
    if (storage) storage.clear();
  }
}

/**
 * localStorage key prefix for save slots.
 */
const STORAGE_KEY_PREFIX = 'gamebook_save_slot_';

/**
 * Error types for save/load operations.
 */
export type SaveErrorType =
  | 'quota-exceeded'
  | 'privacy-mode'
  | 'invalid-data'
  | 'version-mismatch'
  | 'storage-unavailable'
  | 'unknown';

/**
 * Save error with user-friendly message.
 */
export class SaveError extends Error {
  constructor(
    public type: SaveErrorType,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'SaveError';
  }
}

/**
 * Migration function type for version upgrades.
 * Takes old version data and returns new version data.
 */
type MigrationFn = (data: unknown) => SaveDataWithMetadata;

/**
 * Migration registry for version upgrades.
 * Add migrations here when schema changes.
 */
const MIGRATIONS: Record<number, MigrationFn> = {
  // Future migrations: migrate_v1_to_v2, migrate_v2_to_v3, etc.
  // Example:
  // 2: (data: unknown) => {
  //   const old = data as SaveDataV1;
  //   return { ...migrateToV2(old), version: 2 };
  // },
};

/**
 * SaveManager - Pure service for game state persistence.
 *
 * Handles all save/load operations independently of UI.
 * UI components call SaveManager methods and handle the results.
 *
 * Per agent-e (Intent #64):
 * - Accepts optional storageProvider for testability
 * - Event-driven autosave with rotating snapshots (last 3)
 * - Plain JSON export/import for copy-paste sharing
 * - Errors surface to UI via SaveError types
 *
 * @example
 * ```typescript
 * const saveManager = new SaveManager();
 *
 * // Save game to slot 1
 * await saveManager.save(1, gameState, 'The Green Room', 120);
 *
 * // Load from slot 1
 * const gameState = await saveManager.load(1);
 *
 * // Autosave (rotating snapshots)
 * await saveManager.autosave(gameState, 'The Green Room');
 *
 * // Export to plain JSON
 * const json = saveManager.exportToJSON(gameState);
 *
 * // Import from JSON string
 * const gameState = saveManager.importFromJSON(json);
 *
 * // Get slot metadata for UI
 * const slots = await saveManager.getAllSlotMetadata();
 * ```
 */
export class SaveManager {
  /** Maximum save slots per STYLE_GUIDE.md */
  private readonly MAX_SLOTS = 3;

  /** Storage provider for dependency injection (per agent-e) */
  private storage: StorageProvider;

  /** Current autosave rotation index (0-2) */
  private autosaveRotation = 0;

  /**
   * Create a new SaveManager.
   *
   * @param storageProvider - Optional storage provider for testing (defaults to localStorage)
   */
  constructor(storageProvider?: StorageProvider) {
    this.storage = storageProvider ?? new LocalStorageProvider();
  }

  /**
   * Save game state to localStorage slot.
   *
   * @param slotId - Slot ID (1-3)
   * @param gameState - Current game state from Engine
   * @param sceneTitle - Scene title for metadata display
   * @param playtimeSeconds - Playtime in seconds (optional)
   * @throws SaveError if save fails
   */
  async save(
    slotId: SaveSlotId,
    gameState: GameState,
    sceneTitle: string,
    playtimeSeconds?: number
  ): Promise<void> {
    this.validateSlotId(slotId);

    try {
      // Create save data with metadata
      const saveData: SaveDataWithMetadata = {
        version: SAVE_FORMAT_VERSION,
        timestamp: Date.now(),
        contentVersion: gameState.contentVersion,
        gameState,
      };

      // Serialize to JSON with validation (XSS protection per agent-e)
      const json = this.serializeWithValidation(saveData);

      // Store in localStorage
      const storageKey = this.getStorageKey(slotId);
      this.storage.setItem(storageKey, json);

      console.log(`[SaveManager] Saved to slot ${slotId}:`, {
        sceneTitle,
        version: SAVE_FORMAT_VERSION,
        timestamp: new Date(saveData.timestamp).toISOString(),
      });
    } catch (error) {
      throw this.handleSaveError(error, 'save');
    }
  }

  /**
   * Load game state from localStorage slot.
   *
   * @param slotId - Slot ID (1-3)
   * @returns Game state
   * @throws SaveError if load fails or data invalid
   */
  async load(slotId: SaveSlotId): Promise<GameState> {
    this.validateSlotId(slotId);

    try {
      const storageKey = this.getStorageKey(slotId);
      const json = this.storage.getItem(storageKey);

      if (!json) {
        throw new SaveError('invalid-data', `No save data found in slot ${slotId}`);
      }

      // Deserialize with validation (XSS protection per agent-e)
      const saveData = this.deserializeWithValidation(json);

      // Check version and apply migrations if needed
      const migratedData = this.migrateSaveData(saveData);

      console.log(`[SaveManager] Loaded from slot ${slotId}:`, {
        version: migratedData.version,
        timestamp: new Date(migratedData.timestamp).toISOString(),
      });

      return migratedData.gameState;
    } catch (error) {
      throw this.handleSaveError(error, 'load');
    }
  }

  /**
   * Delete save data from slot.
   *
   * @param slotId - Slot ID (1-3)
   * @throws SaveError if delete fails
   */
  async delete(slotId: SaveSlotId): Promise<void> {
    this.validateSlotId(slotId);

    try {
      const storageKey = this.getStorageKey(slotId);
      this.storage.removeItem(storageKey);

      console.log(`[SaveManager] Deleted slot ${slotId}`);
    } catch (error) {
      throw this.handleSaveError(error, 'delete');
    }
  }

  /**
   * Get metadata for a single save slot.
   *
   * @param slotId - Slot ID (1-3)
   * @returns Slot metadata
   */
  async getSlotMetadata(slotId: SaveSlotId): Promise<SaveSlotMetadata> {
    this.validateSlotId(slotId);

    try {
      const storageKey = this.getStorageKey(slotId);
      const json = this.storage.getItem(storageKey);

      if (!json) {
        return {
          slotId,
          hasData: false,
        };
      }

      const saveData = this.deserializeWithValidation(json);

      // Get scene title from game state
      const sceneTitle = this.extractSceneTitle(saveData.gameState);

      return {
        slotId,
        hasData: true,
        timestamp: new Date(saveData.timestamp).toISOString(),
        sceneTitle,
        sceneId: saveData.gameState.currentSceneId,
        playtimeSeconds: Math.floor(saveData.timestamp / 1000), // Approximate
        version: saveData.version,
      };
    } catch (error) {
      console.error(`[SaveManager] Failed to read slot ${slotId} metadata:`, error);
      return {
        slotId,
        hasData: false,
      };
    }
  }

  /**
   * Get metadata for all save slots.
   *
   * @returns Array of slot metadata (1-3)
   */
  async getAllSlotMetadata(): Promise<SaveSlotMetadata[]> {
    const slots: SaveSlotMetadata[] = [];

    for (let i = 1; i <= this.MAX_SLOTS; i++) {
      const metadata = await this.getSlotMetadata(i as SaveSlotId);
      slots.push(metadata);
    }

    return slots;
  }

  /**
   * Check if localStorage is available.
   * Per agent-e: handle privacy mode detection.
   *
   * @returns true if localStorage is accessible
   */
  isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      this.storage.setItem(testKey, 'test');
      this.storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get estimated storage size for a slot.
   * Per agent-e: monitor for quota issues.
   * @param slotId - Slot ID (1-3)
   * @returns Size in bytes, or 0 if slot empty
   */
  getSlotSize(slotId: SaveSlotId): number {
    this.validateSlotId(slotId);

    try {
      const storageKey = this.getStorageKey(slotId);
      const json = this.storage.getItem(storageKey);
      return json ? new Blob([json]).size : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Export game state to plain JSON string.
   * Per agent-e: Use plain JSON (not base64) for testability and debugging.
   * Copy-pasteable for sharing saves between players.
   *
   * @param gameState - Current game state from Engine
   * @returns JSON string of exportable save data
   * @throws SaveError if export fails
   */
  exportToJSON(gameState: GameState): string {
    try {
      const exportData: ExportableSaveData = {
        schemaVersion: SCHEMA_VERSION,
        version: SAVE_FORMAT_VERSION,
        timestamp: new Date(gameState.timestamp).toISOString(),
        contentVersion: gameState.contentVersion,
        currentSceneId: gameState.currentSceneId,
        state: {
          currentSceneId: gameState.currentSceneId,
          history: gameState.history.map(entry => ({
            sceneId: entry.sceneId,
            timestamp: entry.timestamp,
            choiceLabel: entry.choiceLabel,
            visitedCount: entry.visitedCount,
          })),
          stats: { ...gameState.stats },
          flags: Array.from(gameState.flags),
          inventory: Array.from(gameState.inventory.entries()),
          factions: { ...gameState.factions },
        },
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      throw new SaveError('invalid-data', 'Failed to export save data', error);
    }
  }

  /**
   * Import game state from JSON string.
   * Per agent-e: Validates schemaVersion - rejects on mismatch.
   * Surfaces errors to UI for user feedback.
   *
   * @param json - JSON string from exportToJSON()
   * @returns Game state
   * @throws SaveError if import fails or schema mismatch
   */
  importFromJSON(json: string): GameState {
    try {
      const data = JSON.parse(json) as unknown;

      // Validate structure
      if (!data || typeof data !== 'object') {
        throw new SaveError('invalid-data', 'Import data is not a valid object');
      }

      const importData = data as Partial<ExportableSaveData>;

      // Check schemaVersion - required field, reject on mismatch
      if (typeof importData.schemaVersion !== 'string') {
        throw new SaveError(
          'version-mismatch',
          'Save data missing schemaVersion field'
        );
      }

      if (importData.schemaVersion !== SCHEMA_VERSION) {
        throw new SaveError(
          'version-mismatch',
          `Schema version mismatch: expected ${SCHEMA_VERSION}, got ${importData.schemaVersion}`
        );
      }

      // Validate other required fields
      if (typeof importData.version !== 'number') {
        throw new SaveError('invalid-data', 'Save data missing version field');
      }

      if (!importData.state || typeof importData.state !== 'object') {
        throw new SaveError('invalid-data', 'Save data missing state field');
      }

      const state = importData.state!;

      // Reconstruct GameState from export format
      const gameState: GameState = {
        version: importData.version,
        contentVersion: importData.contentVersion ?? '0.0.0',
        timestamp: importData.timestamp ? new Date(importData.timestamp).getTime() : Date.now(),
        currentSceneId: state.currentSceneId ?? '',
        history: (state.history ?? []).map(entry => ({
          sceneId: entry.sceneId,
          timestamp: entry.timestamp,
          choiceLabel: entry.choiceLabel,
          visitedCount: entry.visitedCount ?? 1,
        })),
        stats: state.stats ?? {},
        flags: new Set(state.flags ?? []),
        inventory: new Map(state.inventory ?? []),
        factions: state.factions ?? {},
      };

      console.log(`[SaveManager] Imported save:`, {
        schemaVersion: importData.schemaVersion,
        version: importData.version,
        sceneId: gameState.currentSceneId,
      });

      return gameState;
    } catch (error) {
      if (error instanceof SaveError) {
        throw error;
      }
      throw new SaveError('invalid-data', 'Failed to import save data', error);
    }
  }

  /**
   * Autosave game state to rotating snapshot slots.
   * Per agent-e: Event-driven, no debouncing, keeps last 3 snapshots.
   * Autosave failures should show warning but not block gameplay.
   *
   * @param gameState - Current game state from Engine
   * @param sceneTitle - Scene title for metadata
   * @returns true if autosave succeeded, false otherwise
   */
  async autosave(gameState: GameState, sceneTitle: string): Promise<boolean> {
    const autosaveSlot = this.autosaveRotation;

    try {
      // Create save data with metadata
      const saveData: SaveDataWithMetadata = {
        version: SAVE_FORMAT_VERSION,
        timestamp: Date.now(),
        contentVersion: gameState.contentVersion,
        gameState,
      };

      // Serialize to JSON
      const json = this.serializeWithValidation(saveData);

      // Store in autosave slot (0, 1, or 2)
      const storageKey = this.getAutosaveStorageKey(autosaveSlot);
      this.storage.setItem(storageKey, json);

      // Rotate to next slot for next autosave
      this.autosaveRotation = (this.autosaveRotation + 1) % AUTOSAVE_SNAPSHOT_COUNT;

      console.log(`[SaveManager] Autosaved to slot ${autosaveSlot}:`, {
        sceneTitle,
        version: SAVE_FORMAT_VERSION,
        timestamp: new Date(saveData.timestamp).toISOString(),
      });

      return true;
    } catch (error) {
      // Autosave failure should not block gameplay
      // Log warning for UI to display
      console.warn(`[SaveManager] Autosave failed:`, error);
      return false;
    }
  }

  /**
   * Load most recent autosave.
   * Loads from the most recent autosave slot (previous rotation index).
   *
   * @returns Game state or null if no autosave exists
   * @throws SaveError if load fails
   */
  async loadAutosave(): Promise<GameState | null> {
    // Check autosave slots in reverse order (most recent first)
    for (let i = AUTOSAVE_SNAPSHOT_COUNT - 1; i >= 0; i--) {
      const storageKey = this.getAutosaveStorageKey(i);
      const json = this.storage.getItem(storageKey);

      if (json) {
        try {
          const saveData = this.deserializeWithValidation(json);
          const migratedData = this.migrateSaveData(saveData);

          console.log(`[SaveManager] Loaded autosave from slot ${i}:`, {
            version: migratedData.version,
            timestamp: new Date(migratedData.timestamp).toISOString(),
          });

          return migratedData.gameState;
        } catch (error) {
          console.error(`[SaveManager] Failed to load autosave slot ${i}:`, error);
          // Try next slot
        }
      }
    }

    return null;
  }

  /**
   * Get metadata for all autosave slots.
   *
   * @returns Array of autosave slot metadata (0-2)
   */
  async getAutosaveMetadata(): Promise<Array<{ slot: number; timestamp?: string }>> {
    const metadata: Array<{ slot: number; timestamp?: string }> = [];

    for (let i = 0; i < AUTOSAVE_SNAPSHOT_COUNT; i++) {
      const storageKey = this.getAutosaveStorageKey(i);
      const json = this.storage.getItem(storageKey);

      if (json) {
        try {
          const saveData = this.deserializeWithValidation(json);
          metadata.push({
            slot: i,
            timestamp: new Date(saveData.timestamp).toISOString(),
          });
        } catch {
          metadata.push({ slot: i });
        }
      } else {
        metadata.push({ slot: i });
      }
    }

    return metadata;
  }

  /**
   * Get storage key for autosave slot.
   *
   * @param slot - Autosave slot (0-2)
   * @returns Storage key
   */
  private getAutosaveStorageKey(slot: number): string {
    return `${STORAGE_KEY_PREFIX}autosave_${slot}`;
  }

  /**
   * Validate slot ID is within allowed range.
   *
   * @param slotId - Slot ID to validate
   * @throws Error if slot ID invalid
   */
  private validateSlotId(slotId: SaveSlotId): void {
    if (slotId < 1 || slotId > this.MAX_SLOTS) {
      throw new Error(`Invalid slot ID: ${slotId}. Must be 1-${this.MAX_SLOTS}.`);
    }
  }

  /**
   * Get localStorage key for a slot.
   *
   * @param slotId - Slot ID
   * @returns Storage key
   */
  private getStorageKey(slotId: SaveSlotId): string {
    return `${STORAGE_KEY_PREFIX}${slotId}`;
  }

  /**
   * Serialize save data with validation.
   * Per agent-e: structured clone approach for XSS protection.
   *
   * @param data - Save data to serialize
   * @returns JSON string
   * @throws SaveError if serialization fails
   */
  private serializeWithValidation(data: SaveDataWithMetadata): string {
    try {
      // Validate structure before serializing
      this.validateSaveDataStructure(data);

      // Use structured clone for safety (agent-e recommendation)
      const cloned = structuredClone(data);
      return JSON.stringify(cloned);
    } catch (error) {
      throw new SaveError('invalid-data', 'Failed to serialize save data', error);
    }
  }

  /**
   * Deserialize save data with validation.
   * Per agent-e: reject malformed data to prevent XSS.
   *
   * @param json - JSON string to deserialize
   * @returns Validated save data
   * @throws SaveError if deserialization fails or data invalid
   */
  private deserializeWithValidation(json: string): SaveDataWithMetadata {
    try {
      // Parse JSON
      const data = JSON.parse(json) as unknown;

      // Validate structure after parsing
      return this.validateSaveDataStructure(data);
    } catch (error) {
      throw new SaveError('invalid-data', 'Failed to deserialize save data', error);
    }
  }

  /**
   * Validate save data structure.
   * Per agent-e: XSS protection - reject unexpected/malformed data.
   *
   * @param data - Unknown data to validate
   * @returns Validated save data
   * @throws SaveError if structure invalid
   */
  private validateSaveDataStructure(data: unknown): SaveDataWithMetadata {
    if (!data || typeof data !== 'object') {
      throw new SaveError('invalid-data', 'Save data is not an object');
    }

    const save = data as Partial<SaveDataWithMetadata>;

    // Check required fields
    if (typeof save.version !== 'number') {
      throw new SaveError('invalid-data', 'Save data missing version field');
    }

    if (typeof save.timestamp !== 'number') {
      throw new SaveError('invalid-data', 'Save data missing timestamp');
    }

    if (typeof save.contentVersion !== 'string') {
      throw new SaveError('invalid-data', 'Save data missing contentVersion');
    }

    if (!save.gameState || typeof save.gameState !== 'object') {
      throw new SaveError('invalid-data', 'Save data missing gameState');
    }

    // Validate gameState structure
    const state = save.gameState as Partial<GameState>;
    if (typeof state.version !== 'number' ||
        typeof state.currentSceneId !== 'string' ||
        !Array.isArray(state.history)) {
      throw new SaveError('invalid-data', 'GameState structure invalid');
    }

    return save as SaveDataWithMetadata;
  }

  /**
   * Migrate save data to current version.
   * Per agent-c: applies migrations sequentially.
   *
   * @param data - Save data to migrate
   * @returns Migrated save data
   */
  private migrateSaveData(data: SaveDataWithMetadata): SaveDataWithMetadata {
    let currentData = data;

    // Apply migrations from data version to current version
    while (currentData.version < SAVE_FORMAT_VERSION) {
      const nextVersion = currentData.version + 1;
      const migration = MIGRATIONS[nextVersion];

      if (!migration) {
        throw new SaveError(
          'version-mismatch',
          `No migration found for version ${nextVersion}`
        );
      }

      console.log(`[SaveManager] Migrating from v${currentData.version} to v${nextVersion}`);
      currentData = migration(currentData);
    }

    return currentData;
  }

  /**
   * Extract scene title from game state.
   * Used for save slot metadata display.
   *
   * @param gameState - Game state
   * @returns Scene title or fallback
   */
  private extractSceneTitle(gameState: GameState): string {
    // Try to get scene title from history (last visited scene)
    if (gameState.history.length > 0) {
      const lastEntry = gameState.history[gameState.history.length - 1];
      // Scene title would need to be stored in history or loaded from content
      // For now, use scene ID as fallback
      return lastEntry.sceneId;
    }

    return gameState.currentSceneId;
  }

  /**
   * Handle save/load errors with user-friendly messages.
   * Per agent-e: graceful error handling for quota, privacy mode.
   *
   * @param error - Original error
   * @param operation - Operation that failed ('save', 'load', 'delete')
   * @returns SaveError with appropriate type
   */
  private handleSaveError(error: unknown, operation: string): SaveError {
    // Check for quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      return new SaveError(
        'quota-exceeded',
        'Storage quota exceeded. Please clear browser data or free up space.',
        error
      );
    }

    // Check for security/privacy errors (localStorage access denied)
    if (error instanceof DOMException &&
        (error.name === 'SecurityError' || error.name === 'InvalidAccessError')) {
      return new SaveError(
        'privacy-mode',
        'Unable to access storage. You may be in privacy/incognito mode.',
        error
      );
    }

    // Check for SaveError (already wrapped)
    if (error instanceof SaveError) {
      return error;
    }

    // Unknown error
    return new SaveError(
      'unknown',
      `Failed to ${operation} game: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error
    );
  }
}
