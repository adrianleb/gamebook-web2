/**
 * Scene Loader Tests
 *
 * Tests text transformation from object format to string,
 * and field mapping (effectsOnEnter→effects, onChoose→effects).
 */

import { describe, it, expect } from 'bun:test';
import { SceneLoader } from '../../src/engine/scene-loader.js';
import type { GameManifest, RawSceneData, SceneData } from '../../src/engine/types.js';
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

describe('SceneLoader', () => {
  const testContentPath = join(process.cwd(), 'content-test');
  const testScenesPath = join(testContentPath, 'scenes');

  // Setup: Create test content directory
  const setupTestContent = (sceneFiles: Record<string, RawSceneData>) => {
    if (!existsSync(testScenesPath)) {
      mkdirSync(testScenesPath, { recursive: true });
    }

    for (const [filename, sceneData] of Object.entries(sceneFiles)) {
      writeFileSync(join(testScenesPath, filename), JSON.stringify(sceneData, null, 2));
    }
  };

  // Teardown: Remove test content
  const cleanupTestContent = (filenames: string[]) => {
    for (const filename of filenames) {
      const filePath = join(testScenesPath, filename);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    }
  };

  describe('Text Transformation', () => {
    it('should transform text object { location, paragraphs } to string', async () => {
      const manifest: GameManifest = {
        gamebook: {
          title: 'Test Gamebook',
          source: 'test',
          version: '1.0.0',
          adaptationVersion: '1.0.0',
        },
        structure: {
          acts: 1,
          totalNodesEstimated: 1,
          endings: 0,
        },
        startingScene: 'sc_test_001',
        acts: [],
        endings: [],
        sceneIndex: {
          sc_test_001: {
            title: 'Test Scene',
            location: 'Test Location',
            act: 1,
            hub: 0,
            status: 'complete',
          },
        },
        implementationStatus: {
          totalScenes: 1,
          pending: 0,
          draft: 0,
          complete: 1,
          reviewed: 0,
        },
      };

      // Create raw scene data with text object format
      const rawScene: RawSceneData = {
        id: 'sc_test_001',
        title: 'Test Scene',
        text: {
          location: 'Test Location',
          paragraphs: [
            'First paragraph with <em>emphasis</em>.',
            'Second paragraph with <strong>bold text</strong>.',
            'Third paragraph.',
          ],
        },
        effectsOnEnter: [
          { type: 'set-flag', flag: 'test_flag' },
        ],
        choices: [
          {
            id: 'choice_1',
            label: 'Continue',
            to: 'sc_test_001',
            onChoose: [],
          },
        ],
      };

      setupTestContent({ 'sc_test_001.json': rawScene });

      try {
        const loader = new SceneLoader({ contentPath: testContentPath, cache: false, manifest });
        await loader.initialize();
        const sceneData = await loader.loadScene('sc_test_001');

        // Verify text is transformed to string with paragraph breaks
        expect(sceneData.text).toBeTypeOf('string');
        expect(sceneData.text).toContain('First paragraph with <em>emphasis</em>.');
        expect(sceneData.text).toContain('Second paragraph with <strong>bold text</strong>.');
        expect(sceneData.text).toContain('Third paragraph.');
        // Paragraphs should be joined with double newlines
        expect(sceneData.text).toMatch(/\n\n/);
      } finally {
        cleanupTestContent(['sc_test_001.json']);
      }
    });

    it('should pass through string text as-is', async () => {
      const manifest: GameManifest = {
        gamebook: {
          title: 'Test Gamebook',
          source: 'test',
          version: '1.0.0',
          adaptationVersion: '1.0.0',
        },
        structure: {
          acts: 1,
          totalNodesEstimated: 1,
          endings: 0,
        },
        startingScene: 'sc_test_002',
        acts: [],
        endings: [],
        sceneIndex: {
          sc_test_002: {
            title: 'Test Scene 2',
            location: 'Test',
            act: 1,
            hub: 0,
            status: 'complete',
          },
        },
        implementationStatus: {
          totalScenes: 1,
          pending: 0,
          draft: 0,
          complete: 1,
          reviewed: 0,
        },
      };

      // Create raw scene data with string text
      const rawScene: RawSceneData = {
        id: 'sc_test_002',
        title: 'Test Scene 2',
        text: 'Simple string text without paragraph breaks.',
        effects: [],
        choices: [
          {
            id: 'choice_1',
            label: 'Continue',
            to: 'sc_test_002',
          },
        ],
      };

      setupTestContent({ 'sc_test_002.json': rawScene });

      try {
        const loader = new SceneLoader({ contentPath: testContentPath, cache: false, manifest });
        await loader.initialize();
        const sceneData = await loader.loadScene('sc_test_002');

        // String text should pass through unchanged
        expect(sceneData.text).toBeTypeOf('string');
        expect(sceneData.text).toBe('Simple string text without paragraph breaks.');
      } finally {
        cleanupTestContent(['sc_test_002.json']);
      }
    });
  });

  describe('Field Mapping', () => {
    it('should map effectsOnEnter to effects', async () => {
      const manifest: GameManifest = {
        gamebook: {
          title: 'Test Gamebook',
          source: 'test',
          version: '1.0.0',
          adaptationVersion: '1.0.0',
        },
        structure: {
          acts: 1,
          totalNodesEstimated: 1,
          endings: 0,
        },
        startingScene: 'sc_test_003',
        acts: [],
        endings: [],
        sceneIndex: {
          sc_test_003: {
            title: 'Test Scene 3',
            location: 'Test',
            act: 1,
            hub: 0,
            status: 'complete',
          },
        },
        implementationStatus: {
          totalScenes: 1,
          pending: 0,
          draft: 0,
          complete: 1,
          reviewed: 0,
        },
      };

      const rawScene: RawSceneData = {
        id: 'sc_test_003',
        title: 'Test Scene 3',
        text: 'Test text',
        effectsOnEnter: [
          { type: 'set-flag', flag: 'test_flag' },
          { type: 'set-stat', stat: 'courage', value: 5 },
        ],
        choices: [
          {
            id: 'choice_1',
            label: 'Continue',
            to: 'sc_test_003',
          },
        ],
      };

      setupTestContent({ 'sc_test_003.json': rawScene });

      try {
        const loader = new SceneLoader({ contentPath: testContentPath, cache: false, manifest });
        await loader.initialize();
        const sceneData = await loader.loadScene('sc_test_003');

        // effectsOnEnter should be mapped to effects
        expect(sceneData.effects).toBeDefined();
        expect(sceneData.effects.length).toBe(2);
        expect(sceneData.effects[0].type).toBe('set-flag');
        expect(sceneData.effects[1].type).toBe('set-stat');
      } finally {
        cleanupTestContent(['sc_test_003.json']);
      }
    });

    it('should map onChoose to effects in choices', async () => {
      const manifest: GameManifest = {
        gamebook: {
          title: 'Test Gamebook',
          source: 'test',
          version: '1.0.0',
          adaptationVersion: '1.0.0',
        },
        structure: {
          acts: 1,
          totalNodesEstimated: 1,
          endings: 0,
        },
        startingScene: 'sc_test_004',
        acts: [],
        endings: [],
        sceneIndex: {
          sc_test_004: {
            title: 'Test Scene 4',
            location: 'Test',
            act: 1,
            hub: 0,
            status: 'complete',
          },
        },
        implementationStatus: {
          totalScenes: 1,
          pending: 0,
          draft: 0,
          complete: 1,
          reviewed: 0,
        },
      };

      const rawScene: RawSceneData = {
        id: 'sc_test_004',
        title: 'Test Scene 4',
        text: 'Test text',
        effects: [],
        choices: [
          {
            id: 'choice_1',
            label: 'Continue',
            to: 'sc_test_004',
            onChoose: [
              { type: 'set-flag', flag: 'choice_flag' },
              { type: 'add-item', item: 'test_item', count: 1 },
            ],
          },
        ],
      };

      setupTestContent({ 'sc_test_004.json': rawScene });

      try {
        const loader = new SceneLoader({ contentPath: testContentPath, cache: false, manifest });
        await loader.initialize();
        const sceneData = await loader.loadScene('sc_test_004');

        // onChoose should be mapped to effects in choices
        expect(sceneData.choices).toBeDefined();
        expect(sceneData.choices.length).toBe(1);
        expect(sceneData.choices[0].effects).toBeDefined();
        expect(sceneData.choices[0].effects?.length).toBe(2);
        expect(sceneData.choices[0].effects?.[0].type).toBe('set-flag');
        expect(sceneData.choices[0].effects?.[1].type).toBe('add-item');
      } finally {
        cleanupTestContent(['sc_test_004.json']);
      }
    });

    it('should prefer effects over onChoose when both present', async () => {
      const manifest: GameManifest = {
        gamebook: {
          title: 'Test Gamebook',
          source: 'test',
          version: '1.0.0',
          adaptationVersion: '1.0.0',
        },
        structure: {
          acts: 1,
          totalNodesEstimated: 1,
          endings: 0,
        },
        startingScene: 'sc_test_005',
        acts: [],
        endings: [],
        sceneIndex: {
          sc_test_005: {
            title: 'Test Scene 5',
            location: 'Test',
            act: 1,
            hub: 0,
            status: 'complete',
          },
        },
        implementationStatus: {
          totalScenes: 1,
          pending: 0,
          draft: 0,
          complete: 1,
          reviewed: 0,
        },
      };

      const rawScene: RawSceneData = {
        id: 'sc_test_005',
        title: 'Test Scene 5',
        text: 'Test text',
        effects: [],
        choices: [
          {
            id: 'choice_1',
            label: 'Continue',
            to: 'sc_test_005',
            effects: [{ type: 'set-flag', flag: 'effects_field' }],
            onChoose: [{ type: 'set-flag', flag: 'onChoose_field' }],
          },
        ],
      };

      setupTestContent({ 'sc_test_005.json': rawScene });

      try {
        const loader = new SceneLoader({ contentPath: testContentPath, cache: false, manifest });
        await loader.initialize();
        const sceneData = await loader.loadScene('sc_test_005');

        // effects should be preferred over onChoose
        expect(sceneData.choices[0].effects?.[0].flag).toBe('effects_field');
      } finally {
        cleanupTestContent(['sc_test_005.json']);
      }
    });
  });

  describe('Audio Field Mapping', () => {
    it('should map audio.music/audio.sfx to music/sfx', async () => {
      const manifest: GameManifest = {
        gamebook: {
          title: 'Test Gamebook',
          source: 'test',
          version: '1.0.0',
          adaptationVersion: '1.0.0',
        },
        structure: {
          acts: 1,
          totalNodesEstimated: 1,
          endings: 0,
        },
        startingScene: 'sc_test_006',
        acts: [],
        endings: [],
        sceneIndex: {
          sc_test_006: {
            title: 'Test Scene 6',
            location: 'Test',
            act: 1,
            hub: 0,
            status: 'complete',
          },
        },
        implementationStatus: {
          totalScenes: 1,
          pending: 0,
          draft: 0,
          complete: 1,
          reviewed: 0,
        },
      };

      const rawScene: RawSceneData = {
        id: 'sc_test_006',
        title: 'Test Scene 6',
        text: 'Test text',
        audio: {
          music: 'background_music.mp3',
          sfx: ['footstep.ogg', 'door_creak.ogg'],
        },
        effects: [],
        choices: [
          {
            id: 'choice_1',
            label: 'Continue',
            to: 'sc_test_006',
          },
        ],
      };

      setupTestContent({ 'sc_test_006.json': rawScene });

      try {
        const loader = new SceneLoader({ contentPath: testContentPath, cache: false, manifest });
        await loader.initialize();
        const sceneData = await loader.loadScene('sc_test_006');

        // audio.music/audio.sfx should be flattened to music/sfx
        expect(sceneData.music).toBe('background_music.mp3');
        expect(sceneData.sfx).toEqual(['footstep.ogg', 'door_creak.ogg']);
      } finally {
        cleanupTestContent(['sc_test_006.json']);
      }
    });
  });
});
