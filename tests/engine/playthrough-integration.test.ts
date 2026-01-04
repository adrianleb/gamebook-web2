/**
 * Playthrough Integration Tests
 *
 * Executes actual playthrough JSON scripts against real game content.
 * Tests:
 * - Revisionist faction entry path (modify_faction effects)
 * - Attemptable stat checks (success/failure branches with faction effects)
 * - Item acquisition (add_item effects)
 * - Flag-based choice gating (NOT_SET operator)
 *
 * Per Intent #340: Close integration testing gap between schema/unit tests and runtime behavior.
 */

import { describe, it, expect } from 'vitest';
import { HeadlessRunner } from '../../src/engine/headless-runner.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Test data directory
const PLAYTHROUGH_DIR = join(process.cwd(), 'tests/playthroughs');

// Load and execute a playthrough script
async function runPlaythrough(scriptFile: string) {
  const scriptPath = join(PLAYTHROUGH_DIR, scriptFile);
  const scriptContent = readFileSync(scriptPath, 'utf-8');
  const script = JSON.parse(scriptContent);

  const runner = new HeadlessRunner({
    contentPath: 'content',
    disableAutosave: true,
  });

  await runner.initialize();
  return await runner.executeScript(script);
}

describe('Playthrough Integration - Act 2 Hub 2 Revisionist', () => {
  describe('Revisionist faction entry (sc_2_2_050)', () => {
    it('should join Revisionist faction and apply modify_faction effect', async () => {
      const result = await runPlaythrough('pt-act2-h2-revisionist-entry.json');

      expect(result.status).toBe('passed');
      expect(result.failure).toBeUndefined();
      expect(result.steps).toBeGreaterThan(0);
    });
  });

  describe('Improv Workshop stat checks (sc_2_2_051)', () => {
    it('should succeed stat check and apply modify_faction effect', async () => {
      const result = await runPlaythrough('pt-act2-h2-improv-stat-check.json');

      expect(result.status).toBe('passed');
      expect(result.failure).toBeUndefined();
    });

    it('should fail stat check and not apply faction effect', async () => {
      const result = await runPlaythrough('pt-act2-h2-improv-stat-check-fail.json');

      expect(result.status).toBe('passed');
      expect(result.failure).toBeUndefined();
    });
  });

  describe('Re-Write Desk item acquisition (sc_2_2_052)', () => {
    it('should grant revisionist_pen via add_item effect', async () => {
      const result = await runPlaythrough('pt-act2-h2-rewrite-desk-item.json');

      expect(result.status).toBe('passed');
      expect(result.failure).toBeUndefined();
    });
  });

  describe('Flag-based choice gating (sc_2_2_052)', () => {
    it('should use NOT_SET operator for one-time interaction gating', async () => {
      const result = await runPlaythrough('pt-act2-h2-revisionist-flags.json');

      expect(result.status).toBe('passed');
      expect(result.failure).toBeUndefined();
    });
  });
});

describe('Playthrough Integration - Verse Scene Stat Checks', () => {
  describe('Stat check success path', () => {
    it('should succeed stat check when stage_presence >= threshold', async () => {
      const result = await runPlaythrough('pt-vs-003-stat-check-success.json');

      expect(result.status).toBe('passed');
      expect(result.failure).toBeUndefined();
    });
  });
});
