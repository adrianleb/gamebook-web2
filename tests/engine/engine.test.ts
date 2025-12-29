/**
 * Engine Core Unit Tests
 *
 * Tests deterministic state machine behavior.
 * Per agent-e: Covers state transitions, save/load, edge cases.
 * Per RFC: Headless testing support without UI.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { Engine, createTestEngine } from '../../src/engine/index.js';
import type {
  GameManifest,
  SceneData,
  Condition,
  Effect,
  SceneHistoryEntry,
} from '../../src/engine/index.js';

/**
 * Mock manifest for testing.
 * Note: Actual scene files may reference additional scenes (e.g., sc_1_0_004),
 * so this manifest includes entries for those to avoid validation errors.
 */
const mockManifest: GameManifest = {
  gamebook: {
    title: 'Test Gamebook',
    source: 'test',
    version: '1.0.0',
    adaptationVersion: '0.0.1',
  },
  structure: {
    acts: 1,
    totalNodesEstimated: 4,
    endings: 0,
  },
  startingScene: 'sc_1_0_001',
  acts: [],
  endings: [],
  sceneIndex: {
    sc_1_0_001: {
      title: 'Start Scene',
      location: 'Test',
      act: 1,
      hub: 0,
      status: 'complete',
      description: 'Starting scene',
    },
    sc_1_0_002: {
      title: 'Scene 2',
      location: 'Test',
      act: 1,
      hub: 0,
      status: 'complete',
      description: 'Second scene',
    },
    sc_1_0_003: {
      title: 'Scene 3',
      location: 'Test',
      act: 1,
      hub: 0,
      status: 'complete',
      description: 'Third scene',
    },
    sc_1_0_004: {
      title: 'Scene 4',
      location: 'Test',
      act: 1,
      hub: 0,
      status: 'complete',
      description: 'Fourth scene (Maren)',
    },
  },
  implementationStatus: {
    totalScenes: 4,
    pending: 0,
    draft: 0,
    complete: 4,
    reviewed: 0,
  },
};

/**
 * Mock scenes for testing.
 */
const mockScenes: Record<string, SceneData> = {
  sc_1_0_001: {
    id: 'sc_1_0_001',
    title: 'Start Scene',
    text: 'You are in a test room.',
    effects: [
      { type: 'set-flag', flag: 'GAME_STARTED' },
      { type: 'set-stat', stat: 'courage', value: 5 },
    ],
    choices: [
      {
        label: 'Go left',
        to: 'sc_1_0_002',
      },
      {
        label: 'Go right',
        to: 'sc_1_0_003',
        conditions: [
          { type: 'stat', stat: 'courage', operator: 'gte', value: 5 },
        ],
      },
      {
        label: 'Secret path',
        to: 'sc_1_0_002',
        conditions: [
          { type: 'flag', flag: 'HAS_SECRET_KEY' },
        ],
        disabledHint: 'You need a secret key',
      },
    ],
  },
  sc_1_0_002: {
    id: 'sc_1_0_002',
    title: 'Scene 2',
    text: 'You went left.',
    effects: [],
    choices: [
      {
        label: 'Go back',
        to: 'sc_1_0_001',
      },
    ],
  },
  sc_1_0_003: {
    id: 'sc_1_0_003',
    title: 'Scene 3',
    text: 'You went right.',
    effects: [
      { type: 'modify-stat', stat: 'courage', value: 1 },
    ],
    choices: [
      {
        label: 'Go back',
        to: 'sc_1_0_001',
      },
    ],
  },
};

