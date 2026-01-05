/**
 * Notification Queue Manager
 *
 * Manages UI notification queue with FIFO eviction and priority handling.
 * Per agent-e perspective (Intent #392): Handles rapid-event stress testing,
 * queue overflow scenarios, and memory leak prevention.
 *
 * Queue Behavior:
 * - Max 10 concurrent notifications
 * - FIFO eviction when queue is full
 * - Quest completion toasts take priority over item pickups
 * - Auto-dismiss after 5 seconds
 *
 * @module ui/notification-queue
 */

import type { StateChangeEvent } from '../engine/types.js';

/**
 * Notification types with priority levels.
 * Higher priority = displayed first, displaces lower priority when full.
 */
export type NotificationType = 'quest-complete' | 'faction-change' | 'item-acquired';

/**
 * Notification priority levels (higher = more important).
 */
const PRIORITY_LEVELS: Record<NotificationType, number> = {
  'quest-complete': 3,  // Highest priority
  'faction-change': 2,  // Medium priority
  'item-acquired': 1,   // Lowest priority
};

/**
 * Queued notification data.
 */
export interface QueuedNotification {
  /** Unique notification ID */
  id: string;
  /** Notification type */
  type: NotificationType;
  /** State change event that triggered this notification */
  event: StateChangeEvent;
  /** Queue position timestamp */
  timestamp: number;
  /** Priority level */
  priority: number;
  /** Whether this notification is currently displayed */
  displayed: boolean;
  /** Whether this notification has been dismissed */
  dismissed: boolean;
}

/**
 * Notification display options.
 */
export interface NotificationOptions {
  /** Auto-dismiss timeout in milliseconds (default: 5000ms) */
  autoDismiss?: number;
  /** Maximum queue size (default: 10) */
  maxQueueSize?: number;
}

/**
 * Default options.
 */
const DEFAULT_OPTIONS: Required<NotificationOptions> = {
  autoDismiss: 5000,
  maxQueueSize: 10,
};

/**
 * Notification queue manager class.
 * Implements FIFO eviction with priority handling per agent-e's requirements.
 */
export class NotificationQueue {
  /** Active notifications queue */
  private queue: QueuedNotification[] = [];

  /** Currently displayed notifications */
  private displayed: Map<string, HTMLElement> = new Map();

  /** Configuration options */
  private options: Required<NotificationOptions>;

  /** Auto-dismiss timers */
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  /** Container element for notifications */
  private container: HTMLElement | null = null;

  /** Counter for generating unique IDs */
  private idCounter = 0;

