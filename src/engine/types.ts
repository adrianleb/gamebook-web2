/**
 * Engine Core Types
 *
 * Deterministic state machine types for the gamebook engine.
 * Framework-agnostic - no React/DOM dependencies.
 *
 * Per RFC 2024-12-29-engine-core-architecture.md with refinements:
 * - StateChangeEvent.renderScope for UI hints (agent-d)
 * - SceneHistory.visitedCount for softlock detection (agent-e)
 * - GameState.factions for faction alignment (agent-b)
 */

/**
 * Current engine save format version.
 * Increment when state schema changes incompatibly.
 */
export const ENGINE_VERSION = 1;

/**
 * Content version from manifest.json.
 * Saves are invalidated if content version changes.
 */
export type ContentVersion = string;

/**
 * Choice type classification for Phase 11.3 choice interaction enhancements.
 * Per DOM Contract v1.3: Mandatory [A]/[D]/[E] badges with DOS aesthetic.
 *
 * - action: Physical acts, combat, stat checks (e.g., "Attack the guard")
 * - dialogue: Speech acts, conversation, negotiation (e.g., "Ask about rumors")
 * - explore: Investigation, examination, navigation (e.g., "Examine the paintings")
 *
 * Defaults to 'explore' for backward compatibility with existing scenes.
 */
export type ChoiceType = 'action' | 'dialogue' | 'explore';

/**
 * Unique scene identifier following convention: sc_ACT_HUB_SEQ
 * e.g., sc_1_0_001, sc_2_2_015
 */
export type SceneId = string;

/**
 * Unique identifier for stats (from content/stats.json).
 * e.g., "script", "stagePresence", "improv"
 */
export type StatId = string;

/**
 * Unique identifier for items (from content/items.json).
 * e.g., "prompter_book", "green_room_key"
 */
export type ItemId = string;

/**
 * Flag names use UPPERCASE_SNAKE_CASE convention.
 * e.g., "MET_PURSUER", "HAS_GREEN_ROOM_KEY"
 */
export type FlagName = string;

/**
 * Faction identifiers for alignment tracking.
 * e.g., "preservationist", "revisionist", "exiter", "independent"
 */
export type FactionId = string;

/**
 * Stack count for inventory items.
 */
export type ItemStackCount = number;

/**
 * Core game state - serializable for save/load.
 * All state mutations must go through Engine methods for determinism.
 */
export interface GameState {
  // Metadata for save/load versioning
  version: number;
  contentVersion: ContentVersion;
  timestamp: number;

  // Scene tracking
  currentSceneId: SceneId;
  history: SceneHistoryEntry[];

  // Player state
  stats: Record<StatId, number>;
  flags: Set<FlagName>;
  inventory: Map<ItemId, ItemStackCount>;

  // Faction alignment (per agent-b's manifest)
  factions: Record<FactionId, number>;

  // System state for determinism
  randomSeed?: number;
}

/**
 * Scene history entry for tracking visited scenes and softlock detection.
 * Per agent-e: visitedCount enables softlock detection (looping 3+ times).
 */
export interface SceneHistoryEntry {
  sceneId: SceneId;
  timestamp: number;
  choiceLabel?: string;
  visitedCount: number; // For softlock detection
}

/**
 * State change event emitted synchronously during state transitions.
 * Per agent-d: renderScope and urgency enable UI optimization.
 */
export interface StateChangeEvent {
  // Event type categorization
  type: StateChangeType;

  // Path to the changed state (dot notation for nested, array index for collections)
  path: string;

  // Previous and new values for diff tracking
  oldValue: unknown;
  newValue: unknown;

  // Event timestamp
  timestamp: number;

  // UI rendering hints (per agent-d)
  renderScope: RenderScope;
  urgency: RenderUrgency;

  // Checkpoint type for save/load regression (per agent-e)
  checkpoint?: CheckpointType;
}

/**
 * Types of state changes for event categorization.
 */
export type StateChangeType =
  | 'scene-loaded'
  | 'condition-evaluated'
  | 'effect-applied'
  | 'state-changed';

/**
 * UI rendering scope - tells UI which components need repainting.
 * Per agent-d: Prevents unnecessary DOM repaints (critical for mobile).
 */
export type RenderScope =
  | 'scene'       // Main scene text/image changed
  | 'choices'     // Choice list availability changed
  | 'inventory'   // Inventory items changed
  | 'status'      // Stats/factions changed
  | 'all';        // Full re-render needed

/**
 * Render urgency for batching UI updates.
 * Per agent-d: Text changes = immediate, stat ticks = low priority.
 */
export type RenderUrgency =
  | 'immediate'   // Text changes, scene loads
  | 'low';        // Stat increments, minor UI updates

/**
 * Checkpoint types for save/load regression testing.
 * Per agent-e: Save at each checkpoint type to verify no state drift.
 */
