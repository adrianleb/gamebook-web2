/**
 * SceneHeader - DOS breadcrumb path display
 *
 * Per agent-d (Intent #af3d7379): Scene header displaying DOS-style breadcrumb
 * path (C:\UNDERSTAGE\ACT1\HUB0) with progressive disclosure to avoid spoilers.
 *
 * Features:
 * - Parses scene ID to build breadcrumb path
 * - Progressive disclosure for long paths (per agent-b perspective)
 * - WCAG AA accessible with aria-label
 * - 44x44px touch targets where interactive
 *
 * @module ui/scene-header
 */

import type { SceneData } from '../engine/types.js';

/**
 * Breadcrumb segment for display
 */
interface BreadcrumbSegment {
  label: string;
  ariaLabel?: string;
}

/**
 * SceneHeader - Manages DOS breadcrumb path display
 *
 * @example
 * ```typescript
 * const header = new SceneHeader(viewportElement);
 * header.update(scene);
 * ```
 */
export class SceneHeader {
  /** Parent container element */
  private parentContainer: HTMLElement | null = null;

  /** Header container element */
  private container: HTMLElement | null = null;

  /** Breadcrumb element */
  private breadcrumbElement: HTMLElement | null = null;

  /** Title element */
  private titleElement: HTMLElement | null = null;

  /**
   * Create a SceneHeader instance.
   *
   * @param parentContainer - Parent element (typically text-viewport)
   */
  constructor(parentContainer: HTMLElement) {
    this.parentContainer = parentContainer;
    this.initialize();
  }

  /**
   * Initialize the scene header by creating DOM elements.
   */
  private initialize(): void {
    if (!this.parentContainer) {
      return;
    }

    // Create scene header container
    this.container = document.createElement('header');
    this.container.className = 'scene-header';
    this.container.setAttribute('data-test-id', 'scene-header');
    this.container.setAttribute('role', 'banner');
    this.container.setAttribute('aria-label', 'Scene location');

    // Create breadcrumb element
    this.breadcrumbElement = document.createElement('div');
    this.breadcrumbElement.className = 'scene-breadcrumb';
    this.breadcrumbElement.setAttribute('data-test-id', 'scene-breadcrumb');
    this.breadcrumbElement.setAttribute('aria-label', 'Current location path');

    this.container.appendChild(this.breadcrumbElement);

    // Create title element
    this.titleElement = document.createElement('div');
    this.titleElement.className = 'scene-header-title';
    this.titleElement.setAttribute('data-test-id', 'scene-header-title');
    this.titleElement.setAttribute('aria-live', 'polite');

    this.container.appendChild(this.titleElement);

    // Append header to parent container
    this.parentContainer.appendChild(this.container);
  }

  /**
   * Update the header with new scene data.
   *
   * @param scene - Current scene data
   */
  update(scene: SceneData): void {
    if (!this.container || !this.breadcrumbElement || !this.titleElement) {
      return;
    }

    // Build breadcrumb path
    const segments = this.buildBreadcrumbPath(scene);
    this.renderBreadcrumb(segments);

    // Update title
    this.titleElement.textContent = scene.title;
    this.titleElement.setAttribute('aria-label', `Scene: ${scene.title}`);
  }

  /**
   * Build breadcrumb path from scene ID.
   * Parses sc_ACT_HUB_SEQ into DOS path segments.
   *
   * @param scene - Scene data
   * @returns Array of breadcrumb segments
   */
  private buildBreadcrumbPath(scene: SceneData): BreadcrumbSegment[] {
    const segments: BreadcrumbSegment[] = [];

    // Root: C:
    segments.push({ label: 'C:', ariaLabel: 'Root drive' });

    // Game folder: UNDERSTAGE
    segments.push({ label: 'UNDERSTAGE', ariaLabel: 'The Understage game' });

    // Parse scene ID for act and hub
    const match = scene.id.match(/^sc_(\d+)_(\d+)_/);
    if (match) {
      const act = match[1];
      const hub = match[2];

      // Act folder: ACT1, ACT2, ACT3
      const actNum = parseInt(act, 10);
      if (actNum >= 1 && actNum <= 3) {
        segments.push({
          label: `ACT${actNum}`,
          ariaLabel: `Act ${actNum}`
        });
      }

      // Hub folder: HUB0, HUB1, etc.
      const hubNum = parseInt(hub, 10);
      if (hubNum >= 0) {
        // Use HUB{N} format for breadcrumb
        const hubLabel = `HUB${hubNum}`;
        segments.push({
          label: hubLabel,
          ariaLabel: hubLabel
        });
      }
    } else {
      // Fallback for scenes that don't match pattern
      segments.push({
        label: 'UNKNOWN',
        ariaLabel: 'Unknown location'
      });
    }

    return segments;
  }

  /**
   * Render breadcrumb path to DOM.
   * Implements progressive disclosure for long paths (per agent-b).
   *
   * @param segments - Breadcrumb segments to render
   */
  private renderBreadcrumb(segments: BreadcrumbSegment[]): void {
    const breadcrumbEl = this.breadcrumbElement;
    if (!breadcrumbEl) {
      return;
    }

    // Clear existing breadcrumb
    breadcrumbEl.innerHTML = '';

    // Progressive disclosure: show max 4 segments
    // Format: C: > UNDERSTAGE > ACT1 > HUB0
    const maxSegments = 4;
    const displaySegments = segments.slice(-maxSegments);

    // Add ellipsis if segments were truncated
    if (segments.length > maxSegments) {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'breadcrumb-segment progressive-hidden';
      ellipsis.textContent = '...';
      ellipsis.setAttribute('aria-hidden', 'true');
      breadcrumbEl.appendChild(ellipsis);
    }

    // Render each segment
    displaySegments.forEach((segment, index) => {
      // Add separator (except for first segment)
      if (index > 0 || segments.length > maxSegments) {
        const separator = document.createElement('span');
        separator.className = 'breadcrumb-separator';
        separator.textContent = '\\';
        separator.setAttribute('aria-hidden', 'true');
        breadcrumbEl.appendChild(separator);
      }

      // Create segment element
      const segmentEl = document.createElement('span');
      segmentEl.className = 'breadcrumb-segment progressive-visible';
      segmentEl.textContent = segment.label;

      if (segment.ariaLabel) {
        segmentEl.setAttribute('aria-label', segment.ariaLabel);
      }

      breadcrumbEl.appendChild(segmentEl);
    });

    // Update full path for screen readers
    const fullPath = segments.map(s => s.label).join('\\');
    breadcrumbEl.setAttribute('aria-label', `Location: ${fullPath}`);
  }

  /**
   * Get the container element.
   */
  getElement(): HTMLElement | null {
    return this.container;
  }

  /**
   * Destroy the header and cleanup DOM.
   */
  destroy(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.breadcrumbElement = null;
    this.titleElement = null;
  }
}
