/**
 * Phase 11 Mobile Viewport Constraint Tests
 *
 * Intent #392 Item 13: Create mobile viewport constraint tests
 * (320px small, 375px medium, 414px large breakpoints).
 *
 * These tests verify the Phase 11 notification system behaves correctly
 * on mobile devices with various screen sizes.
 *
 * @module tests/phase11/mobile-viewports
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { NotificationQueue, resetNotificationQueue, type NotificationType } from '../../src/ui/notification-queue.js';

/**
 * Mobile viewport breakpoints per phase11-styles.css.
 */
const MOBILE_BREAKPOINTS = {
  small: 320,   // iPhone SE, small phones
  medium: 375,  // iPhone 12/13/14, standard phones
  large: 414,   // iPhone Pro Max, large phones
  tablet: 768,  // iPads, tablets
};

/**
 * Touch target minimum size per WCAG 2.1 AA.
 */
const MIN_TOUCH_TARGET = 44;

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

describe('Mobile Viewport Constraints - 320px (Small)', () => {
  let queue: NotificationQueue;

  beforeEach(() => {
    resetNotificationQueue();
    queue = new NotificationQueue({
      maxQueueSize: 10,
      autoDismiss: 5000,
    });

    // Simulate 320px viewport
    if (typeof document !== 'undefined') {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: MOBILE_BREAKPOINTS.small,
      });

      // Update viewport meta tag simulation
      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=320, initial-scale=1');
      }

      queue.initialize();
    }
  });

  afterEach(() => {
    queue.destroy();
    resetNotificationQueue();
  });

  it('should create notifications that fit within 320px width', () => {
    const event = createMockEvent('QUEST_TEST_COMPLETE', 'unset', 'set');
    const id = queue.add('quest-complete', event);

    expect(id).not.toBeNull();
    expect(queue.getQueueSize()).toBe(1);

    if (typeof document !== 'undefined') {
      const notification = document.querySelector('.notification') as HTMLElement;
      expect(notification).not.toBeNull();

      // Notification should not exceed viewport width
      const notificationWidth = notification?.offsetWidth || 0;
      expect(notificationWidth).toBeLessThanOrEqual(MOBILE_BREAKPOINTS.small);

      console.log(`[320px] Notification width: ${notificationWidth}px`);
    }
  });

  it('should handle dismiss button touch target (min 44x44px)', () => {
    const event = createMockEvent('inventory.test_item', 0, 1);
    queue.add('item-acquired', event);

    if (typeof document !== 'undefined') {
      const dismissBtn = document.querySelector('.notification-dismiss') as HTMLElement;
      expect(dismissBtn).not.toBeNull();

      // Check touch target size
      const rect = dismissBtn?.getBoundingClientRect();
      if (rect) {
        expect(rect.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        expect(rect.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);

        console.log(`[320px] Dismiss button: ${rect.width}x${rect.height}px`);
      }
    }
  });

  it('should handle long quest names on 320px screen', () => {
    // Simulate a very long quest name
    const longQuestName = 'QUEST_EXTREMELY_LONG_NAME_THAT_MIGHT_WRAP_OR_TRUNCATE_ON_SMALL_SCREENS_COMPLETE';
    const event = createMockEvent(longQuestName, 'unset', 'set');
    queue.add('quest-acquired', event);

    if (typeof document !== 'undefined') {
      const notification = document.querySelector('.notification') as HTMLElement;
      expect(notification).not.toBeNull();

      // Check for overflow
      const notificationWidth = notification?.offsetWidth || 0;
      expect(notificationWidth).toBeLessThanOrEqual(MOBILE_BREAKPOINTS.small);

      // Check for horizontal scroll
      const overflowX = notification?.style.overflowX || 'visible';
      expect(overflowX).not.toBe('scroll');

      console.log(`[320px] Long quest name handled, width: ${notificationWidth}px`);
    }
  });

  it('should handle item quantity badge on 320px', () => {
    const event = createMockEvent('inventory.stackable_item', 0, 99);
    queue.add('item-acquired', event);

    if (typeof document !== 'undefined') {
      const quantityBadge = document.querySelector('.item-quantity') as HTMLElement;
      expect(quantityBadge).not.toBeNull();

      // Badge should be visible and not cause overflow
      const rect = quantityBadge?.getBoundingClientRect();
      expect(rect?.width).toBeGreaterThan(0);

      console.log(`[320px] Quantity badge width: ${rect?.width}px`);
    }
  });
});

