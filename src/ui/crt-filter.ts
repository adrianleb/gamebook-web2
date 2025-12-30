/**
 * CRT Filter — Phase 4 Polish Visual Effect
 *
 * Per agent-e's accessibility perspective:
 * - Desktop-only (disabled on mobile viewports < 768px)
 * - Respects prefers-reduced-motion
 * - Toggleable for user preference
 *
 * Per agent-d's DOS Experience perspective:
 * - Scanlines for retro CRT look
 * - Subtle chromatic aberration
 * - Screen curvature effect
 *
 * @module ui/crt-filter
 */

/**
 * CRT filter configuration
 */
interface CRTFilterConfig {
  /** Whether the filter is enabled by default */
  defaultEnabled?: boolean;
  /** Minimum viewport width for CRT filter (mobile disabled below this) */
  minViewportWidth?: number;
  /** Whether to respect prefers-reduced-motion */
  respectReducedMotion?: boolean;
}

/**
 * CRT Filter - Retro DOS monitor visual effect.
 *
 * Applies scanlines, chromatic aberration, and screen curvature
 * to simulate a CRT monitor. Desktop-only with accessibility fallbacks.
 *
 * Per agent-e: "CRT filter desktop-only with reduced-motion respect."
 *
 * @example
 * ```typescript
 * const crt = new CRTFilter();
 * crt.initialize();
 *
 * // Toggle on/off
 * crt.toggle();
 *
 * // Check state
 * if (crt.isEnabled()) {
 *   console.log('CRT filter active');
 * }
 * ```
 */
export class CRTFilter {
  /** Whether the filter is currently enabled */
  private enabled: boolean;

  /** Minimum viewport width for enabling CRT effect */
  private minViewportWidth: number;

  /** Container element for CRT overlay */
  private overlay: HTMLElement | null = null;

  /** Whether to respect reduced motion preference */
  private respectReducedMotion: boolean;

  /** Viewport change listener for responsive behavior */
  private mediaQuery: MediaQueryList | null = null;

  /** Reduced motion query listener */
  private reducedMotionQuery: MediaQueryList | null = null;

  /**
   * Create a CRTFilter instance.
   *
   * @param config - Optional configuration
   */
  constructor(config: CRTFilterConfig = {}) {
    this.minViewportWidth = config.minViewportWidth ?? 768;
    this.respectReducedMotion = config.respectReducedMotion ?? true;

    // Check if we should enable by default
    let defaultEnabled = config.defaultEnabled ?? false;

    // Disable on mobile or if prefers-reduced-motion
    if (window.innerWidth < this.minViewportWidth) {
      defaultEnabled = false;
    }

    if (this.respectReducedMotion &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      defaultEnabled = false;
    }

    this.enabled = defaultEnabled;
  }

  /**
   * Initialize the CRT filter.
   *
   * Creates the overlay element and sets up responsive listeners.
   * Should be called after DOM is ready.
   */
  initialize(): void {
    if (this.overlay) {
      return; // Already initialized
    }

    // Create overlay element
    this.createOverlay();

    // Setup responsive behavior
    this.setupResponsiveListeners();

    // Apply initial state
    if (this.enabled && this.isViewportAllowed()) {
      this.apply();
    }

    console.log('[CRTFilter] Initialized', {
      enabled: this.enabled,
      minViewportWidth: this.minViewportWidth,
      respectReducedMotion: this.respectReducedMotion,
    });
  }

  /**
   * Enable the CRT filter.
   *
   * Does nothing if viewport is too small or reduced motion is preferred.
   */
  enable(): void {
    if (!this.isViewportAllowed()) {
      console.warn('[CRTFilter] Cannot enable: viewport too small or prefers reduced motion');
      return;
    }

    this.enabled = true;
    this.apply();
  }

  /**
   * Disable the CRT filter.
   */
  disable(): void {
    this.enabled = false;
    this.remove();
  }

