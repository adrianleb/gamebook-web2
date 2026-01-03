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
      { type: 'set-stat', stat: 'stage_presence', value: 5 },
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
          { type: 'stat', stat: 'stage_presence', operator: 'gte', value: 5 },
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
      { type: 'modify-stat', stat: 'stage_presence', value: 1 },
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
      expect(state.stats.stage_presence).toBe(5);
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
        stat: 'stage_presence',
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
          { type: 'stat', stat: 'stage_presence', operator: 'gte', value: 3 },
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
          { type: 'stat', stat: 'stage_presence', operator: 'gte', value: 3 },
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
        stat: 'improv',
        value: 7,
      };

      const event = engine.applyEffect(effect);
      const state = engine.getState();

      expect(state.stats.improv).toBe(7);
      expect(event.path).toBe('stats.improv');
      expect(event.newValue).toBe(7);
    });

    it('should apply modify-stat effect', () => {
      const effect: Effect = {
        type: 'modify-stat',
        stat: 'stage_presence',
        value: 2,
      };

      const event = engine.applyEffect(effect);
      const state = engine.getState();

      expect(state.stats.stage_presence).toBe(7); // 5 + 2
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

      // Item is removed from inventory when count reaches 0
      expect(state.inventory.get('test_item')).toBeUndefined();
    });
  });

  describe('Choice Selection', () => {
    it('should return available choices', () => {
      const choices = engine.getAvailableChoices();

      expect(choices.length).toBe(3);
      expect(choices[0].state).toBe('enabled');
      expect(choices[1].state).toBe('enabled'); // stage_presence >= 5
      expect(choices[2].state).toBe('disabled'); // missing flag
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
        stat: 'stage_presence',
        value: 1,
      });

      expect(event).toMatchObject({
        type: 'effect-applied',
        path: 'stats.stage_presence',
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
          stat: 'stage_presence',
          value: 10,
        });
      }

      // Stats can overflow (no max limit in current implementation)
      // This is intentional - content authors control stat ranges
      expect(engine.getState().stats.stage_presence).toBeGreaterThan(0);
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

  // Intent #155: Attemptable stat check tests
  describe('Attemptable Stat Checks (Intent #155)', () => {
    it('should mark attemptable choices as "risky" state', async () => {
      const riskyScene: SceneData = {
        id: 'sc_risky_001',
        title: 'Risky Choice Test',
        text: 'Test attemptable stat check.',
        effects: [],
        choices: [
          {
            label: 'Try to climb (Courage 5+)',
            to: 'sc_success',
            conditions: [
              {
                type: 'stat',
                stat: 'stage_presence',
                operator: 'gte',
                value: 5,
                attemptable: true,
              },
            ],
            onSuccess: {
              to: 'sc_success',
            },
            onFailure: {
              to: 'sc_failure',
            },
          },
        ],
      };

      const loader = engine.getLoader();
      loader['sceneCache'].set('sc_risky_001', riskyScene);
      loader['sceneCache'].set('sc_success', {
        id: 'sc_success',
        title: 'Success',
        text: 'You made it!',
        effects: [],
        choices: [],
      });
      loader['sceneCache'].set('sc_failure', {
        id: 'sc_failure',
        title: 'Failure',
        text: 'You fell!',
        effects: [],
        choices: [],
      });

      await engine.transitionTo('sc_risky_001');
      const choices = engine.getAvailableChoices();

      expect(choices.length).toBe(1);
      expect(choices[0].state).toBe('risky');
      expect(choices[0].statCheck).toBe('Stage_presence +5');
    });

    it('should branch to onSuccess when stat check passes', async () => {
      const scene: SceneData = {
        id: 'sc_branch_test',
        title: 'Branch Test',
        text: 'Test success/failure branching.',
        effects: [],
        choices: [
          {
            label: 'Attempt check',
            conditions: [
              {
                type: 'stat',
                stat: 'stage_presence',
                operator: 'gte',
                value: 5,
                attemptable: true,
              },
            ],
            onSuccess: {
              to: 'sc_success',
              effects: [{ type: 'set-flag', flag: 'CHECK_PASSED' }],
            },
            onFailure: {
              to: 'sc_failure',
              effects: [{ type: 'set-flag', flag: 'CHECK_FAILED' }],
            },
          },
        ],
      };

      const loader = engine.getLoader();
      loader['sceneCache'].set('sc_branch_test', scene);
      loader['sceneCache'].set('sc_success', {
        id: 'sc_success',
        title: 'Success',
        text: 'Passed!',
        effects: [],
        choices: [],
      });
      loader['sceneCache'].set('sc_failure', {
        id: 'sc_failure',
        title: 'Failure',
        text: 'Failed!',
        effects: [],
        choices: [],
      });

      await engine.transitionTo('sc_branch_test');
      // Courage starts at 5, so check passes
      const result = await engine.makeChoice(0);

      expect(result.targetSceneId).toBe('sc_success');
      expect(engine.getState().flags.has('CHECK_PASSED')).toBe(true);
      expect(engine.getState().flags.has('CHECK_FAILED')).toBe(false);
    });

    it('should branch to onFailure when stat check fails', async () => {
      const scene: SceneData = {
        id: 'sc_branch_test_2',
        title: 'Branch Test 2',
        text: 'Test failure branch.',
        effects: [],
        choices: [
          {
            label: 'Attempt hard check',
            conditions: [
              {
                type: 'stat',
                stat: 'stage_presence',
                operator: 'gte',
                value: 10,
                attemptable: true,
              },
            ],
            onSuccess: {
              to: 'sc_success',
              effects: [{ type: 'set-flag', flag: 'HARD_PASSED' }],
            },
            onFailure: {
              to: 'sc_failure',
              effects: [{ type: 'set-flag', flag: 'HARD_FAILED' }],
            },
          },
        ],
      };

      const loader = engine.getLoader();
      loader['sceneCache'].set('sc_branch_test_2', scene);
      loader['sceneCache'].set('sc_success', {
        id: 'sc_success',
        title: 'Success',
        text: 'Passed!',
        effects: [],
        choices: [],
      });
      loader['sceneCache'].set('sc_failure', {
        id: 'sc_failure',
        title: 'Failure',
        text: 'Failed!',
        effects: [],
        choices: [],
      });

      await engine.transitionTo('sc_branch_test_2');
      // Courage is 5, check requires 10, so it fails
      const result = await engine.makeChoice(0);

      expect(result.targetSceneId).toBe('sc_failure');
      expect(engine.getState().flags.has('HARD_PASSED')).toBe(false);
      expect(engine.getState().flags.has('HARD_FAILED')).toBe(true);
    });

    it('should fallback to default "to" when onSuccess missing', async () => {
      const scene: SceneData = {
        id: 'sc_fallback_test',
        title: 'Fallback Test',
        text: 'Test default fallback.',
        effects: [],
        choices: [
          {
            label: 'Try without onSuccess',
            to: 'sc_default',
            conditions: [
              {
                type: 'stat',
                stat: 'stage_presence',
                operator: 'gte',
                value: 3,
                attemptable: true,
              },
            ],
            onFailure: {
              to: 'sc_failure',
            },
          },
        ],
      };

      const loader = engine.getLoader();
      loader['sceneCache'].set('sc_fallback_test', scene);
      loader['sceneCache'].set('sc_default', {
        id: 'sc_default',
        title: 'Default',
        text: 'Default path.',
        effects: [],
        choices: [],
      });
      loader['sceneCache'].set('sc_failure', {
        id: 'sc_failure',
        title: 'Failure',
        text: 'Failed!',
        effects: [],
        choices: [],
      });

      await engine.transitionTo('sc_fallback_test');
      // Courage is 5, check passes, but no onSuccess defined
      const result = await engine.makeChoice(0);

      expect(result.targetSceneId).toBe('sc_default');
    });

    it('should fallback to default "to" when onFailure missing', async () => {
      const scene: SceneData = {
        id: 'sc_fallback_test_2',
        title: 'Fallback Test 2',
        text: 'Test default fallback.',
        effects: [],
        choices: [
          {
            label: 'Try without onFailure',
            to: 'sc_default',
            conditions: [
              {
                type: 'stat',
                stat: 'stage_presence',
                operator: 'gte',
                value: 10,
                attemptable: true,
              },
            ],
            onSuccess: {
              to: 'sc_success',
            },
          },
        ],
      };

      const loader = engine.getLoader();
      loader['sceneCache'].set('sc_fallback_test_2', scene);
      loader['sceneCache'].set('sc_default', {
        id: 'sc_default',
        title: 'Default',
        text: 'Default path.',
        effects: [],
        choices: [],
      });
      loader['sceneCache'].set('sc_success', {
        id: 'sc_success',
        title: 'Success',
        text: 'Success!',
        effects: [],
        choices: [],
      });

      await engine.transitionTo('sc_fallback_test_2');
      // Courage is 5, check fails, but no onFailure defined
      const result = await engine.makeChoice(0);

      expect(result.targetSceneId).toBe('sc_default');
    });

    it('should support non-attemptable choices alongside attemptable', async () => {
      const mixedScene: SceneData = {
        id: 'sc_mixed',
        title: 'Mixed Choices',
        text: 'Test mixed choice types.',
        effects: [],
        choices: [
          {
            label: 'Always available',
            to: 'sc_always',
          },
          {
            label: 'Attemptable check',
            to: 'sc_risky',
            conditions: [
              {
                type: 'stat',
                stat: 'stage_presence',
                operator: 'gte',
                value: 5,
                attemptable: true,
              },
            ],
          },
          {
            label: 'Gated choice',
            to: 'sc_gated',
            conditions: [
              {
                type: 'flag',
                flag: 'HAS_KEY',
              },
            ],
            disabledHint: 'You need a key',
          },
        ],
      };

      const loader = engine.getLoader();
      loader['sceneCache'].set('sc_mixed', mixedScene);
      loader['sceneCache'].set('sc_always', {
        id: 'sc_always',
        title: 'Always',
        text: 'Always available.',
        effects: [],
        choices: [],
      });
      loader['sceneCache'].set('sc_risky', {
        id: 'sc_risky',
        title: 'Risky',
        text: 'Risky path.',
        effects: [],
        choices: [],
      });
      loader['sceneCache'].set('sc_gated', {
        id: 'sc_gated',
        title: 'Gated',
        text: 'Gated path.',
        effects: [],
        choices: [],
      });

      await engine.transitionTo('sc_mixed');
      const choices = engine.getAvailableChoices();

      expect(choices.length).toBe(3);
      expect(choices[0].state).toBe('enabled');
      expect(choices[1].state).toBe('risky');
      expect(choices[2].state).toBe('disabled');
      expect(choices[2].disabledHint).toBe('You need a key');
    });
  });
});