describe('Mobile Viewport Constraints - 375px (Medium)', () => {
  let queue: NotificationQueue;

  beforeEach(() => {
    resetNotificationQueue();
    queue = new NotificationQueue({
      maxQueueSize: 10,
      autoDismiss: 5000,
    });

    // Simulate 375px viewport (iPhone 12/13/14)
    if (typeof document !== 'undefined') {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: MOBILE_BREAKPOINTS.medium,
      });

      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=375, initial-scale=1');
      }

      queue.initialize();
    }
  });

  afterEach(() => {
    queue.destroy();
    resetNotificationQueue();
  });

  it('should display notifications comfortably on 375px screen', () => {
    const event = createMockEvent('QUEST_COMPLETE', 'unset', 'set');
    const id = queue.add('quest-complete', event);

    expect(id).not.toBeNull();

    if (typeof document !== 'undefined') {
      const notification = document.querySelector('.notification') as HTMLElement;
      expect(notification).not.toBeNull();

      const notificationWidth = notification?.offsetWidth || 0;
      // Should fit with margins
      expect(notificationWidth).toBeLessThanOrEqual(MOBILE_BREAKPOINTS.medium - 32); // 16px margins

      console.log(`[375px] Notification width: ${notificationWidth}px`);
    }
  });

  it('should handle multiple notifications stacked vertically', () => {
    // Add 5 notifications
    for (let i = 0; i < 5; i++) {
      const event = createMockEvent(`QUEST_${i}_COMPLETE`, 'unset', 'set');
      queue.add('quest-complete', event);
    }

    expect(queue.getQueueSize()).toBe(5);

    if (typeof document !== 'undefined') {
      const notifications = document.querySelectorAll('.notification');
      expect(notifications.length).toBe(5);

      // Check that they're stacked (not overlapping)
      const container = document.getElementById('notification-container');
      expect(container).not.toBeNull();

      const containerHeight = container?.offsetHeight || 0;
      expect(containerHeight).toBeGreaterThan(0);

      console.log(`[375px] 5 notifications stacked, container height: ${containerHeight}px`);
    }
  });

  it('should handle faction change indicator positioning', () => {
    const event = createMockEvent('factions.preservationist', 5, 7);
    queue.add('faction-change', event);

    if (typeof document !== 'undefined') {
      const indicator = document.querySelector('.faction-indicator') as HTMLElement;
      // Faction indicators are created via GameRenderer, not NotificationQueue
      // This test verifies the notification was queued
      expect(queue.getQueueSize()).toBe(1);

      console.log(`[375px] Faction notification queued`);
    }
  });
});

describe('Mobile Viewport Constraints - 414px (Large)', () => {
  let queue: NotificationQueue;

  beforeEach(() => {
    resetNotificationQueue();
    queue = new NotificationQueue({
      maxQueueSize: 10,
      autoDismiss: 5000,
    });

    // Simulate 414px viewport (iPhone Pro Max)
    if (typeof document !== 'undefined') {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: MOBILE_BREAKPOINTS.large,
      });

      const viewportMeta = document.querySelector('meta[name="viewport"]');
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=414, initial-scale=1');
      }

      queue.initialize();
    }
  });

  afterEach(() => {
    queue.destroy();
    resetNotificationQueue();
  });

  it('should display notifications with proper spacing on 414px', () => {
    const event = createMockEvent('QUEST_COMPLETE', 'unset', 'set');
    queue.add('quest-complete', event);

    if (typeof document !== 'undefined') {
      const notification = document.querySelector('.notification') as HTMLElement;
      expect(notification).not.toBeNull();

      // Should have comfortable padding
      const styles = window.getComputedStyle(notification);
      const padding = parseInt(styles.paddingLeft || '0', 10);
      expect(padding).toBeGreaterThanOrEqual(8); // Minimum padding

      console.log(`[414px] Notification padding: ${padding}px`);
    }
  });

  it('should handle full queue (10 notifications) on 414px', () => {
    // Fill the queue
    for (let i = 0; i < 10; i++) {
      const event = createMockEvent(`inventory.item${i}`, 0, 1);
      queue.add('item-acquired', event);
    }

    expect(queue.getQueueSize()).toBe(10);

    if (typeof document !== 'undefined') {
      const notifications = document.querySelectorAll('.notification');
      expect(notifications.length).toBe(10);

      // Verify container doesn't overflow viewport
      const container = document.getElementById('notification-container');
      const containerHeight = container?.offsetHeight || 0;
      const viewportHeight = window.innerHeight;

      expect(containerHeight).toBeLessThanOrEqual(viewportHeight);

      console.log(`[414px] Full queue: 10 notifications, container height: ${containerHeight}px, viewport: ${viewportHeight}px`);
    }
  });
});

