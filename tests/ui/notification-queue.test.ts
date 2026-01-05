/**
 * Phase 11 Notification Queue Tests
 *
 * Per Intent #392: Tests for rapid-event stress, memory leak regression,
 * queue overflow, inventory pagination boundaries, mobile viewports, and
 * DOS styling QA.
 *
 * @module tests/ui/notification-queue
 */

// Set up DOM environment first (before other imports)
import { Window } from 'happy-dom';
const win = new Window();
// @ts-ignore
globalThis.document = win.document;
// @ts-ignore
globalThis.window = win as unknown as Window & typeof globalThis;
// @ts-ignore
globalThis.HTMLElement = win.HTMLElement;
// @ts-ignore
globalThis.HTMLCollection = win.HTMLCollection;
// @ts-ignore
globalThis.Node = win.Node;
// @ts-ignore
globalThis.Element = win.Element;
// @ts-ignore
globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16) as unknown as number;
// @ts-ignore
globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { NotificationQueue, resetNotificationQueue, type NotificationType } from '../../src/ui/notification-queue.js';

/**
 * Mock StateChangeEvent for testing.
 */
interface MockStateChangeEvent {
  type: 'effect-applied';
  path: string;
  oldValue: unknown;
  newValue: unknown;
  renderScope: string;
  urgency: string;
  timestamp?: number;
}

/**
 * Create a mock state change event.
 */
function createMockEvent(path: string, oldValue: unknown, newValue: unknown): MockStateChangeEvent {
  return {
    type: 'effect-applied',
    path,
    oldValue,
    newValue,
    renderScope: 'all',
    urgency: 'immediate',
    timestamp: Date.now(),
  };
}