// Run tests
describe('Condition Evaluator Edge Cases', () => {
  let engine: Engine;
  let evaluator: import('../../src/engine/condition-evaluator.js').ConditionEvaluator;

  beforeEach(async () => {
    engine = createTestEngine(mockManifest, { cacheScenes: true });
    const loader = engine.getLoader();
    loader['sceneCache'] = new Map(
      Object.entries(mockScenes).map(([id, scene]) => [id, scene])
    );
    loader['manifest'] = mockManifest;
    await engine.initialize();

    // Import ConditionEvaluator for direct testing
    const { ConditionEvaluator } = await import('../../src/engine/condition-evaluator.js');
    evaluator = new ConditionEvaluator();
  });

  describe('Missing/Undefined Fields', () => {
    it('should return false for stat condition with missing stat', () => {
      const state = engine.getState();
      const condition: Condition = {
        type: 'stat',
        operator: 'gte',
        value: 5,
        // stat is undefined
      } as Condition;

      expect(evaluator.evaluate(condition, state)).toBe(false);
    });

    it('should return false for stat condition with missing operator', () => {
      const state = engine.getState();
      const condition: Condition = {
        type: 'stat',
        stat: 'stage_presence',
        value: 5,
        // operator is undefined
      } as Condition;

      expect(evaluator.evaluate(condition, state)).toBe(false);
    });

    it('should return false for stat condition with missing value', () => {
      const state = engine.getState();
      const condition: Condition = {
        type: 'stat',
        stat: 'stage_presence',
        operator: 'gte',
        // value is undefined
      } as Condition;

      expect(evaluator.evaluate(condition, state)).toBe(false);
    });

    it('should return false for flag condition with missing flag', () => {
      const state = engine.getState();
      const condition: Condition = {
        type: 'flag',
        // flag is undefined
      } as Condition;

      expect(evaluator.evaluate(condition, state)).toBe(false);
    });

    it('should return false for item condition with missing item', () => {
      const state = engine.getState();
      const condition: Condition = {
        type: 'item',
        itemCount: 1,
        // item is undefined
      } as Condition;

      expect(evaluator.evaluate(condition, state)).toBe(false);
    });

    it('should return false for faction condition with missing faction', () => {
      const state = engine.getState();
      const condition: Condition = {
        type: 'faction',
        factionLevel: 5,
        // faction is undefined
      } as Condition;

      expect(evaluator.evaluate(condition, state)).toBe(false);
    });

    it('should return false for unknown condition type', () => {
      const state = engine.getState();
      const condition: Condition = {
        type: 'unknown' as never,
      };

      expect(evaluator.evaluate(condition, state)).toBe(false);
    });
  });

  describe('Boundary Values', () => {
    it('should handle stat at exact boundary (gte)', () => {
      const state = engine.getState();
      state.stats.stage_presence = 5;

      const condition: Condition = {
        type: 'stat',
        stat: 'stage_presence',
        operator: 'gte',
        value: 5,
      };

      expect(evaluator.evaluate(condition, state)).toBe(true);
    });

    it('should handle stat below boundary (gte)', () => {
      const state = engine.getState();
      state.stats.stage_presence = 4;

      const condition: Condition = {
        type: 'stat',
        stat: 'stage_presence',
        operator: 'gte',
        value: 5,
      };

      expect(evaluator.evaluate(condition, state)).toBe(false);
    });

    it('should handle stat at exact boundary (lte)', () => {
      const state = engine.getState();
      state.stats.stage_presence = 5;

      const condition: Condition = {
        type: 'stat',
        stat: 'stage_presence',
        operator: 'lte',
        value: 5,
      };

      expect(evaluator.evaluate(condition, state)).toBe(true);
    });

    it('should handle stat at exact boundary (eq)', () => {
      const state = engine.getState();
      state.stats.stage_presence = 5;

      const condition: Condition = {
        type: 'stat',
        stat: 'stage_presence',
        operator: 'eq',
        value: 5,
      };

      expect(evaluator.evaluate(condition, state)).toBe(true);
    });

    it('should handle stat just below boundary (gt)', () => {
      const state = engine.getState();
      state.stats.stage_presence = 5;

      const condition: Condition = {
        type: 'stat',
        stat: 'stage_presence',
        operator: 'gt',
        value: 5,
      };

      expect(evaluator.evaluate(condition, state)).toBe(false);
    });

    it('should handle stat just above boundary (lt)', () => {
      const state = engine.getState();
      state.stats.stage_presence = 5;

      const condition: Condition = {
        type: 'stat',
        stat: 'stage_presence',
        operator: 'lt',
        value: 5,
      };

      expect(evaluator.evaluate(condition, state)).toBe(false);
    });

    it('should default missing stat to 0', () => {
      const state = engine.getState();
      // stat 'nonexistent' is not in state.stats

      const condition: Condition = {
        type: 'stat',
        stat: 'nonexistent',
        operator: 'gte',
        value: 0,
      };

      expect(evaluator.evaluate(condition, state)).toBe(true); // 0 >= 0
    });

    it('should default missing faction to 0', () => {
      const state = engine.getState();
      // faction 'nonexistent' is not in state.factions

      const condition: Condition = {
        type: 'faction',
        faction: 'nonexistent',
        factionLevel: 0,
      };

      expect(evaluator.evaluate(condition, state)).toBe(true); // 0 >= 0
    });
  });

  describe('Empty AND/OR/NOT Conditions', () => {
    it('should return true for empty AND (vacuous truth)', () => {
      const state = engine.getState();
      const condition: Condition = {
        type: 'and',
        conditions: [],
      };

      expect(evaluator.evaluate(condition, state)).toBe(true);
    });

    it('should return false for empty OR', () => {
      const state = engine.getState();
      const condition: Condition = {
        type: 'or',
        conditions: [],
      };

      expect(evaluator.evaluate(condition, state)).toBe(false);
    });

    it('should return false for NOT without exactly one condition', () => {
      const state = engine.getState();
      const condition: Condition = {
        type: 'not',
        conditions: [], // Empty, not exactly one
      };

      expect(evaluator.evaluate(condition, state)).toBe(false);
    });

    it('should return false for NOT with multiple conditions', () => {
      const state = engine.getState();
      const condition: Condition = {
        type: 'not',
        conditions: [
          { type: 'flag', flag: 'GAME_STARTED' },
          { type: 'flag', flag: 'ANOTHER_FLAG' },
        ],
      };

      expect(evaluator.evaluate(condition, state)).toBe(false);
    });
  });

  describe('Nested Conditions', () => {
    it('should evaluate deeply nested AND conditions', () => {
      const state = engine.getState();
      state.stats.stage_presence = 5;

      const condition: Condition = {
        type: 'and',
        conditions: [
          {
            type: 'and',
            conditions: [
              { type: 'flag', flag: 'GAME_STARTED' },
              {
                type: 'or',
                conditions: [
                  { type: 'stat', stat: 'stage_presence', operator: 'gte', value: 5 },
                  { type: 'stat', stat: 'stage_presence', operator: 'gte', value: 10 },
                ],
              },
            ],
          },
        ],
      };

      expect(evaluator.evaluate(condition, state)).toBe(true);
    });

    it('should evaluate deeply nested OR conditions', () => {
      const state = engine.getState();
      state.flags.add('FLAG_A');

      const condition: Condition = {
        type: 'or',
        conditions: [
          { type: 'flag', flag: 'FLAG_A' },
          {
            type: 'or',
            conditions: [
              { type: 'flag', flag: 'FLAG_B' },
              { type: 'flag', flag: 'FLAG_C' },
            ],
          },
        ],
      };

      expect(evaluator.evaluate(condition, state)).toBe(true);
    });

    it('should evaluate NOT with nested AND', () => {
      const state = engine.getState();

      const condition: Condition = {
        type: 'not',
        conditions: [
          {
            type: 'and',
            conditions: [
              { type: 'flag', flag: 'NONEXISTENT' },
              { type: 'flag', flag: 'ALSO_NONEXISTENT' },
            ],
          },
        ],
      };

      // NOT(AND(false, false)) = NOT(false) = true
      expect(evaluator.evaluate(condition, state)).toBe(true);
    });
  });

  describe('Item Conditions', () => {
    it('should return false when item not in inventory', () => {
      const state = engine.getState();
      // inventory is empty

      const condition: Condition = {
        type: 'item',
        item: 'test_item',
      };

      expect(evaluator.evaluate(condition, state)).toBe(false);
    });

    it('should return true when item count meets requirement', () => {
      const state = engine.getState();
      state.inventory.set('test_item', 5);

      const condition: Condition = {
        type: 'item',
        item: 'test_item',
        itemCount: 5,
      };

      expect(evaluator.evaluate(condition, state)).toBe(true);
    });

    it('should return false when item count insufficient', () => {
      const state = engine.getState();
      state.inventory.set('test_item', 2);

      const condition: Condition = {
        type: 'item',
        item: 'test_item',
        itemCount: 5,
      };

      expect(evaluator.evaluate(condition, state)).toBe(false);
    });

    it('should default itemCount to 1', () => {
      const state = engine.getState();
      state.inventory.set('test_item', 1);

      const condition: Condition = {
        type: 'item',
        item: 'test_item',
        // itemCount defaults to 1
      };

      expect(evaluator.evaluate(condition, state)).toBe(true);
    });
  });

  describe('Faction Conditions', () => {
    it('should return true when faction level meets requirement', () => {
      const state = engine.getState();
      state.factions.preservationist = 7;

      const condition: Condition = {
        type: 'faction',
        faction: 'preservationist',
        factionLevel: 7,
      };

      expect(evaluator.evaluate(condition, state)).toBe(true);
    });

    it('should return false when faction level below requirement', () => {
      const state = engine.getState();
      state.factions.preservationist = 5;

      const condition: Condition = {
        type: 'faction',
        faction: 'preservationist',
        factionLevel: 7,
      };

      expect(evaluator.evaluate(condition, state)).toBe(false);
    });

    it('should default missing faction to 0', () => {
      const state = engine.getState();
      // preservationist faction not set

      const condition: Condition = {
        type: 'faction',
        faction: 'preservationist',
        factionLevel: 0,
      };

      expect(evaluator.evaluate(condition, state)).toBe(true); // 0 >= 0
    });
  });

  describe('Attemptable Detection', () => {
    it('should detect attemptable on direct condition', () => {
      const condition: Condition = {
        type: 'stat',
        stat: 'courage',
        operator: 'gte',
        value: 5,
        attemptable: true,
      };

      expect(evaluator.isAttemptable(condition)).toBe(true);
    });

    it('should detect attemptable in nested AND', () => {
      const condition: Condition = {
        type: 'and',
        conditions: [
          { type: 'flag', flag: 'GAME_STARTED' },
          {
            type: 'stat',
            stat: 'courage',
            operator: 'gte',
            value: 5,
            attemptable: true,
          },
        ],
      };

      expect(evaluator.isAttemptable(condition)).toBe(true);
    });

    it('should detect attemptable in nested OR', () => {
      const condition: Condition = {
        type: 'or',
        conditions: [
          { type: 'flag', flag: 'GAME_STARTED' },
          {
            type: 'stat',
            stat: 'courage',
            operator: 'gte',
            value: 5,
            attemptable: true,
          },
        ],
      };

      expect(evaluator.isAttemptable(condition)).toBe(true);
    });

    it('should not detect attemptable when flag not set', () => {
      const condition: Condition = {
        type: 'stat',
        stat: 'courage',
        operator: 'gte',
        value: 5,
        // attemptable not set
      };

      expect(evaluator.isAttemptable(condition)).toBe(false);
    });
  });

  describe('Reference Methods', () => {
    it('should detect stat reference in simple condition', () => {
      const condition: Condition = {
        type: 'stat',
        stat: 'courage',
        operator: 'gte',
        value: 5,
      };

      expect(evaluator.referencesStat('courage', condition)).toBe(true);
      expect(evaluator.referencesStat('wit', condition)).toBe(false);
    });

    it('should detect stat reference in nested condition', () => {
      const condition: Condition = {
        type: 'and',
        conditions: [
          { type: 'flag', flag: 'GAME_STARTED' },
          { type: 'stat', stat: 'courage', operator: 'gte', value: 5 },
        ],
      };

      expect(evaluator.referencesStat('courage', condition)).toBe(true);
    });

    it('should detect flag reference', () => {
      const condition: Condition = {
        type: 'flag',
        flag: 'GAME_STARTED',
      };

      expect(evaluator.referencesFlag('GAME_STARTED', condition)).toBe(true);
    });

    it('should detect item reference', () => {
      const condition: Condition = {
        type: 'item',
        item: 'magic_sword',
      };

      expect(evaluator.referencesItem('magic_sword', condition)).toBe(true);
    });
  });

  describe('Stat Check Description', () => {
    it('should format simple stat check', () => {
      const condition: Condition = {
        type: 'stat',
        stat: 'courage',
        operator: 'gte',
        value: 5,
      };

      expect(evaluator.getStatCheckDescription(condition)).toBe('Courage +5');
    });

    it('should format stat check with different operators', () => {
      const baseCondition = { type: 'stat', stat: 'courage', value: 5 };

      expect(evaluator.getStatCheckDescription({ ...baseCondition, operator: 'gte' })).toBe('Courage +5');
      expect(evaluator.getStatCheckDescription({ ...baseCondition, operator: 'lte' })).toBe('Courage -5');
      expect(evaluator.getStatCheckDescription({ ...baseCondition, operator: 'eq' })).toBe('Courage =5');
      expect(evaluator.getStatCheckDescription({ ...baseCondition, operator: 'gt' })).toBe('Courage >5');
      expect(evaluator.getStatCheckDescription({ ...baseCondition, operator: 'lt' })).toBe('Courage <5');
    });

    it('should return null for non-stat condition', () => {
      const condition: Condition = {
        type: 'flag',
        flag: 'GAME_STARTED',
      };

      expect(evaluator.getStatCheckDescription(condition)).toBeNull();
    });

    it('should return null for stat condition with missing fields', () => {
      const condition: Condition = {
        type: 'stat',
        // stat is missing
      } as Condition;

      expect(evaluator.getStatCheckDescription(condition)).toBeNull();
    });

    it('should format multi-word stat names', () => {
      const condition: Condition = {
        type: 'stat',
        stat: 'stage_presence',
        operator: 'gte',
        value: 7,
      };

      // Note: formatStatName converts "stage_presence" to "Stage_presence" (capitalizes first letter only)
      // This is the actual behavior - underscores are not converted to spaces
      expect(evaluator.getStatCheckDescription(condition)).toBe('Stage_presence +7');
    });
  });
});

