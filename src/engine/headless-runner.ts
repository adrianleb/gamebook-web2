/**
 * Headless Runner
 *
 * Executes playthrough scripts without UI for automated testing.
 * Framework-agnostic - no React/DOM dependencies.
 *
 * Per agent-e and agent-d feedback:
 * - Deterministic playthrough execution with assertions
 * - Softlock detection with configurable thresholds
 * - State snapshots for regression testing
 * - CI-friendly output with detailed diagnostics
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { Engine } from './engine.js';
import type {
  GameState,
  SceneId,
  FlagName,
  ItemId,
  StatId,
} from './types.js';
import type {
  PlaythroughScript,
  PlaythroughStep,
  ChooseStep,
  CheckpointStep,
  SaveSnapshotStep,
  LoadSnapshotStep,
  StateAssertions,
  SoftlockConfig,
  SoftlockResult,
  StateSnapshot,
  PlaythroughResult,
  EndingCriteria,
} from './headless-types.js';

/**
 * Headless runner for automated playthrough testing.
 *
 * Executes playthrough scripts deterministically, validates state,
 * detects softlocks, and saves snapshots for regression testing.
 *
 * @example
 * ```typescript
 * const runner = new HeadlessRunner({ contentPath: './content' });
 * const script = JSON.parse(await fs.readFile('test.json', 'utf-8'));
 * const result = await runner.executeScript(script);
 * console.log(result.status); // 'passed' | 'failed' | 'softlocked'
 * ```
 */
export class HeadlessRunner {
  private engine: Engine;
  private snapshots: Map<string, StateSnapshot> = new Map();
  private contentPath: string;
  private snapshotDir: string;
  private stepCount: number = 0;
  private lastProgressState: Set<string> = new Set();

  /**
   * Create a new headless runner.
   *
   * Per agent-e (Intent #64): disableAutosave option prevents filesystem churn during automated tests.
   */
  constructor(options: {
    contentPath?: string;
    snapshotDir?: string;
    /** Disable autosave during playthrough (per agent-e) */
    disableAutosave?: boolean;
  } = {}) {
    this.contentPath = options.contentPath ?? './content';
    this.snapshotDir = options.snapshotDir ?? './test-snapshots';
    this.engine = new Engine({
      contentPath: this.contentPath,
      disableAutosave: options.disableAutosave ?? false,
    });
  }

  /**
   * Initialize the engine.
   */
  async initialize(): Promise<void> {
    await this.engine.initialize();
  }

