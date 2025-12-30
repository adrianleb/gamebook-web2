/**
 * AudioManager — Phase 4 Polish Sound Effects
 *
 * Per agent-c's Engine lens perspective: HTML5 Audio for Phase 4 SFX scope.
 * - Simpler state management than Web Audio API
 * - Deterministic behavior, sufficient for "key moments" audio
 * - User gesture aware - initializes on first interaction
 *
 * Per agent-e's accessibility perspective:
 * - Respects user preferences (can be muted)
 * - No autoplay - requires user gesture
 *
 * @module ui/audio-manager
 */

/**
 * Sound effect identifiers for game events
 */
export type SoundEffect =
  | 'choice-select'   // Choice button clicked
  | 'scene-load'      // New scene loaded
  | 'menu-open'       // Menu opened
  | 'menu-close'      // Menu closed
  | 'save-game'       // Game saved
  | 'load-game'       // Game loaded
  | 'error'           // Error occurred
  | 'stat-gain';      // Stat increased

/**
 * Audio manager configuration
 */
interface AudioManagerConfig {
  /** Base path for audio assets */
  assetsPath?: string;
  /** Default volume (0.0 to 1.0) */
  defaultVolume?: number;
  /** Whether audio is enabled */
  enabled?: boolean;
}

/**
 * AudioManager - HTML5 Audio-based sound effects for Phase 4 Polish.
 *
 * Uses HTML5 <audio> elements for simple, deterministic SFX playback.
 * Initializes on first user gesture to respect browser autoplay policies.
 *
 * Per agent-c: "HTML5 Audio has simpler state management. Web Audio API's
 * AudioContext adds complexity with suspend/resume states."
 *
 * @example
 * ```typescript
 * const audio = new AudioManager();
 *
 * // Initialize on first user interaction
 * document.addEventListener('click', () => audio.initialize(), { once: true });
 *
 * // Play sound effects
 * audio.play('choice-select');
 * audio.play('scene-load');
 *
 * // Mute for accessibility
 * audio.setEnabled(false);
 * ```
 */
export class AudioManager {
  /** Whether the manager has been initialized (user gesture received) */
  private initialized: boolean = false;

  /** Whether audio is currently enabled */
  private enabled: boolean;

  /** Volume level (0.0 to 1.0) */
  private volume: number;

  /** Base path for audio assets */
  private assetsPath: string;

  /** Audio element cache - creates reusable audio elements */
  private audioCache: Map<SoundEffect, HTMLAudioElement>;

  /** Sound effect file mappings */
  private static readonly SOUND_FILES: Record<SoundEffect, string> = {
    'choice-select': 'sfx-choice-select.mp3',
    'scene-load': 'sfx-scene-load.mp3',
    'menu-open': 'sfx-menu-open.mp3',
    'menu-close': 'sfx-menu-close.mp3',
    'save-game': 'sfx-save.mp3',
    'load-game': 'sfx-load.mp3',
    'error': 'sfx-error.mp3',
    'stat-gain': 'sfx-stat-gain.mp3',
  };