export type CheckpointType =
  | 'scene-transition'  // After scene load, before choices
  | 'choice'            // After player choice
  | 'effect'            // After stat/item changes
  | 'act-transition'    // Between acts for state continuity
  | 'ending';           // Final state before ending

/**
 * Condition types for evaluating requirements.
 * Supports nested and/or/not for complex logic.
 *
 * Per Intent #155: attemptable flag enables choices that can be tried
 * but may fail, with branching to onSuccess/onFailure scenes based on result.
 */
export interface Condition {
  type: 'stat' | 'flag' | 'item' | 'faction' | 'and' | 'or' | 'not';

  // Attemptable mode: choice always enabled, branches on check result
  attemptable?: boolean;

  // Stat check fields
  stat?: StatId;
  operator?: StatOperator;
  value?: number;

  // Flag check fields
  flag?: FlagName;

  // Item check fields
  item?: ItemId;
  itemCount?: number;

  // Faction check fields
  faction?: FactionId;
  factionLevel?: number;

  // Nested conditions
  conditions?: Condition[];
}

/**
 * Comparison operators for stat checks.
 */
export type StatOperator =
  | 'gte'   // Greater than or equal
  | 'lte'   // Less than or equal
  | 'eq'    // Equal
  | 'gt'    // Greater than
  | 'lt'    // Less than;

/**
 * Effect types for modifying state.
 * All effects are applied synchronously for determinism.
 */
export interface Effect {
  type: EffectType;

  // Stat modification fields
  stat?: StatId;
  value?: number;

  // Flag fields
  flag?: FlagName;

  // Item fields
  item?: ItemId;
  count?: number;

  // Scene transition
  sceneId?: SceneId;

  // Faction changes
  faction?: FactionId;
  amount?: number;
}

/**
 * Types of effects that can be applied.
 */
export type EffectType =
  | 'set-stat'       // Set stat to exact value
  | 'modify-stat'    // Add/subtract from stat
  | 'set-flag'       // Set a flag to true
  | 'clear-flag'     // Set a flag to false
  | 'add-item'       // Add item to inventory
  | 'remove-item'    // Remove item from inventory
  | 'goto'           // Transition to scene
  | 'modify-faction' // Change faction alignment;

/**
 * Choice data structure for scene options.
 *
 * Per Intent #155: Attemptable stat checks support onSuccess/onFailure branching
 * for choices that can be tried but may fail based on condition evaluation.
 *
 * Per Phase 11.3: choiceType adds semantic classification for UI badges ([A]/[D]/[E]).
 */
export interface Choice {
  label: string;
  to?: SceneId;  // Optional when using conditional branches
  conditions?: Condition[];
  effects?: Effect[];

  // Phase 11.3: Choice type classification for DOS-style badges
  // Optional field - defaults to 'explore' for backward compatibility
  choiceType?: ChoiceType;

  // Attemptable branching: when conditions contain attemptable: true,
  // the engine evaluates the check and branches to onSuccess or onFailure
  onSuccess?: {
    to: SceneId;
    effects?: Effect[];
  };
  onFailure?: {
    to: SceneId;
    effects?: Effect[];
  };

  disabledHint?: string;
}

/**
 * Raw scene text format from content files.
 * Supports both simple string and object with location/paragraphs.
 */
export type SceneText = string | SceneTextObject;

/**
 * Scene text object format with location metadata and paragraphs array.
 * The loader transforms this to a joined string for runtime use.
 */
export interface SceneTextObject {
  location: string;
  paragraphs: string[];
}

/**
 * Raw choice format from content files.
 * May use 'onChoose' instead of 'effects' for backwards compatibility.
 *
 * Per Intent #155: Supports onSuccess/onFailure for attemptable stat checks.
 * Per Phase 11.3: Supports choiceType for DOS-style badges.
 */
export interface RawChoice {
  label: string;
  to?: SceneId;
  conditions?: Condition[];
  effects?: Effect[];
  onChoose?: Effect[];  // Alias for effects

  // Phase 11.3: Choice type classification for DOS-style badges
  choiceType?: ChoiceType;

  // Attemptable branching
  onSuccess?: {
    to: SceneId;
    effects?: Effect[];
  };
  onFailure?: {
    to: SceneId;
    effects?: Effect[];
  };

  disabledHint?: string;
}

/**
 * Ending scene type for DOS UI visual treatment.
 * Per agent-d: Different endings require different visual presentations.
 */
export type EndingType = 'victory' | 'defeat' | 'neutral' | 'secret';

/**
 * Ending metadata from content files.
 * Per agent-d: Maps to DOS UI visual treatments for different ending types.
 */
export interface EndingData {
  type: EndingType;
  title?: string;
  description?: string;
  achievementId?: string;
}

/**
 * Raw scene data format from content files.
 * Differs from SceneData in that text can be an object and effectsOnEnter/onChoose
 * may be used instead of effects. The SceneLoader transforms this to SceneData.
 */
