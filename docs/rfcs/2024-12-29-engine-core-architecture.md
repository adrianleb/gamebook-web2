# RFC: Engine Core Architecture

## Status
**PROPOSED** | Agent: agent-c | Lens: Engine/Robustness

## Summary
Define the deterministic state machine architecture for the gamebook engine, including state schema, condition evaluation, effect application, and event system.

## Motivation
The engine must:
1. Execute gamebook scenes deterministically (same inputs → same outputs)
2. Support save/load with versioned state serialization
3. Emit events for UI reactivity without tight coupling
4. Validate content integrity (broken links, schema violations)
5. Run headless in Node.js for testing

## Proposed Design

### 1. State Schema

```typescript
// src/engine/types.ts
interface GameState {
  // Metadata for save/load versioning
  version: number;
  contentVersion: string;
  timestamp: number;

  // Core game state
  currentSceneId: string;
  history: SceneHistoryEntry[];

  // Player state
  stats: Record<string, number>;        // e.g., { courage: 5, wit: 3 }
  flags: Set<string>;                   // e.g., ["met_pursuer", "has_key"]
  inventory: string[];                  // Item IDs

  // System state
  randomSeed?: number;                  // For deterministic randomness
}

interface SceneHistoryEntry {
  sceneId: string;
  timestamp: number;
  choiceLabel?: string;
}

interface StateChangeEvent {
  type: 'scene-loaded' | 'condition-evaluated' | 'effect-applied' | 'state-changed';
  path: string;        // e.g., 'stats.courage', 'inventory.[2]'
  oldValue: any;
  newValue: any;
  timestamp: number;
}
```

### 2. Core Engine Class

```typescript
// src/engine/engine.ts
class Engine {
  private state: GameState;
  private sceneLoader: SceneLoader;
  private eventHandlers: Set<(event: StateChangeEvent) => void>;

  constructor(initialState?: Partial<GameState>);

  // State access (read-only view)
  getState(): Readonly<GameState>;
  getCurrentScene(): SceneData;

  // Event subscription
  onStateChange(handler: (event: StateChangeEvent) => void): () => void;

  // Core flow
  async loadScene(sceneId: string): Promise<void>;
  evaluateCondition(condition: Condition): boolean;
  applyEffect(effect: Effect): void;
  transitionTo(sceneId: string, choiceLabel?: string): void;

  // Save/Load
  save(): string;              // JSON string
  load(saveData: string): void;

  // Validation
  validateScene(scene: SceneData): ValidationResult;
}
```

### 3. Condition Evaluation

```typescript
// src/engine/condition-evaluator.ts
interface Condition {
  type: 'stat' | 'flag' | 'item' | 'and' | 'or' | 'not';
  stat?: string;       // For stat checks
  operator?: 'gte' | 'lte' | 'eq' | 'gt' | 'lt';
  value?: any;
  flag?: string;       // For flag checks
  item?: string;       // For inventory checks
  conditions?: Condition[];  // For and/or/not
}

class ConditionEvaluator {
  evaluate(condition: Condition, state: Readonly<GameState>): boolean;
}
```

### 4. Effect Application

```typescript
// src/engine/effect-applier.ts
interface Effect {
  type: 'set-stat' | 'modify-stat' | 'set-flag' | 'clear-flag' | 'add-item' | 'remove-item' | 'goto';
  stat?: string;
  value?: any;
  flag?: string;
  item?: string;
  sceneId?: string;    // For goto effects
}

class EffectApplier {
  apply(effect: Effect, state: GameState): StateChangeEvent[];
}
```

### 5. Scene Loading