  /**
   * Create an AudioManager instance.
   *
   * @param config - Optional configuration
   */
  constructor(config: AudioManagerConfig = {}) {
    this.enabled = config.enabled ?? true;
    this.volume = config.defaultVolume ?? 0.5;
    this.assetsPath = config.assetsPath ?? '/audio';
    this.audioCache = new Map();

    // Check for reduced motion preference (audio can be motion-sensitive too)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.enabled = false;
    }
  }

  /**
   * Initialize the audio manager.
   *
   * Must be called after a user gesture (click, keypress) to comply with
   * browser autoplay policies. Safe to call multiple times - will only
   * initialize once.
   *
   * Per agent-c: "Initialize AudioManager lazily on first user interaction."
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }

    console.log('[AudioManager] Initialized on user gesture');
    this.initialized = true;
    this.preloadCriticalSounds();
  }

  /**
   * Play a sound effect.
   *
   * If not initialized, silently fails (waiting for user gesture).
   * If disabled or volume is 0, does nothing.
   *
   * @param effect - Sound effect identifier
   * @param volumeOverride - Optional volume override (0.0 to 1.0)
   */
  play(effect: SoundEffect, volumeOverride?: number): void {
    // Skip if not initialized, disabled, or muted
    if (!this.initialized || !this.enabled || this.volume === 0) {
      return;
    }

    try {
      const audio = this.getAudioElement(effect);
      if (!audio) {
        console.warn('[AudioManager] Audio element not found:', effect);
        return;
      }

      // Apply volume
      const playbackVolume = volumeOverride ?? this.volume;
      audio.volume = Math.max(0, Math.min(1, playbackVolume));

      // Reset to start if already playing
      audio.currentTime = 0;

      // Play the sound
      audio.play().catch(err => {
        // Silently handle autoplay errors
        if (err.name !== 'NotAllowedError') {
          console.warn('[AudioManager] Playback failed:', effect, err);
        }
      });
    } catch (error) {
      console.error('[AudioManager] Error playing sound:', effect, error);
    }
  }

  /**
   * Enable or disable audio.
   *
   * @param enabled - Whether audio should be enabled
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log('[AudioManager] Audio', enabled ? 'enabled' : 'disabled');
  }

  /**
   * Check if audio is enabled.
   */
  isEnabled(): boolean {
    return this.enabled && this.initialized;
  }

  /**
   * Set the master volume.
   *
   * @param volume - Volume level (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    console.log('[AudioManager] Volume set to:', this.volume);
  }

  /**
   * Get the current master volume.
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Check if the manager has been initialized.
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Preload critical sound effects for instant playback.
   *
   * Per agent-c: "Preload critical SFX early (choice-select, scene-load)."
   */
  private preloadCriticalSounds(): void {
    const criticalSounds: SoundEffect[] = ['choice-select', 'scene-load'];

    for (const effect of criticalSounds) {
      this.getAudioElement(effect);
    }

    console.log('[AudioManager] Preloaded critical sounds');
  }

  /**
   * Get or create an audio element for the given sound effect.
   *
   * Creates and caches audio elements on first use for reuse.
   *
   * @param effect - Sound effect identifier
   * @returns Audio element or null if file not found
   */
  private getAudioElement(effect: SoundEffect): HTMLAudioElement | null {
    // Check cache first
    let audio = this.audioCache.get(effect);
    if (audio) {
      return audio;
    }

    // Get the filename for this effect
    const filename = AudioManager.SOUND_FILES[effect];
    if (!filename) {
      console.error('[AudioManager] Unknown sound effect:', effect);
      return null;
    }

    // Create new audio element
    const src = `${this.assetsPath}/${filename}`;
    audio = new Audio(src);

    // Handle load errors gracefully
    audio.addEventListener('error', () => {
      console.warn('[AudioManager] Failed to load audio:', src);
      // Remove from cache so we don't keep trying
      this.audioCache.delete(effect);
    });

    // Cache for reuse
    this.audioCache.set(effect, audio);

    return audio;
  }

  /**
   * Stop all currently playing sounds.
   *
   * Useful for scene transitions or menu closes.
   */
  stopAll(): void {
    for (const audio of this.audioCache.values()) {
      if (!audio.paused) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
  }

  /**
   * Cleanup resources.
   *
   * Call this when destroying the audio manager to prevent memory leaks.
   */
  destroy(): void {
    this.stopAll();
    this.audioCache.clear();
    this.initialized = false;
    console.log('[AudioManager] Destroyed');
  }
}

/**
 * Singleton instance for global access.
 *
 * Per agent-c: "Create a singleton AudioManager that initializes on
 * first user gesture."
 */
let globalAudioManager: AudioManager | null = null;

/**
 * Get the global AudioManager instance.
 *
 * Creates the instance if it doesn't exist.
 *
 * @returns Global AudioManager instance
 */
export function getAudioManager(): AudioManager {
  if (!globalAudioManager) {
    globalAudioManager = new AudioManager();
  }
  return globalAudioManager;
}

/**
 * Reset the global AudioManager instance.
 *
 * Useful for testing or cleanup.
 */
export function resetAudioManager(): void {
  if (globalAudioManager) {
    globalAudioManager.destroy();
  }
  globalAudioManager = null;
}