  /**
   * Execute a playthrough script.
   *
   * @param script - Playthrough script configuration
   * @returns Execution result with status and diagnostics
   */
  async executeScript(script: PlaythroughScript): Promise<PlaythroughResult> {
    const startTime = Date.now();
    const snapshotsCreated: string[] = [];
    let failure: PlaythroughResult['failure'] | undefined;
    let softlock: SoftlockResult | undefined;

    try {
      // Apply starting state overrides
      if (script.startingState) {
        await this.applyStartingState(script.startingState);
      }

      // Initial softlock check (catches softlocks in starting state)
      if (script.softlockDetection?.enabled !== false) {
        softlock = this.detectSoftlock(script.softlockDetection);
        if (softlock.softlocked && script.softlockDetection?.failOnDetection !== false) {
          failure = {
            step: 0,
            reason: `Softlock detected: ${softlock.reason} at scene ${softlock.sceneId}`,
          };
        }
      }
      // Execute each step
      for (const step of script.steps) {
        this.stepCount++;

        // Check for softlock before executing step
        if (script.softlockDetection?.enabled !== false && !failure) {
          softlock = this.detectSoftlock(script.softlockDetection);
          if (softlock.softlocked) {
            if (script.softlockDetection?.failOnDetection !== false) {
              failure = {
                step: step.sequence,
                reason: `Softlock detected: ${softlock.reason} at scene ${softlock.sceneId}`,
              };
              break;
            } else {
              console.warn(`[Softlock] ${softlock.reason} at ${softlock.sceneId}`);
            }
          }
        }

        // Execute step based on action type
        const stepResult = await this.executeStep(step, script);

        if (stepResult.status === 'failed') {
          failure = stepResult.failure;
          break;
        }

        if (stepResult.snapshot && stepResult.snapshotData) {
          snapshotsCreated.push(stepResult.snapshot);
          this.snapshots.set(stepResult.snapshot, stepResult.snapshotData);
        }
      }

      // Check ending criteria if no failure yet
      if (!failure && script.endingCriteria) {
        const endingResult = this.validateEndingCriteria(script.endingCriteria);
        if (endingResult.status === 'failed') {
          failure = endingResult.failure;
        }
      }
    } catch (error) {
      failure = {
        step: this.stepCount,
        reason: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    const duration = Date.now() - startTime;
    const status: PlaythroughResult['status'] = failure
      ? 'failed'
      : softlock?.softlocked
        ? 'softlocked'
        : 'passed';

    return {
      playthrough: script.meta.name,
      status,
      steps: this.stepCount,
      duration,
      snapshots: snapshotsCreated,
      failure,
      softlock,
    };
  }

  /**
   * Execute a single playthrough step.
   */
  private async executeStep(
    step: PlaythroughStep,
    script: PlaythroughScript
  ): Promise<{
    status: 'passed' | 'failed';
    failure?: PlaythroughResult['failure'];
    snapshot?: string;
    snapshotData?: StateSnapshot;
  }> {
    const state = this.engine.getState();

    switch (step.action) {
      case 'start': {
        // Start is implicit - engine initializes at starting scene
        return { status: 'passed' };
      }

      case 'choose': {
        return await this.executeChooseStep(step, state);
      }

      case 'checkpoint': {
        return this.executeCheckpointStep(step, state);
      }

      case 'save_snapshot': {
        return this.executeSaveSnapshotStep(step, state, script);
      }

      case 'load_snapshot': {
        return this.executeLoadSnapshotStep(step);
      }

      default: {
        // Exhaustiveness check - should never reach here
        const unknownStep: never = step;
        return {
          status: 'failed',
          failure: {
            step: (unknownStep as PlaythroughStep).sequence,
            reason: `Unknown action type: ${(unknownStep as any).action}`,
          },
        };
      }
    }
  }

  /**
   * Execute a choose step.
   */
  private async executeChooseStep(
    step: ChooseStep,
    state: GameState
  ): Promise<{
    status: 'passed' | 'failed';
    failure?: PlaythroughResult['failure'];
  }> {
    const availableChoices = this.engine.getAvailableChoices();

    // Validate choice index
    if (step.choiceIndex < 0 || step.choiceIndex >= availableChoices.length) {
      return {
        status: 'failed',
        failure: {
          step: step.sequence,
          expected: `choice index 0-${availableChoices.length - 1}`,
          actual: `${step.choiceIndex}`,
          reason: `Invalid choice index: ${step.choiceIndex} (only ${availableChoices.length} choices available)`,
        },
      };
    }

    const selectedChoice = availableChoices[step.choiceIndex];

    // Check if choice is enabled (or risky for attemptable stat checks)
    if (selectedChoice.state !== 'enabled' && selectedChoice.state !== 'risky') {
      return {
        status: 'failed',
        failure: {
          step: step.sequence,
          expected: 'enabled choice',
          actual: `disabled choice (${selectedChoice.disabledHint || 'no hint'})`,
          reason: `Choice ${step.choiceIndex} is disabled: ${selectedChoice.disabledHint || 'no hint provided'}`,
        },
      };
    }

    // Make the choice
    const result = await this.engine.makeChoice(step.choiceIndex);

    // Validate expected scene
    if (step.expectedScene && result.targetSceneId !== step.expectedScene) {
      return {
        status: 'failed',
        failure: {
          step: step.sequence,
          expected: step.expectedScene,
          actual: result.targetSceneId,
          reason: `Expected scene ${step.expectedScene}, got ${result.targetSceneId}`,
        },
      };
    }

    // Validate assertions
    if (step.assertions) {
      const assertionResult = this.validateAssertions(step.assertions, this.engine.getState());
      if (assertionResult.status === 'failed') {
        return {
          status: 'failed',
          failure: {
            step: step.sequence,
            expected: assertionResult.expected,
            actual: assertionResult.actual,
            reason: assertionResult.reason!,
          },
        };
      }
    }

    // Track progress for softlock detection
    this.trackProgress();

    return { status: 'passed' };
  }

  /**
   * Execute a checkpoint step.
   */
  private executeCheckpointStep(
    step: CheckpointStep,
    state: GameState
  ): {
    status: 'passed' | 'failed';
    failure?: PlaythroughResult['failure'];
    snapshot?: string;
    snapshotData?: StateSnapshot;
  } {
    const assertionResult = this.validateAssertions(step.assertions, state);

    if (assertionResult.status === 'failed') {
      const failure: PlaythroughResult['failure'] = {
        step: step.sequence,
        expected: assertionResult.expected,
        actual: assertionResult.actual,
        reason: assertionResult.reason!,
      };
      return {
        status: 'failed',
        failure,
      };
    }

    // Save snapshot if requested
    if (step.saveSnapshot) {
      const snapshot = this.createSnapshot(step.saveSnapshot, state);
      return {
        status: 'passed',
        snapshot: step.saveSnapshot,
        snapshotData: snapshot,
      };
    }

    return { status: 'passed' };
  }

  /**
   * Execute a save snapshot step.
   */
  private executeSaveSnapshotStep(
    step: SaveSnapshotStep,
    state: GameState,
    script: PlaythroughScript
  ): {
    status: 'passed' | 'failed';
    failure?: PlaythroughResult['failure'];
    snapshot: string;
    snapshotData: StateSnapshot;
  } {
    const snapshot = this.createSnapshot(step.snapshotName, state);

    // Save snapshot to file system
    this.saveSnapshotToFile(snapshot, script.meta.name).catch((err) => {
      console.warn(`Failed to save snapshot to file: ${err.message}`);
    });

    return {
      status: 'passed',
      snapshot: step.snapshotName,
      snapshotData: snapshot,
    };
  }

  /**
   * Execute a load snapshot step.
   */
  private async executeLoadSnapshotStep(
    step: LoadSnapshotStep
  ): Promise<{
    status: 'passed' | 'failed';
    failure?: PlaythroughResult['failure'];
  }> {
    const snapshot = this.snapshots.get(step.snapshotName);

    if (!snapshot) {
      return {
        status: 'failed',
        failure: {
          step: step.sequence,
          reason: `Snapshot not found: ${step.snapshotName}`,
        },
      };
    }

    // Load snapshot into engine
    // snapshot.state already has flags as array and inventory as array of entries
    // from createSnapshot, so we can directly stringify it
    this.engine.load(JSON.stringify(snapshot.state));

    // Validate assertions if provided
    if (step.assertions) {
      const assertionResult = this.validateAssertions(step.assertions, this.engine.getState());
      if (assertionResult.status === 'failed') {
        return {
          status: 'failed',
          failure: {
            step: step.sequence,
            expected: assertionResult.expected,
            actual: assertionResult.actual,
            reason: assertionResult.reason!,
          },
        };
      }
    }

    return { status: 'passed' };
  }

  /**
   * Validate state assertions.
   */
  private validateAssertions(
    assertions: StateAssertions,
    state: GameState
  ): {
    status: 'passed' | 'failed';
    expected?: string;
    actual?: string;
    reason?: string;
  } {
    // Check flagsSet
    if (assertions.flagsSet) {
      for (const flag of assertions.flagsSet) {
        if (!state.flags.has(flag)) {
          return {
            status: 'failed',
            expected: `flag ${flag} to be set`,
            actual: 'flag not set',
            reason: `Expected flag "${flag}" to be set, but it is not`,
          };
        }
      }
    }

    // Check flagsCleared
    if (assertions.flagsCleared) {
      for (const flag of assertions.flagsCleared) {
        if (state.flags.has(flag)) {
          return {
            status: 'failed',
            expected: `flag ${flag} to be cleared`,
            actual: 'flag is set',
            reason: `Expected flag "${flag}" to be cleared, but it is set`,
          };
        }
      }
    }

    // Check inventoryContains
    if (assertions.inventoryContains) {
      for (const item of assertions.inventoryContains) {
        if (!state.inventory.has(item)) {
          return {
            status: 'failed',
            expected: `item ${item} in inventory`,
            actual: 'item not in inventory',
            reason: `Expected item "${item}" in inventory, but it is not`,
          };
        }
      }
    }

    // Check inventoryExcludes
    if (assertions.inventoryExcludes) {
      for (const item of assertions.inventoryExcludes) {
        if (state.inventory.has(item)) {
          return {
            status: 'failed',
            expected: `item ${item} not in inventory`,
            actual: 'item is in inventory',
            reason: `Expected item "${item}" not in inventory, but it is`,
          };
        }
      }
    }

    // Check stats
    if (assertions.stats) {
      for (const [stat, expectedValue] of Object.entries(assertions.stats)) {
        const actualValue = state.stats[stat];
        if (actualValue !== expectedValue) {
          return {
            status: 'failed',
            expected: `${stat} = ${expectedValue}`,
            actual: `${stat} = ${actualValue}`,
            reason: `Expected stat "${stat}" to be ${expectedValue}, but got ${actualValue}`,
          };
        }
      }
    }

    // Check currentScene
    if (assertions.currentScene && state.currentSceneId !== assertions.currentScene) {
      return {
        status: 'failed',
        expected: assertions.currentScene,
        actual: state.currentSceneId,
        reason: `Expected current scene to be ${assertions.currentScene}, but got ${state.currentSceneId}`,
      };
    }

    // Check visitedCount
    if (assertions.visitedCount) {
      for (const [sceneId, expectedCount] of Object.entries(assertions.visitedCount)) {
        const historyEntry = state.history.find((h) => h.sceneId === sceneId);
        const actualCount = historyEntry?.visitedCount ?? 0;
        if (actualCount !== expectedCount) {
          return {
            status: 'failed',
            expected: `${sceneId} visited ${expectedCount} times`,
            actual: `${sceneId} visited ${actualCount} times`,
            reason: `Expected scene "${sceneId}" to have been visited ${expectedCount} times, but got ${actualCount}`,
          };
        }
      }
    }

    // Check choicesAvailable
    if (assertions.choicesAvailable !== undefined) {
      const availableChoices = this.engine.getAvailableChoices();
      if (availableChoices.length < assertions.choicesAvailable) {
        return {
          status: 'failed',
          expected: `at least ${assertions.choicesAvailable} choices`,
          actual: `${availableChoices.length} choices`,
          reason: `Expected at least ${assertions.choicesAvailable} choices available, but got ${availableChoices.length}`,
        };
      }
    }

    return { status: 'passed' };
  }

  /**
   * Validate ending criteria.
   */
  private validateEndingCriteria(
    criteria: EndingCriteria
  ): {
    status: 'passed' | 'failed';
    failure?: PlaythroughResult['failure'];
  } {
    const state = this.engine.getState();

    // Check ending scene
    if (state.currentSceneId !== criteria.sceneId) {
      return {
        status: 'failed',
        failure: {
          step: this.stepCount,
          expected: criteria.sceneId,
          actual: state.currentSceneId,
          reason: `Expected ending scene ${criteria.sceneId}, but at ${state.currentSceneId}`,
        },
      };
    }

    // Check required flags
    if (criteria.flagsRequired) {
      for (const flag of criteria.flagsRequired) {
        if (!state.flags.has(flag)) {
          return {
            status: 'failed',
            failure: {
              step: this.stepCount,
              expected: `flag ${flag} to be set`,
              actual: 'flag not set',
              reason: `Required flag "${flag}" is not set at ending`,
            },
          };
        }
      }
    }

    // Check required items
    if (criteria.inventoryRequired) {
      for (const item of criteria.inventoryRequired) {
        if (!state.inventory.has(item)) {
          return {
            status: 'failed',
            failure: {
              step: this.stepCount,
              expected: `item ${item} in inventory`,
              actual: 'item not in inventory',
              reason: `Required item "${item}" is not in inventory at ending`,
            },
          };
        }
      }
    }

    // Check required stats
    if (criteria.statsRequired) {
      for (const [stat, minValue] of Object.entries(criteria.statsRequired)) {
        const actualValue = state.stats[stat] ?? 0;
        if (actualValue < (minValue ?? 0)) {
          return {
            status: 'failed',
            failure: {
              step: this.stepCount,
              expected: `${stat} >= ${minValue}`,
              actual: `${stat} = ${actualValue}`,
              reason: `Required stat "${stat}" is ${actualValue}, expected at least ${minValue ?? 0}`,
            },
          };
        }
      }
    }

    return { status: 'passed' };
  }

  /**
   * Detect softlock conditions.
   * Per agent-e: visitedCount threshold and progress tracking.
   */
  private detectSoftlock(config?: SoftlockConfig): SoftlockResult {
    const state = this.engine.getState();
    const currentScene = state.currentSceneId;
    const maxRevisits = config?.maxSceneRevisits ?? 3;
    const maxStepsWithoutProgress = config?.maxStepsWithoutProgress ?? 15;

    // Check if current scene is exempt
    if (config?.exemptScenes?.includes(currentScene)) {
      return { softlocked: false };
    }

    // Check for no choices (dead end)
    const availableChoices = this.engine.getAvailableChoices();
    if (availableChoices.length === 0) {
      // Check if this is an ending scene (no choices is expected)
      const currentSceneData = this.engine.getCurrentScene();
      // If we have scene data and it's not an ending, that's a softlock
      if (currentSceneData && !this.isEndingScene(currentSceneData)) {
        return {
          softlocked: true,
          reason: 'no_choices',
          sceneId: currentScene,
        };
      }
      // If no scene data or it's an ending, continue to other checks
    }

    // Check scene revisit threshold
    const historyEntry = state.history.find((h) => h.sceneId === currentScene);
    if (historyEntry && historyEntry.visitedCount > maxRevisits) {
      return {
        softlocked: true,
        reason: 'revisit_threshold',
        sceneId: currentScene,
        visitCount: historyEntry.visitedCount,
      };
    }

    // Check steps without progress
    if (this.stepCount - this.getLastProgressStep() > maxStepsWithoutProgress) {
      return {
        softlocked: true,
        reason: 'progress_threshold',
        stepsWithoutProgress: this.stepCount - this.getLastProgressStep(),
      };
    }

    return { softlocked: false };
  }

  /**
   * Track progress for softlock detection.
   * Progress = flag changes or significant item/stat changes.
   */
  private trackProgress(): void {
    const state = this.engine.getState();

    // Create a progress signature from current state
    const signature = [
      Array.from(state.flags).sort().join(','),
      Array.from(state.inventory.entries())
        .map(([item, count]) => `${item}:${count}`)
        .sort()
        .join(','),
      Object.entries(state.stats)
        .map(([stat, value]) => `${stat}:${value}`)
        .sort()
        .join(','),
    ].join('|');

    // Check if signature changed
    if (!this.lastProgressState.has(signature)) {
      this.lastProgressState.clear();
      this.lastProgressState.add(signature);
      this.lastProgressStep = this.stepCount;
    }
  }

  private lastProgressStep: number = 0;

  /**
   * Get the last step where progress was made.
   */
  private getLastProgressStep(): number {
    return this.lastProgressStep;
  }

  /**
   * Check if a scene is an ending scene.
   * Per agent-d (DOS UI lens): Check both ending property AND choices.length === 0
   * for backward compatibility with existing content.
   *
   * - If scene has ending property (boolean or EndingData): it's an ending
   * - If scene has no choices but no ending marker: it's a bug (dead end/softlock)
   *
   * This enables DOS UI to render different visual treatments for ending types
   * (defeat/victory/neutral/secret) while supporting old content format.
   */
  private isEndingScene(scene: { id: string; choices: unknown[]; ending?: unknown }): boolean {
    // Check explicit ending property first (new content format)
    // Then fall back to choices.length heuristic for old content
    return scene.ending !== undefined || scene.choices.length === 0;
  }

  /**
   * Create a state snapshot.
   */
  private createSnapshot(
    name: string,
    state: GameState
  ): StateSnapshot {
    // Deep clone and convert Set/Map to serializable arrays
    const serializableState = {
      ...state,
      flags: Array.from(state.flags),
      inventory: Array.from(state.inventory.entries()),
    };
    return {
      timestamp: new Date().toISOString(),
      playthrough: name, // Will be updated with actual playthrough name
      step: this.stepCount,
      name,
      engineVersion: state.version,
      contentVersion: state.contentVersion,
      state: serializableState,
    };
  }

  /**
   * Save snapshot to file system.
   */
  private async saveSnapshotToFile(
    snapshot: StateSnapshot,
    playthroughName: string
  ): Promise<void> {
    const filename = `${playthroughName}_${snapshot.name}_${snapshot.step}.json`;
    const filepath = join(this.snapshotDir, filename);

    // Ensure directory exists
    await fs.mkdir(this.snapshotDir, { recursive: true });

    // Write snapshot
    await fs.writeFile(filepath, JSON.stringify(snapshot, null, 2));
  }

  /**
   * Apply starting state overrides.
   */
  private async applyStartingState(startingState: {
    flags?: FlagName[];
    inventory?: ItemId[];
    stats?: Record<StatId, number>;
    currentScene?: SceneId;
  }): Promise<void> {
    const state = this.engine.getState();

    // Set flags
    if (startingState.flags) {
      for (const flag of startingState.flags) {
        state.flags.add(flag);
      }
    }

    // Add inventory items
    if (startingState.inventory) {
      for (const item of startingState.inventory) {
        state.inventory.set(item, 1);
      }
    }

    // Set stats
    if (startingState.stats) {
      for (const [stat, value] of Object.entries(startingState.stats)) {
        state.stats[stat] = value;
      }
    }

    // Transition to starting scene if specified
    if (startingState.currentScene) {
      await this.engine.transitionTo(startingState.currentScene);
    }
  }

  /**
   * Reset the runner for a new playthrough.
   */
  async reset(): Promise<void> {
    await this.engine.reset();
    this.snapshots.clear();
    this.stepCount = 0;
    this.lastProgressState.clear();
    this.lastProgressStep = 0;
  }

  /**
   * Get the underlying engine (for testing).
   */
  getEngine(): Engine {
    return this.engine;
  }
}
