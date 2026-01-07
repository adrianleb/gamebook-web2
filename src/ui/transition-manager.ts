/**
 * TransitionManager - Scene transition effects
 *
 * Per agent-c perspective (Issue #438): Centralized transition management
 * to avoid conflicts with existing animation systems.
 *
 * Features:
 * - Multiple transition types: fade, wipe, dissolve, hwipe
 * - Respects prefers-reduced-motion media query
 * - Configurable duration and easing
 * - Queued transitions to prevent conflicts
 *
 * @module ui/transition-manager
 */

/**
 * Available transition types
 */
export type TransitionType =
  | 'fade'       // Simple fade in/out
  | 'wipe'       // Vertical wipe from top
  | 'dissolve'   // Blur + brightness effect
  | 'hwipe'      // Horizontal wipe from center
  | 'none';      // No transition (instant)

/**
 * Transition configuration options
 */
export interface TransitionOptions {
  /** Transition type */
  type?: TransitionType;
  /** Duration in milliseconds */
  duration?: number;
  /** Custom easing function (CSS) */
  easing?: string;
  /** Callback when transition completes */
  onComplete?: () => void;
}

/**
 * TransitionManager - Handles scene transition effects
 *
 * Per agent-c perspective: Single responsibility for transition effects
 * to prevent conflicts with existing GameRenderer animations.
 *
 * @example
 * ```typescript
 * const manager = new TransitionManager();
 * manager.apply('fade', viewportElement, {
 *   duration: 500,
 *   onComplete: () => console.log('Transition complete')
 * });
 * ```
 */
export class TransitionManager {
  /** Active transition queue (only one transition at a time) */
  private transitioning: boolean = false;

  /** Cached reduced-motion preference */
  private reducedMotion: boolean;

  /** Default transition duration */
  private readonly defaultDuration = 500;

  /**
   * Create a TransitionManager instance.
   */
  constructor() {
    // Check for reduced motion preference
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Listen for changes to reduced motion preference
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.reducedMotion = e.matches;
    });
  }

  /**
   * Apply a transition effect to an element.
   *
   * @param type - Transition type to apply
   * @param element - DOM element to transition
   * @param options - Transition configuration options
   */
  apply(type: TransitionType, element: HTMLElement, options: TransitionOptions = {}): Promise<void> {
    // Respect reduced motion preference
    if (this.reducedMotion) {
      return Promise.resolve();
    }

    // Queue transition if one is already active
    if (this.transitioning) {
      return new Promise((resolve) => {
        setTimeout(() => {
          this.apply(type, element, options).then(resolve);
        }, 100);
      });
    }

    // Handle 'none' transition type
    if (type === 'none') {
      return Promise.resolve();
    }

    this.transitioning = true;

    return new Promise((resolve) => {
      // Build transition class name
      const transitionClass = `transition-${type}`;

      // Add transition class
      element.classList.add('transition-active', transitionClass);

      // Calculate duration
      const duration = options.duration ?? this.defaultDuration;

      // Remove classes after animation completes
      setTimeout(() => {
        element.classList.remove('transition-active', transitionClass);
        this.transitioning = false;

        // Call completion callback if provided
        if (options.onComplete) {
          options.onComplete();
        }

        resolve();
      }, duration);
    });
  }

  /**
   * Check if a transition is currently active.
   */
  isActive(): boolean {
    return this.transitioning;
  }

  /**
   * Cancel any active transition.
   */
  cancel(): void {
    const activeElements = document.querySelectorAll('.transition-active');
    activeElements.forEach((el) => {
      el.classList.remove('transition-active', 'transition-fade', 'transition-wipe', 'transition-dissolve', 'transition-hwipe');
    });
    this.transitioning = false;
  }

  /**
   * Get a random transition type from available options.
   * Useful for variety in scene transitions.
   *
   * @param exclude - Transition types to exclude from random selection
   */
  getRandomTransition(exclude: TransitionType[] = []): TransitionType {
    const available: TransitionType[] = ['fade', 'wipe', 'dissolve', 'hwipe'];
    const filtered = available.filter((t) => !exclude.includes(t));

    if (filtered.length === 0) {
      return 'none';
    }

    return filtered[Math.floor(Math.random() * filtered.length)];
  }
}

/**
 * Singleton instance getter for TransitionManager.
 * Per agent-c perspective: Shared instance prevents multiple managers
 * from conflicting with each other.
 */
let transitionManagerInstance: TransitionManager | null = null;

/**
 * Get the shared TransitionManager instance.
 */
export function getTransitionManager(): TransitionManager {
  if (!transitionManagerInstance) {
    transitionManagerInstance = new TransitionManager();
  }
  return transitionManagerInstance;
}
