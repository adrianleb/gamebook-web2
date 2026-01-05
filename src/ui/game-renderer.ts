/**
 * GameRenderer - DOS UI Shell Renderer
 *
 * Bridges agent-c's Engine with the DOS UI shell.
 * Subscribes to state changes and updates the DOM per STYLE_GUIDE.md.
 *
 * Per agent-c perspective (Issue #33):
 * - Engine emits minimal events; GameRenderer handles renderScope routing
 * - Implements cleanup pattern for memory leak prevention
 * - Uses defensive rendering for missing state properties
 *
 * Per agent-e perspective (Issue #33):
 * - data-testid naming: game-{element}, scene-{id}, choice-{index}, stat-{name}
 * - Performance targets: <100ms/100 renders, single scene <5ms, stat <1ms, inventory <2ms
 *
 * @module ui/game-renderer
 */

import type { Engine, AvailableChoice } from '../engine/engine.js';
import type {
  StateChangeEvent,
  RenderScope,
  SceneData,
  ItemId,
  StatId,
  ReadonlyState,
} from '../engine/types.js';
import { getAudioManager } from './audio-manager.js';
import { getNotificationQueue, type NotificationQueue } from './notification-queue.js';

/**
 * Item metadata from content/items.json
 */
interface ItemMetadata {
  id: string;
  name: string;
  category: string;
  properties?: string[];
  description?: string;
}

/**
 * Item catalog mapping item IDs to metadata
 */
type ItemCatalog = Record<string, ItemMetadata>;

/**
 * Stat metadata from content/stats.json
 */
interface StatMetadata {
  id: string;
  name: string;
  description: string;
}

/**
 * Category order for inventory display (per agent-b's perspective response)
 */
const CATEGORY_ORDER = [
  'Keys',
  'Scripts',
  'Props',
  'Tokens',
  'Artifacts',
  'Tools',
  'Consumables',
  'Misc',
  'Quest',
  'Readables',
];

/**
 * Category icon mapping for inventory items
 */
const CATEGORY_ICONS: Record<string, string> = {
  'Keys': '🔑',
  'Scripts': '📜',
  'Props': '🎭',
  'Tokens': '🎫',
  'Artifacts': '⚱️',
  'Tools': '🔧',
  'Consumables': '🧪',
  'Misc': '📦',
  'Quest': '⭐',
  'Readables': '📘',
};

/**
 * Category colors for fallback icons (per STYLE_GUIDE.md)
 */
const CATEGORY_COLORS: Record<string, string> = {
  'Keys': '#ffd700',
  'Scripts': '#1abc9c',
  'Props': '#9b59b6',
  'Tokens': '#f39c12',
  'Artifacts': '#e74c3c',
  'Tools': '#5dade2',
  'Consumables': '#ff4757',
  'Misc': '#a0a0a0',
  'Quest': '#ffd700',
  'Readables': '#e8e8e8',
};

/**
 * DOM element references for the game UI
 */
interface GameElements {
  /** Main text viewport */
  viewport: HTMLElement | null;
  /** Scene text content element */
  sceneText: HTMLElement | null;
  /** Choices list container */
  choicesList: HTMLElement | null;
  /** Stats panel */
  statsPanel: HTMLElement | null;
  /** Inventory panel */
  inventoryPanel: HTMLElement | null;
  /** Inventory list container */
  inventoryList: HTMLElement | null;
  /** Error overlay */
  errorOverlay: HTMLElement | null;
  /** Error message text */
  errorText: HTMLElement | null;
  /** Loading indicator */
  loadingIndicator: HTMLElement | null;
}

/**
 * Unsubscribe function returned by Engine.onStateChange()
 */
type UnsubscribeFn = () => void;

/**
 * GameRenderer - Connects Engine state changes to DOM updates.
 *
 * Implements renderScope-based routing to avoid unnecessary repaints.
 * Per agent-c's recommendation: cleanup pattern prevents memory leaks.
 *
 * @example
 * ```typescript
 * const engine = new Engine();
 * await engine.initialize();
 *
 * const renderer = new GameRenderer(engine);
 * renderer.initialize();
 *
 * // Later: cleanup to prevent memory leaks
 * renderer.destroy();
 * ```
 */
