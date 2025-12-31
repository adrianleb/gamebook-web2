/**
 * Phase 4 Accessibility Regression Tests
 *
 * Tests that Phase 4 Polish accessibility features do NOT break
 * existing engine functionality. The accessibility features
 * (CRT filter, reduced motion, audio) are UI-layer concerns
 * handled by src/ui/crt-filter.ts, src/ui/audio-manager.ts,
 * and CSS in src/ui/shell.css.
 *
 * Per agent-c's Engine lens: The engine remains focused on
 * deterministic state management. Accessibility preferences
 * are handled by the UI layer without affecting core gameplay.
 *
 * Per Intent #133: Validates Phase 4 regression prevention:
 * - PT-P4-ACC: Phase 3 QA gates still pass
 * - PT-P4-ACC: Save/load unaffected by UI changes
 * - PT-P4-ACC: State machine determinism maintained
 *
 * @author agent-e (Validator Lens)
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { Engine, createTestEngine } from '../../src/engine/index.js';
import type {
  GameManifest,
  SceneData,
} from '../../src/engine/types.js';

/**
 * Mock manifest for accessibility regression testing.
 */
const mockManifest: GameManifest = {
  gamebook: {
    title: 'Accessibility Regression Test',
    source: 'test',
    version: '1.0.0',
    adaptationVersion: '0.0.1',
  },
  structure: {
    acts: 1,
    totalNodesEstimated: 3,
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
  },
  implementationStatus: {
    totalScenes: 2,
    pending: 0,
    draft: 0,
    complete: 2,
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
        label: 'Continue',
        to: 'sc_1_0_002',
        conditions: [
          { type: 'stat', stat: 'courage', operator: 'gte', value: 5 },
        ],
      },
      {
        label: 'Alternative',
        to: 'sc_1_0_002',
      },
    ],
  },
  sc_1_0_002: {
    id: 'sc_1_0_002',
    title: 'Scene 2',
    text: 'You continued.',
    effects: [
      { type: 'add-item', item: 'test_item', count: 1 },
    ],
    choices: [],
  },
};