describe('Engine Core', () => {
  let engine: Engine;

  beforeEach(async () => {
    engine = createTestEngine(mockManifest, { cacheScenes: true });

    // Mock the scene loader to return our test scenes
    const loader = engine.getLoader();
    loader['sceneCache'] = new Map(
      Object.entries(mockScenes).map(([id, scene]) => [id, scene])
    );
    loader['manifest'] = mockManifest;

    // Initialize
    await engine.initialize();
  });

  describe('State Initialization', () => {
    it('should initialize with correct starting scene', () => {
      const state = engine.getState();
      expect(state.currentSceneId).toBe('sc_1_0_001');
    });

    it('should apply initial scene effects', () => {
      const state = engine.getState();
      expect(state.flags.has('GAME_STARTED')).toBe(true);
      expect(state.stats.courage).toBe(5);
    });

    it('should track scene history', () => {
      const state = engine.getState();
      expect(state.history.length).toBe(1);
      expect(state.history[0].sceneId).toBe('sc_1_0_001');
      expect(state.history[0].visitedCount).toBe(1);
    });
  });

  describe('Condition Evaluation', () => {
    it('should evaluate stat conditions correctly', () => {
      const condition: Condition = {
        type: 'stat',
        stat: 'courage',
        operator: 'gte',
        value: 5,
      };

      const result = engine.evaluateCondition(condition);
      expect(result).toBe(true);
    });

    it('should evaluate flag conditions correctly', () => {
      const condition: Condition = {
        type: 'flag',
        flag: 'GAME_STARTED',
      };

      const result = engine.evaluateCondition(condition);
      expect(result).toBe(true);
    });

    it('should evaluate AND conditions correctly', () => {
      const condition: Condition = {
        type: 'and',
        conditions: [
          { type: 'flag', flag: 'GAME_STARTED' },
          { type: 'stat', stat: 'courage', operator: 'gte', value: 3 },
        ],
      };

      const result = engine.evaluateCondition(condition);
      expect(result).toBe(true);
    });

    it('should evaluate OR conditions correctly', () => {
      const condition: Condition = {
        type: 'or',
        conditions: [
          { type: 'flag', flag: 'NONEXISTENT_FLAG' },
          { type: 'stat', stat: 'courage', operator: 'gte', value: 3 },
        ],
      };

      const result = engine.evaluateCondition(condition);
      expect(result).toBe(true);
    });

    it('should evaluate NOT conditions correctly', () => {
      const condition: Condition = {
        type: 'not',
        conditions: [
          { type: 'flag', flag: 'NONEXISTENT_FLAG' },
        ],
      };

      const result = engine.evaluateCondition(condition);
      expect(result).toBe(true);
    });
  });

  describe('Effect Application', () => {
    it('should apply set-stat effect', () => {
      const effect: Effect = {
        type: 'set-stat',
        stat: 'wit',
        value: 7,
      };

      const event = engine.applyEffect(effect);
      const state = engine.getState();

      expect(state.stats.wit).toBe(7);
      expect(event.path).toBe('stats.wit');
      expect(event.newValue).toBe(7);
    });

    it('should apply modify-stat effect', () => {
      const effect: Effect = {
        type: 'modify-stat',
        stat: 'courage',
        value: 2,
      };

      const event = engine.applyEffect(effect);
      const state = engine.getState();

      expect(state.stats.courage).toBe(7); // 5 + 2
      expect(event.oldValue).toBe(5);
      expect(event.newValue).toBe(7);
    });

    it('should apply set-flag effect', () => {
      const effect: Effect = {
        type: 'set-flag',
        flag: 'NEW_FLAG',
      };

      engine.applyEffect(effect);
      const state = engine.getState();

      expect(state.flags.has('NEW_FLAG')).toBe(true);
    });

    it('should apply clear-flag effect', () => {
      const effect: Effect = {
        type: 'clear-flag',
        flag: 'GAME_STARTED',
      };

      engine.applyEffect(effect);
      const state = engine.getState();

      expect(state.flags.has('GAME_STARTED')).toBe(false);
    });

    it('should apply add-item effect', () => {
      const effect: Effect = {
        type: 'add-item',
        item: 'test_item',
        count: 3,
      };

      engine.applyEffect(effect);
      const state = engine.getState();

      expect(state.inventory.get('test_item')).toBe(3);
    });

    it('should apply remove-item effect', () => {
      // First add an item
      engine.applyEffect({ type: 'add-item', item: 'test_item', count: 5 });

      // Then remove some
      const effect: Effect = {
        type: 'remove-item',
        item: 'test_item',
        count: 2,
      };

      engine.applyEffect(effect);
      const state = engine.getState();

      expect(state.inventory.get('test_item')).toBe(3);
    });

    it('should prevent negative item counts', () => {
      // Add item
      engine.applyEffect({ type: 'add-item', item: 'test_item', count: 2 });

      // Try to remove more than available
      const effect: Effect = {
        type: 'remove-item',
        item: 'test_item',
        count: 5,
      };

      engine.applyEffect(effect);
      const state = engine.getState();

      // Item count is clamped at 0 (per agent-a: access layer returns 0 for missing items)
      expect(state.inventory.get('test_item')).toBe(0);
    });
  });

  describe('Choice Selection', () => {
    it('should return available choices', () => {
      const choices = engine.getAvailableChoices();

      expect(choices.length).toBe(3);
      expect(choices[0].enabled).toBe(true);
      expect(choices[1].enabled).toBe(true); // courage >= 5
      expect(choices[2].enabled).toBe(false); // missing flag
      expect(choices[2].disabledHint).toBe('You need a secret key');
    });

    it('should allow making valid choices', async () => {
      const result = await engine.makeChoice(0);

      expect(result.choiceIndex).toBe(0);
      expect(result.targetSceneId).toBe('sc_1_0_002');
      expect(engine.getState().currentSceneId).toBe('sc_1_0_002');
    });

    it('should reject disabled choices', async () => {
      await expect(engine.makeChoice(2)).rejects.toThrow();
    });

    it('should update scene history with choice', async () => {
      await engine.makeChoice(0);

      const history = engine.getState().history;
      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history[history.length - 1].choiceLabel).toBe('Go left');
    });
  });

  describe('Scene History and Softlock Detection', () => {
    it('should track visited count', async () => {
      // Start at sc_1_0_001
      let history = engine.getState().history;
      expect(history[0].visitedCount).toBe(1);

      // Go to scene 2 and back
      await engine.makeChoice(0);
      await engine.makeChoice(0);

      // Check visited count for starting scene
      history = engine.getState().history;
      const startEntry = history.find((h: SceneHistoryEntry) => h.sceneId === 'sc_1_0_001');
      expect(startEntry?.visitedCount).toBe(2);
    });

    it('should increment visited count on repeated visits', async () => {
      // Visit starting scene multiple times
      await engine.makeChoice(0); // to scene 2
      await engine.makeChoice(0); // back to start
      await engine.makeChoice(0); // to scene 2 again
      await engine.makeChoice(0); // back to start again

      const history = engine.getState().history;
      const startEntry = history.find((h: SceneHistoryEntry) => h.sceneId === 'sc_1_0_001');
      expect(startEntry?.visitedCount).toBe(3);
    });
  });

  describe('Save/Load', () => {
    it('should save state to JSON', () => {
      const saveData = engine.save();

      expect(typeof saveData).toBe('string');
      const parsed = JSON.parse(saveData);
      expect(parsed.currentSceneId).toBe('sc_1_0_001');
      expect(parsed.version).toBeDefined();
    });

    it('should load state from JSON', async () => {
      // Make some changes
      await engine.makeChoice(0);

      // Save
      const saveData = engine.save();

      // Create new engine and load
      const newEngine = createTestEngine(mockManifest);
      const loader = newEngine.getLoader();
      loader['sceneCache'] = new Map(
        Object.entries(mockScenes).map(([id, scene]) => [id, scene])
      );
      loader['manifest'] = mockManifest;
      await newEngine.initialize();

      newEngine.load(saveData);

      // Verify state
      expect(newEngine.getState().currentSceneId).toBe('sc_1_0_002');
      expect(newEngine.getState().flags.has('GAME_STARTED')).toBe(true);
    });

    it('should reject incompatible content versions', async () => {
      const saveData = JSON.stringify({
        version: 1,
        contentVersion: 'incompatible-version',
        currentSceneId: 'sc_1_0_001',
        history: [],
        stats: {},
        flags: [],
        inventory: [],
        factions: {},
        timestamp: Date.now(),
      });

      // engine.load() is synchronous, not async
      expect(() => engine.load(saveData)).toThrow('Content version mismatch');
    });
  });

  describe('State Change Events', () => {
    it('should emit events with renderScope and urgency', () => {
      // applyEffect() returns the event directly, does not emit to handlers
      const event = engine.applyEffect({
        type: 'modify-stat',
        stat: 'courage',
        value: 1,
      });

      expect(event).toMatchObject({
        type: 'effect-applied',
        path: 'stats.courage',
        renderScope: 'status',
        urgency: 'low',
      });
    });

    it('should include checkpoint type for scene transitions', async () => {
      const events: unknown[] = [];

      engine.onStateChange((event) => {
        if ((event as { type: string }).type === 'scene-loaded') {
          events.push(event);
        }
      });

      await engine.makeChoice(0);

      expect(events.length).toBeGreaterThan(0);
      // scene-loaded event has 'scene-transition' checkpoint, not 'choice'
      expect(events[events.length - 1]).toMatchObject({
        type: 'scene-loaded',
        checkpoint: 'scene-transition',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle scene with no choices', async () => {
      const deadEndScene: SceneData = {
        id: 'sc_1_0_004',
        title: 'Dead End',
        text: 'The end.',
        effects: [],
        choices: [],
      };

      const loader = engine.getLoader();
      loader['sceneCache'].set('sc_1_0_004', deadEndScene);

      await engine.transitionTo('sc_1_0_004');

      const choices = engine.getAvailableChoices();
      expect(choices.length).toBe(0);
    });

    it('should handle stat overflow from multiple effects', () => {
      // Apply multiple stat modifications
      for (let i = 0; i < 100; i++) {
        engine.applyEffect({
          type: 'modify-stat',
          stat: 'courage',
          value: 10,
        });
      }

      // Stats can overflow (no max limit in current implementation)
      // This is intentional - content authors control stat ranges
      expect(engine.getState().stats.courage).toBeGreaterThan(0);
    });

    it('should handle circular scene references', async () => {
      // Scene 1 -> Scene 2 -> Scene 1
      const circularScenes: Record<string, SceneData> = {
        sc_circ_1: {
          id: 'sc_circ_1',
          title: 'Circle 1',
          text: 'Go to circle 2',
          effects: [],
          choices: [{ label: 'Next', to: 'sc_circ_2' }],
        },
        sc_circ_2: {
          id: 'sc_circ_2',
          title: 'Circle 2',
          text: 'Go back to circle 1',
          effects: [],
          choices: [{ label: 'Back', to: 'sc_circ_1' }],
        },
      };

      const loader = engine.getLoader();
      loader['sceneCache'].set('sc_circ_1', circularScenes.sc_circ_1);
      loader['sceneCache'].set('sc_circ_2', circularScenes.sc_circ_2);

      // Navigate in circle multiple times
      await engine.transitionTo('sc_circ_1');
      await engine.makeChoice(0); // to circ_2
      await engine.makeChoice(0); // back to circ_1
      await engine.makeChoice(0); // to circ_2 again

      const history = engine.getState().history;
      const circ1Entry = history.filter((h: SceneHistoryEntry) => h.sceneId === 'sc_circ_1');
      // updateSceneHistory modifies existing entry in-place, incrementing visitedCount
      // sc_circ_1 is visited: (1) transitionTo, (2) one return from sc_circ_2
      expect(circ1Entry.length).toBe(1);
      expect(circ1Entry[0].visitedCount).toBe(2); // Initial + 1 return
    });
  });
});

// Run tests
describe('Condition Evaluator Edge Cases', () => {
  // Additional tests for condition evaluator...
});

describe('Effect Applier Edge Cases', () => {
  // Additional tests for effect applier...
});
