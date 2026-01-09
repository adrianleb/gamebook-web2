/**
 * Engine Core
 *
 * Deterministic state machine for gamebook execution.
 * Framework-agnostic - no React/DOM dependencies.
 *
 * Per RFC:
 * - Synchronous event emission for determinism
 * - Pure state mutations (no side effects)
 * - Save/load with versioning support
 * - Headless testing support
 *
 * Per agent-d feedback:
 * - StateChangeEvent includes renderScope and urgency
 *
 * Per agent-e feedback:
 * - SceneHistory tracks visitedCount for softlock detection
 */

import type {
  GameState,
  SceneData,
  SceneId,
  SceneHistoryEntry,
  ReadonlyState,
  StateChangeEvent,
  StateChangeHandler,
  Unsubscribe,
  Condition,
  Effect,
  SaveData,
  ContentVersion,
  CheckpointType,
  RenderScope,
  RenderUrgency,
} from './types.js';
import { ConditionEvaluator } from './condition-evaluator.js';
import { EffectApplier } from './effect-applier.js';
import { SceneLoader } from './scene-loader.js';
import { ENGINE_VERSION, type ChoiceType } from './types.js';
import type { SaveManager } from './save-manager.js';

/**
 * Engine configuration options.
 */
export interface EngineOptions {
  /** Content path for scene loader */
  contentPath?: string;
  /** Initial state overrides (for testing) */
  initialState?: Partial<GameState>;
  /** Enable scene caching */
  cacheScenes?: boolean;
  /**
   * Optional SaveManager for autosave integration.
   * Per agent-e (Intent #64): If provided, autosave triggers on scene transitions.
   * Pass null to disable autosave (e.g., for headless runner with --no-autosave).
   */
  saveManager?: SaveManager | null;
  /**
   * Disable autosave even if SaveManager is provided.
   * Per agent-e: Allows explicit autosave disable (e.g., --no-autosave flag).
   */
  disableAutosave?: boolean;
}

/**
 * Result of a choice selection.
 */
export interface ChoiceResult {
  /** Selected choice index */
  choiceIndex: number;
  /** Target scene ID */
  targetSceneId: SceneId;
  /** State change events from effects */
  events: StateChangeEvent[];
}

/**
 * Choice state for UI indication.
 * Per Intent #155, agent-d (UI): Three states for DOS aesthetic.
 */
export type ChoiceState = 'enabled' | 'risky' | 'disabled';

/**
 * Available choices for current scene.
 * Per Intent #155: state indicates enabled/risky/disabled for UI rendering.
 * Per Phase 11.3: choiceType included for DOS-style [A]/[D]/[E] badges.
 */
export interface AvailableChoice {
  /** Original choice data */
  choice: {
    label: string;
    to?: SceneId;
    choiceType?: ChoiceType;
  };
  /** Choice index in scene */
  index: number;
  /** Choice state: enabled (normal), risky (attemptable stat check), disabled (gated) */
  state: ChoiceState;
  /** Disabled reason (when state === 'disabled') */
  disabledHint?: string;
  /** Stat check requirement for display (when state === 'risky') */
  statCheck?: string;
}

/**
 * Main engine class for gamebook state machine.
 *
 * All state mutations go through Engine methods for determinism.
 * Events are emitted synchronously for UI reactivity.
 *
 * @example
 * ```typescript
 * const engine = new Engine({ contentPath: './content' });
 * await engine.initialize();
 *
 * // Subscribe to state changes
 * const unsubscribe = engine.onStateChange((event) => {
 *   console.log('State changed:', event.path, event.newValue);
 * });
 *
 * // Make a choice
 * const choices = engine.getAvailableChoices();
 * const result = await engine.makeChoice(choices[0].index);
 *
 * // Save/load
 * const saveData = engine.save();
 * engine.load(saveData);
 *
 * unsubscribe();
 * ```
 */
export class Engine {
  private state: GameState;
  private loader: SceneLoader;
  private conditionEvaluator: ConditionEvaluator;
  private effectApplier: EffectApplier;
  private eventHandlers: Set<StateChangeHandler>;
  private currentScene: SceneData | null = null;
  private contentPath: string;
  private saveManager: SaveManager | null;
  private disableAutosave: boolean;
  /** Load guard flag to prevent state mutations during async scene load (per agent-e Intent #93) */
  private isLoadingState = false;

