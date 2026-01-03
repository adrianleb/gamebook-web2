# Engine Core

Deterministic state machine for gamebook execution.

## Architecture

Per RFC 2024-12-29-engine-core-architecture.md with refinements from agent feedback:

- **agent-e**: SceneHistory tracks `visitedCount` for softlock detection
- **agent-d**: StateChangeEvent includes `renderScope` and `urgency` for UI optimization
- **agent-b**: GameState includes `factions` object for faction alignment

## Components

| File | Purpose |
|------|---------|
| `types.ts` | TypeScript type definitions for all engine types |
| `engine.ts` | Main Engine class - state machine orchestration |
| `condition-evaluator.ts` | Evaluates conditions against state (pure functions) |
| `effect-applier.ts` | Applies effects to state and emits events |
| `scene-loader.ts` | Loads scene data from content files with caching |
| `validator.ts` | Validates manifest and scene integrity |
| `index.ts` | Public API exports |

## Usage

```typescript
import { Engine } from './engine/index.js';

const engine = new Engine({ contentPath: './content' });
await engine.initialize();

// Subscribe to state changes
const unsubscribe = engine.onStateChange((event) => {
  console.log(`${event.path}: ${event.oldValue} → ${event.newValue}`);
  // Use event.renderScope and event.urgency for UI optimization
});

// Get available choices
const choices = engine.getAvailableChoices();

// Make a choice
const result = await engine.makeChoice(choices[0].index);

// Save/load
const saveData = engine.save();
engine.load(saveData);

unsubscribe();
```

## Key Design Decisions

1. **Custom implementation** (not Redux/MobX)
   - Domain-specific state machine
   - Full control over serialization for save/load
   - Framework-agnostic

2. **Synchronous event emission**
   - Deterministic state transitions
   - UI can batch/debounce as needed
   - Simpler testing

3. **Two-tier validation**
   - **Full validation**: CI/CLI tool (`scripts/validate-content.js`)
   - **Lightweight validation**: Engine load time (assertions only)

4. **Versioned save format**
   - `version`: Engine save format version
   - `contentVersion`: Content manifest version
   - Migration support for future changes

5. **Fail-fast error handling**
   - Content validator catches errors pre-runtime
   - Invalid scenes throw detailed errors
   - Dev strictness, production could degrade gracefully

## Event System

Events are emitted synchronously during state transitions:

```typescript
interface StateChangeEvent {
  type: 'scene-loaded' | 'condition-evaluated' | 'effect-applied' | 'state-changed';
  path: string;           // e.g., 'stats.script', 'inventory.[2]'
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
  renderScope: 'scene' | 'choices' | 'inventory' | 'status' | 'all';
  urgency: 'immediate' | 'low';
  checkpoint?: 'scene-transition' | 'choice' | 'effect' | 'act-transition' | 'ending';
}
```

- `renderScope`: Tells UI which components need repainting
- `urgency`: Enables batching of low-priority updates
- `checkpoint`: For save/load regression testing

## Testing

Unit tests are in `tests/engine/engine.test.ts`:

```bash
bun test tests/engine/*.test.ts
```

Tests cover:
- State initialization
- Condition evaluation (stat, flag, item, AND, OR, NOT)
- Effect application (set/modify stat, flags, items)
- Choice selection
- Scene history and visitedCount tracking
- Save/load round-trip
- State change events
- Edge cases (circular references, dead ends, stat overflow)

## Content Validation

Validate content before runtime:

```bash
node scripts/validate-content.js
```

The validator checks:
- Manifest structure
- Broken scene links
- Invalid stat/item/flag references
- Unreachable scenes (via graph traversal)

## Headless Testing

The engine runs in Node.js without any DOM/browser dependencies:

```typescript
import { createTestEngine } from './engine/index.js';

const engine = createTestEngine(mockManifest);
await engine.initialize();

// Run playthrough script
const choices = engine.getAvailableChoices();
await engine.makeChoice(choices[0].index);

// Verify state
expect(engine.getState().currentSceneId).toBe('expected_scene');
```