export class GameRenderer {
  /** Engine instance */
  private engine: Engine;

  /** Audio manager for Phase 4 SFX */
  private audio;

  /** Notification queue for Phase 11 presentation enhancements */
  private notificationQueue: NotificationQueue;

  /** Track previous flags state for quest completion detection (per agent-c perspective) */
  private previousFlags: Set<string> = new Set();

  /** DOM element references */
  private elements: GameElements;

  /** Item catalog loaded from content/items.json */
  private itemCatalog: ItemCatalog;

  /** Stat metadata loaded from content/stats.json */
  private statMetadata: StatMetadata[];

  /** Unsubscribe functions for cleanup */
  private unsubscribers: UnsubscribeFn[];

  /** Max stat value for stat bar rendering */
  private readonly maxStat = 4; // Per stats.json absoluteMax

  /**
   * Create a GameRenderer instance.
   *
   * @param engine - Initialized Engine instance
   */
  constructor(engine: Engine) {
    this.engine = engine;
    this.audio = getAudioManager();
    this.notificationQueue = getNotificationQueue();
    this.unsubscribers = [];
    this.itemCatalog = {};
    this.statMetadata = [];

    // Cache DOM element references
    this.elements = {
      viewport: document.querySelector('[data-test-id="main-text-viewport"]'),
      sceneText: document.querySelector('[data-test-id="scene-text-content"]'),
      choicesList: document.querySelector('[data-test-id="choices-list"]'),
      statsPanel: document.querySelector('[data-test-id="stats-panel"]'),
      inventoryPanel: document.querySelector('[data-test-id="inventory-panel"]'),
      inventoryList: document.querySelector('[data-test-id="inventory-list"]'),
      errorOverlay: document.querySelector('[data-test-id="error-overlay"]'),
      errorText: document.querySelector('[data-test-id="error-message"]'),
      loadingIndicator: document.querySelector('[data-test-id="loading-indicator"]'),
    };
  }

  /**
   * Initialize the renderer.
   * Loads item/stat metadata and subscribes to engine events.
   *
   * Call this after creating the GameRenderer instance.
   */
  async initialize(): Promise<void> {
    try {
      // Load item catalog
      await this.loadItemCatalog();

      // Load stat metadata
      await this.loadStatMetadata();

      // Phase 11: Initialize notification queue
      this.notificationQueue.initialize();

      // Phase 11: Initialize previous flags state for quest completion detection
      const initialState = this.engine.getState();
      this.previousFlags = new Set(initialState.flags);

      // Subscribe to engine state changes
      const unsubscribe = this.engine.onStateChange(
        this.handleStateChange.bind(this)
      );
      this.unsubscribers.push(unsubscribe);

      // Setup keyboard navigation
      this.setupKeyboardNav();

      // Setup audio initialization on first user gesture (Phase 4 Polish)
      this.setupAudioInit();

      // Initial render
      this.renderAll();

      console.log('[GameRenderer] Initialized');
    } catch (error) {
      console.error('[GameRenderer] Initialization failed:', error);
      this.showError('Failed to initialize game renderer. Please reload.');
    }
  }