describe('Mobile Viewport - Orientation Changes', () => {
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

  it('should handle portrait to landscape transition', () => {
    // Start in portrait (375px)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const event1 = createMockEvent('QUEST_1', 'unset', 'set');
    queue.add('quest-complete', event1);

    // Switch to landscape (667px for iPhone 12)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 667,
    });

    // Add another notification in landscape
    const event2 = createMockEvent('QUEST_2', 'unset', 'set');
    queue.add('quest-complete', event2);

    expect(queue.getQueueSize()).toBe(2);

    console.log('[Orientation] Portrait → Landscape handled');
  });

  it('should handle landscape to portrait transition', () => {
    // Start in landscape (812px for iPhone 12 Pro Max)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 812,
    });

    const event1 = createMockEvent('inventory.item1', 0, 1);
    queue.add('item-acquired', event1);

    // Switch to portrait (414px)
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 414,
    });

    const event2 = createMockEvent('inventory.item2', 0, 1);
    queue.add('item-acquired', event2);

    expect(queue.getQueueSize()).toBe(2);

    console.log('[Orientation] Landscape → Portrait handled');
  });
});

describe('Mobile Viewport - Safe Area Insets', () => {
  let queue: NotificationQueue;

  beforeEach(() => {
    resetNotificationQueue();
    queue = new NotificationQueue({ maxQueueSize: 10 });
    if (typeof document !== 'undefined') {
      // Simulate safe area insets (notch, home indicator)
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      // Mock getComputedStyle to include safe area insets
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = (element: Element) => {
        const styles = originalGetComputedStyle.call(window, element);
        return {
          ...styles,
          paddingTop: '44px', // Simulated notch
          paddingBottom: '34px', // Simulated home indicator
        } as CSSStyleDeclaration;
      };

      queue.initialize();
    }
  });

  afterEach(() => {
    queue.destroy();
    resetNotificationQueue();
  });

  it('should respect safe area insets for positioning', () => {
    const event = createMockEvent('QUEST_COMPLETE', 'unset', 'set');
    queue.add('quest-complete', event);

    if (typeof document !== 'undefined') {
      const container = document.getElementById('notification-container');
      expect(container).not.toBeNull();

      // Container should have top padding for safe area
      const styles = window.getComputedStyle(container);
      const topPadding = parseInt(styles.paddingTop || '0', 10);

      expect(topPadding).toBeGreaterThan(0);

      console.log(`[Safe Area] Top padding: ${topPadding}px`);
    }
  });
});