```typescript
// src/engine/scene-loader.ts
interface SceneData {
  id: string;
  title: string;
  text: string;
  art?: string;
  music?: string;
  sfx?: string;
  effects: Effect[];
  choices: Choice[];
}

interface Choice {
  label: string;
  to: string;
  conditions?: Condition;
  effects?: Effect[];
  disabledHint?: string;
}

class SceneLoader {
  private manifest: GameManifest;
  private sceneCache: Map<string, SceneData>;

  constructor(contentPath: string);
  loadScene(id: string): Promise<SceneData>;
  validateManifest(): ManifestValidationResult;
}
```

### 6. Content Validation

```typescript
// src/engine/validator.ts
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  type: 'broken-link' | 'invalid-stat' | 'invalid-item' | 'schema-error';
  sceneId: string;
  message: string;
}

class ContentValidator {
  validateManifest(manifest: GameManifest): ValidationResult;
  validateScene(scene: SceneData, manifest: GameManifest): ValidationResult;
  checkReachability(manifest: GameManifest): unreachableScene[];
}
```

## Key Decisions

### 1. Custom Implementation vs Library
**Decision: Custom implementation**

Rationale:
- Gamebook state machine is domain-specific; general state libraries add unnecessary complexity
- Need explicit control over serialization format for save/load versioning
- Event system needs to be lightweight and framework-agnostic
- Full determinism is easier to guarantee with custom code

### 2. Event System: Synchronous vs Asynchronous
**Decision: Synchronous event emission**

Rationale:
- State changes must be deterministic; async events could introduce race conditions
- UI can batch updates if needed
- Keeps engine simple and testable
- Content effects should be synchronous for predictability

### 3. State Schema Validation
**Decision: Runtime validation with schema declaration**

Rationale:
- Manifest.json will declare state schema (stats, items, flags)
- Engine validates at load time and during transitions
- Catches content errors early
- Enables better error messages for debugging

### 4. Save/Load Format Versioning
**Decision: Versioned JSON with migration support**

Rationale:
- Save files include `version` and `contentVersion` fields
- Engine can detect old save formats and run migrations
- Content version changes invalidate saves (design decision)
- Export/import uses same format for consistency

### 5. Error Handling for Malformed Content
**Decision: Fail-fast with detailed error reporting**

Rationale:
- Broken links, invalid conditions, or missing scenes throw errors
- Content validator catches these before runtime
- Headless runner includes validation pass
- Production builds could include graceful degradation, but dev should be strict

## Open Questions

1. **Randomness**: Does the gamebook require any random elements? If so, need seeded random for save/load consistency.
2. **Complex Conditions**: Are nested conditions (and/or/not) sufficient, or do we need scripting?
3. **Effect Ordering**: Do effects need to execute in sequence with early exit capability?
4. **Scene Preloading**: Should we preload adjacent scenes for performance, or load on demand?

## Dependencies

- Agent B: `content/manifest.json` schema definition
- Agent D: UI event subscription patterns
- Agent E: Test scenarios for validation

## Deliverables

- `src/engine/types.ts` - Type definitions
- `src/engine/engine.ts` - Core Engine class
- `src/engine/condition-evaluator.ts` - Condition evaluation
- `src/engine/effect-applier.ts` - Effect application
- `src/engine/scene-loader.ts` - Scene loading
- `src/engine/validator.ts` - Content validation
- `tests/engine/` - Unit tests for all components
- `scripts/validate-content.js` - CLI content validator

## Testing Strategy

1. **Unit tests**: Each component tested in isolation
2. **Integration tests**: Full scene transitions with state changes
3. **Save/load tests**: Round-trip state serialization
4. **Validation tests**: Broken links, invalid conditions, unreachable scenes
5. **Headless runner**: Execute playthrough scripts without UI

## Alternatives Considered

### Redux/MobX for State Management
**Rejected**: Too much overhead for simple game state. Would introduce framework dependency.

### Immutable.js
**Rejected**: Adds complexity to serialization. Simple shallow copying is sufficient for our state size.

### Async Event System
**Rejected**: Introduces non-determinism. Synchronous events are simpler and sufficient.

---

**Signed**: agent-c | **Date**: 2024-12-29
