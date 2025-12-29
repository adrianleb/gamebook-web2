/**
 * Engine Core - Public API
 *
 * Main exports for the gamebook engine.
 * Framework-agnostic - works in Node.js and browser.
 *
 * @example
 * ```typescript
 * import { Engine } from './engine/index.js';
 *
 * const engine = new Engine({ contentPath: './content' });
 * await engine.initialize();
 * ```
 */

// Main engine class
export { Engine, createTestEngine } from './engine.js';
export type {
  EngineOptions,
  ChoiceResult,
  AvailableChoice,
} from './engine.js';

// Types
export {
  ENGINE_VERSION,
} from './types.js';
export type {
  GameState,
  SceneData,
  SceneId,
  StatId,
  ItemId,
  FlagName,
  FactionId,
  ItemStackCount,
  ContentVersion,
  SceneHistoryEntry,
  StateChangeEvent,
  StateChangeType,
  RenderScope,
  RenderUrgency,
  CheckpointType,
  Condition,
  StatOperator,
  Effect,
  EffectType,
  Choice,
  EndingType,
  EndingData,
  GameManifest,
  ActManifest,
  HubManifest,
  BranchPath,
  EndingManifest,
  EndingRequirements,
  SceneIndexEntry,
  ImplementationStatus,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  UnreachableScene,
  ManifestValidationResult,
  SaveData,
  ReadonlyState,
  StateChangeHandler,
  Unsubscribe,
} from './types.js';

// Condition evaluator
export { ConditionEvaluator, conditionEvaluator } from './condition-evaluator.js';

// Effect applier
export { EffectApplier, effectApplier } from './effect-applier.js';

// Scene loader
export { SceneLoader, createTestLoader } from './scene-loader.js';
export type { SceneLoaderOptions } from './scene-loader.js';

// Validator
export { ContentValidator, contentValidator } from './validator.js';

// SaveManager for game persistence
export { SaveManager, SaveError, SAVE_FORMAT_VERSION } from './save-manager.js';
export type {
  SaveSlotId,
  SaveSlotMetadata,
  SaveDataWithMetadata,
  SaveErrorType,
} from './save-manager.js';

// Headless runner
export { HeadlessRunner } from './headless-runner.js';
export type {
  PlaythroughScript,
  PlaythroughMeta,
  StartingState,
  PlaythroughStep,
  PlaythroughAction,
  ChooseStep,
  CheckpointStep,
  SaveSnapshotStep,
  LoadSnapshotStep,
  StateAssertions,
  EndingCriteria,
  SoftlockConfig,
  SoftlockResult,
  StateSnapshot,
  PlaythroughResult,
  PlaythroughSummary,
  CliCommand,
  CliOptions,
} from './headless-types.js';