  /**
   * Toggle the CRT filter on/off.
   */
  toggle(): void {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * Check if the CRT filter is currently enabled.
   */
  isEnabled(): boolean {
    return this.enabled && this.isViewportAllowed();
  }

  /**
   * Check if current viewport allows CRT filter.
   *
   * Per agent-e: "Desktop-only with fallback detection."
   */
  private isViewportAllowed(): boolean {
    // Check viewport width
    if (window.innerWidth < this.minViewportWidth) {
      return false;
    }

    // Check reduced motion preference
    if (this.respectReducedMotion &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }

    return true;
  }

  /**
   * Create the CRT overlay element.
   */
  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.className = 'crt-overlay';
    this.overlay.setAttribute('data-test-id', 'crt-overlay');
    this.overlay.setAttribute('aria-hidden', 'true');

    // Apply inline styles for CRT effect
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '9998',
      opacity: '0',
      transition: 'opacity 0.3s ease',
    });

    document.body.appendChild(this.overlay);
  }

  /**
   * Apply the CRT filter effect.
   */
  private apply(): void {
    if (!this.overlay || !this.enabled) {
      return;
    }

    // Apply CRT effect via inline styles
    Object.assign(this.overlay.style, {
      opacity: '1',
      background: `
        /* Scanlines */
        linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0) 50%,
          rgba(0, 0, 0, 0.1) 50%
        ),
        linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0) 50%,
          rgba(0, 0, 0, 0.1) 50%
        )
      `,
      backgroundSize: '4px 4px, 2px 2px',
      boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.3)',
    });

    // Add CRT class to body for additional CSS effects
    document.body.classList.add('crt-enabled');
  }

  /**
   * Remove the CRT filter effect.
   */
  private remove(): void {
    if (!this.overlay) {
      return;
    }

    this.overlay.style.opacity = '0';
    document.body.classList.remove('crt-enabled');
  }

  /**
   * Setup responsive behavior listeners.
   *
   * Per agent-e: "Mobile viewport < 768px disables CRT filter."
   */
  private setupResponsiveListeners(): void {
    // Watch for viewport size changes
    this.mediaQuery = window.matchMedia(`(min-width: ${this.minViewportWidth}px)`);

    this.mediaQuery.addEventListener('change', (e) => {
      if (!e.matches && this.enabled) {
        // Viewport became too small - disable
        this.remove();
      } else if (e.matches && this.enabled) {
        // Viewport became large enough - re-enable
        this.apply();
      }
    });

    // Watch for reduced motion preference changes
    if (this.respectReducedMotion) {
      this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

      this.reducedMotionQuery.addEventListener('change', (e) => {
        if (e.matches && this.enabled) {
          // User prefers reduced motion - disable
          this.remove();
        } else if (!e.matches && this.enabled) {
          // Reduced motion disabled - re-enable
          this.apply();
        }
      });
    }
  }

  /**
   * Cleanup resources.
   *
   * Call this when destroying the CRT filter to prevent memory leaks.
   */
  destroy(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }

    document.body.classList.remove('crt-enabled');

    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', () => {});
      this.mediaQuery = null;
    }

    if (this.reducedMotionQuery) {
      this.reducedMotionQuery.removeEventListener('change', () => {});
      this.reducedMotionQuery = null;
    }

    console.log('[CRTFilter] Destroyed');
  }
}

/**
 * Singleton instance for global access.
 */
let globalCRTFilter: CRTFilter | null = null;

/**
 * Get the global CRTFilter instance.
 *
 * Creates the instance if it doesn't exist.
 *
 * @returns Global CRTFilter instance
 */
export function getCRTFilter(): CRTFilter {
  if (!globalCRTFilter) {
    globalCRTFilter = new CRTFilter();
  }
  return globalCRTFilter;
}

/**
 * Reset the global CRTFilter instance.
 *
 * Useful for testing or cleanup.
 */
export function resetCRTFilter(): void {
  if (globalCRTFilter) {
    globalCRTFilter.destroy();
  }
  globalCRTFilter = null;
}