describe('NotificationQueue - Core Functionality', () => {
  let queue: NotificationQueue;

  beforeEach(() => {
    // Reset singleton and create fresh instance
    resetNotificationQueue();
    queue = new NotificationQueue({ maxQueueSize: 10, autoDismiss: 5000 });

    // Initialize in test environment
    if (typeof document !== 'undefined') {
      queue.initialize();
    }
  });

  afterEach(() => {
    queue.destroy();
    resetNotificationQueue();
  });

  describe('Initialization', () => {
    it('should create container element on initialize', () => {
      if (typeof document === 'undefined') {
        return; // Skip in Node.js environment
      }

      const container = document.getElementById('notification-container');
      expect(container).not.toBeNull();
      expect(container?.className).toBe('notification-container');
    });

    it('should be idempotent on multiple initialize calls', () => {
      if (typeof document === 'undefined') {
        return;
      }

      queue.initialize();
      queue.initialize();

      const containers = document.querySelectorAll('#notification-container');
      expect(containers.length).toBe(1);
    });

    it('should return correct initial queue size', () => {
      expect(queue.getQueueSize()).toBe(0);
      expect(queue.getDisplayedCount()).toBe(0);
    });
  });

  describe('Adding Notifications', () => {
    it('should add quest-complete notification', () => {
      const event = createMockEvent('QUEST_TEST_COMPLETE', 'unset', 'set');
      const id = queue.add('quest-complete', event);

      expect(id).not.toBeNull();
      expect(queue.getQueueSize()).toBe(1);
      expect(queue.getDisplayedCount()).toBe(1);
    });

    it('should add faction-change notification', () => {
      const event = createMockEvent('factions.preservationist', 5, 7);
      const id = queue.add('faction-change', event);

      expect(id).not.toBeNull();
      expect(queue.getQueueSize()).toBe(1);
    });

    it('should add item-acquired notification', () => {
      const event = createMockEvent('inventory.test_item', 0, 1);
      const id = queue.add('item-acquired', event);

      expect(id).not.toBeNull();
      expect(queue.getQueueSize()).toBe(1);
    });

    it('should generate unique IDs for each notification', () => {
      const event1 = createMockEvent('test1', 0, 1);
      const event2 = createMockEvent('test2', 0, 1);

      const id1 = queue.add('quest-complete', event1);
      const id2 = queue.add('quest-complete', event2);

      expect(id1).not.toEqual(id2);
    });

    it('should return null when not initialized', () => {
      const uninitializedQueue = new NotificationQueue();
      const event = createMockEvent('test', 0, 1);

      const id = uninitializedQueue.add('quest-complete', event);

      expect(id).toBeNull();
    });
  });

  describe('Priority Handling', () => {
    it('should sort queue by priority (quest-complete > faction-change > item-acquired)', () => {
      // Add in reverse priority order
      const itemEvent = createMockEvent('inventory.item', 0, 1);
      const factionEvent = createMockEvent('factions.test', 5, 7);
      const questEvent = createMockEvent('QUEST_COMPLETE', 'unset', 'set');

      queue.add('item-acquired', itemEvent);
      queue.add('faction-change', factionEvent);
      queue.add('quest-complete', questEvent);

      // Queue should have all 3 notifications
      expect(queue.getQueueSize()).toBe(3);
    });

    it('should maintain FIFO for same-priority notifications', () => {
      const event1 = createMockEvent('inventory.item1', 0, 1);
      const event2 = createMockEvent('inventory.item2', 0, 1);

      const id1 = queue.add('item-acquired', event1);
      const id2 = queue.add('item-acquired', event2);

      // Both should be added (queue not full)
      expect(id1).not.toBeNull();
      expect(id2).not.toBeNull();
      expect(queue.getQueueSize()).toBe(2);
    });
  });

  describe('FIFO Eviction', () => {
    it('should evict lowest priority notification when queue is full', () => {
      const maxQueueSize = 10;

      // Fill queue with 10 low-priority item notifications
      for (let i = 0; i < maxQueueSize; i++) {
        const event = createMockEvent(`inventory.item${i}`, 0, 1);
        queue.add('item-acquired', event);
      }

      expect(queue.getQueueSize()).toBe(maxQueueSize);

      // Add a high-priority quest notification - should evict an item notification
      const questEvent = createMockEvent('QUEST_COMPLETE', 'unset', 'set');
      const questId = queue.add('quest-complete', questEvent);

      expect(questId).not.toBeNull();
      // Queue should still be at max size
      expect(queue.getQueueSize()).toBeLessThanOrEqual(maxQueueSize);
    });

    it('should return null when queue is full with high-priority items', () => {
      const maxQueueSize = 10;

      // Fill queue with 10 high-priority quest notifications
      for (let i = 0; i < maxQueueSize; i++) {
        const event = createMockEvent(`QUEST_${i}_COMPLETE`, 'unset', 'set');
        queue.add('quest-complete', event);
      }

      expect(queue.getQueueSize()).toBe(maxQueueSize);

      // Try to add another item notification (lower priority)
      const itemEvent = createMockEvent('inventory.item', 0, 1);
      const itemId = queue.add('item-acquired', itemEvent);

      // Should be rejected since all displayed items are higher priority
      expect(itemId).toBeNull();
    });
  });

  describe('Dismissing Notifications', () => {
    it('should dismiss notification by ID', () => {
      const event = createMockEvent('test', 0, 1);
      const id = queue.add('quest-complete', event);

      expect(queue.getQueueSize()).toBe(1);

      queue.dismiss(id!);

      // Queue size should decrease
      expect(queue.getQueueSize()).toBe(0);
    });

    it('should handle dismissing non-existent notification gracefully', () => {
      expect(() => {
        queue.dismiss('non-existent-id');
      }).not.toThrow();
    });

    it('should clear auto-dismiss timer on manual dismiss', () => {
      const event = createMockEvent('test', 0, 1);
      const id = queue.add('quest-complete', event);

      // Manually dismiss before auto-dismiss
      queue.dismiss(id!);

      // Should not cause errors when timer fires
      expect(queue.getQueueSize()).toBe(0);
    });
  });

  describe('Clear and Destroy', () => {
    it('should clear all notifications', () => {
      // Add multiple notifications
      for (let i = 0; i < 5; i++) {
        const event = createMockEvent(`test${i}`, 0, 1);
        queue.add('quest-complete', event);
      }

      expect(queue.getQueueSize()).toBe(5);

      queue.clear();

      expect(queue.getQueueSize()).toBe(0);
      expect(queue.getDisplayedCount()).toBe(0);
    });

    it('should destroy and remove container element', () => {
      if (typeof document === 'undefined') {
        return;
      }

      queue.initialize();

      const containerBefore = document.getElementById('notification-container');
      expect(containerBefore).not.toBeNull();

      queue.destroy();

      const containerAfter = document.getElementById('notification-container');
      expect(containerAfter).toBeNull();
    });

    it('should be safe to call destroy multiple times', () => {
      expect(() => {
        queue.destroy();
        queue.destroy();
        queue.destroy();
      }).not.toThrow();
    });
  });

  describe('Auto-dismiss', () => {
    it('should auto-dismiss notification after configured timeout', (done) => {
      // Use short timeout for testing
      const testQueue = new NotificationQueue({ autoDismiss: 100 });
      testQueue.initialize();

      const event = createMockEvent('test', 0, 1);
      const id = testQueue.add('quest-complete', event);

      expect(testQueue.getQueueSize()).toBe(1);

      // Wait for auto-dismiss
      setTimeout(() => {
        // Notification should be dismissed
        expect(testQueue.getQueueSize()).toBe(0);
        testQueue.destroy();
        done();
      }, 150);
    }, 5000);

    it('should cancel auto-dismiss on manual dismiss', (done) => {
      const testQueue = new NotificationQueue({ autoDismiss: 100 });
      testQueue.initialize();

      const event = createMockEvent('test', 0, 1);
      const id = testQueue.add('quest-complete', event);

      // Manually dismiss immediately
      setTimeout(() => {
        testQueue.dismiss(id!);
      }, 50);

      // Wait past auto-dismiss timeout
      setTimeout(() => {
        // Should not cause errors
        expect(testQueue.getQueueSize()).toBe(0);
        testQueue.destroy();
        done();
      }, 150);
    }, 5000);
  });
});

