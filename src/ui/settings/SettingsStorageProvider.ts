/**
 * SettingsStorageProvider — Accessibility Settings Persistence
 *
 * Per agent-a's Delivery perspective (Intent #429):
 * - Follows SaveManager's LocalStorageProvider pattern
 * - localStorage → sessionStorage fallback on error (not memory fallback)
 * - GDPR-exempt for accessibility settings
 * - Extensible for all Phase 11 accessibility features
 *
 * Per agent-e's accessibility perspective:
 * - Debounced input (300ms) for persistence
 * - beforeunload safety net for data integrity
 *
 * @module ui/settings/SettingsStorageProvider
 */

/**
 * Storage provider interface for dependency injection.
 * Matches SaveManager's StorageProvider for consistency.
 */
export interface StorageProvider {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Minimal Storage interface for DOM storage APIs.
 */
interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Default localStorage provider with sessionStorage fallback.
 * Falls back to sessionStorage if localStorage fails (quota, privacy mode).
 */
class LocalStorageWithFallbackProvider implements StorageProvider {
  private useSessionStorage = false;

  getItem(key: string): string | null {
    const storage = this.getStorage();
    return storage ? storage.getItem(key) : null;
  }

  setItem(key: string, value: string): void {
    const storage = this.getStorage();
    if (storage) {
      try {
        storage.setItem(key, value);
      } catch (error) {
        // QuotaExceededError or security error - fallback to sessionStorage
        if (!this.useSessionStorage && typeof sessionStorage !== 'undefined') {
          console.warn('[SettingsStorageProvider] localStorage failed, falling back to sessionStorage:', error);
          this.useSessionStorage = true;
          sessionStorage.setItem(key, value);
        } else {
          throw error;
        }
      }
    }
  }

  removeItem(key: string): void {
    const storage = this.getStorage();
    if (storage) storage.removeItem(key);
  }

  private getStorage(): StorageLike | null {
    if (typeof window === 'undefined') return null;
    return this.useSessionStorage ? sessionStorage : localStorage;
  }
}

/**
 * Storage key prefix for accessibility settings.
 * Scoped to avoid conflicts with game saves.
 */
const STORAGE_KEY_PREFIX = 'understage_accessibility_';

/**
 * SettingsStorageProvider — Accessibility settings persistence service.
 *
 * Handles storage for accessibility settings (CRT intensity, color themes, etc.).
 * Uses debounced persistence to avoid excessive writes while ensuring data integrity.
 *
 * Per agent-a: "Single reusable provider for all accessibility settings."
 *
 * @example
 * ```typescript
 * const settings = new SettingsStorageProvider();
 *
 * // Get CRT intensity (returns default if not set)
 * const intensity = settings.getNumber('crtIntensity', 50);
 *
 * // Set CRT intensity (debounced)
 * settings.setNumber('crtIntensity', 75);
 *
 * // Immediate save (beforeunload safety net)
 * await settings.flush();
 * ```
 */
export class SettingsStorageProvider {
  /** Storage provider for dependency injection */
  private storage: StorageProvider;

  /** Debounce timer for writes */
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  /** Pending write values */
  private pendingWrites: Map<string, string> = new Map();

  /** Default debounce delay (300ms per agent-a's recommendation) */
  private readonly DEBOUNCE_DELAY = 300;