  constructor(options: EngineOptions = {}) {
    this.contentPath = options.contentPath ?? './content';
    this.loader = new SceneLoader({
      contentPath: this.contentPath,
      cache: options.cacheScenes ?? true,
    });
    this.conditionEvaluator = new ConditionEvaluator();
    this.effectApplier = new EffectApplier();
    this.eventHandlers = new Set();

    // SaveManager for autosave (per agent-e Intent #64)
    this.saveManager = options.saveManager ?? null;
    this.disableAutosave = options.disableAutosave ?? false;

    // Initialize state
    this.state = this.createInitialState(options.initialState);
  }

  /**
   * Initialize the engine by loading content manifest.
   * Must be called before other methods.
   */
  async initialize(): Promise<void> {
    await this.loader.initialize();
    this.state.contentVersion = this.loader.getContentVersion();

    // Load starting scene
    const startingSceneId = this.loader.getStartingScene();
    await this.loadScene(startingSceneId, true);
  }

  /**
   * Get current game state (read-only).
   * Returns a readonly view to prevent external mutation.
   */
  getState(): ReadonlyState {
    return this.state;
  }

  /**
   * Get current scene data.
   */
  getCurrentScene(): SceneData | null {
    return this.currentScene;
  }

  /**
   * Subscribe to state change events.
   * Returns unsubscribe function.
   *
   * Per agent-d: Events include renderScope and urgency for UI optimization.
   *
   * @param handler - Function to call on state changes
   * @returns Unsubscribe function
   */
  onStateChange(handler: StateChangeHandler): Unsubscribe {
    this.eventHandlers.add(handler);

    return () => {
      this.eventHandlers.delete(handler);
    };
  }

  /**
   * Load a scene by ID.
   * Updates currentSceneId and applies scene effects.
   *
   * @param sceneId - Scene to load
   * @param isInitial - Whether this is the initial scene load
   */
  async loadScene(sceneId: SceneId, isInitial = false): Promise<void> {
    // Load scene data
    const scene = await this.loader.loadScene(sceneId);
    this.currentScene = scene;

    const oldSceneId = this.state.currentSceneId;
    this.state.currentSceneId = sceneId;

    // Emit scene-loaded event
    this.emitEvent({
      type: 'scene-loaded',
      path: 'currentSceneId',
      oldValue: isInitial ? null : oldSceneId,
      newValue: sceneId,
      timestamp: Date.now(),
      renderScope: 'scene',
      urgency: 'immediate',
      checkpoint: isInitial ? undefined : 'scene-transition',
    });

    // Update scene history (only for initial scene load)
    // For non-initial loads, caller (makeChoice/transitionTo) handles history update
    if (isInitial) {
      this.updateSceneHistory(sceneId);
    }

    // Apply scene effects and emit events
    // Per agent-e Intent #379: Emit individual effect events for Phase 11 event detection
    if (scene.effects && scene.effects.length > 0) {
      const sceneEvents = this.effectApplier.applyAll(scene.effects, this.state);
      for (const event of sceneEvents) {
        this.emitEvent(event);
      }
    }
  }

  /**
   * Evaluate a condition against current state.
   *
   * @param condition - Condition to evaluate
   * @returns True if condition passes
   */
  evaluateCondition(condition: Condition): boolean {
    const result = this.conditionEvaluator.evaluate(condition, this.state);

    // Emit condition-evaluated event
    this.emitEvent({
      type: 'condition-evaluated',
      path: 'condition',
      oldValue: null,
      newValue: result,
      timestamp: Date.now(),
      renderScope: 'choices',
      urgency: 'immediate',
    });

    return result;
  }

  /**
   * Apply an effect to the state.
   *
   * @param effect - Effect to apply
   * @returns State change event
   */
  applyEffect(effect: Effect): StateChangeEvent {
    return this.effectApplier.apply(effect, this.state);
  }

  /**
   * Get available choices for current scene.
   * Filters choices by conditions.
   *
   * @returns Array of available choices
   */
  getAvailableChoices(): AvailableChoice[] {
    if (!this.currentScene) {
      return [];
    }

    return this.currentScene.choices.map((choice, index) => {
      // Check if conditions have attemptable mode
      const hasAttemptable = choice.conditions
        ? this.conditionEvaluator.hasAttemptable(choice.conditions)
        : false;

      if (hasAttemptable) {
        // Attemptable choice: always enabled, shown as 'risky'
        // Get stat check description for UI display
        const statCheck = this.getStatCheckForChoice(choice);

        return {
          choice: {
            label: choice.label,
            to: choice.to,
          },
          index,
          state: 'risky',
          statCheck,
        };
      }

      // Normal choice: evaluate conditions for enabled/disabled
      const enabled = choice.conditions
        ? this.conditionEvaluator.evaluateAll(choice.conditions, this.state)
        : true;

      return {
        choice: {
          label: choice.label,
          to: choice.to,
        },
        index,
        state: enabled ? 'enabled' : 'disabled',
        disabledHint: choice.disabledHint,
      };
    });
  }