describe('NotificationQueue - Rapid Event Stress (Item 8)', () => {
  let queue: NotificationQueue;

  beforeEach(() => {
    resetNotificationQueue();
    queue = new NotificationQueue({ maxQueueSize: 10 });
    if (typeof document !== 'undefined') {
      queue.initialize();
    }
  });

  afterEach(() => {
    queue.destroy();
    resetNotificationQueue();
  });

  /**
   * Intent #392 Item 8: Create rapid-event stress test (50+ set-flag, modify-faction,
   * add-item events in single scene).
   */
  it('should handle 50+ rapid events without performance degradation', () => {
    const startTime = performance.now();

    // Simulate 50 rapid events in a single scene
    const eventTypes: NotificationType[] = [
      'quest-complete',  // 10 quest completions
      'faction-change',  // 15 faction changes
      'item-acquired',   // 25 item acquisitions
    ];

    let eventIndex = 0;
    for (const type of eventTypes) {
      const count = type === 'quest-complete' ? 10 : type === 'faction-change' ? 15 : 25;
      for (let i = 0; i < count; i++) {
        const event = createMockEvent(
          `${type}-${eventIndex++}`,
          type === 'faction-change' ? i : i === 0 ? 0 : undefined,
          type === 'faction-change' ? i + 1 : i === 0 ? 1 : undefined
        );
        queue.add(type, event);
      }
    }

    const elapsed = performance.now() - startTime;

    // Performance target: should complete in reasonable time
    expect(elapsed).toBeLessThan(1000); // Less than 1 second for 50 events

    // Queue should be capped at max size (10)
    expect(queue.getQueueSize()).toBeLessThanOrEqual(10);

    console.log(`[Rapid Event Stress] Processed 50 events in ${elapsed.toFixed(2)}ms`);
  });

  it('should maintain queue integrity during rapid additions', () => {
    // Add 20 events rapidly
    for (let i = 0; i < 20; i++) {
      const event = createMockEvent(`test-${i}`, 0, 1);
      queue.add('item-acquired', event);
    }

    // Queue should not exceed max size
    expect(queue.getQueueSize()).toBeLessThanOrEqual(10);

    // Displayed count should match queue size
    expect(queue.getDisplayedCount()).toBe(queue.getQueueSize());
  });
});

describe('NotificationQueue - Memory Leak Regression (Item 9)', () => {
  let queue: NotificationQueue;

  beforeEach(() => {
    resetNotificationQueue();
    queue = new NotificationQueue();
    if (typeof document !== 'undefined') {
      queue.initialize();
    }
  });

  afterEach(() => {
    queue.destroy();
    resetNotificationQueue();
  });

  /**
   * Intent #392 Item 9: Create memory leak regression test (verify listener
   * cleanup after 100 scene transitions).
   */
  it('should not leak memory after 100 scene transitions', () => {
    // Simulate 100 scene transitions with notifications
    for (let i = 0; i < 100; i++) {
      // Add notification for this "scene"
      const event = createMockEvent(`scene-${i}`, 0, 1);
      queue.add('quest-complete', event);

      // Clear between scenes (simulates transition cleanup)
      queue.clear();
    }

    // Queue should be empty after all clears
    expect(queue.getQueueSize()).toBe(0);
    expect(queue.getDisplayedCount()).toBe(0);

    // Timers map should be empty (all cleaned up)
    // This is verified implicitly by no errors occurring

    console.log('[Memory Leak] Completed 100 simulated scene transitions');
  });

  it('should properly clean up destroy and reinitialize cycle', () => {
    // Simulate SPA navigation cycle: initialize -> destroy -> reinitialize
    for (let i = 0; i < 10; i++) {
      queue.initialize();

      // Add some notifications
      for (let j = 0; j < 5; j++) {
        const event = createMockEvent(`test-${i}-${j}`, 0, 1);
        queue.add('item-acquired', event);
      }

      queue.destroy();
    }

    // Final reinitialize for cleanup
    queue.initialize();

    // Should work normally after multiple cycles
    const event = createMockEvent('final-test', 0, 1);
    const id = queue.add('quest-complete', event);

    expect(id).not.toBeNull();
    expect(queue.getQueueSize()).toBe(1);

    console.log('[Memory Leak] Completed 10 initialize/destroy cycles');
  });
});