  /**
   * Create a new SettingsStorageProvider.
   *
   * @param storageProvider - Optional storage provider for testing
   */
  constructor(storageProvider?: StorageProvider) {
    this.storage = storageProvider ?? new LocalStorageWithFallbackProvider();

    // Setup beforeunload safety net
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushSync();
      });
    }
  }

  /**
   * Get a number setting from storage.
   *
   * @param key - Setting key (without prefix)
   * @param defaultValue - Default value if not set
   * @returns Number value or default
   */
  getNumber(key: string, defaultValue: number): number {
    const storageKey = this.getStorageKey(key);
    const value = this.storage.getItem(storageKey);

    if (!value) return defaultValue;

    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Set a number setting with debounced persistence.
   *
   * @param key - Setting key (without prefix)
   * @param value - Number value to store
   */
  setNumber(key: string, value: number): void {
    this.setString(key, value.toString());
  }

  /**
   * Get a string setting from storage.
   *
   * @param key - Setting key (without prefix)
   * @param defaultValue - Default value if not set
   * @returns String value or default
   */
  getString(key: string, defaultValue: string): string {
    const storageKey = this.getStorageKey(key);
    const value = this.storage.getItem(storageKey);
    return value ?? defaultValue;
  }

  /**
   * Set a string setting with debounced persistence.
   *
   * @param key - Setting key (without prefix)
   * @param value - String value to store
   */
  setString(key: string, value: string): void {
    const storageKey = this.getStorageKey(key);
    this.pendingWrites.set(storageKey, value);
    this.scheduleFlush();
  }

  /**
   * Get a boolean setting from storage.
   *
   * @param key - Setting key (without prefix)
   * @param defaultValue - Default value if not set
   * @returns Boolean value or default
   */
  getBoolean(key: string, defaultValue: boolean): boolean {
    const storageKey = this.getStorageKey(key);
    const value = this.storage.getItem(storageKey);

    if (!value) return defaultValue;

    return value === 'true';
  }

  /**
   * Set a boolean setting with debounced persistence.
   *
   * @param key - Setting key (without prefix)
   * @param value - Boolean value to store
   */
  setBoolean(key: string, value: boolean): void {
    this.setString(key, value.toString());
  }

  /**
   * Remove a setting from storage.
   *
   * @param key - Setting key (without prefix)
   */
  remove(key: string): void {
    const storageKey = this.getStorageKey(key);
    this.pendingWrites.delete(storageKey);
    this.storage.removeItem(storageKey);
  }

  /**
   * Flush pending writes immediately.
   * Call this before page unload to ensure data integrity.
   *
   * @returns Promise that resolves when flush completes
   */
  async flush(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.pendingWrites.forEach((value, key) => {
      try {
        this.storage.setItem(key, value);
      } catch (error) {
        console.warn(`[SettingsStorageProvider] Failed to write ${key}:`, error);
      }
    });

    this.pendingWrites.clear();
  }

  /**
   * Synchronous flush for beforeunload.
   * Storage operations are synchronous in browsers.
   */
  private flushSync(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.pendingWrites.forEach((value, key) => {
      try {
        this.storage.setItem(key, value);
      } catch (error) {
        console.warn(`[SettingsStorageProvider] Failed to write ${key}:`, error);
      }
    });

    this.pendingWrites.clear();
  }

  /**
   * Schedule debounced flush.
   */
  private scheduleFlush(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.flush().catch(error => {
        console.error('[SettingsStorageProvider] Flush failed:', error);
      });
    }, this.DEBOUNCE_DELAY);
  }

  /**
   * Get storage key with prefix.
   *
   * @param key - Setting key
   * @returns Prefixed storage key
   */
  private getStorageKey(key: string): string {
    return `${STORAGE_KEY_PREFIX}${key}`;
  }

  /**
   * Check if storage is available.
   *
   * @returns true if storage is accessible
   */
  isStorageAvailable(): boolean {
    try {
      const testKey = '__settings_storage_test__';
      this.storage.setItem(testKey, 'test');
      this.storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Singleton instance for global access.
 */
let globalSettingsStorage: SettingsStorageProvider | null = null;

/**
 * Get the global SettingsStorageProvider instance.
 *
 * Creates the instance if it doesn't exist.
 *
 * @returns Global SettingsStorageProvider instance
 */
export function getSettingsStorage(): SettingsStorageProvider {
  if (!globalSettingsStorage) {
    globalSettingsStorage = new SettingsStorageProvider();
  }
  return globalSettingsStorage;
}

/**
 * Reset the global SettingsStorageProvider instance.
 *
 * Useful for testing or cleanup.
 */
export function resetSettingsStorage(): void {
  globalSettingsStorage = null;
}