  /**
   * Get stat check description for a choice with attemptable conditions.
   * Used for UI display to show player what stat is being checked.
   *
   * @param choice - Choice to get stat check from
   * @returns Stat check description string or undefined
   */
  private getStatCheckForChoice(choice: {
    conditions?: Condition[];
  }): string | undefined {
    if (!choice.conditions) {
      return undefined;
    }

    for (const condition of choice.conditions) {
      if (condition.type === 'stat') {
        const description = this.conditionEvaluator.getStatCheckDescription(condition);
        if (description) {
          return description;
        }
      }
      // Check nested conditions for stat checks
      if (condition.conditions) {
        const nested = this.getStatCheckForChoice({ conditions: condition.conditions });
        if (nested) {
          return nested;
        }
      }
    }

    return undefined;
  }

  /**
   * Make a choice and transition to the target scene.
   * Applies choice effects and updates scene history.
   * Per Intent #155: For attemptable choices, evaluates stat check and branches
   * to onSuccess/onFailure based on result.
   *
   * @param choiceIndex - Index of choice to make
   * @returns Result with target scene and events
   */
  async makeChoice(choiceIndex: number): Promise<ChoiceResult> {
    if (!this.currentScene) {
      throw new Error('No scene loaded');
    }

    const availableChoices = this.getAvailableChoices();
    const selectedChoice = availableChoices[choiceIndex];

    if (!selectedChoice) {
      throw new Error(`Invalid choice index: ${choiceIndex}`);
    }

    // Check if choice is available (disabled choices cannot be selected)
    if (selectedChoice.state === 'disabled') {
      throw new Error(`Choice "${selectedChoice.choice.label}" is not available`);
    }

    const originalChoice = this.currentScene.choices[choiceIndex];
    let targetSceneId: SceneId;
    const events: StateChangeEvent[] = [];

    // Handle attemptable stat check branching (per Intent #155)
    if (selectedChoice.state === 'risky' && originalChoice.conditions) {
      // Evaluate the stat check
      const checkPassed = this.conditionEvaluator.evaluateAll(
        originalChoice.conditions,
        this.state
      );

      // Branch to success or failure target
      if (checkPassed) {
        // Success path
        if (originalChoice.onSuccess) {
          targetSceneId = originalChoice.onSuccess.to;
          // Apply success effects and emit events
          // Per agent-e Intent #379: Emit individual effect events for Phase 11 event detection
          if (originalChoice.onSuccess.effects) {
            const successEvents = this.effectApplier.applyAll(
              originalChoice.onSuccess.effects,
              this.state,
              'choice' as CheckpointType
            );
            events.push(...successEvents);
            for (const event of successEvents) {
              this.emitEvent(event);
            }
          }
        } else {
          // Fallback to default to if onSuccess not defined
          targetSceneId = originalChoice.to!;
        }
      } else {
        // Failure path
        if (originalChoice.onFailure) {
          targetSceneId = originalChoice.onFailure.to;
          // Apply failure effects and emit events
          // Per agent-e Intent #379: Emit individual effect events for Phase 11 event detection
          if (originalChoice.onFailure.effects) {
            const failureEvents = this.effectApplier.applyAll(
              originalChoice.onFailure.effects,
              this.state,
              'choice' as CheckpointType
            );
            events.push(...failureEvents);
            for (const event of failureEvents) {
              this.emitEvent(event);
            }
          }
        } else {
          // Fallback to default to if onFailure not defined
          targetSceneId = originalChoice.to!;
        }
      }
    } else {
      // Normal choice (non-attemptable)
      targetSceneId = originalChoice.to!;

      // Apply choice effects and emit events
      // Per agent-e Intent #379: Emit individual effect events for Phase 11 event detection
      if (originalChoice.effects && originalChoice.effects.length > 0) {
        const choiceEvents = this.effectApplier.applyAll(
          originalChoice.effects,
          this.state,
          'choice' as CheckpointType
        );
        events.push(...choiceEvents);
        for (const event of choiceEvents) {
          this.emitEvent(event);
        }
      }
    }

    // Update scene history with choice label
    this.updateSceneHistory(targetSceneId, originalChoice.label);

    // Transition to target scene
    await this.loadScene(targetSceneId);

    return {
      choiceIndex,
      targetSceneId,
      events,
    };
  }