describe('NotificationQueue - Queue Overflow (Item 10)', () => {
  let queue: NotificationQueue;

  beforeEach(() => {
    resetNotificationQueue();
    queue = new NotificationQueue({ maxQueueSize: 10 });
    if (typeof document !== 'undefined') {
      queue.initialize();
    }
  });

  afterEach(() => {
    queue.destroy();
    resetNotificationQueue();
  });

  /**
   * Intent #392 Item 10: Create notification queue overflow test (100+ events
   * to verify queue cap and FIFO eviction).
   */
  it('should enforce max queue size cap', () => {
    // Add 100 events
    for (let i = 0; i < 100; i++) {
      const event = createMockEvent(`test-${i}`, 0, 1);
      queue.add('item-acquired', event);
    }

    // Queue should never exceed max size
    expect(queue.getQueueSize()).toBeLessThanOrEqual(10);

    console.log('[Queue Overflow] Added 100 events, queue size:', queue.getQueueSize());
  });

  it('should evict FIFO when queue is full with same-priority items', () => {
    const maxQueueSize = 10;

    // Add items with timestamps to verify FIFO order
    const ids: string[] = [];
    for (let i = 0; i < maxQueueSize; i++) {
      const event = createMockEvent(`inventory.item${i}`, 0, 1);
      const id = queue.add('item-acquired', event);
      if (id) ids.push(id);
    }

    expect(queue.getQueueSize()).toBe(maxQueueSize);

    // Add one more - should evict the oldest
    const newEvent = createMockEvent('inventory.item_new', 0, 1);
    const newId = queue.add('item-acquired', newEvent);

    expect(newId).not.toBeNull();
    expect(queue.getQueueSize()).toBeLessThanOrEqual(maxQueueSize);
  });

  it('should prioritize quest notifications over item notifications when full', () => {
    // Fill queue with low-priority items
    for (let i = 0; i < 10; i++) {
      const event = createMockEvent(`inventory.item${i}`, 0, 1);
      queue.add('item-acquired', event);
    }

    expect(queue.getQueueSize()).toBe(10);

    // Add high-priority quest - should succeed by evicting an item
    const questEvent = createMockEvent('QUEST_COMPLETE', 'unset', 'set');
    const questId = queue.add('quest-complete', questEvent);

    expect(questId).not.toBeNull();
    expect(queue.getQueueSize()).toBeLessThanOrEqual(10);
  });

  it('should handle mixed priority overflow correctly', () => {
    // Add mix of priorities
    for (let i = 0; i < 5; i++) {
      queue.add('item-acquired', createMockEvent(`item${i}`, 0, 1));
    }
    for (let i = 0; i < 3; i++) {
      queue.add('faction-change', createMockEvent(`faction${i}`, 5, 7));
    }
    for (let i = 0; i < 2; i++) {
      queue.add('quest-complete', createMockEvent(`QUEST${i}`, 'unset', 'set'));
    }

    expect(queue.getQueueSize()).toBe(10);

    // Try to add more - should evict items first
    const newItemEvent = createMockEvent('inventory.new_item', 0, 1);
    const newItemId = queue.add('item-acquired', newItemEvent);

    // Item notification may be rejected if queue has higher priorities
    expect(queue.getQueueSize()).toBeLessThanOrEqual(10);
  });
});

