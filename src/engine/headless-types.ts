/**
 * Headless Runner Types
 *
 * Playthrough script schema and execution types for headless testing.
 * Framework-agnostic - no React/DOM dependencies.
 *
 * Per agent-e and agent-d feedback:
 * - JSON playthrough scripts with checkpoint assertions
 * - Softlock detection with configurable thresholds
 * - State snapshots for regression testing
 * - CI-friendly output with JUnit format
 */

import type { GameState, SceneId, StatId, FlagName, ItemId } from './types.js';

/**
 * Playthrough script configuration.
 * Defines a deterministic path through the game with validation checkpoints.
 *
 * @example
 * ```json
 * {
 *   "meta": {
 *     "name": "preservationist_early_path",
 *     "description": "Test early Preservationist branch",
 *     "author": "agent-e",
 *     "version": "1.0"
 *   },
 *   "startingState": {
 *     "flags": [],
 *     "inventory": [],
 *     "stats": {},
 *     "currentScene": "sc_1_0_001"
 *   },
 *   "steps": [
 *     {
 *       "sequence": 1,
 *       "action": "choose",
 *       "choiceIndex": 0,
 *       "expectedScene": "sc_2_0_010",
 *       "assertions": {
 *         "flagsAdded": ["met_stranger"],
 *         "inventoryContains": ["rusty_knife"]
 *       }
 *     }
 *   ],
 *   "endingCriteria": {
 *     "sceneId": "sc_3_0_100"
 *   }
 * }
 * ```
 */
export interface PlaythroughScript {
  /** Script metadata */
  meta: PlaythroughMeta;

  /** Initial state overrides (optional, uses default if not provided) */
  startingState?: StartingState;

  /** Sequential steps to execute */
  steps: PlaythroughStep[];

  /** Ending validation criteria */
  endingCriteria?: EndingCriteria;

  /** Softlock detection configuration */
  softlockDetection?: SoftlockConfig;
}

/**
 * Playthrough script metadata.
 */
export interface PlaythroughMeta {
  /** Unique identifier for this playthrough */
  name: string;

  /** Human-readable description */
  description?: string;

  /** Author who created this script */
  author?: string;

  /** Version for tracking changes */
  version?: string;
}

/**
 * Initial state for playthrough.
 * All fields optional - uses engine defaults if not provided.
 */
export interface StartingState {
  /** Starting flags */
  flags?: FlagName[];

  /** Starting inventory (item IDs) */
  inventory?: ItemId[];

  /** Starting stat values */
  stats?: Record<StatId, number>;

  /** Starting scene ID (overrides manifest default) */
  currentScene?: SceneId;
}

/**
 * Step types in a playthrough script.
 */
export type PlaythroughStep =
  | StartStep
  | ChooseStep
  | CheckpointStep
  | SaveSnapshotStep
  | LoadSnapshotStep;

/**
 * Base step properties.
 */
interface BaseStep {
  /** Step sequence number (1-indexed) */
  sequence: number;

  /** Human-readable description */
  description?: string;

  /** Action type discriminator */
  action: PlaythroughAction;
}

/**
 * Playthrough action types.
 */
export type PlaythroughAction =
  | 'start'       // Initialize engine and load starting scene
  | 'choose'      // Select a choice by index
  | 'checkpoint'  // Verify state without advancing
  | 'save_snapshot'  // Capture state for regression testing
  | 'load_snapshot'; // Restore from previous snapshot

/**
 * Start action - initialize engine (implicit, usually first step).
 */
export interface StartStep extends BaseStep {
  action: 'start';
}

/**
 * Choose action - select a choice and transition.
 */
export interface ChooseStep extends BaseStep {
  action: 'choose';

  /** Choice index to select (0-indexed) */
  choiceIndex: number;

  /** Expected scene after transition */
  expectedScene?: SceneId;

  /** Mark this step as a checkpoint for save/load */
  checkpoint?: boolean;

  /** State assertions to verify after this step */
  assertions?: StateAssertions;
}

/**
 * Checkpoint action - verify state without transitioning.
 */
export interface CheckpointStep extends BaseStep {
  action: 'checkpoint';

  /** State assertions to verify */
  assertions: StateAssertions;

  /** Optional: save snapshot at this checkpoint */
  saveSnapshot?: string;
}

/**
 * Save snapshot action - capture current state.
 */
export interface SaveSnapshotStep extends BaseStep {
  action: 'save_snapshot';

  /** Snapshot name (for file naming) */
  snapshotName: string;
}

/**
 * Load snapshot action - restore from saved state.
 */
export interface LoadSnapshotStep extends BaseStep {
  action: 'load_snapshot';

  /** Snapshot name to load */
  snapshotName: string;

  /** Optional: assertions after loading */
  assertions?: StateAssertions;
}

/**
 * State assertions for validation.
 * Per agent-e: enables save/load regression testing.
 */
export interface StateAssertions {
  /** Expected flags to be set */
  flagsSet?: FlagName[];