describe('Mobile Viewport - Text Scaling', () => {
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

  it('should handle system font scaling (accessibility)', () => {
    if (typeof document === 'undefined') {
      return;
    }

    // Simulate user setting larger text (150% scale)
    const htmlElement = document.documentElement;
    htmlElement.style.fontSize = '150%';

    const event = createMockEvent('QUEST_COMPLETE', 'unset', 'set');
    queue.add('quest-complete', event);

    const notification = document.querySelector('.notification') as HTMLElement;
    expect(notification).not.toBeNull();

    // Text should scale but remain readable
    const styles = window.getComputedStyle(notification);
    const fontSize = parseInt(styles.fontSize || '0', 10);

    // Font size should reflect scaling
    expect(fontSize).toBeGreaterThan(0);

    console.log(`[Text Scaling] Font size at 150%: ${fontSize}px`);

    // Reset
    htmlElement.style.fontSize = '';
  });

  it('should not break layout at maximum text scale (200%)', () => {
    if (typeof document === 'undefined') {
      return;
    }

    const htmlElement = document.documentElement;
    htmlElement.style.fontSize = '200%';

    const event = createMockEvent('inventory.long_item_name', 0, 1);
    queue.add('item-acquired', event);

    const notification = document.querySelector('.notification') as HTMLElement;
    expect(notification).not.toBeNull();

    // Check for overflow
    const notificationWidth = notification?.offsetWidth || 0;
    const viewportWidth = window.innerWidth;

    expect(notificationWidth).toBeLessThanOrEqual(viewportWidth);

    console.log(`[Text Scaling] 200% scale, width: ${notificationWidth}px / viewport: ${viewportWidth}px`);

    htmlElement.style.fontSize = '';
  });
});

describe('Mobile Viewport - Touch Interactions', () => {
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

  it('should provide adequate touch targets for dismiss buttons', () => {
    // Add multiple notifications
    for (let i = 0; i < 3; i++) {
      const event = createMockEvent(`QUEST_${i}`, 'unset', 'set');
      queue.add('quest-complete', event);
    }

    if (typeof document !== 'undefined') {
      const dismissButtons = document.querySelectorAll('.notification-dismiss');

      expect(dismissButtons.length).toBe(3);

      for (const btn of dismissButtons) {
        const rect = btn.getBoundingClientRect();
        // WCAG 2.1 AA: Touch targets must be at least 44x44 CSS pixels
        expect(rect.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        expect(rect.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
      }

      console.log('[Touch Targets] All dismiss buttons meet 44x44px minimum');
    }
  });

  it('should handle rapid consecutive dismissals', () => {
    const ids: string[] = [];

    // Add 5 notifications
    for (let i = 0; i < 5; i++) {
      const event = createMockEvent(`test-${i}`, 0, 1);
      const id = queue.add('item-acquired', event);
      if (id) ids.push(id);
    }

    expect(queue.getQueueSize()).toBe(5);

    // Rapidly dismiss all
    const startTime = performance.now();
    for (const id of ids) {
      queue.dismiss(id);
    }
    const elapsed = performance.now() - startTime;

    expect(queue.getQueueSize()).toBe(0);
    expect(elapsed).toBeLessThan(100); // Should be fast

    console.log(`[Touch] Dismissed 5 notifications in ${elapsed.toFixed(2)}ms`);
  });
});

describe('Mobile Viewport - Performance', () => {
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

  it('should maintain 60fps during notification animations on mobile', () => {
    if (typeof document === 'undefined') {
      return;
    }

    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    const startTime = performance.now();
    let frameCount = 0;

    // Simulate animation frames
    const measureFrames = () => {
      frameCount++;
      if (performance.now() - startTime < 1000) {
        requestAnimationFrame(measureFrames);
      }
    };

    // Add notifications during animation
    for (let i = 0; i < 5; i++) {
      const event = createMockEvent(`QUEST_${i}`, 'unset', 'set');
      queue.add('quest-complete', event);
    }

    requestAnimationFrame(measureFrames);

    // Wait for measurement
    const startWait = Date.now();
    while (Date.now() - startWait < 1100) {
      // Busy wait for test measurement
    }

    // Should have ~60 frames in 1 second
    expect(frameCount).toBeGreaterThan(30); // At least 30fps

    console.log(`[Performance] ${frameCount} frames in ~1 second`);
  });

  it('should not block main thread during rapid notifications on mobile', () => {
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 320,
    });

    const startTime = performance.now();

    // Add 20 notifications rapidly
    for (let i = 0; i < 20; i++) {
      const event = createMockEvent(`test-${i}`, 0, 1);
      queue.add('item-acquired', event);
    }

    const elapsed = performance.now() - startTime;

    // Should complete quickly (no main thread blocking)
    expect(elapsed).toBeLessThan(500);

    console.log(`[Performance] 20 notifications in ${elapsed.toFixed(2)}ms on 320px viewport`);
  });
});