  constructor(options: NotificationOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Initialize the notification queue.
   * Creates the container element in the DOM.
   */
  initialize(): void {
    if (this.container) {
      return; // Already initialized
    }

    // Create container element
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.setAttribute('data-test-id', 'notification-container');
    this.container.className = 'notification-container';

    // Append to body
    document.body.appendChild(this.container);

    console.log('[NotificationQueue] Initialized');
  }

  /**
   * Add a notification to the queue.
   * Implements FIFO eviction with priority handling.
   *
   * @param type - Notification type
   * @param event - State change event that triggered this notification
   * @returns Notification ID or null if notification was not added
   */
  add(type: NotificationType, event: StateChangeEvent): string | null {
    if (!this.container) {
      console.warn('[NotificationQueue] Not initialized, call initialize() first');
      return null;
    }

    const newPriority = PRIORITY_LEVELS[type];

    // Check if queue is full
    if (this.queue.length >= this.options.maxQueueSize) {
      // Find the lowest priority notification that is currently displayed
      const lowestPriorityIndex = this.findLowestPriorityDisplayed();
      if (lowestPriorityIndex !== -1) {
        const lowestPriority = this.queue[lowestPriorityIndex].priority;
        // Evict if the new notification has higher priority, OR same priority (FIFO behavior)
        if (newPriority > lowestPriority) {
          const toEvict = this.queue[lowestPriorityIndex];
          // Evict lower priority notification
          // Note: dismiss() removes from queue, so don't splice again
          this.dismiss(toEvict.id);
        } else if (newPriority === lowestPriority) {
          // Same priority: evict the oldest (FIFO behavior)
          // Find the oldest item with this priority
          let oldestIndex = -1;
          let oldestTimestamp = Infinity;
          for (let i = 0; i < this.queue.length; i++) {
            const n = this.queue[i];
            if (n.priority === lowestPriority && n.displayed && !n.dismissed && n.timestamp < oldestTimestamp) {
              oldestTimestamp = n.timestamp;
              oldestIndex = i;
            }
          }
          if (oldestIndex !== -1) {
            this.dismiss(this.queue[oldestIndex].id);
          } else {
            console.warn('[NotificationQueue] Queue full, skipping notification:', type);
            return null;
          }
        } else {
          // New notification has lower priority than everything in queue
          console.warn('[NotificationQueue] Queue full with higher priority items, skipping notification:', type);
          return null;
        }
      } else {
        // Queue is full with all high-priority items, skip this notification
        console.warn('[NotificationQueue] Queue full, skipping notification:', type);
        return null;
      }
    }

    // Generate unique ID
    const id = `notification-${++this.idCounter}-${Date.now()}`;

    // Create queued notification
    const notification: QueuedNotification = {
      id,
      type,
      event,
      timestamp: Date.now(),
      priority: PRIORITY_LEVELS[type],
      displayed: false,
      dismissed: false,
    };

    // Add to queue
    this.queue.push(notification);

    // Sort queue by priority (highest first) then timestamp (oldest first)
    this.queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.timestamp - b.timestamp; // FIFO for same priority
    });

    // Display notification
    this.display(notification);