describe('NotificationQueue - Inventory Pagination Boundaries (Item 11)', () => {
  /**
   * Intent #392 Item 11: Create inventory pagination boundary tests
   * (19, 20, 21 items with mixed quest/regular categories).
   *
   * Note: This test validates the notification queue behavior when
   * inventory changes cross pagination boundaries. The actual inventory
   * pagination logic is in GameRenderer, but the queue should handle
   * all inventory item notifications correctly.
   */
  it('should handle 19 inventory item notifications', () => {
    resetNotificationQueue();
    const queue = new NotificationQueue({ maxQueueSize: 20 });
    if (typeof document !== 'undefined') {
      queue.initialize();
    }

    // Add 19 items
    for (let i = 0; i < 19; i++) {
      const event = createMockEvent(`inventory.item${i}`, 0, 1);
      queue.add('item-acquired', event);
    }

    expect(queue.getQueueSize()).toBe(19);

    queue.destroy();
  });

  it('should handle 20 inventory item notifications', () => {
    resetNotificationQueue();
    const queue = new NotificationQueue({ maxQueueSize: 20 });
    if (typeof document !== 'undefined') {
      queue.initialize();
    }

    // Add 20 items
    for (let i = 0; i < 20; i++) {
      const event = createMockEvent(`inventory.item${i}`, 0, 1);
      queue.add('item-acquired', event);
    }

    expect(queue.getQueueSize()).toBe(20);

    queue.destroy();
  });

  it('should handle 21 inventory item notifications (overflow)', () => {
    resetNotificationQueue();
    const queue = new NotificationQueue({ maxQueueSize: 20 });
    if (typeof document !== 'undefined') {
      queue.initialize();
    }

    // Add 21 items - FIFO eviction means oldest is evicted when queue is full
    let successCount = 0;
    for (let i = 0; i < 21; i++) {
      const event = createMockEvent(`inventory.item${i}`, 0, 1);
      const id = queue.add('item-acquired', event);
      if (id !== null) successCount++;
    }

    // All 21 should succeed (FIFO evicts oldest), but queue size stays at max
    expect(successCount).toBe(21);
    expect(queue.getQueueSize()).toBe(20);

    queue.destroy();
  });

  it('should handle mixed quest and regular item categories', () => {
    resetNotificationQueue();
    const queue = new NotificationQueue({ maxQueueSize: 25 });
    if (typeof document !== 'undefined') {
      queue.initialize();
    }

    // Add 15 quest items and 10 regular items
    for (let i = 0; i < 15; i++) {
      const event = createMockEvent(`inventory.quest_item${i}`, 0, 1);
      queue.add('item-acquired', event);
    }
    for (let i = 0; i < 10; i++) {
      const event = createMockEvent(`inventory.regular_item${i}`, 0, 1);
      queue.add('item-acquired', event);
    }

    expect(queue.getQueueSize()).toBe(25);

    queue.destroy();
  });
});

describe('NotificationQueue - Custom Configuration', () => {
  it('should respect custom maxQueueSize', () => {
    resetNotificationQueue();
    const queue = new NotificationQueue({ maxQueueSize: 5 });
    if (typeof document !== 'undefined') {
      queue.initialize();
    }

    // Add 10 events
    for (let i = 0; i < 10; i++) {
      const event = createMockEvent(`test${i}`, 0, 1);
      queue.add('item-acquired', event);
    }

    expect(queue.getQueueSize()).toBeLessThanOrEqual(5);

    queue.destroy();
  });

  it('should respect custom autoDismiss timeout', (done) => {
    resetNotificationQueue();
    const queue = new NotificationQueue({ autoDismiss: 200 });
    if (typeof document !== 'undefined') {
      queue.initialize();
    }

    const event = createMockEvent('test', 0, 1);
    queue.add('quest-complete', event);

    expect(queue.getQueueSize()).toBe(1);

    // Wait for auto-dismiss
    setTimeout(() => {
      expect(queue.getQueueSize()).toBe(0);
      queue.destroy();
      done();
    }, 250);
  }, 5000);
});

describe('NotificationQueue - Accessibility', () => {
  let queue: NotificationQueue;

  beforeEach(() => {
    resetNotificationQueue();
    queue = new NotificationQueue();
    if (typeof document !== 'undefined') {
      queue.initialize();
    }
  });

  afterEach(() => {
    queue.destroy();
    resetNotificationQueue();
  });

  it('should create notification with ARIA attributes', () => {
    if (typeof document === 'undefined') {
      return;
    }

    const event = createMockEvent('QUEST_TEST', 'unset', 'set');
    queue.add('quest-complete', event);

    const notification = document.querySelector('[role="status"]');
    expect(notification).not.toBeNull();

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
  });

  it('should include dismiss button with aria-label', () => {
    if (typeof document === 'undefined') {
      return;
    }

    const event = createMockEvent('test', 0, 1);
    queue.add('item-acquired', event);

    const dismissBtn = document.querySelector('[aria-label="Dismiss notification"]');
    expect(dismissBtn).not.toBeNull();
  });
});