describe('Effect Applier Edge Cases', () => {
  let engine: Engine;
  let applier: import('../../src/engine/effect-applier.js').EffectApplier;
  let initialState: import('../../src/engine/types.js').GameState;

  beforeEach(async () => {
    engine = createTestEngine(mockManifest, { cacheScenes: true });
    const loader = engine.getLoader();
    loader['sceneCache'] = new Map(
      Object.entries(mockScenes).map(([id, scene]) => [id, scene])
    );
    loader['manifest'] = mockManifest;
    await engine.initialize();

    // Import EffectApplier for direct testing
    const { EffectApplier } = await import('../../src/engine/effect-applier.js');
    applier = new EffectApplier();
    initialState = engine.getState();
  });

  describe('Missing/Undefined Fields', () => {
    it('should return no-op event for set-stat with missing stat', () => {
      const effect: Effect = {
        type: 'set-stat',
        value: 5,
        // stat is missing
      } as Effect;

      const event = applier.apply(effect, initialState);

      expect(event.path).toBe('none');
      expect(event.newValue).toBeUndefined();
    });

    it('should return no-op event for set-stat with missing value', () => {
      const effect: Effect = {
        type: 'set-stat',
        stat: 'stage_presence',
        // value is missing
      } as Effect;

      const event = applier.apply(effect, initialState);

      expect(event.path).toBe('none');
      expect(event.newValue).toBeUndefined();
    });

    it('should return no-op event for set-flag with missing flag', () => {
      const effect: Effect = {
        type: 'set-flag',
        // flag is missing
      } as Effect;

      const event = applier.apply(effect, initialState);

      expect(event.path).toBe('none');
      expect(event.newValue).toBeUndefined();
    });

    it('should return no-op event for add-item with missing item', () => {
      const effect: Effect = {
        type: 'add-item',
        count: 5,
        // item is missing
      } as Effect;

      const event = applier.apply(effect, initialState);

      expect(event.path).toBe('none');
      expect(event.newValue).toBeUndefined();
    });

    it('should return no-op event for goto with missing sceneId', () => {
      const effect: Effect = {
        type: 'goto',
        // sceneId is missing
      } as Effect;

      const event = applier.apply(effect, initialState);

      expect(event.path).toBe('none');
      expect(event.newValue).toBeUndefined();
    });

    it('should return no-op event for unknown effect type', () => {
      const effect: Effect = {
        type: 'unknown' as never,
      };

      const event = applier.apply(effect, initialState);

      expect(event.path).toBe('none');
      expect(event.type).toBe('effect-applied');
    });
  });

  describe('Stat Modification Clamping', () => {
    it('should allow negative stat values', () => {
      const effect: Effect = {
        type: 'modify-stat',
        stat: 'stage_presence',
        value: -100,
      };

      const event = applier.apply(effect, initialState);

      expect(event.newValue).toBe(-95); // 5 - 100
    });

    it('should allow stat overflow (no upper limit)', () => {
      const effect: Effect = {
        type: 'modify-stat',
        stat: 'stage_presence',
        value: 999999,
      };

      const event = applier.apply(effect, initialState);

      expect(event.newValue).toBe(1000004); // 5 + 999999
    });

    it('should set stat to exact value', () => {
      const effect: Effect = {
        type: 'set-stat',
        stat: 'stage_presence',
        value: 42,
      };

      const event = applier.apply(effect, initialState);

      expect(event.newValue).toBe(42);
    });

    it('should set stat to 0', () => {
      const effect: Effect = {
        type: 'set-stat',
        stat: 'stage_presence',
        value: 0,
      };

      const event = applier.apply(effect, initialState);

      expect(event.newValue).toBe(0);
    });
  });

  describe('Item Count Clamping', () => {
    it('should clamp item removal at 0', () => {
      // Add item
      applier.apply({ type: 'add-item', item: 'test_item', count: 3 }, initialState);

      // Remove more than available
      const event = applier.apply({ type: 'remove-item', item: 'test_item', count: 10 }, initialState);

      expect(event.newValue).toBe(0);
      expect(initialState.inventory.has('test_item')).toBe(false);
    });

    it('should remove item from inventory when count reaches 0', () => {
      // Add item
      applier.apply({ type: 'add-item', item: 'test_item', count: 5 }, initialState);

      // Remove exactly 5
      applier.apply({ type: 'remove-item', item: 'test_item', count: 5 }, initialState);

      expect(initialState.inventory.has('test_item')).toBe(false);
    });

    it('should keep item when count > 0 after removal', () => {
      // Add item
      applier.apply({ type: 'add-item', item: 'test_item', count: 10 }, initialState);

      // Remove some
      applier.apply({ type: 'remove-item', item: 'test_item', count: 5 }, initialState);

      expect(initialState.inventory.has('test_item')).toBe(true);
      expect(initialState.inventory.get('test_item')).toBe(5);
    });

    it('should default item count to 1 when adding', () => {
      const effect: Effect = {
        type: 'add-item',
        item: 'test_item',
        // count defaults to 1
      };

      applier.apply(effect, initialState);

      expect(initialState.inventory.get('test_item')).toBe(1);
    });

    it('should default item count to 1 when removing', () => {
      // Add 5 items
      applier.apply({ type: 'add-item', item: 'test_item', count: 5 }, initialState);

      // Remove without count (defaults to 1)
      applier.apply({ type: 'remove-item', item: 'test_item' }, initialState);

      expect(initialState.inventory.get('test_item')).toBe(4);
    });
  });

  describe('Faction Clamping', () => {
    it('should clamp faction level at minimum 0', () => {
      initialState.factions.preservationist = 2;

      const effect: Effect = {
        type: 'modify-faction',
        faction: 'preservationist',
        amount: -5,
      };

      const event = applier.apply(effect, initialState);

      expect(event.newValue).toBe(0); // Clamped to 0
    });

    it('should clamp faction level at maximum 10', () => {
      initialState.factions.preservationist = 8;

      const effect: Effect = {
        type: 'modify-faction',
        faction: 'preservationist',
        amount: 5,
      };

      const event = applier.apply(effect, initialState);

      expect(event.newValue).toBe(10); // Clamped to 10
    });

    it('should handle faction at exact boundaries', () => {
      initialState.factions.preservationist = 10;

      // Try to increase beyond max
      const event1 = applier.apply({ type: 'modify-faction', faction: 'preservationist', amount: 1 }, initialState);
      expect(event1.newValue).toBe(10);

      // Try to decrease from max
      const event2 = applier.apply({ type: 'modify-faction', faction: 'preservationist', amount: -2 }, initialState);
      expect(event2.newValue).toBe(8);
    });

    it('should default faction amount to 1', () => {
      const effect: Effect = {
        type: 'modify-faction',
        faction: 'preservationist',
        // amount defaults to 1
      };

      const event = applier.apply(effect, initialState);

      expect(event.newValue).toBe(1); // 0 + 1
    });
  });

  describe('Event Metadata', () => {
    it('should include correct render scope for stat effects', () => {
      const event = applier.apply({ type: 'set-stat', stat: 'courage', value: 5 }, initialState);

      expect(event.renderScope).toBe('status');
      expect(event.urgency).toBe('low');
    });

    it('should include correct render scope for flag effects', () => {
      const event = applier.apply({ type: 'set-flag', flag: 'TEST_FLAG' }, initialState);

      expect(event.renderScope).toBe('all');
      expect(event.urgency).toBe('immediate');
    });

    it('should include correct render scope for item effects', () => {
      const event = applier.apply({ type: 'add-item', item: 'test_item', count: 3 }, initialState);

      expect(event.renderScope).toBe('inventory');
      expect(event.urgency).toBe('immediate');
    });

    it('should include correct render scope for goto effect', () => {
      const event = applier.apply({ type: 'goto', sceneId: 'sc_1_0_002' }, initialState);

      expect(event.renderScope).toBe('scene');
      expect(event.urgency).toBe('immediate');
    });

    it('should include checkpoint in event when provided', () => {
      const event = applier.apply({ type: 'set-flag', flag: 'TEST' }, initialState, 'scene-transition');

      expect(event.checkpoint).toBe('scene-transition');
    });

    it('should not include checkpoint when not provided', () => {
      const event = applier.apply({ type: 'set-flag', flag: 'TEST' }, initialState);

      expect(event.checkpoint).toBeUndefined();
    });

    it('should include timestamp in event', () => {
      const beforeTime = Date.now();
      const event = applier.apply({ type: 'set-flag', flag: 'TEST' }, initialState);
      const afterTime = Date.now();

      expect(event.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(event.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should include old and new values in event', () => {
      const event = applier.apply({ type: 'modify-stat', stat: 'stage_presence', value: 2 }, initialState);

      expect(event.oldValue).toBe(5);
      expect(event.newValue).toBe(7);
    });

    it('should include path in event', () => {
      const event = applier.apply({ type: 'modify-stat', stat: 'courage', value: 3 }, initialState);

      expect(event.path).toBe('stats.courage');
    });
  });

  describe('applyAll Method', () => {
    it('should apply multiple effects in sequence', () => {
      const effects: Effect[] = [
        { type: 'set-stat', stat: 'courage', value: 5 },
        { type: 'modify-stat', stat: 'courage', value: 2 },
        { type: 'set-flag', flag: 'TEST_FLAG' },
      ];

      const events = applier.applyAll(effects, initialState);

      expect(events.length).toBe(3);
      expect(initialState.stats.courage).toBe(7);
      expect(initialState.flags.has('TEST_FLAG')).toBe(true);
    });

    it('should return events in order', () => {
      const effects: Effect[] = [
        { type: 'set-stat', stat: 'stat1', value: 1 },
        { type: 'set-stat', stat: 'stat2', value: 2 },
        { type: 'set-stat', stat: 'stat3', value: 3 },
      ];

      const events = applier.applyAll(effects, initialState);

      expect(events[0].path).toBe('stats.stat1');
      expect(events[1].path).toBe('stats.stat2');
      expect(events[2].path).toBe('stats.stat3');
    });

    it('should handle empty effects array', () => {
      const events = applier.applyAll([], initialState);

      expect(events).toEqual([]);
    });

    it('should pass checkpoint to all effects', () => {
      const effects: Effect[] = [
        { type: 'set-flag', flag: 'FLAG1' },
        { type: 'set-flag', flag: 'FLAG2' },
      ];

      const events = applier.applyAll(effects, initialState, 'test-checkpoint');

      expect(events[0].checkpoint).toBe('test-checkpoint');
      expect(events[1].checkpoint).toBe('test-checkpoint');
    });
  });

  describe('getRenderScope Method', () => {
    it('should return status for stat effects', () => {
      expect(applier.getRenderScope('set-stat')).toBe('status');
      expect(applier.getRenderScope('modify-stat')).toBe('status');
    });

    it('should return status for faction effect', () => {
      expect(applier.getRenderScope('modify-faction')).toBe('status');
    });

    it('should return inventory for item effects', () => {
      expect(applier.getRenderScope('add-item')).toBe('inventory');
      expect(applier.getRenderScope('remove-item')).toBe('inventory');
    });

    it('should return all for flag effects', () => {
      expect(applier.getRenderScope('set-flag')).toBe('all');
      expect(applier.getRenderScope('clear-flag')).toBe('all');
    });

    it('should return scene for goto effect', () => {
      expect(applier.getRenderScope('goto')).toBe('scene');
    });
  });

  describe('getRenderUrgency Method', () => {
    it('should return low for stat effects', () => {
      expect(applier.getRenderUrgency('set-stat')).toBe('low');
      expect(applier.getRenderUrgency('modify-stat')).toBe('low');
    });

    it('should return low for faction effect', () => {
      expect(applier.getRenderUrgency('modify-faction')).toBe('low');
    });

    it('should return immediate for flag effects', () => {
      expect(applier.getRenderUrgency('set-flag')).toBe('immediate');
      expect(applier.getRenderUrgency('clear-flag')).toBe('immediate');
    });

    it('should return immediate for item effects', () => {
      expect(applier.getRenderUrgency('add-item')).toBe('immediate');
      expect(applier.getRenderUrgency('remove-item')).toBe('immediate');
    });

    it('should return immediate for goto effect', () => {
      expect(applier.getRenderUrgency('goto')).toBe('immediate');
    });
  });

  describe('State Mutation Verification', () => {
    it('should mutate state for set-stat', () => {
      const state = engine.getState();
      const oldValue = state.stats.courage ?? 0;

      applier.apply({ type: 'set-stat', stat: 'courage', value: 10 }, state);

      expect(state.stats.courage).toBe(10);
    });

    it('should mutate state for set-flag', () => {
      const state = engine.getState();

      applier.apply({ type: 'set-flag', flag: 'NEW_FLAG' }, state);

      expect(state.flags.has('NEW_FLAG')).toBe(true);
    });

    it('should mutate state for clear-flag', () => {
      const state = engine.getState();
      state.flags.add('TEMP_FLAG');

      applier.apply({ type: 'clear-flag', flag: 'TEMP_FLAG' }, state);

      expect(state.flags.has('TEMP_FLAG')).toBe(false);
    });

    it('should mutate state for add-item', () => {
      const state = engine.getState();

      applier.apply({ type: 'add-item', item: 'magic_item', count: 3 }, state);

      expect(state.inventory.get('magic_item')).toBe(3);
    });

    it('should mutate state for modify-faction', () => {
      const state = engine.getState();

      applier.apply({ type: 'modify-faction', faction: 'preservationist', amount: 2 }, state);

      expect(state.factions.preservationist).toBe(2);
    });

    it('should not mutate state for goto effect', () => {
      const state = engine.getState();
      const oldSceneId = state.currentSceneId;

      applier.apply({ type: 'goto', sceneId: 'sc_other' }, state);

      // goto effect only returns event, doesn't mutate currentSceneId
      // Actual transition is handled by Engine.transitionTo()
      expect(state.currentSceneId).toBe(oldSceneId);
    });
  });

  describe('Flag Set/Clear Semantics', () => {
    it('should set flag that is already set (idempotent)', () => {
      const state = engine.getState();
      state.flags.add('TEST_FLAG');

      const event = applier.apply({ type: 'set-flag', flag: 'TEST_FLAG' }, state);

      expect(state.flags.has('TEST_FLAG')).toBe(true);
      expect(event.oldValue).toBe('set'); // oldValue is 'set' string when flag was already set
      expect(event.newValue).toBe('set');
    });

    it('should clear flag that is not set (idempotent)', () => {
      const state = engine.getState();

      const event = applier.apply({ type: 'clear-flag', flag: 'NONEXISTENT_FLAG' }, state);

      expect(state.flags.has('NONEXISTENT_FLAG')).toBe(false);
      expect(event.oldValue).toBe('unset'); // oldValue is 'unset' string when flag was already unset
      expect(event.newValue).toBe('unset');
    });

    it('should set then clear flag successfully', () => {
      const state = engine.getState();

      applier.apply({ type: 'set-flag', flag: 'TEST_FLAG' }, state);
      expect(state.flags.has('TEST_FLAG')).toBe(true);

      applier.apply({ type: 'clear-flag', flag: 'TEST_FLAG' }, state);
      expect(state.flags.has('TEST_FLAG')).toBe(false);
    });
  });
});