    return id;
  }

  /**
   * Display a notification.
   * Creates the DOM element and adds it to the container.
   *
   * @param notification - Notification to display
   */
  private display(notification: QueuedNotification): void {
    if (!this.container || notification.displayed || notification.dismissed) {
      return;
    }

    // Create notification element
    const element = this.createElement(notification);

    // Append to container
    this.container.appendChild(element);

    // Mark as displayed
    notification.displayed = true;

    // Store reference
    this.displayed.set(notification.id, element);

    // Set auto-dismiss timer
    const timer = setTimeout(() => {
      this.dismiss(notification.id);
    }, this.options.autoDismiss);

    this.timers.set(notification.id, timer);
  }

  /**
   * Create the DOM element for a notification.
   *
   * @param notification - Notification data
   * @returns DOM element
   */
  private createElement(notification: QueuedNotification): HTMLElement {
    const element = document.createElement('div');
    element.id = notification.id;
    element.className = `notification notification-${notification.type}`;
    element.setAttribute('data-test-id', `notification-${notification.type}`);
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', 'polite');

    // Inner content based on type
    let content = '';
    switch (notification.type) {
      case 'quest-complete':
        content = this.createQuestCompleteContent(notification.event);
        break;
      case 'faction-change':
        content = this.createFactionChangeContent(notification.event);
        break;
      case 'item-acquired':
        content = this.createItemAcquiredContent(notification.event);
        break;
    }

    element.innerHTML = content;

    return element;
  }

  /**
   * Create content for quest completion notification.
   */
  private createQuestCompleteContent(event: StateChangeEvent): string {
    const flagName = event.path === 'flags' ? 'Quest Complete' : event.path;
    return `
      <div class="notification-icon">⭐</div>
      <div class="notification-content">
        <div class="notification-title">Quest Complete</div>
        <div class="notification-message">${flagName}</div>
      </div>
      <button class="notification-dismiss" aria-label="Dismiss notification">×</button>
    `;
  }

  /**
   * Create content for faction change notification.
   */
  private createFactionChangeContent(event: StateChangeEvent): string {
    const oldValue = event.oldValue as number ?? 0;
    const newValue = event.newValue as number ?? 0;
    const diff = newValue - oldValue;
    const sign = diff >= 0 ? '+' : '';
    const factionName = event.path.replace('factions.', '');

    return `
      <div class="notification-icon">🏛️</div>
      <div class="notification-content">
        <div class="notification-title">Faction Change</div>
        <div class="notification-message">${factionName}: ${sign}${diff}</div>
      </div>
      <button class="notification-dismiss" aria-label="Dismiss notification">×</button>
    `;
  }

  /**
   * Create content for item acquired notification.
   */
  private createItemAcquiredContent(event: StateChangeEvent): string {
    const itemName = event.path.replace('inventory.', '');
    const count = event.newValue as number ?? 1;

    return `
      <div class="notification-icon">📦</div>
      <div class="notification-content">
        <div class="notification-title">Item Acquired</div>
        <div class="notification-message">${itemName}${count > 1 ? ` x${count}` : ''}</div>
      </div>
      <button class="notification-dismiss" aria-label="Dismiss notification">×</button>
    `;
  }

  /**
   * Dismiss a notification.
   * Removes it from display and queue.
   *
   * @param id - Notification ID to dismiss
   */
  dismiss(id: string): void {
    // Clear timer
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }

    // Remove from displayed
    const element = this.displayed.get(id);
    if (element) {
      element.classList.add('notification-dismissed');
      setTimeout(() => {
        element.remove();
      }, 300); // Wait for animation
      this.displayed.delete(id);
    }

    // Remove from queue
    const index = this.queue.findIndex(n => n.id === id);
    if (index !== -1) {
      this.queue[index].dismissed = true;
      this.queue.splice(index, 1);
    }
  }

  /**
   * Find the lowest priority displayed notification.
   * Used for FIFO eviction when queue is full.
   *
   * @returns Index of lowest priority displayed notification, or -1 if none found
   */
  private findLowestPriorityDisplayed(): number {
    let lowestIndex = -1;
    let lowestPriority = Infinity;

    for (let i = 0; i < this.queue.length; i++) {
      const notification = this.queue[i];
      if (notification.displayed && !notification.dismissed) {
        if (notification.priority < lowestPriority) {
          lowestPriority = notification.priority;
          lowestIndex = i;
        }
      }
    }

    return lowestIndex;
  }

  /**
   * Clear all notifications.
   * Used for cleanup or testing.
   */
  clear(): void {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    // Remove all displayed elements
    for (const element of this.displayed.values()) {
      element.remove();
    }
    this.displayed.clear();

    // Clear queue
    this.queue = [];
  }

  /**
   * Get current queue size.
   * Used for testing and monitoring.
   *
   * @returns Number of active notifications in queue
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Get displayed count.
   * Used for testing and monitoring.
   *
   * @returns Number of currently displayed notifications
   */
  getDisplayedCount(): number {
    return this.displayed.size;
  }

  /**
   * Destroy the notification queue.
   * Cleanup for memory leak prevention.
   */
  destroy(): void {
    this.clear();

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }

    this.container = null;

    console.log('[NotificationQueue] Destroyed');
  }
}

/**
 * Singleton instance for convenient use.
 */
let singletonInstance: NotificationQueue | null = null;

/**
 * Get or create the notification queue singleton.
 *
 * @param options - Optional configuration options (only used on first call)
 * @returns NotificationQueue singleton instance
 */
export function getNotificationQueue(options?: NotificationOptions): NotificationQueue {
  if (!singletonInstance) {
    singletonInstance = new NotificationQueue(options);
  }
  return singletonInstance;
}

/**
 * Reset the singleton instance.
 * Used for testing.
 */
export function resetNotificationQueue(): void {
  if (singletonInstance) {
    singletonInstance.destroy();
    singletonInstance = null;
  }
}