  /**
   * Transition to a scene by ID.
   * Direct transition without checking conditions.
   *
   * Per agent-e (Intent #64): Triggers autosave on every scene transition
   * if SaveManager is provided and autosave is not disabled.
   *
   * @param sceneId - Target scene ID
   * @param choiceLabel - Optional choice label for history
   */
  async transitionTo(sceneId: SceneId, choiceLabel?: string): Promise<void> {
    this.updateSceneHistory(sceneId, choiceLabel);
    await this.loadScene(sceneId);

    // Autosave after scene transition (per agent-e Intent #64)
    // Event-driven, no debouncing - every transition triggers save
    if (this.saveManager && !this.disableAutosave) {
      const sceneTitle = this.currentScene?.title ?? sceneId;
      const success = await this.saveManager.autosave(this.state, sceneTitle);

      if (!success) {
        // Autosave failure should warn but not block gameplay
        console.warn(`[Engine] Autosave failed after transition to ${sceneId}`);
      }
    }
  }

  /**
   * Save current state to JSON string.
   * Includes version info for migration support.
   *
   * @returns JSON string of current state
   */
  save(): SaveData {
    // Convert Set and Map to plain JSON
    const serializable = {
      ...this.state,
      flags: Array.from(this.state.flags),
      inventory: Array.from(this.state.inventory.entries()),
    };

    return JSON.stringify(serializable);
  }