export interface RawSceneData {
  id: SceneId;
  title: string;
  text: SceneText;
  art?: string;
  music?: string;
  sfx?: string[];
  audio?: { music?: string | null; sfx?: string[] };
  effects?: Effect[];
  effectsOnEnter?: Effect[];  // Alias for effects
  choices: RawChoice[];
  requiredFlags?: FlagName[];
  requiredItems?: ItemId[];
  ending?: boolean | EndingData;  // Ending scene marker for DOS UI treatment
  // Additional fields from content format (ignored by engine)
  act?: number;
  hub?: number;
  location?: string;
  implementationStatus?: string;
  metadata?: Record<string, unknown>;
  npcs?: Array<Record<string, unknown>>;
  flags?: Record<string, unknown>;
}

/**
 * Scene data structure loaded from content files.
 * This is the runtime format after transformation from RawSceneData.
 */
export interface SceneData {
  id: SceneId;
  title: string;
  text: string;
  art?: string;
  music?: string;
  sfx?: string[];
  effects: Effect[];
  choices: Choice[];
  requiredFlags?: FlagName[];    // Pre-validation (fail-fast if not met)
  requiredItems?: ItemId[];      // Pre-validation (fail-fast if not met)
  ending?: boolean | EndingData; // Ending scene marker for DOS UI treatment
}

/**
 * Manifest structure from content/manifest.json.
 */
export interface GameManifest {
  $schema?: string;
  gamebook: {
    title: string;
    source: string;
    version: string;
    adaptationVersion: ContentVersion;
  };
  structure: {
    acts: number;
    totalNodesEstimated: number;
    endings: number;
  };
  startingScene: SceneId;
  acts: ActManifest[];
  endings: EndingManifest[];
  sceneIndex: Record<SceneId, SceneIndexEntry>;
  implementationStatus: ImplementationStatus;
}

/**
 * Act structure from manifest.
 */
export interface ActManifest {
  id: number;
  title: string;
  theme: string;
  estimatedNodes: number;
  hubs: HubManifest[];
}

/**
 * Hub structure from manifest.
 */
export interface HubManifest {
  id: number;
  title: string;
  description?: string;
  idRange?: string;
  keyLocations?: string[];
  npcs?: string[];
  branchPaths?: BranchPath[];
  convergenceScene?: SceneId;
  convergenceTitle?: string;
}

/**
 * Branch path options from manifest.
 */
export interface BranchPath {
  id: string;
  name: string;
  description: string;
  faction?: FactionId;
}

/**
 * Ending structure from manifest.
 */
export interface EndingManifest {
  id: number;
  sceneId: SceneId;
  title: string;
  description: string;
  tier: string;
  requirements: EndingRequirements;
}

/**
 * Ending requirements for validation.
 */
export interface EndingRequirements {
  faction?: FactionId;
  factionLevel?: number;
  editorState?: string;
  finalChoice?: string;
}

/**
 * Scene index entry for implementation tracking.
 */
export interface SceneIndexEntry {
  title: string;
  location: string;
  act: number;
  hub: number;
  status: 'pending' | 'draft' | 'complete' | 'reviewed';
  description?: string;
  mechanics?: string[];
  ending?: boolean;
  endingId?: number;
}

/**
 * Implementation status tracking.
 */
export interface ImplementationStatus {
  totalScenes: number;
  pending: number;
  draft: number;
  complete: number;
  reviewed: number;
}

/**
 * Validation result for content checking.
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error details.
 */
export interface ValidationError {
  type: 'broken-link' | 'invalid-stat' | 'invalid-item' | 'schema-error' | 'missing-scene';
  sceneId?: SceneId;
  message: string;
  context?: Record<string, unknown>;
}

/**
 * Validation warning for non-blocking issues.
 */
export interface ValidationWarning {
  type: 'unreachable-scene' | 'unused-flag' | 'unused-item';
  sceneId?: SceneId;
  message: string;
}

/**
 * Unreachable scene detection result.
 */
export interface UnreachableScene {
  sceneId: SceneId;
  reason: 'no-incoming-links' | 'behind-unsatisfied-condition';
  fromScenes?: SceneId[];
}

/**
 * Manifest validation result.
 */
export interface ManifestValidationResult extends ValidationResult {
  missingScenes?: SceneId[];
  brokenLinks?: Array<{ from: SceneId; to: SceneId }>;
}

/**
 * Save data format for export/import.
 * Same format as GameState but serialized.
 */
export type SaveData = string; // JSON stringified GameState

/**
 * Read-only view of game state.
 * Returned by getState() to prevent external mutation.
 */
export type ReadonlyState = Readonly<GameState>;

/**
 * Event handler function for state change subscriptions.
 */
export type StateChangeHandler = (event: StateChangeEvent) => void;

/**
 * Unsubscribe function returned by onStateChange().
 */
export type Unsubscribe = () => void;