  /**
   * Setup audio manager initialization on first user gesture.
   *
   * Per agent-c's recommendation: "Initialize AudioManager lazily on
   * first user interaction (any click/keyboard)."
   *
   * Per browser autoplay policies: AudioContext/Audio must be
   * initialized after a user gesture.
   */
  private setupAudioInit(): void {
    const initAudio = () => {
      this.audio.initialize();
      // Remove all listeners after first init
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
      document.removeEventListener('touchstart', initAudio);
    };

    // Listen for first user interaction
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true, passive: true });
  }

  /**
   * Cleanup subscriptions to prevent memory leaks.
   * Per agent-c's recommendation for long-running subscriptions.
   * Phase 11: Also cleanup notification queue.
   *
   * Call this before destroying the renderer (e.g., SPA navigation).
   */
  destroy(): void {
    // Phase 11: Cleanup notification queue
    this.notificationQueue.destroy();

    // Unsubscribe from all engine events
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];

    console.log('[GameRenderer] Destroyed - subscriptions cleaned up');
  }

  /**
   * Handle state change events from Engine.
   * Routes to appropriate render method based on renderScope.
   * Phase 11: Also triggers notifications for quest completions,
   * faction changes, and item acquisitions.
   *
   * @param event - State change event from Engine
   */
  private handleStateChange(event: StateChangeEvent): void {
    console.log('[GameRenderer] State change:', {
      type: event.type,
      path: event.path,
      renderScope: event.renderScope,
      urgency: event.urgency,
    });

    // Phase 11: Handle effect-applied events for notifications
    if (event.type === 'effect-applied') {
      this.handlePhase11Notifications(event);
    }

    // Route based on renderScope (per agent-c's design)
    switch (event.renderScope) {
      case 'scene':
        this.renderScene();
        this.renderChoices();
        break;
      case 'choices':
        this.renderChoices();
        break;
      case 'inventory':
        this.renderInventory();
        break;
      case 'status':
        this.renderStats();
        break;
      case 'all':
        this.renderAll();
        break;
      default:
        console.warn('[GameRenderer] Unknown renderScope:', event.renderScope);
    }
  }

  /**
   * Phase 11: Handle notification triggering for quest completions,
   * faction changes, and item acquisitions.
   *
   * Per Intent #392: Uses event.path/oldValue/newValue from engine,
   * no state diffing needed (per agent-c perspective).
   *
   * @param event - State change event from Engine
   */
  private handlePhase11Notifications(event: StateChangeEvent): void {
    const { path, oldValue, newValue } = event;

    // Quest completion: Detect QUEST_*_COMPLETE flags being set
    // Per agent-c perspective: Use state diffing to detect newly set quest flags
    // since effect-applied event for setFlag only returns path='flags' (generic)
    if (path === 'flags' && newValue === 'set' && oldValue === 'unset') {
      const state = this.engine.getState();
      const newFlags = state.flags;

      // Find quest flags that are in current state but weren't in previous state
      for (const flag of newFlags) {
        if (flag.startsWith('QUEST_') && flag.endsWith('_COMPLETE') && !this.previousFlags.has(flag)) {
          this.notificationQueue.add('quest-complete', {
            ...event,
            path: flag, // Use the actual flag name for display
          });
          // Only show one notification per event batch
          break;
        }
      }

      // Update previous flags to current state
      this.previousFlags = new Set(newFlags);
    }

    // Faction change: Detect factions.* changes
    if (path.startsWith('factions.') && typeof oldValue === 'number' && typeof newValue === 'number') {
      const diff = newValue - oldValue;
      if (diff !== 0) {
        this.notificationQueue.add('faction-change', event);
        // Also create floating indicator from stats panel
        this.createFactionIndicator(path, diff);
      }
    }

    // Item acquisition: Detect inventory.* additions
    if (path.startsWith('inventory.') && typeof newValue === 'number') {
      const oldCount = typeof oldValue === 'number' ? oldValue : 0;
      if (newValue > oldCount) {
        this.notificationQueue.add('item-acquired', event);
      }
    }
  }

  /**
   * Phase 11: Create floating faction change indicator from stats panel.
   * Animates from the stats panel location and floats up.
   *
   * @param path - Faction path (e.g., "factions.preservationist")
   * @param diff - Faction change amount (positive or negative)
   */
  private createFactionIndicator(path: string, diff: number): void {
    const statsPanel = this.elements.statsPanel;
    if (!statsPanel) {
      return;
    }

    // Get faction name from path
    const factionName = path.replace('factions.', '');

    // Create indicator element
    const indicator = document.createElement('div');
    indicator.className = `faction-indicator ${diff >= 0 ? 'positive' : 'negative'}`;
    indicator.textContent = `${diff >= 0 ? '+' : ''}${diff}`;

    // Position near stats panel
    const rect = statsPanel.getBoundingClientRect();
    indicator.style.left = `${rect.right + 10}px`;
    indicator.style.top = `${rect.top + 20}px`;

    // Append to body
    document.body.appendChild(indicator);

    // Remove after animation completes (2 seconds)
    setTimeout(() => {
      indicator.remove();
    }, 2000);
  }

  /**
   * Render all UI components.
   * Used for initial render and full re-renders.
   */
  private renderAll(): void {
    this.renderScene();
    this.renderChoices();
    this.renderStats();
    this.renderInventory();
  }

  /**
   * Render scene text to viewport.
   * Updates scene.title and scene.text with DOS-style transition.
   *
   * Per agent-e: performance target <5ms per render.
   * Phase 4 Polish: Added audio SFX on scene load.
   */
  private renderScene(): void {
    const startTime = performance.now();

    const scene = this.engine.getCurrentScene();
    const sceneTextEl = this.elements.sceneText;
    const viewportEl = this.elements.viewport;

    if (!scene || !sceneTextEl || !viewportEl) {
      console.error('[GameRenderer] renderScene: Missing scene or DOM elements');
      return;
    }

    // Defensive validation (per agent-c's recommendation)
    if (!scene.text) {
      console.warn('[GameRenderer] Scene has no text:', scene.id);
      sceneTextEl.textContent = '[Scene text missing]';
      return;
    }

    // Phase 4 Polish: Play scene load SFX
    this.audio.play('scene-load');

    // Add transition class for DOS-style fade
    viewportEl.classList.add('transitioning');

    // Update text at midpoint of transition
    setTimeout(() => {
      // Parse scene text for formatting (support paragraphs, bold, italic)
      sceneTextEl.innerHTML = this.parseSceneText(scene.text, scene.title);
    }, 250);

    // Remove transition class
    setTimeout(() => {
      viewportEl.classList.remove('transitioning');
    }, 500);

    const elapsed = performance.now() - startTime;
    if (elapsed > 5) {
      console.warn('[GameRenderer] renderScene exceeded 5ms target:', elapsed);
    }
  }

  /**
   * Parse scene text with DOS formatting support.
   * Converts markdown-style formatting to HTML spans.
   *
   * @param text - Scene text content
   * @param title - Scene title (optional heading)
   * @returns HTML string with formatted spans
   */
  private parseSceneText(text: string, title?: string): string {
    let html = '';

    // Add title if present
    if (title) {
      html += `<h2 class="scene-title" data-test-id="scene-title">${this.escapeHtml(title)}</h2>`;
    }

    // Split into paragraphs
    const paragraphs = text.split('\n\n');

    for (const paragraph of paragraphs) {
      if (!paragraph.trim()) continue;

      // Handle speaker prefixes (SPEAKER:)
      let processed = paragraph;
      if (processed.match(/^[A-Z\s]+:/)) {
        const match = processed.match(/^([A-Z\s]+:)/);
        if (match) {
          const speaker = match[1].replace(':', '');
          const rest = processed.substring(match[1].length);
          processed = `<span class="speaker">${speaker}</span>: "${rest}"`;
        }
      }

      // Bold: **text** or <strong>
      processed = processed.replace(/\*\*([^*]+)\*\*/g, '<span class="bold">$1</span>');
      processed = processed.replace(/<strong>([^<]+)<\/strong>/g, '<span class="bold">$1</span>');

      // Italic: *text* or <em>
      processed = processed.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<span class="italic">$1</span>');
      processed = processed.replace(/<em>([^<]+)<\/em>/g, '<span class="italic">$1</span>');

      // Faction coloring: [[Preservationist]], [[Revisor]]
      processed = processed.replace(
        /\[\[Preservationist\]\]/gi,
        '<span class="faction-preservationist">The Preservationists</span>'
      );
      processed = processed.replace(
        /\[\[Revisors?\]\]/gi,
        '<span class="faction-revisor">The Revisors</span>'
      );

      html += `<p>${processed}</p>`;
    }

    return html;
  }

  /**
   * Escape HTML to prevent XSS.
   *
   * @param text - Text to escape
   * @returns Escaped HTML string
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Render choices panel with disabled styling.
   * Per agent-b's perspective: disabledHint shows for gated choices.
   *
   * Per agent-e: performance target <5ms per render.
   */
  private renderChoices(): void {
    const startTime = performance.now();

    const choices = this.engine.getAvailableChoices();
    const listEl = this.elements.choicesList;

    if (!listEl) {
      console.error('[GameRenderer] renderChoices: Missing choices list element');
      return;
    }

    // Clear existing choices
    listEl.innerHTML = '';

    choices.forEach((choice: AvailableChoice, index: number) => {
      const li = document.createElement('li');
      li.setAttribute('data-test-id', `choice-${index}`);
      li.setAttribute('data-choice-index', String(index));

      const button = document.createElement('button');
      button.className = 'choice-button';
      button.setAttribute('data-choice-number', String(index + 1));
      button.setAttribute('data-choice-index', String(index));
      button.setAttribute('data-test-id', `choice-button-${index}`);

      // Set choice text
      button.textContent = choice.choice.label;

      if (choice.state === 'enabled' || choice.state === 'risky') {
        button.setAttribute('aria-label', `Choice ${index + 1}: ${choice.choice.label}`);
        button.addEventListener('click', () => this.handleChoice(choice.index));
      } else {
        // Disabled choice with hint
        button.disabled = true;
        button.setAttribute('aria-disabled', 'true');

        const hint = choice.disabledHint || 'Locked';
        button.setAttribute('data-disabled-hint', hint);
        button.setAttribute(
          'aria-label',
          `Choice ${index + 1}: ${choice.choice.label} — ${hint}`
        );

        // Add sr-only text for screen readers
        const srText = document.createElement('span');
        srText.className = 'sr-only';
        srText.textContent = ` (${hint})`;
        button.appendChild(srText);
      }

      li.appendChild(button);
      listEl.appendChild(li);
    });

    // Update keyboard navigation
    this.updateChoiceTabIndexes();

    const elapsed = performance.now() - startTime;
    if (elapsed > 5) {
      console.warn('[GameRenderer] renderChoices exceeded 5ms target:', elapsed);
    }
  }

  /**
   * Render stats panel with dynamic stat bars.
   * Per agent-e: stat bar segments with aria-valuenow for accessibility.
   *
   * Per agent-e: performance target <1ms per render.
   */
  private renderStats(): void {
    const startTime = performance.now();

    const state = this.engine.getState();
    const panel = this.elements.statsPanel;

    if (!panel) {
      console.error('[GameRenderer] renderStats: Missing stats panel element');
      return;
    }

    // Defensive validation (per agent-c's recommendation)
    if (!state.stats || typeof state.stats !== 'object') {
      console.error('[GameRenderer] Invalid stats state:', state.stats);
      this.showError('Stats data corrupted. Please reload.');
      return;
    }

    // Clear existing stats
    const header = panel.querySelector('.panel-header');
    panel.innerHTML = '';
    if (header) {
      panel.appendChild(header);
    }

    // Render each stat from metadata
    for (const stat of this.statMetadata) {
      const value = state.stats[stat.id] ?? 0;
      const clampedValue = Math.max(0, Math.min(this.maxStat, value));

      // Stat row with label and value
      const statRow = document.createElement('div');
      statRow.className = 'stat-row mt-3';
      statRow.setAttribute('data-test-id', `stat-${stat.id}`);

      const label = document.createElement('span');
      label.className = 'stat-label';
      label.textContent = stat.name;

      const valueSpan = document.createElement('span');
      valueSpan.className = 'stat-value';
      valueSpan.textContent = `${clampedValue}/${this.maxStat}`;
      valueSpan.setAttribute('data-test-id', `stat-${stat.id}-value`);

      statRow.appendChild(label);
      statRow.appendChild(valueSpan);

      // Stat bar with segments
      const statBar = document.createElement('div');
      statBar.className = 'stat-bar stat-bar-animated';
      statBar.setAttribute('data-stat-value', String(clampedValue));
      statBar.setAttribute('data-stat-max', String(this.maxStat));
      statBar.setAttribute('role', 'progressbar');
      statBar.setAttribute('aria-label', `${stat.name} stat: ${clampedValue} out of ${this.maxStat}`);
      statBar.setAttribute('aria-valuenow', String(clampedValue));
      statBar.setAttribute('aria-valuemin', '0');
      statBar.setAttribute('aria-valuemax', String(this.maxStat));
      statBar.setAttribute('data-test-id', `stat-${stat.id}-bar`);

      // Create filled and empty segments
      for (let i = 0; i < this.maxStat; i++) {
        const segment = document.createElement('div');
        segment.className = 'stat-bar-segment';
        if (i < clampedValue) {
          segment.classList.add('filled');
        }
        statBar.appendChild(segment);
      }

      panel.appendChild(statRow);
      panel.appendChild(statBar);
    }

    const elapsed = performance.now() - startTime;
    if (elapsed > 1) {
      console.warn('[GameRenderer] renderStats exceeded 1ms target:', elapsed);
    }
  }

  /**
   * Render inventory panel with category grouping.
   * Per agent-b: category ordering for consistent item display.
   *
   * Per agent-e: performance target <2ms per render.
   */
  private renderInventory(): void {
    const startTime = performance.now();

    const state = this.engine.getState();
    const listEl = this.elements.inventoryList;
    const panel = this.elements.inventoryPanel;

    if (!listEl || !panel) {
      console.error('[GameRenderer] renderInventory: Missing inventory elements');
      return;
    }

    // Defensive validation (per agent-c's recommendation)
    if (!(state.inventory instanceof Map)) {
      console.error('[GameRenderer] Invalid inventory state:', state.inventory);
      this.showError('Inventory data corrupted. Please reload.');
      return;
    }

    // Clear existing inventory
    listEl.innerHTML = '';

    // Convert Map to array and filter items with quantity > 0
    const items: Array<{ id: ItemId; quantity: number; metadata: ItemMetadata }> = [];
    for (const [itemId, quantity] of state.inventory.entries()) {
      if (quantity > 0 && this.itemCatalog[itemId]) {
        items.push({
          id: itemId,
          quantity,
          metadata: this.itemCatalog[itemId],
        });
      }
    }

    // Show empty state if no items
    if (items.length === 0) {
      const emptyMsg = document.createElement('li');
      emptyMsg.className = 'inventory-empty';
      emptyMsg.textContent = '— Empty —';
      emptyMsg.setAttribute('data-test-id', 'inventory-empty');
      listEl.appendChild(emptyMsg);

      // Update panel header
      const header = panel.querySelector('.panel-header');
      if (header) {
        header.textContent = 'Inventory';
      }
      return;
    }

    // Group items by category
    const itemsByCategory: Record<string, typeof items> = {};
    for (const item of items) {
      const category = this.capitalizeCategory(item.metadata.category);
      if (!itemsByCategory[category]) {
        itemsByCategory[category] = [];
      }
      itemsByCategory[category].push(item);
    }

    // Sort categories by defined order, then alphabetically
    const sortedCategories = Object.keys(itemsByCategory).sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a);
      const indexB = CATEGORY_ORDER.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });

    // Render items by category
    sortedCategories.forEach(category => {
      const categoryItems = itemsByCategory[category].sort((a, b) =>
        a.metadata.name.localeCompare(b.metadata.name)
      );

      // Category header (only if multiple categories)
      if (sortedCategories.length > 1) {
        const categoryHeader = document.createElement('li');
        categoryHeader.className = 'inventory-category-header';
        categoryHeader.textContent = `${category} (${categoryItems.length})`;
        categoryHeader.setAttribute('data-test-id', `category-${category.toLowerCase()}`);
        listEl.appendChild(categoryHeader);
      }

      // Render items in this category
      categoryItems.forEach(item => {
        const itemLi = document.createElement('li');
        itemLi.className = 'inventory-item inventory-item-animated';
        itemLi.setAttribute('data-test-id', `item-${item.id}`);
        itemLi.setAttribute('data-item-id', item.id);

        // Icon - use category icon or fallback
        const icon = document.createElement('span');
        icon.className = 'item-icon';
        const categoryIcon = CATEGORY_ICONS[category];
        if (categoryIcon) {
          icon.textContent = categoryIcon;
        } else {
          // Fallback: colored box with first 2 letters
          icon.textContent = item.id.substring(0, 2).toUpperCase();
          icon.className += ' item-icon-fallback';
          (icon as HTMLElement).style.backgroundColor = CATEGORY_COLORS[category] || '#a0a0a0';
        }

        // Item name
        const name = document.createElement('span');
        name.className = 'item-name';
        name.textContent = item.metadata.name;
        name.setAttribute('data-test-id', `item-name-${item.id}`);

        // Category (screen reader only)
        const categorySpan = document.createElement('span');
        categorySpan.className = 'item-category sr-only';
        categorySpan.textContent = item.metadata.category;

        itemLi.appendChild(icon);
        itemLi.appendChild(name);
        itemLi.appendChild(categorySpan);

        // Quantity badge for stackable items
        if (item.quantity > 1) {
          const quantity = document.createElement('span');
          quantity.className = 'item-quantity';
          quantity.textContent = item.quantity > 99 ? '99+' : `x${item.quantity}`;
          quantity.setAttribute('data-test-id', `item-quantity-${item.id}`);
          itemLi.appendChild(quantity);
        }

        listEl.appendChild(itemLi);
      });
    });

    // Update panel header with count
    const header = panel.querySelector('.panel-header');
    if (header) {
      header.textContent = `Inventory (${items.length})`;
    }

    const elapsed = performance.now() - startTime;
    if (elapsed > 2) {
      console.warn('[GameRenderer] renderInventory exceeded 2ms target:', elapsed);
    }
  }

  /**
   * Handle choice selection.
   * Triggers engine state transition with visual and audio feedback.
   *
   * Phase 4 Polish: Added choice-select SFX playback.
   *
   * @param choiceIndex - Index of selected choice
   */
  private async handleChoice(choiceIndex: number): Promise<void> {
    try {
      console.log('[GameRenderer] Choice selected:', choiceIndex);

      // Phase 4 Polish: Play choice selection SFX
      this.audio.play('choice-select');

      // Flash animation on selected button
      const button = document.querySelector(`[data-choice-index="${choiceIndex}"] .choice-button`);
      if (button instanceof HTMLElement) {
        button.classList.add('selected');
      }

      // Make choice via engine
      await this.engine.makeChoice(choiceIndex);
    } catch (error) {
      console.error('[GameRenderer] Choice failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';

      // Phase 4 Polish: Play error SFX
      this.audio.play('error');

      this.showError(`Failed to make choice: ${message}`);
    }
  }

  /**
   * Setup keyboard navigation per STYLE_GUIDE.md.
   * Arrow keys for navigation, number keys for quick select.
   */
  private setupKeyboardNav(): void {
    const choicesList = this.elements.choicesList;
    if (!choicesList) return;

    choicesList.addEventListener('keydown', (e: KeyboardEvent) => {
      const allButtons = Array.from(choicesList.querySelectorAll('.choice-button'));
      const enabledButtons = allButtons.filter(
        btn => !(btn instanceof HTMLButtonElement) || !btn.disabled
      );
      const currentFocused = document.activeElement;
      const currentIndex = enabledButtons.indexOf(currentFocused as HTMLElement);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.focusNextChoice(enabledButtons, currentIndex);
          break;

        case 'ArrowUp':
          e.preventDefault();
          this.focusPreviousChoice(enabledButtons, currentIndex);
          break;

        case 'Home':
          e.preventDefault();
          if (enabledButtons.length > 0) (enabledButtons[0] as HTMLElement).focus();
          break;

        case 'End':
          e.preventDefault();
          if (enabledButtons.length > 0)
            (enabledButtons[enabledButtons.length - 1] as HTMLElement).focus();
          break;

        case 'Escape':
          // Toggle inventory panel
          const inventoryPanel = this.elements.inventoryPanel;
          if (inventoryPanel) {
            inventoryPanel.classList.toggle('collapsed');
          }
          break;

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          // Quick select choice
          const choiceIndex = parseInt(e.key) - 1;
          const choices = this.engine.getAvailableChoices();
          const choice = choices[choiceIndex];
          if (choice && (choice.state === 'enabled' || choice.state === 'risky')) {
            this.handleChoice(choiceIndex);
          }
          e.preventDefault();
          break;
      }
    });
  }

  /**
   * Focus next choice in list (wraps to first).
   */
  private focusNextChoice(enabledButtons: Element[], currentIndex: number): void {
    let nextIndex = currentIndex + 1;
    if (nextIndex >= enabledButtons.length) nextIndex = 0;
    if (enabledButtons[nextIndex]) (enabledButtons[nextIndex] as HTMLElement).focus();
  }

  /**
   * Focus previous choice in list (wraps to last).
   */
  private focusPreviousChoice(enabledButtons: Element[], currentIndex: number): void {
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = enabledButtons.length - 1;
    if (enabledButtons[prevIndex]) (enabledButtons[prevIndex] as HTMLElement).focus();
  }

  /**
   * Update tab indexes for keyboard navigation.
   * Only enabled choices are focusable via Tab.
   */
  private updateChoiceTabIndexes(): void {
    const allButtons = this.elements.choicesList?.querySelectorAll('.choice-button');
    if (!allButtons) return;

    allButtons.forEach(btn => {
      if (btn instanceof HTMLButtonElement) {
        btn.tabIndex = -1;
      }
    });

    const enabledButtons = Array.from(allButtons).filter(
      btn => !(btn instanceof HTMLButtonElement) || !btn.disabled
    );
    enabledButtons.forEach(btn => {
      if (btn instanceof HTMLButtonElement) {
        btn.tabIndex = 0;
      }
    });
  }

  /**
   * Show error message in overlay.
   *
   * @param message - Error message to display
   */
  private showError(message: string): void {
    const overlay = this.elements.errorOverlay;
    const errorText = this.elements.errorText;

    if (overlay && errorText) {
      errorText.textContent = message;
      overlay.classList.add('visible');
      overlay.setAttribute('aria-hidden', 'false');
    }
  }

  /**
   * Load item catalog from content/items.json.
   */
  private async loadItemCatalog(): Promise<void> {
    try {
      const response = await fetch('/content/items.json');
      if (!response.ok) {
        throw new Error(`Failed to load items.json: ${response.statusText}`);
      }
      const data = await response.json();

      // Flatten all item arrays into a single catalog
      this.itemCatalog = {};
      for (const category of Object.keys(data.items)) {
        const items: ItemMetadata[] = data.items[category];
        for (const item of items) {
          this.itemCatalog[item.id] = item;
        }
      }

      console.log('[GameRenderer] Loaded item catalog:', Object.keys(this.itemCatalog).length, 'items');
    } catch (error) {
      console.error('[GameRenderer] Failed to load item catalog:', error);
      // Continue with empty catalog - inventory will show IDs as fallback
    }
  }

  /**
   * Load stat metadata from content/stats.json.
   */
  private async loadStatMetadata(): Promise<void> {
    try {
      const response = await fetch('/content/stats.json');
      if (!response.ok) {
        throw new Error(`Failed to load stats.json: ${response.statusText}`);
      }
      const data = await response.json();

      this.statMetadata = data.stats || [];
      console.log('[GameRenderer] Loaded stat metadata:', this.statMetadata.length, 'stats');
    } catch (error) {
      console.error('[GameRenderer] Failed to load stat metadata:', error);
      // Use default stats as fallback
      this.statMetadata = [
        { id: 'script', name: 'Script', description: 'Knowledge of narrative patterns' },
        { id: 'stagePresence', name: 'Stage Presence', description: 'Force of personality' },
        { id: 'improv', name: 'Improv', description: 'Adaptability and quick thinking' },
      ];
    }
  }

  /**
   * Capitalize category name for display.
   * Converts 'prop' -> 'Props', 'script' -> 'Scripts', etc.
   */
  private capitalizeCategory(category: string): string {
    // Special cases for pluralization
    const pluralMap: Record<string, string> = {
      'prop': 'Props',
      'script': 'Scripts',
      'token': 'Tokens',
      'key': 'Keys',
      'artifact': 'Artifacts',
      'tool': 'Tools',
      'consumable': 'Consumables',
    };

    if (pluralMap[category]) {
      return pluralMap[category];
    }

    // Default: capitalize first letter
    return category.charAt(0).toUpperCase() + category.slice(1);
  }
}