describe('Phase 4: Accessibility - Engine Regression Tests', () => {
  let engine: Engine;

  beforeEach(async () => {
    engine = createTestEngine(mockManifest, { cacheScenes: true });

    // Mock scene loader
    const loader = engine.getLoader();
    loader['sceneCache'] = new Map(
      Object.entries(mockScenes).map(([id, scene]) => [id, scene])
    );
    loader['manifest'] = mockManifest;

    await engine.initialize();
  });

  describe('PT-P4-ACC-001: Phase 3 QA Gates Still Pass', () => {
    it('should not break scene navigation', async () => {
      // Phase 3: Scene reachability should work unchanged
      const choices = engine.getAvailableChoices();
      expect(choices.length).toBe(2);
      expect(choices[0].state).toBe('enabled'); // courage >= 5
      expect(choices[1].state).toBe('enabled'); // no conditions

      await engine.makeChoice(0);
      expect(engine.getState().currentSceneId).toBe('sc_1_0_002');
    });

    it('should not break stat condition evaluation', () => {
      // Phase 3: Stat checks should work unchanged
      const condition = {
        type: 'stat' as const,
        stat: 'courage' as const,
        operator: 'gte' as const,
        value: 5,
      };

      const result = engine.evaluateCondition(condition);
      expect(result).toBe(true);
    });

    it('should not break flag operations', () => {
      // Phase 3: Flag set/clear should work unchanged
      expect(engine.getState().flags.has('GAME_STARTED')).toBe(true);

      engine.applyEffect({ type: 'clear-flag', flag: 'GAME_STARTED' });
      expect(engine.getState().flags.has('GAME_STARTED')).toBe(false);

      engine.applyEffect({ type: 'set-flag', flag: 'NEW_FLAG' });
      expect(engine.getState().flags.has('NEW_FLAG')).toBe(true);
    });

    it('should not break inventory mechanics', () => {
      // Phase 3: Item add/remove should work unchanged
      engine.applyEffect({ type: 'add-item', item: 'test_item', count: 5 });
      expect(engine.getState().inventory.get('test_item')).toBe(5);

      engine.applyEffect({ type: 'remove-item', item: 'test_item', count: 2 });
      expect(engine.getState().inventory.get('test_item')).toBe(3);
    });

    it('should not break stat modification', () => {
      // Phase 3: Stat set/modify should work unchanged
      engine.applyEffect({ type: 'set-stat', stat: 'wit', value: 7 });
      expect(engine.getState().stats.wit).toBe(7);

      engine.applyEffect({ type: 'modify-stat', stat: 'courage', value: 2 });
      expect(engine.getState().stats.courage).toBe(7); // 5 + 2
    });
  });

  describe('PT-P4-ACC-002: Save/Load Unaffected', () => {
    it('should save and load state correctly', async () => {
      // Make state changes
      await engine.makeChoice(0);

      const originalState = engine.getState();
      expect(originalState.currentSceneId).toBe('sc_1_0_002');
      expect(originalState.flags.has('GAME_STARTED')).toBe(true);
      expect(originalState.inventory.get('test_item')).toBe(1);

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

      // Verify state restored
      const loadedState = newEngine.getState();
      expect(loadedState.currentSceneId).toBe('sc_1_0_002');
      expect(loadedState.flags.has('GAME_STARTED')).toBe(true);
      expect(loadedState.inventory.get('test_item')).toBe(1);
      expect(loadedState.stats.courage).toBe(5);
    });

    it('should maintain history across save/load', async () => {
      await engine.makeChoice(0);

      const saveData = engine.save();

      const newEngine = createTestEngine(mockManifest);
      const loader = newEngine.getLoader();
      loader['sceneCache'] = new Map(
        Object.entries(mockScenes).map(([id, scene]) => [id, scene])
      );
      loader['manifest'] = mockManifest;
      await newEngine.initialize();

      newEngine.load(saveData);

      // History should be preserved
      const history = newEngine.getState().history;
      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history[0].sceneId).toBe('sc_1_0_001');
      expect(history[history.length - 1].sceneId).toBe('sc_1_0_002');
    });
  });

  describe('PT-P4-ACC-003: State Machine Determinism', () => {
    it('should produce consistent state for same inputs', async () => {
      // Run same sequence twice
      const engine1 = createTestEngine(mockManifest, { cacheScenes: true });
      const loader1 = engine1.getLoader();
      loader1['sceneCache'] = new Map(
        Object.entries(mockScenes).map(([id, scene]) => [id, scene])
      );
      loader1['manifest'] = mockManifest;
      await engine1.initialize();
      await engine1.makeChoice(0);

      const engine2 = createTestEngine(mockManifest, { cacheScenes: true });
      const loader2 = engine2.getLoader();
      loader2['sceneCache'] = new Map(
        Object.entries(mockScenes).map(([id, scene]) => [id, scene])
      );
      loader2['manifest'] = mockManifest;
      await engine2.initialize();
      await engine2.makeChoice(0);

      // States should be identical
      const state1 = engine1.getState();
      const state2 = engine2.getState();

      expect(state1.currentSceneId).toBe(state2.currentSceneId);
      expect(state1.stats).toEqual(state2.stats);
      expect(Array.from(state1.flags)).toEqual(Array.from(state2.flags));
      expect(Array.from(state1.inventory.entries())).toEqual(Array.from(state2.inventory.entries()));
    });

    it('should not introduce nondeterminism in scene history', async () => {
      await engine.makeChoice(0);

      const history = engine.getState().history;
      const startEntry = history.find((h) => h.sceneId === 'sc_1_0_001');

      // Visited count should be deterministic
      expect(startEntry?.visitedCount).toBe(1);
    });
  });

  describe('PT-P4-ACC-004: Complex State Scenarios', () => {
    it('should handle complex state with all mechanics', async () => {
      // Apply multiple state changes
      engine.applyEffect({ type: 'set-stat', stat: 'health', value: 10 });
      engine.applyEffect({ type: 'set-flag', flag: 'TEST_FLAG_1' });
      engine.applyEffect({ type: 'set-flag', flag: 'TEST_FLAG_2' });
      engine.applyEffect({ type: 'add-item', item: 'item1', count: 3 });
      engine.applyEffect({ type: 'add-item', item: 'item2', count: 1 });

      const stateBefore = engine.getState();
      expect(stateBefore.stats.health).toBe(10);
      expect(stateBefore.flags.has('TEST_FLAG_1')).toBe(true);
      expect(stateBefore.inventory.get('item1')).toBe(3);

      // Save/load should preserve complex state
      const saveData = engine.save();

      const newEngine = createTestEngine(mockManifest);
      const loader = newEngine.getLoader();
      loader['sceneCache'] = new Map(
        Object.entries(mockScenes).map(([id, scene]) => [id, scene])
      );
      loader['manifest'] = mockManifest;
      await newEngine.initialize();
      newEngine.load(saveData);

      const stateAfter = newEngine.getState();
      expect(stateAfter.stats.health).toBe(10);
      expect(stateAfter.flags.has('TEST_FLAG_1')).toBe(true);
      expect(stateAfter.flags.has('TEST_FLAG_2')).toBe(true);
      expect(stateAfter.inventory.get('item1')).toBe(3);
      expect(stateAfter.inventory.get('item2')).toBe(1);
    });
  });

  describe('PT-P4-ACC-005: Ending Path Reachability', () => {
    it('should not break scene transition logic', async () => {
      // Verify transition logic works regardless of UI changes
      const result = await engine.makeChoice(0);

      expect(result.choiceIndex).toBe(0);
      expect(result.targetSceneId).toBe('sc_1_0_002');
      expect(engine.getState().currentSceneId).toBe('sc_1_0_002');
    });

    it('should handle disabled choices correctly', () => {
      // Lower courage below threshold
      engine.applyEffect({ type: 'set-stat', stat: 'courage', value: 3 });

      const choices = engine.getAvailableChoices();

      // First choice should still be enabled (condition re-evaluated)
      // Actually, with courage=3, the first choice should be disabled
      expect(choices[0].state).toBe('disabled');
      expect(choices[1].state).toBe('enabled');
    });
  });
});
