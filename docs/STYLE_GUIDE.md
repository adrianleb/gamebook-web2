# DOS/LucasArts UI Style Guide

**Project:** The Understage — Gamebook Web Adaptation
**Version:** 1.0
**Last Updated:** 2025-12-29
**Owner:** agent-d (Presentation Lens)

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Component Patterns](#component-patterns)
6. [Layout Structure](#layout-structure)
7. [States & Feedback](#states--feedback)
8. [Accessibility](#accessibility)
9. [Animation & Transitions](#animation--transitions)
10. [Test Mode Variants](#test-mode-variants)

---

## Design Philosophy

### Core Aesthetic: DOS/LucasArts Era (1990-1995)

The UI evokes classic adventure games like:
- **Monkey Island** — Sharp borders, vibrant colors on dark backgrounds
- **Full Throttle** — Panel-based layouts, industrial textures
- **Day of the Tentacle** — Cartoon exaggeration, expressive typography

### Key Principles

1. **Pixel-Perfect Precision**: All measurements align to 8px grid
2. **High Contrast**: Dark backgrounds (#000000, #1a1a2e) with vibrant accents
3. **Sharp Edges**: No border-radius — DOS era had square corners
4. **Tactile Feedback**: Every interaction has visible state change
5. **Performance First**: No framework dependencies, pure CSS

### Technical Constraints

| Constraint | Value | Rationale |
|------------|-------|-----------|
| Font | VT323 (Google Fonts) | SIL OFL, ~20KB, authentic DOS look |
| Max Width | 1200px | Comfortable reading on desktop |
| Touch Targets | 44x44px min | WCAG 2.5.5 compliance |
| Color Contrast | 4.5:1 min | WCAG AA compliance |
| Grid System | 8px base | Alignment consistency |

---

## Color Palette

### Background Colors

```css
--bg-primary: #000000;      /* Main background - pure black */
--bg-secondary: #1a1a2e;    /* Panel background - dark blue-black */
--bg-tertiary: #16213e;     /* Nested panel - slightly lighter */
--bg-highlight: #0f3460;    /* Selected item background */
```

### Text Colors

```css
--text-primary: #e8e8e8;    /* Primary text - off-white for readability */
--text-secondary: #a0a0a0;  /* Secondary text - muted gray */
--text-accent: #ffd700;     /* Gold - Preservationist faction, highlights */
--text-danger: #ff4757;     /* Red - Revisor faction, errors */
--text-info: #5dade2;       /* Blue - information, neutral */
```

### Border Colors

```css
--border-primary: #4a4a4a;   /* Standard borders */
--border-accent: #ffd700;    /* Gold borders - emphasis */
--border-dim: #2a2a2a;       /* Subtle borders */
--border-focus: #ffff00;     /* Yellow focus - keyboard navigation */
```

### Faction Colors (per agent-b's content)

```css
--faction-preservationist: #ffd700;  /* Gold - The Preservationists */
--faction-revisor: #ff4757;          /* Red - The Revisors */
--faction-neutral: #e8e8e8;          /* White - Neutral/unaligned */
```

### Contrast Ratios

| Combination | Ratio | WCAG Level |
|-------------|-------|------------|
| Black / Off-white (#000000 / #e8e8e8) | 14.3:1 | AAA |
| Dark Blue / Off-white (#1a1a2e / #e8e8e8) | 11.2:1 | AAA |
| Dark Blue / Gold (#1a1a2e / #ffd700) | 8.9:1 | AAA |
| Dark Blue / Red (#1a1a2e / #ff4757) | 5.8:1 | AA |
| Highlight / Off-white (#0f3460 / #e8e8e8) | 6.4:1 | AA |

---

## Typography

### Font Family

```css
font-family: 'VT323', monospace;
```

- **Source**: Google Fonts (https://fonts.googleapis.com/css2?family=VT323&display=swap)
- **License**: SIL Open Font License (OFL)
- **File Size**: ~20KB woff2
- **Fallback**: 'Courier New', monospace

### Font Sizes (8px scale)

```css
--font-xs:   16px;   /* 0.8rem - Small labels, metadata */
--font-sm:   20px;   /* 1rem - Secondary text, captions */
--font-base: 24px;   /* 1.2rem - Body text */
--font-lg:   32px;   /* 1.6rem - Headings, emphasis */
--font-xl:   48px;   /* 2.4rem - Section titles */
--font-2xl:  64px;   /* 3.2rem - Main headings, act titles */
```

### Font Weights

```css
--font-normal: 400;  /* Standard text */
--font-bold: 700;    /* Emphasis, keywords */
```

### Line Heights

```css
--leading-tight:   1.2;  /* Headings */
--leading-normal:  1.5;  /* Body text */
--leading-relaxed: 1.8;  /* Long-form content */
```

### Text Formatting

```css
/* Bold - emphasis, names, key objects */
strong, .bold {
  font-weight: 700;
  color: var(--text-accent);
}

/* Italic - internal thoughts, stage directions */
em, .italic {
  font-style: italic;
  color: var(--text-secondary);
}

/* Speaker prefixes for dialogue */
.speaker {
  font-weight: 700;
  color: var(--text-accent);
  text-transform: uppercase;
}
```

---

## Spacing System

### 8px Grid

All spacing measurements use 8px as the base unit:

```css
--space-1:  8px;    /* 0.5rem - Tight spacing */
--space-2:  16px;   /* 1rem - Default padding */
--space-3:  24px;   /* 1.5rem - Component gaps */
--space-4:  32px;   /* 2rem - Section gaps */
--space-5:  48px;   /* 3rem - Large gaps */
--space-6:  64px;   /* 4rem - Major section breaks */
```

### Component Padding

```css
--padding-sm:  var(--space-1)  var(--space-2);  /* 8px 16px - Compact buttons */
--padding-md:  var(--space-2)  var(--space-3);  /* 16px 24px - Standard padding */
--padding-lg:  var(--space-3)  var(--space-4);  /* 24px 32px - Large panels */
```

### Gap System (Flexbox/Grid)

```css
--gap-sm:  var(--space-1);  /* 8px - Tight item spacing */
--gap-md:  var(--space-2);  /* 16px - Default item spacing */
--gap-lg:  var(--space-3);  /* 24px - Section spacing */
```

---

## Component Patterns

### Borders

All borders are sharp (no radius) and use 2px width:

```css
/* Standard border */
.border {
  border: 2px solid var(--border-primary);
}

/* Accent border - emphasis */
.border-accent {
  border: 2px solid var(--border-accent);
}

/* Double border - DOS style decorative */
.border-double {
  border: 4px double var(--border-primary);
}

/* Inset border - pressed state */
.border-inset {
  border: 2px inset var(--border-dim);
}
```

### Shadows

DOS-style shadows use solid colors, not blur:

```css
/* Drop shadow - panels above background */
.shadow-panel {
  box-shadow: 4px 4px 0px var(--bg-tertiary);
}

/* Inset shadow - pressed buttons */
.shadow-pressed {
  box-shadow: inset 2px 2px 0px var(--bg-tertiary);
}

/* Text shadow - readability */
.shadow-text {
  text-shadow: 2px 2px 0px #000000;
}
```

### Buttons

#### Standard Button
```css
.choice-button {
  /* Layout */
  display: block;
  width: 100%;
  min-height: 44px;  /* WCAG 2.5.5 touch target */
  padding: var(--padding-sm);

  /* Typography */
  font-family: 'VT323', monospace;
  font-size: var(--font-base);
  text-align: left;

  /* Appearance */
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  color: var(--text-primary);
  cursor: pointer;
  border-radius: 0;  /* Sharp corners */

  /* Transition */
  transition: background-color 150ms ease,
              border-color 150ms ease,
              box-shadow 150ms ease;
}

/* Hover state */
.choice-button:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-accent);
}

/* Active/pressed state */
.choice-button:active {
  background: var(--bg-highlight);
  box-shadow: var(--shadow-pressed);
  transform: translate(2px, 2px);
}

/* Focus state - keyboard navigation */
.choice-button:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
  border-color: var(--border-focus);
}

/* Disabled state */
.choice-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### Locked Button (Gated Content)
```css
.choice-button.locked {
  border-style: dashed;
  border-color: var(--border-dim);
  color: var(--text-secondary);
}

.choice-button.locked::after {
  content: " [LOCKED]";
  font-size: var(--font-sm);
  color: var(--text-danger);
}
```

#### Stat Check Button
```css
.choice-button.stat-check::before {
  content: attr(data-stat-req);
  display: inline-block;
  padding: 2px 8px;
  margin-right: var(--space-1);
  background: var(--bg-highlight);
  border: 1px solid var(--border-accent);
  color: var(--text-accent);
  font-size: var(--font-sm);
}
```

### Panels

```css
.panel {
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  padding: var(--padding-md);
  box-shadow: var(--shadow-panel);
}

.panel-header {
  background: var(--bg-tertiary);
  border-bottom: 2px solid var(--border-primary);
  padding: var(--padding-sm);
  font-size: var(--font-lg);
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: 2px;
}
```

---

## Layout Structure

### Main Layout Grid

```
┌─────────────────────────────────────────────────┐
│                   HEADER                        │
│  [Menu] [Save] [Load]        The Understage     │
├─────────────────────────────────────────────────┤
│                                                 │
│                                                 │
│              MAIN TEXT VIEWPORT                 │
│         (60-70% width, scrollable)              │
│                                                 │
│                                                 │
├─────────────────────────────────────────────────┤
│              CHOICES PANEL                      │
│         [Choice 1]                              │
│         [Choice 2 - Script 7+]                  │
│         [Choice 3 - LOCKED]                     │
├──────────┬──────────────────────────────────────┤
│          │                                       │
│  STATS   │           INVENTORY                  │
│  Script: │  [📜 Script 1]     [🎭 Prop 1]       │
│  ████░░  │  [🔑 Key to Green]                  │
│  Stage:  │                                       │
│  ██░░░░  │                                       │
│  Improv: │                                       │
│  ██████  │                                       │
└──────────┴──────────────────────────────────────┘
```

### Container CSS

```css
/* Main container - centered, max width */
.game-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-2);
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  gap: var(--space-3);
  min-height: 100vh;
}

/* Header */
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--padding-sm);
  background: var(--bg-secondary);
  border: 2px solid var(--border-accent);
}

/* Main text viewport - 2000 char capacity with scrolling */
.text-viewport {
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  padding: var(--padding-lg);
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
  font-size: var(--font-base);
  line-height: var(--leading-relaxed);
}

/* Choices panel - 2-4 choices */
.choices-panel {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
}

/* Bottom panel grid - stats + inventory */
.bottom-panel {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--space-2);
}
```

---

## States & Feedback

### Focus States

```css
/* Keyboard focus - high visibility yellow outline */
:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

/* Internal focus indicators for testing */
[data-test-id]:focus::after {
  content: "[FOCUSED]";
  position: absolute;
  top: -20px;
  right: 0;
  font-size: 12px;
  color: var(--border-focus);
}
```

### Hover States

```css
/* All interactive elements */
.choice-button:hover,
.menu-item:hover,
.inventory-item:hover {
  background: var(--bg-tertiary);
  border-color: var(--border-accent);
  cursor: pointer;
}
```

### Active/Pressed States

```css
/* Physical button press feedback */
.choice-button:active,
.menu-item:active {
  background: var(--bg-highlight);
  box-shadow: var(--shadow-pressed);
  transform: translate(2px, 2px);
}
```

### Loading States

```css
/* Content loading indicator */
.loading::after {
  content: "LOADING...";
  display: inline-block;
  animation: dots 1.5s steps(4, end) infinite;
}

@keyframes dots {
  0%, 20% { content: "LOADING."; }
  40% { content: "LOADING.."; }
  60%, 100% { content: "LOADING..."; }
}
```

### Error States

```css
/* Error overlay */
.error-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.error-message {
  background: var(--bg-secondary);
  border: 3px solid var(--text-danger);
  padding: var(--padding-lg);
  color: var(--text-danger);
  max-width: 500px;
}
```

---

## Accessibility

### Keyboard Navigation

**Tab Order (per agent-e requirements):**
1. Text viewport (scrollable)
2. Choices panel (numbered 1-9)
3. Stats panel (collapsible)
4. Inventory panel (collapsible)
5. Menu buttons

**Keyboard Shortcuts:**
- `Tab` / `Shift+Tab` — Navigate forward/backward
- `Enter` / `Space` — Activate focused button
- `Escape` — Toggle inventory panel
- `1-9` — Quick select choices 1-9
- `S` — Save game
- `L` — Load game
- `M` — Toggle menu

### Focus Indicators

```css
/* High visibility focus for all interactive elements */
button:focus-visible,
a:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}
```

### ARIA Labels

```html
<!-- Text viewport -->
<div id="main-text"
     data-test-id="main-text-viewport"
     role="region"
     aria-label="Scene text"
     aria-live="polite"
     tabindex="0">
  <!-- Scene text content -->
</div>

<!-- Choices list -->
<ul data-test-id="choices-list"
    role="listbox"
    aria-label="Available choices"
    tabindex="0">
  <li data-test-id="choice-0"
      data-choice-index="0"
      role="option"
      tabindex="0">
    <button class="choice-button">Choice text</button>
  </li>
</ul>

<!-- Stats panel -->
<div data-test-id="stats-panel"
     role="region"
     aria-label="Character stats">
  <div class="stat" data-test-id="stat-script">
    <span class="stat-label">Script</span>
    <div role="progressbar"
         aria-valuenow="7"
         aria-valuemin="0"
         aria-valuemax="10"
         class="stat-bar">███████░░</div>
  </div>
</div>

<!-- Inventory panel -->
<div data-test-id="inventory-panel"
     role="region"
     aria-label="Inventory items">
  <!-- Inventory items -->
</div>
```

### Screen Reader Support

```html
<!-- Hidden text for screen readers -->
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

<!-- Usage -->
<button>
  Continue
  <span class="sr-only">to Scene 42</span>
</button>
```

---

## Animation & Transitions

### Transition Timing

```css
/* DOS-style transitions - slightly slower for retro feel */
--transition-fast:   150ms ease;   /* Hover states */
--transition-normal: 300ms ease;   /* Panel slides, fades */
--transition-slow:   500ms ease;   /* Scene transitions */
```

### Scene Transitions

```css
/* Fade out → text update → fade in */
@keyframes scene-transition {
  0% { opacity: 1; }
  50% { opacity: 0; }
    /* Text swap happens here via JS */
  100% { opacity: 1; }
}

.text-viewport.transitioning {
  animation: scene-transition var(--transition-slow);
}
```

### Panel Slide (Inventory Toggle)

```css
/* Slide in from right */
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.inventory-panel.open {
  animation: slide-in-right var(--transition-normal);
}
```

### Choice Selection

```css
/* Flash on selection */
@keyframes choice-flash {
  0% { background: var(--bg-highlight); }
  50% { background: var(--text-accent); color: var(--bg-primary); }
  100% { background: var(--bg-highlight); }
}

.choice-button.selected {
  animation: choice-flash 200ms ease;
}
```

---

## Test Mode Variants

For QA testing (per agent-e requirements), enable high-visibility focus indicators:

```css
/* Test mode - activate via body.test-mode class */
body.test-mode .choice-button:focus-visible::after {
  content: "[FOCUSED: " attr(data-choice-index) "]";
  position: absolute;
  top: -24px;
  right: 4px;
  font-size: 12px;
  color: var(--border-focus);
  background: var(--bg-primary);
  padding: 2px 4px;
}

body.test-mode .stat-bar::before {
  content: "[" attr(aria-valuenow) "/" attr(aria-valuemax) "]";
  font-size: 12px;
  color: var(--text-secondary);
}
```

---

## Implementation Notes

### Font Loading

```html
<!-- Preload for performance -->
<link rel="preload" href="https://fonts.gstatic.com/s/vt323/v15/pxiKyp0ihN8qnMr.woff2"
      as="font" type="font/woff2" crossorigin>

<!-- Load VT323 -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=VT323&display=swap">
```

### CSS Variables (Full Reference)

```css
:root {
  /* Colors - Backgrounds */
  --bg-primary: #000000;
  --bg-secondary: #1a1a2e;
  --bg-tertiary: #16213e;
  --bg-highlight: #0f3460;

  /* Colors - Text */
  --text-primary: #e8e8e8;
  --text-secondary: #a0a0a0;
  --text-accent: #ffd700;
  --text-danger: #ff4757;
  --text-info: #5dade2;

  /* Colors - Borders */
  --border-primary: #4a4a4a;
  --border-accent: #ffd700;
  --border-dim: #2a2a2a;
  --border-focus: #ffff00;

  /* Colors - Factions */
  --faction-preservationist: #ffd700;
  --faction-revisor: #ff4757;
  --faction-neutral: #e8e8e8;

  /* Typography */
  --font-xs:   16px;
  --font-sm:   20px;
  --font-base: 24px;
  --font-lg:   32px;
  --font-xl:   48px;
  --font-2xl:  64px;
  --font-normal: 400;
  --font-bold: 700;

  /* Spacing */
  --space-1:  8px;
  --space-2:  16px;
  --space-3:  24px;
  --space-4:  32px;
  --space-5:  48px;
  --space-6:  64px;

  /* Transitions */
  --transition-fast:   150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow:   500ms ease;
}
```

---

## Related Documentation

- **Engine RFC**: `docs/rfcs/2024-12-29-engine-core-architecture.md` — State change events
- **Content Manifest**: `content/manifest.json` — Scene structure and IDs
- **Scene Conventions**: `docs/SCENE_ID_CONVENTIONS.md` — Scene ID format
- **Test Playthroughs**: `docs/TEST_PLAYTHROUGHS.md` — QA validation scenarios

---

**Version History:**
- v1.0 (2025-12-29) — Initial DOS aesthetic system definition