  /**
   * Load state from GameState object.
   * Integrates with SaveManager for save menu functionality.
   * Per agent-e (Intent #93): Implements fail-safe rollback on scene load failure.
   *
   * @param gameState - Validated GameState from SaveManager (already validated)
   * @throws Error if scene reload fails (state is rolled back)
   */
  async loadState(gameState: GameState): Promise<void> {
    // Load guard: prevent concurrent state loads (per agent-e)
    if (this.isLoadingState) {
      throw new Error('Cannot load state while another load is in progress');
    }

    // Store previous state for rollback (per agent-e's fail-safe recommendation)
    const previousState = this.deepCloneState(this.state);
    const previousScene = this.currentScene;

    this.isLoadingState = true;

    try {
      // Validate content version (SaveManager already validated, but double-check)
      if (gameState.contentVersion !== this.state.contentVersion) {
        throw new Error(
          `Content version mismatch: save is ${gameState.contentVersion}, current is ${this.state.contentVersion}`
        );
      }

      // Assign new state (direct assignment since SaveManager already validated)
      // Deep clone to prevent external mutations affecting engine state
      this.state = this.deepCloneState(gameState);

      // Emit state change event for UI (per agent-e: all scope update)
      this.emitEvent({
        type: 'state-changed',
        path: 'state',
        oldValue: previousState,
        newValue: this.state,
        timestamp: Date.now(),
        renderScope: 'all',
        urgency: 'immediate',
        checkpoint: 'scene-transition',
      });

      // Reload current scene (async operation - may fail)
      if (this.state.currentSceneId) {
        await this.loadScene(this.state.currentSceneId, true);
      }
    } catch (error) {
      // Rollback to previous state on scene load failure (per agent-e)
      console.error('[Engine] Scene load failed, rolling back state:', error);
      this.state = previousState;
      this.currentScene = previousScene;

      // Re-emit event to show rollback to UI
      this.emitEvent({
        type: 'state-changed',
        path: 'state',
        oldValue: gameState,
        newValue: this.state,
        timestamp: Date.now(),
        renderScope: 'all',
        urgency: 'immediate',
        checkpoint: 'scene-transition',
      });

      throw new Error(
        `Failed to load scene: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      // Always release load guard (per agent-e)
      this.isLoadingState = false;
    }
  }

  /**
   * Load state from JSON string.
   * Validates version compatibility.
   *
   * @param saveData - JSON string from save()
   */
  load(saveData: SaveData): void {
    try {
      const parsed = JSON.parse(saveData);

      // Validate version
      if (parsed.version !== ENGINE_VERSION) {
        console.warn(
          `Save version mismatch: expected ${ENGINE_VERSION}, got ${parsed.version}`
        );
        // TODO: Run migration if needed
      }

      // Validate content version
      if (parsed.contentVersion !== this.state.contentVersion) {
        throw new Error(
          `Content version mismatch: save is ${parsed.contentVersion}, current is ${this.state.contentVersion}`
        );
      }

      // Convert back to Set and Map
      this.state = {
        ...parsed,
        flags: new Set(parsed.flags),
        inventory: new Map(parsed.inventory),
      };

      // Reload current scene
      if (this.state.currentSceneId) {
        this.loadScene(this.state.currentSceneId, true);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to load save: ${error.message}`);
      }
      throw new Error('Failed to load save: Unknown error');
    }
  }

  /**
   * Validate the current scene.
   *
   * @returns Validation result
   */
  validateCurrentScene() {
    if (!this.currentScene) {
      return {
        valid: false,
        errors: [{ type: 'schema-error', message: 'No scene loaded' }],
        warnings: [],
      };
    }

    const manifest = this.loader.getManifest();
    if (!manifest) {
      return {
        valid: false,
        errors: [{ type: 'schema-error', message: 'Manifest not loaded' }],
        warnings: [],
      };
    }

    // Import validator dynamically to avoid circular dependency
    return import('./validator.js').then(({ contentValidator }) => {
      return contentValidator.validateScene(this.currentScene!, manifest);
    });
  }

  /**
   * Reset engine to initial state.
   * Per agent-e (Intent #93): Clears load guard and UI state.
   */
  async reset(): Promise<void> {
    this.isLoadingState = false; // Clear load guard (per agent-e)
    this.state = this.createInitialState();
    this.currentScene = null;
    await this.initialize();
  }

  /**
   * Get content version.
   */
  getContentVersion(): ContentVersion {
    return this.state.contentVersion;
  }

  /**
   * Check if a save is compatible with current content.
   */
  isSaveCompatible(saveData: SaveData): boolean {
    try {
      const parsed = JSON.parse(saveData);
      return parsed.contentVersion === this.state.contentVersion;
    } catch {
      return false;
    }
  }

  /**
   * Create initial game state.
   */
  private createInitialState(overrides: Partial<GameState> = {}): GameState {
    return {
      version: ENGINE_VERSION,
      contentVersion: '0.0.0', // Will be set during initialize()
      timestamp: Date.now(),
      currentSceneId: '',
      history: [],
      stats: {},
      flags: new Set(),
      inventory: new Map(),
      factions: {},
      ...overrides,
    };
  }

  /**
   * Deep clone GameState for rollback (per agent-e Intent #93).
   * Preserves Set and Map structures through JSON serialization.
   *
   * @param state - State to clone
   * @returns Deep cloned state
   */
  private deepCloneState(state: GameState): GameState {
    const serialized = {
      ...state,
      flags: Array.from(state.flags),
      inventory: Array.from(state.inventory.entries()),
    };
    const cloned = JSON.parse(JSON.stringify(serialized));
    return {
      ...cloned,
      flags: new Set(cloned.flags),
      inventory: new Map(cloned.inventory),
    };
  }

  /**
   * Update scene history with visited count tracking.
   * Per agent-e: visitedCount enables softlock detection.
   */
  private updateSceneHistory(sceneId: SceneId, choiceLabel?: string): void {
    // Find existing entry
    const existingEntry = this.state.history.find(entry => entry.sceneId === sceneId);

    if (existingEntry) {
      // Increment visited count
      existingEntry.visitedCount++;
      existingEntry.timestamp = Date.now();
      if (choiceLabel !== undefined) {
        existingEntry.choiceLabel = choiceLabel;
      }

      // Emit warning if visiting 3+ times (potential softlock)
      if (existingEntry.visitedCount >= 3) {
        console.warn(
          `Scene "${sceneId}" visited ${existingEntry.visitedCount} times - potential softlock`
        );
      }
    } else {
      // Create new entry
      const newEntry: SceneHistoryEntry = {
        sceneId,
        timestamp: Date.now(),
        choiceLabel,
        visitedCount: 1,
      };
      this.state.history.push(newEntry);
    }
  }

  /**
   * Emit state change event to all handlers.
   * Events are emitted synchronously per agent-d's feedback.
   */
  private emitEvent(event: StateChangeEvent): void {
    for (const handler of this.eventHandlers) {
      handler(event);
    }
  }

  /**
   * Get scene loader (for testing).
   */
  getLoader(): SceneLoader {
    return this.loader;
  }
}

/**
 * Create an engine with custom state (for testing).
 */
export function createTestEngine(
  manifest: any,
  options: Partial<EngineOptions> = {}
): Engine {
  const engine = new Engine(options);
  engine.getLoader().setManifest(manifest);
  return engine;
}