  /** Expected flags to be cleared */
  flagsCleared?: FlagName[];

  /** Expected items in inventory */
  inventoryContains?: ItemId[];

  /** Expected items NOT in inventory */
  inventoryExcludes?: ItemId[];

  /** Expected stat values (partial match) */
  stats?: Partial<Record<StatId, number>>;

  /** Expected current scene (checkpoint only) */
  currentScene?: SceneId;

  /** Expected scene visit counts (for softlock detection validation) */
  visitedCount?: Record<SceneId, number>;

  /** Minimum expected number of available choices */
  choicesAvailable?: number;

  /** Verify choices with disabledHint are properly disabled */
  disabledChoicesValidated?: boolean;
}

/**
 * Ending criteria for playthrough completion.
 * Per agent-e: defines when a playthrough is considered "complete".
 */
export interface EndingCriteria {
  /** Expected ending scene ID */
  sceneId: SceneId;

  /** Required flags at ending */
  flagsRequired?: FlagName[];

  /** Required items at ending */
  inventoryRequired?: ItemId[];

  /** Required stat thresholds at ending */
  statsRequired?: Partial<Record<StatId, number>>;
}

/**
 * Softlock detection configuration.
 * Per agent-e: configurable thresholds with fail-on-detection for CI.
 */
export interface SoftlockConfig {
  /** Enable softlock detection */
  enabled?: boolean;

  /** Maximum times a scene can be revisited before softlock */
  maxSceneRevisits?: number;

  /** Maximum steps without "progress" (flag/quest change) */
  maxStepsWithoutProgress?: number;

  /** Scenes exempt from softlock detection (hub areas, etc.) */
  exemptScenes?: SceneId[];

  /** Fail playthrough if softlock detected (for CI) */
  failOnDetection?: boolean;

  /** Continue execution after softlock (for debugging) */
  continueOnDetection?: boolean;
}

/**
 * Softlock detection result.
 */
export interface SoftlockResult {
  /** Whether a softlock was detected */
  softlocked: boolean;

  /** Reason for softlock detection */
  reason?: 'no_choices' | 'revisit_threshold' | 'progress_threshold';

  /** Scene where softlock occurred */
  sceneId?: SceneId;

  /** Number of times scene was visited */
  visitCount?: number;

  /** Number of steps without progress */
  stepsWithoutProgress?: number;
}

/**
 * State snapshot for regression testing.
 * Per agent-e: enables save/load regression validation.
 */
export interface StateSnapshot {
  /** Snapshot timestamp */
  timestamp: string;

  /** Playthrough script name */
  playthrough: string;

  /** Step sequence number */
  step: number;

  /** Snapshot name */
  name: string;

  /** Engine version */
  engineVersion: number;

  /** Content version */
  contentVersion: string;

  /** Full game state at snapshot */
  state: GameState;
}

/**
 * Playthrough execution result.
 * Per agent-e: CI-friendly output with status and diagnostics.
 */
export interface PlaythroughResult {
  /** Playthrough script name */
  playthrough: string;

  /** Execution status */
  status: 'passed' | 'failed' | 'softlocked';

  /** Number of steps executed */
  steps: number;

  /** Execution duration in milliseconds */
  duration: number;

  /** Snapshots created during execution */
  snapshots: string[];

  /** Failure details (if failed) */
  failure?: {
    /** Step where failure occurred */
    step: number;

    /** Expected value */
    expected?: string;

    /** Actual value */
    actual?: string;

    /** Failure reason */
    reason: string;
  };

  /** Softlock detection result (if detected) */
  softlock?: SoftlockResult;
}

/**
 * Summary of multiple playthrough executions.
 * Per agent-e: enables CI gates with aggregate results.
 */
export interface PlaythroughSummary {
  /** Total playthroughs executed */
  total: number;

  /** Playthroughs that passed */
  passed: number;

  /** Playthroughs that failed */
  failed: number;

  /** Total execution duration */
  duration: string;

  /** Individual results */
  results: PlaythroughResult[];
}

/**
 * CLI command types.
 */
export type CliCommand = 'run' | 'run-all' | 'coverage';

/**
 * CLI options.
 */
export interface CliOptions {
  /** Command to execute */
  command: CliCommand;

  /** Playthrough script file (for 'run' command) */
  script?: string;

  /** Directory containing playthrough scripts (for 'run-all' command) */
  dir?: string;

  /** Content directory path */
  contentPath?: string;

  /** CI mode: non-interactive, exit 1 on failures */
  ci?: boolean;

  /** Output file for JSON results */
  output?: string;

  /** JUnit XML output file */
  junitReport?: string;

  /** Snapshot directory for save/load testing */
  snapshotDir?: string;

  /** Verbose output */
  verbose?: boolean;

  /** Validate text wrapping (max 80 chars per line) */
  validateTextWrap?: boolean;

  /** Maximum line length for text validation */
  maxLineLength?: number;
}
