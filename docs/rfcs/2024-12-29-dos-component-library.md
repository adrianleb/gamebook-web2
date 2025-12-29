# RFC: DOS Component Library & UI/Engine Interface

**Status:** Draft
**Created:** 2025-12-29
**Author:** agent-d (Presentation Lens)
**Related:** Engine Core Architecture RFC, STYLE_GUIDE.md

## Table of Contents

1. [Summary](#summary)
2. [Motivation](#motivation)
3. [Proposed Solution](#proposed-solution)
4. [UI/Engine Interface Contract](#uiengine-interface-contract)
5. [Component Library Design](#component-library-design)
6. [State Management Pattern](#state-management-pattern)
7. [Alternatives Considered](#alternatives-considered)
8. [Unresolved Questions](#unresolved-questions)

---

## Summary

Define the component library approach and UI/Engine interface contract for The Understage's DOS-style web interface. This RFC establishes how the presentation layer (UI) subscribes to engine state changes without tight coupling, enabling framework-agnostic implementation and testability.

---

## Motivation

### Current State

- Engine architecture (agent-c's RFC) defines state types and event system
- Style guide (STYLE_GUIDE.md) defines DOS aesthetic system
- No formal contract between engine events and UI component updates

### Problem

Without a defined UI/Engine interface:

1. **Tight Coupling Risk**: UI might directly access engine internals, breaking encapsulation
2. **Update Inefficiency**: Naive UI re-renders on every state change waste performance
3. **Testability**: Difficult to mock engine state for UI component testing
4. **Framework Flexibility**: Hard to swap presentation frameworks (vanilla → React → Svelte)

### Goals

1. **Loose Coupling**: UI subscribes to events; engine emits notifications
2. **Selective Updates**: UI components update only when relevant state changes
3. **Testability**: UI components accept state props; engine events are mockable
4. **Framework Agnostic**: Interface works with vanilla JS, React, or any framework

---

## Proposed Solution

### Core Approach

**Event-Driven Architecture with State Snapshot Pattern**

1. **Engine emits events** when state changes (synchronous, per engine RFC)
2. **UI subscribes** to relevant event types
3. **UI requests state snapshot** for initial render and after navigation
4. **Components render** based on current state, not event history

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data Flow | Unidirectional (Engine → UI) | Engine is source of truth; UI is pure view |
| Update Granularity | Scoped (`renderScope` field) | Avoid full re-renders for targeted updates |
| Initial State | Snapshot + replay events | Fast initial load; catch up missed events |
| Error Handling | Engine emits error events | UI displays error overlay; engine logs details |
| Font Loading | `font-ready` event | Defer scene rendering until typography loaded |

---

## UI/Engine Interface Contract

### Event Subscription

UI components subscribe to engine events via callback registration:

```typescript
// Engine API (per engine RFC)
interface Engine {
  on(eventType: StateChangeEvent['type'], callback: (event: StateChangeEvent) => void): void;
  off(eventType: StateChangeEvent['type'], callback: (event: StateChangeEvent) => void): void;
}

// UI subscription
engine.on('scene-loaded', uiController.handleSceneLoaded);
engine.on('state-changed', uiController.handleStateChanged);
engine.on('error', uiController.handleError);
```

### State Snapshot API

UI requests full state snapshot for initial render:

```typescript
// Engine API
interface Engine {
  getState(): GameStateView;
}

// UI usage
const initialState = engine.getState();
uiController.renderAll(initialState);
```

### State Change Event Structure

Per engine RFC, with UI-specific enhancements:

```typescript
interface StateChangeEvent {
  // Core fields (from engine RFC)
  type: 'scene-loaded' | 'condition-evaluated' | 'effect-applied' | 'state-changed' | 'font-ready';
  path: string;           // e.g., 'stats.courage', 'inventory.[2]'
  oldValue: any;
  newValue: any;

  // UI-specific fields (per agent-d perspective request)
  renderScope?: RenderScope;
  urgency?: 'high' | 'normal' | 'low';
}

type RenderScope =
  | 'all'         // Re-render entire UI
  | 'viewport'    // Re-render text viewport only
  | 'choices'     // Re-render choices panel only
  | 'stats'       // Re-render stats panel only
  | 'inventory'   // Re-render inventory panel only
  | 'none';       // State changed but no UI update needed
```

### Event Type → UI Component Mapping

| Event Type | Render Scope | UI Component Action |
|------------|--------------|---------------------|
| `scene-loaded` | `all` | Fade out viewport → update text → fade in; rebuild choices list |
| `condition-evaluated` | `choices` | Update choice availability (enable/disable) |
| `effect-applied` | `stats` \| `inventory` \| `viewport` | Update specific panel based on effect type |
| `state-changed` | (path-based) | Map `path` to component: `stats.*` → stats, `inventory.*` → inventory |
| `font-ready` | `all` | Remove loading overlay; render first scene |
| `error` | `none` | Show error overlay (don't re-render) |

---

## Component Library Design

### Component Hierarchy

```
GameContainer
├── Header
│   ├── GameTitle
│   └── HeaderActions (Menu, Save, Load buttons)
├── TextViewport (main content area)
│   ├── SceneText (formatted content)
│   └── SceneMetadata (debug info, optional)
├── ChoicesPanel
│   ├── ChoicesHeader
│   └── ChoicesList
│       └── ChoiceButton (×2-4)
├── BottomPanel
│   ├── StatsPanel
│   │   ├── StatRow (×3: Script, Stage Presence, Improv)
│   │   └── StatBar (segmented display)
│   └── InventoryPanel
│       └── InventoryList
│           └── InventoryItem (×N)
└── ErrorOverlay (conditional)
```

### Component Props Interface

Each component accepts state props (not raw engine access):

```typescript
// TextViewport props
interface TextViewportProps {
  sceneId: string;
  textContent: string;
  formattedElements?: FormattedText[];  // Bold, italic, speaker, faction colors
  isLoading: boolean;
  onScrollToBottom?: () => void;
}

// ChoicesPanel props
interface ChoicesPanelProps {
  choices: Choice[];
  stats: Stats;  // For stat check evaluation display
  inventory: Item[];  // For requirement display
  onSelectChoice: (choiceId: number) => void;
}

// StatsPanel props
interface StatsPanelProps {
  stats: Stats;
  layout: 'horizontal' | 'vertical';
}

// InventoryPanel props
interface InventoryPanelProps {
  items: Item[];
  categories: ItemCategory[];
  isCollapsed: boolean;
  onToggle: () => void;
}
```

### Component Implementation Pattern

**Framework-Agnostic Template:**

```typescript
// Base component interface
interface Component<P> {
  props: P;
  mount(container: HTMLElement): void;
  update(newProps: P): void;
  unmount(): void;
}

// Example: StatBar component
class StatBar implements Component<StatBarProps> {
  props: StatBarProps;
  element: HTMLElement;

  constructor(props: StatBarProps) {
    this.props = props;
    this.element = this.render();
  }

  mount(container: HTMLElement): void {
    container.appendChild(this.element);
  }

  update(newProps: StatBarProps): void {
    this.props = newProps;
    this.element.innerHTML = this.renderSegments();
  }

  unmount(): void {
    this.element.remove();
  }

  private render(): HTMLElement {
    const div = document.createElement('div');
    div.className = 'stat-bar';
    div.setAttribute('data-stat-value', String(this.props.value));
    div.setAttribute('data-stat-max', String(this.props.max));
    div.innerHTML = this.renderSegments();
    return div;
  }

  private renderSegments(): string {
    const filled = Array(this.props.value).fill('<div class="stat-bar-segment filled"></div>').join('');
    const empty = Array(this.props.max - this.props.value).fill('<div class="stat-bar-segment"></div>').join('');
    return filled + empty;
  }
}
```

---

## State Management Pattern

### UI Controller Architecture

```typescript
class UIController {
  private engine: Engine;
  private components: Map<string, Component<any>>;

  constructor(engine: Engine) {
    this.engine = engine;
    this.components = new Map();
    this.subscribeToEvents();
  }

  private subscribeToEvents(): void {
    this.engine.on('scene-loaded', this.handleSceneLoaded.bind(this));
    this.engine.on('state-changed', this.handleStateChanged.bind(this));
    this.engine.on('error', this.handleError.bind(this));
  }

  private handleSceneLoaded(event: StateChangeEvent): void {
    const newState = this.engine.getState();
    this.components.get('viewport')?.update({
      sceneId: newState.currentScene,
      textContent: newState.scene.text,
      formattedElements: newState.scene.formattedElements
    });
    this.components.get('choices')?.update({
      choices: newState.availableChoices,
      stats: newState.stats,
      inventory: newState.inventory
    });
  }

  private handleStateChanged(event: StateChangeEvent): void {
    const component = this.mapPathToComponent(event.path);
    const newState = this.engine.getState();

    switch (component) {
      case 'stats':
        this.components.get('stats')?.update({ stats: newState.stats });
        break;
      case 'inventory':
        this.components.get('inventory')?.update({ items: newState.inventory });
        break;
    }
  }

  private handleError(event: StateChangeEvent): void {
    const errorOverlay = this.components.get('errorOverlay');
    errorOverlay?.update({
      visible: true,
      message: event.newValue.message,
      type: event.newValue.type
    });
  }

  private mapPathToComponent(path: string): string | null {
    if (path.startsWith('stats.')) return 'stats';
    if (path.startsWith('inventory.')) return 'inventory';
    if (path.startsWith('currentScene')) return 'viewport';
    return null;
  }
}
```

### Render Scope Implementation

```typescript
class ScopedRenderer {
  render(scope: RenderScope, state: GameStateView): void {
    switch (scope) {
      case 'all':
        this.renderViewport(state);
        this.renderChoices(state);
        this.renderStats(state);
        this.renderInventory(state);
        break;
      case 'viewport':
        this.renderViewport(state);
        break;
      case 'choices':
        this.renderChoices(state);
        break;
      case 'stats':
        this.renderStats(state);
        break;
      case 'inventory':
        this.renderInventory(state);
        break;
      case 'none':
        // No render needed
        break;
    }
  }
}
```

---

## Alternatives Considered

### Alternative 1: UI Polling Engine State

**Approach:** UI uses `setInterval` to check engine state every 100ms.

**Rejected because:**
- Wasteful; most polls return no changes
- UI lags behind state by up to 100ms
- Unclear when to re-render which components

### Alternative 2: Two-Way Data Binding

**Approach:** UI and engine share observable state; changes flow both ways.

**Rejected because:**
- Breaks engine encapsulation (UI could mutate state directly)
- Engine can't guarantee state validity if UI bypasses methods
- Adds complexity for little benefit (UI is read-only view)

### Alternative 3: Framework-Specific (React) Integration

**Approach:** Use React Context + hooks for state management.

**Deferred because:**
- Engine RFC specifies framework-agnostic design
- Can add React adapter later without breaking interface
- Vanilla JS prototype validates design first

---

## Unresolved Questions

1. **Animation Timing:** Should engine emit `scene-transition-start` and `scene-transition-end` events, or should UI handle transition timing independently?
   - **倾向:** UI handles timing; engine emits `scene-loaded` after state update

2. **Save/Load UI:** Should save/load UI be part of the game shell or a separate overlay?
   - **倾向:** Separate overlay (modal) to avoid cluttering main shell

3. **Mobile Responsiveness:** Should the component library include mobile-specific layouts (e.g., collapsible panels), or is desktop-only acceptable for v1?
   - **倾向:** Desktop-first v1; mobile breakpoints in CSS but unpolished

4. **Component Testing:** Should UI components have their own test suite (e.g., Jest + Testing Library), or are E2E tests (Playwright) sufficient?
   - **倾向:** Unit tests for complex components (StatBar, ChoiceButton); E2E for integration

---

## Related Documentation

- **Engine RFC:** `docs/rfcs/2024-12-29-engine-core-architecture.md`
- **Style Guide:** `docs/STYLE_GUIDE.md`
- **Content Manifest:** `content/manifest.json`
- **Test Playthroughs:** `docs/TEST_PLAYTHROUGHS.md`

---

**Next Steps:**
1. [ ] Team review and approval
2. [ ] Implement UI controller with engine event subscription
3. [ ] Build component library per STYLE_GUIDE.md
4. [ ] Add mock engine for component testing
5. [ ] Validate with E2E playthrough tests
