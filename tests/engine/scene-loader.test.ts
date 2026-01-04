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
          { type: 'set-stat', stat: 'stage_presence', value: 5 },
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

  describe('Faction Condition Transformation', () => {
    it('should transform stat_check with faction ID to type: faction condition', async () => {
      const manifest: GameManifest = {
        gamebook: {
          title: 'Test Gamebook',
          source: 'test',
          version: '1.0.0',
          adaptationVersion: '1.0.0',
        },
        structure: {
          acts: 1,
          totalNodesEstimated: 5,
          endings: 4,
        },
        startingScene: 'sc_test_faction_001',
        acts: [],
        endings: [],
        sceneIndex: {
          sc_test_faction_001: {
            title: 'Faction Test Scene',
            location: 'Test',
            act: 1,
            hub: 0,
            status: 'complete',
          },
          sc_test_ending_001: {
            title: 'Ending 1',
            location: 'Test',
            act: 1,
            hub: 0,
            status: 'complete',
          },
          sc_test_ending_002: {
            title: 'Ending 2',
            location: 'Test',
            act: 1,
            hub: 0,
            status: 'complete',
          },
          sc_test_ending_003: {
            title: 'Ending 3',
            location: 'Test',
            act: 1,
            hub: 0,
            status: 'complete',
          },
          sc_test_ending_004: {
            title: 'Ending 4',
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

      // Scene with faction-based stat_check (like sc_3_4_098 convergence)
      const rawScene: RawSceneData = {
        id: 'sc_test_faction_001',
        title: 'Faction Test Scene',
        text: 'Test text',
        effects: [],
        choices: [
          {
            id: 'choice_1',
            label: 'Revisionist path',
            to: 'sc_test_ending_001',
            conditions: {
              type: 'stat_check',
              stat: 'revisionist',
              op: 'gte',
              value: 7,
            },
            onChoose: [],
            disabledHint: 'Requires revisionist faction >= 7',
          },
          {
            id: 'choice_2',
            label: 'Preservationist path',
            to: 'sc_test_ending_002',
            conditions: {
              type: 'stat_check',
              stat: 'preservationist',
              op: 'gte',
              value: 7,
            },
            onChoose: [],
            disabledHint: 'Requires preservationist faction >= 7',
          },
          {
            id: 'choice_3',
            label: 'Exiter path',
            to: 'sc_test_ending_003',
            conditions: {
              type: 'stat_check',
              stat: 'exiter',
              op: 'gte',
              value: 7,
            },
            onChoose: [],
            disabledHint: 'Requires exiter faction >= 7',
          },
          {
            id: 'choice_4',
            label: 'Independent path',
            to: 'sc_test_ending_004',
            conditions: {
              type: 'stat_check',
              stat: 'independent',
              op: 'gte',
              value: 7,
            },
            onChoose: [],
            disabledHint: 'Requires independent faction >= 7',
          },
        ],
      };

      setupTestContent({ 'sc_test_faction_001.json': rawScene });

      try {
        const loader = new SceneLoader({ contentPath: testContentPath, cache: false, manifest });
        await loader.initialize();
        const sceneData = await loader.loadScene('sc_test_faction_001');

        // All faction conditions should be transformed to type: 'faction'
        expect(sceneData.choices.length).toBe(4);

        // Revisionist choice
        expect(sceneData.choices[0].conditions).toBeDefined();
        expect(sceneData.choices[0].conditions?.[0].type).toBe('faction');
        expect(sceneData.choices[0].conditions?.[0].faction).toBe('revisionist');
        expect(sceneData.choices[0].conditions?.[0].factionLevel).toBe(7);

        // Preservationist choice
        expect(sceneData.choices[1].conditions).toBeDefined();
        expect(sceneData.choices[1].conditions?.[0].type).toBe('faction');
        expect(sceneData.choices[1].conditions?.[0].faction).toBe('preservationist');
        expect(sceneData.choices[1].conditions?.[0].factionLevel).toBe(7);

        // Exiter choice
        expect(sceneData.choices[2].conditions).toBeDefined();
        expect(sceneData.choices[2].conditions?.[0].type).toBe('faction');
        expect(sceneData.choices[2].conditions?.[0].faction).toBe('exiter');
        expect(sceneData.choices[2].conditions?.[0].factionLevel).toBe(7);

        // Independent choice
        expect(sceneData.choices[3].conditions).toBeDefined();
        expect(sceneData.choices[3].conditions?.[0].type).toBe('faction');
        expect(sceneData.choices[3].conditions?.[0].faction).toBe('independent');
        expect(sceneData.choices[3].conditions?.[0].factionLevel).toBe(7);
      } finally {
        cleanupTestContent(['sc_test_faction_001.json']);
      }
    });

    it('should preserve non-faction stat_check as type: stat condition', async () => {
      const manifest: GameManifest = {
        gamebook: {
          title: 'Test Gamebook',
          source: 'test',
          version: '1.0.0',
          adaptationVersion: '1.0.0',
        },
        structure: {
          acts: 1,
          totalNodesEstimated: 2,
          endings: 0,
        },
        startingScene: 'sc_test_stat_001',
        acts: [],
        endings: [],
        sceneIndex: {
          sc_test_stat_001: {
            title: 'Stat Test Scene',
            location: 'Test',
            act: 1,
            hub: 0,
            status: 'complete',
          },
          sc_test_001: {
            title: 'Target Scene',
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

      // Scene with regular stat_check (not faction)
      const rawScene: RawSceneData = {
        id: 'sc_test_stat_001',
        title: 'Stat Test Scene',
        text: 'Test text',
        effects: [],
        choices: [
          {
            id: 'choice_1',
            label: 'Courage check',
            to: 'sc_test_001',
            conditions: {
              type: 'stat_check',
              stat: 'stage_presence',
              op: 'gte',
              value: 5,
            },
            onChoose: [],
            disabledHint: 'Requires Courage 5+',
          },
          {
            id: 'choice_2',
            label: 'Health check',
            to: 'sc_test_001',
            conditions: {
              type: 'stat_check',
              stat: 'script',
              op: 'gte',
              value: 10,
            },
            onChoose: [],
            disabledHint: 'Requires Health 10+',
          },
        ],
      };

      setupTestContent({ 'sc_test_stat_001.json': rawScene });

      try {
        const loader = new SceneLoader({ contentPath: testContentPath, cache: false, manifest });
        await loader.initialize();
        const sceneData = await loader.loadScene('sc_test_stat_001');

        // Non-faction stat checks should remain as type: 'stat'
        expect(sceneData.choices.length).toBe(2);

        expect(sceneData.choices[0].conditions?.[0].type).toBe('stat');
        expect(sceneData.choices[0].conditions?.[0].stat).toBe('stage_presence');
        expect(sceneData.choices[0].conditions?.[0].operator).toBe('gte');
        expect(sceneData.choices[0].conditions?.[0].value).toBe(5);

        expect(sceneData.choices[1].conditions?.[0].type).toBe('stat');
        expect(sceneData.choices[1].conditions?.[0].stat).toBe('script');
        expect(sceneData.choices[1].conditions?.[0].operator).toBe('gte');
        expect(sceneData.choices[1].conditions?.[0].value).toBe(10);
      } finally {
        cleanupTestContent(['sc_test_stat_001.json']);
      }
    });

    it('should handle case-insensitive faction ID detection', async () => {
      const manifest: GameManifest = {
        gamebook: {
          title: 'Test Gamebook',
          source: 'test',
          version: '1.0.0',
          adaptationVersion: '1.0.0',
        },
        structure: {
          acts: 1,
          totalNodesEstimated: 2,
          endings: 0,
        },
        startingScene: 'sc_test_case_001',
        acts: [],
        endings: [],
        sceneIndex: {
          sc_test_case_001: {
            title: 'Case Test Scene',
            location: 'Test',
            act: 1,
            hub: 0,
            status: 'complete',
          },
          sc_test_001: {
            title: 'Target Scene',
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

      // Scene with mixed-case faction IDs
      const rawScene: RawSceneData = {
        id: 'sc_test_case_001',
        title: 'Case Test Scene',
        text: 'Test text',
        effects: [],
        choices: [
          {
            id: 'choice_1',
            label: 'Revisionist (mixed case)',
            to: 'sc_test_001',
            conditions: {
              type: 'stat_check',
              stat: 'Revisionist',
              op: 'gte',
              value: 7,
            },
            onChoose: [],
            disabledHint: 'Requires revisionist faction >= 7',
          },
          {
            id: 'choice_2',
            label: 'PRESERVATIONIST (uppercase)',
            to: 'sc_test_001',
            conditions: {
              type: 'stat_check',
              stat: 'PRESERVATIONIST',
              op: 'gte',
              value: 7,
            },
            onChoose: [],
            disabledHint: 'Requires preservationist faction >= 7',
          },
        ],
      };

      setupTestContent({ 'sc_test_case_001.json': rawScene });

      try {
        const loader = new SceneLoader({ contentPath: testContentPath, cache: false, manifest });
        await loader.initialize();
        const sceneData = await loader.loadScene('sc_test_case_001');

        // Case-insensitive detection should work
        expect(sceneData.choices.length).toBe(2);

        expect(sceneData.choices[0].conditions?.[0].type).toBe('faction');
        expect(sceneData.choices[0].conditions?.[0].faction).toBe('Revisionist');
        expect(sceneData.choices[0].conditions?.[0].factionLevel).toBe(7);

        expect(sceneData.choices[1].conditions?.[0].type).toBe('faction');
        expect(sceneData.choices[1].conditions?.[0].faction).toBe('PRESERVATIONIST');
        expect(sceneData.choices[1].conditions?.[0].factionLevel).toBe(7);
      } finally {
        cleanupTestContent(['sc_test_case_001.json']);
      }
    });

    it('should handle faction_check type with explicit faction field', async () => {
      const manifest: GameManifest = {
        gamebook: {
          title: 'Test Gamebook',
          source: 'test',
          version: '1.0.0',
          adaptationVersion: '1.0.0',
        },
        structure: {
          acts: 1,
          totalNodesEstimated: 2,
          endings: 0,
        },
        startingScene: 'sc_test_explicit_001',
        acts: [],
        endings: [],
        sceneIndex: {
          sc_test_explicit_001: {
            title: 'Explicit Faction Test',
            location: 'Test',
            act: 1,
            hub: 0,
            status: 'complete',
          },
          sc_test_001: {
            title: 'Target Scene',
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

      // Scene with explicit faction_check type (not stat_check)
      const rawScene: RawSceneData = {
        id: 'sc_test_explicit_001',
        title: 'Explicit Faction Test',
        text: 'Test text',
        effects: [],
        choices: [
          {
            id: 'choice_1',
            label: 'Explicit faction check',
            to: 'sc_test_001',
            conditions: {
              type: 'faction_check',
              faction: 'revisionist',
              level: 7,
            },
            onChoose: [],
            disabledHint: 'Requires revisionist faction >= 7',
          },
        ],
      };

      setupTestContent({ 'sc_test_explicit_001.json': rawScene });

      try {
        const loader = new SceneLoader({ contentPath: testContentPath, cache: false, manifest });
        await loader.initialize();
        const sceneData = await loader.loadScene('sc_test_explicit_001');

        // Explicit faction_check should work correctly
        expect(sceneData.choices[0].conditions?.[0].type).toBe('faction');
        expect(sceneData.choices[0].conditions?.[0].faction).toBe('revisionist');
        expect(sceneData.choices[0].conditions?.[0].factionLevel).toBe(7);
      } finally {
        cleanupTestContent(['sc_test_explicit_001.json']);
      }
    });

    describe('NOT Condition Normalization', () => {
      it('should normalize uppercase NOT to lowercase not', async () => {
        const manifest: GameManifest = {
          gamebook: {
            title: 'Test Gamebook',
            source: 'test',
            version: '1.0.0',
            adaptationVersion: '1.0.0',
          },
          structure: {
            acts: 1,
            totalNodesEstimated: 2,
            endings: 0,
          },
          startingScene: 'sc_test_not_001',
          acts: [],
          endings: [],
          sceneIndex: {
            sc_test_not_001: {
              title: 'NOT Test Scene',
              location: 'Test',
              act: 1,
              hub: 0,
              status: 'complete',
            },
            sc_test_001: {
              title: 'Target Scene',
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

        // Content files use uppercase NOT per scene-schema.json
        const rawScene: RawSceneData = {
          id: 'sc_test_not_001',
          title: 'NOT Test Scene',
          text: 'Test text',
          effects: [],
          choices: [
            {
              id: 'choice_1',
              label: 'Choice without flag',
              to: 'sc_test_001',
              conditions: {
                type: 'NOT',
                conditions: [
                  { type: 'flag_check', flag: 'some_flag' }
                ]
              },
              onChoose: [],
            },
            {
              id: 'choice_2',
              label: 'Choice without item',
              to: 'sc_test_001',
              conditions: {
                type: 'NOT',
                conditions: [
                  { type: 'has_item', item: 'key_item' }
                ]
              },
              onChoose: [],
            },
          ],
        };

        setupTestContent({ 'sc_test_not_001.json': rawScene });

        try {
          const loader = new SceneLoader({ contentPath: testContentPath, cache: false, manifest });
          await loader.initialize();
          const sceneData = await loader.loadScene('sc_test_not_001');

          // Uppercase NOT should normalize to lowercase 'not'
          expect(sceneData.choices.length).toBe(2);

          expect(sceneData.choices[0].conditions).toBeDefined();
          expect(sceneData.choices[0].conditions?.[0].type).toBe('not');
          expect(sceneData.choices[0].conditions?.[0].conditions).toBeDefined();
          expect(sceneData.choices[0].conditions?.[0].conditions?.[0].type).toBe('flag');

          expect(sceneData.choices[1].conditions).toBeDefined();
          expect(sceneData.choices[1].conditions?.[0].type).toBe('not');
          expect(sceneData.choices[1].conditions?.[0].conditions?.[0].type).toBe('item');
        } finally {
          cleanupTestContent(['sc_test_not_001.json']);
        }
      });

      it('should handle nested NOT conditions', async () => {
        const manifest: GameManifest = {
          gamebook: {
            title: 'Test Gamebook',
            source: 'test',
            version: '1.0.0',
            adaptationVersion: '1.0.0',
          },
          structure: {
            acts: 1,
            totalNodesEstimated: 2,
            endings: 0,
          },
          startingScene: 'sc_test_nested_not_001',
          acts: [],
          endings: [],
          sceneIndex: {
            sc_test_nested_not_001: {
              title: 'Nested NOT Test',
              location: 'Test',
              act: 1,
              hub: 0,
              status: 'complete',
            },
            sc_test_001: {
              title: 'Target Scene',
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

        // Nested NOT with AND/OR - common in faction scene gating
        const rawScene: RawSceneData = {
          id: 'sc_test_nested_not_001',
          title: 'Nested NOT Test',
          text: 'Test text',
          effects: [],
          choices: [
            {
              id: 'choice_1',
              label: 'Complex condition',
              to: 'sc_test_001',
              conditions: {
                type: 'NOT',
                conditions: [
                  {
                    type: 'AND',
                    conditions: [
                      { type: 'flag_check', flag: 'flag_a' },
                      { type: 'flag_check', flag: 'flag_b' }
                    ]
                  }
                ]
              },
              onChoose: [],
            },
          ],
        };

        setupTestContent({ 'sc_test_nested_not_001.json': rawScene });

        try {
          const loader = new SceneLoader({ contentPath: testContentPath, cache: false, manifest });
          await loader.initialize();
          const sceneData = await loader.loadScene('sc_test_nested_not_001');

          // Nested conditions should all normalize correctly
          expect(sceneData.choices[0].conditions?.[0].type).toBe('not');
          const nestedAnd = sceneData.choices[0].conditions?.[0].conditions?.[0];
          expect(nestedAnd?.type).toBe('and');
          expect(nestedAnd?.conditions?.[0].type).toBe('flag');
          expect(nestedAnd?.conditions?.[1].type).toBe('flag');
        } finally {
          cleanupTestContent(['sc_test_nested_not_001.json']);
        }
      });
    });

    it('should preserve attemptable flag during condition normalization', async () => {
      const manifest: GameManifest = {
        gamebook: {
          title: 'Test Gamebook',
          source: 'test',
          version: '1.0.0',
          adaptationVersion: '1.0.0',
        },
        structure: {
          acts: 1,
          totalNodesEstimated: 2,
          endings: 0,
        },
        startingScene: 'sc_test_attemptable_001',
        acts: [],
        endings: [],
        sceneIndex: {
          sc_test_attemptable_001: {
            title: 'Attemptable Test Scene',
            location: 'Test',
            act: 1,
            hub: 0,
            status: 'complete',
          },
          sc_test_success: {
            title: 'Success Scene',
            location: 'Test',
            act: 1,
            hub: 0,
            status: 'complete',
          },
          sc_test_failure: {
            title: 'Failure Scene',
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

      // Scene with attemptable stat_check conditions
      const rawScene: RawSceneData = {
        id: 'sc_test_attemptable_001',
        title: 'Attemptable Test Scene',
        text: 'Test text',
        effects: [],
        choices: [
          {
            id: 'choice_1',
            label: 'Attemptable stage_presence check',
            conditions: {
              type: 'stat_check',
              stat: 'stage_presence',
              op: 'gte',
              value: 5,
              attemptable: true,
            },
            onSuccess: {
              to: 'sc_test_success',
            },
            onFailure: {
              to: 'sc_test_failure',
            },
            onChoose: [],
          },
          {
            id: 'choice_2',
            label: 'Attemptable faction check',
            conditions: {
              type: 'stat_check',
              stat: 'revisionist',
              op: 'gte',
              value: 7,
              attemptable: true,
            },
            onSuccess: {
              to: 'sc_test_success',
            },
            onFailure: {
              to: 'sc_test_failure',
            },
            onChoose: [],
          },
          {
            id: 'choice_3',
            label: 'Non-attemptable check',
            to: 'sc_test_success',
            conditions: {
              type: 'stat_check',
              stat: 'script',
              op: 'gte',
              value: 10,
            },
            onChoose: [],
          },
        ],
      };

      setupTestContent({ 'sc_test_attemptable_001.json': rawScene });

      try {
        const loader = new SceneLoader({ contentPath: testContentPath, cache: false, manifest });
        await loader.initialize();
        const sceneData = await loader.loadScene('sc_test_attemptable_001');

        // Attemptable stat check should preserve the flag
        expect(sceneData.choices[0].conditions?.[0].attemptable).toBe(true);
        expect(sceneData.choices[0].conditions?.[0].type).toBe('stat');
        expect(sceneData.choices[0].conditions?.[0].stat).toBe('stage_presence');

        // Attemptable faction check should preserve the flag after transformation
        expect(sceneData.choices[1].conditions?.[0].attemptable).toBe(true);
        expect(sceneData.choices[1].conditions?.[0].type).toBe('faction');
        expect(sceneData.choices[1].conditions?.[0].faction).toBe('revisionist');

        // Non-attemptable check should not have the flag
        expect(sceneData.choices[2].conditions?.[0].attemptable).toBeUndefined();
        expect(sceneData.choices[2].conditions?.[0].type).toBe('stat');
      } finally {
        cleanupTestContent(['sc_test_attemptable_001.json']);
      }
    });
  });
});
