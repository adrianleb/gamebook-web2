# GANG.md — Coordination Contract

## 1. Definition of the Deliverable (what we’re building, definition of done)

### Product
A fully playable, browser-based RPG/adventure game that adapts the linked gamebook (https://github.com/adrianleb/gamebook) into an old-school DOS / LucasArts-style interactive experience (e.g., Full Throttle-era vibes).

### Core Player Experience
- Player can start at the beginning and reach one (or more) valid endings.
- Narrative-forward exploration with choices, inventory, and stateful consequences.
- Old-school DOS presentation: pixel UI, chunky fonts, limited palette, CRT-ish optional filter, point-and-click friendly.

### Must-have Features (Definition of Done)
1. **Complete playthrough**: start → midgame → end state(s), no placeholder scenes.
2. **All gamebook content implemented**: every referenced section/branch/choice is reachable and functional (or explicitly cut with documented rationale + content rewrite; see Guardrails).
3. **State management**: flags, inventory, stats (as required by gamebook), gated choices, and consequence persistence.
4. **Save/Load**:
   - LocalStorage save slots (min 3), autosave on scene transitions.
   - Export/import save as JSON string.
5. **UX parity for completion**:
   - Keyboard + mouse support.
   - Clear feedback for unavailable choices (disabled + hint, not silent failure).
6. **Audio**: at least minimal SFX + background loop(s) consistent with DOS vibe (can be lightweight).
7. **Performance**: loads quickly, runs smoothly on modern desktop browsers.
8. **Quality**: no progress-blocking bugs; no dead ends unless intentionally designed.

### Non-goals (unless later approved)
- Multiplayer, procedural generation, complex combat simulation beyond what the gamebook requires, mobile-first optimization, backend accounts, or large-scale voice acting.

---

## 2. Collaboration Rules (decision ownership by agent name, decision protocol)

### Ownership (by decision type)
- **Integration, release readiness, final merges**: owned by Agent A.
- **Engine/runtime architecture, build tooling, persistence model**: owned by Agent C, reviewed by Agent A.
- **Narrative mapping, content fidelity, branching logic correctness**: owned by Agent B, reviewed by Agent A.
- **UI style system, pixel layout, interaction patterns, accessibility baseline**: owned by Agent D, reviewed by Agent A.
- **Test plans, playthrough validation, balance/softlocks**: owned by Agent E, reviewed by Agent A.

### Decision Protocol
1. Propose via short RFC in a PR description or `/docs/rfcs/YYYY-MM-DD-topic.md`.
2. At least one reviewer must sign off (Agent A required for user-facing changes impacting scope).
3. If conflict:
   - Agent A resolves based on Definition of Done and Guardrails.
   - If tie persists, default to the simplest option that preserves complete playability.

### Communication Norms
- Prefer written, checkable artifacts (issues, tasks, PR checklists) over chatty discussion.
- Every PR must state: What changed, Why, How to test, and any new/updated content IDs.

---

## 3. Workflow: Phases and Cycles (macro phases, micro cycle format)

### Macro Phases
1. **Inception & Mapping**
   - Extract/understand gamebook structure; define canonical content IDs.
   - Agree on minimal RPG systems needed (inventory, stats, checks).
2. **Vertical Slice**
   - Implement engine + UI + 2–3 representative scenes covering: choice, inventory gating, a stat check, and save/load.
3. **Full Content Implementation**
   - Convert all sections into game content format; wire all branches.
4. **Polish & DOS Vibe Pass**
   - UI consistency, typography, audio pass, transitions, CRT toggle.
5. **QA & Release**
   - Full playthrough tests, fix softlocks, finalize builds.

### Micro Cycle (repeat per chunk)
For each chunk (e.g., chapter/region):
1. **Plan**: list scenes + required state variables.
2. **Implement**: content + hooks.
3. **Review**: correctness + style.
4. **Test**: scripted playthrough + save/load.
5. **Merge**: only when checklist passes.

---

## 4. Content Format & Conventions (domain-specific)

### Canonical Content Model
- Every scene/node has a stable ID: `bk_<source>_<number>` or `sc_<chapter>_<slug>`.
- Content stored as data (not hard-coded) to enable fast iteration.

### Scene Schema (baseline)
Each scene should define:
- `id`, `title`, `text` (supports inline markup), `art` (optional), `music`/`sfx` cues (optional)
- `effects`: list of state mutations (flags, inventory add/remove, stat change)
- `choices`: array of choices with:
  - `label`
  - `to` (next scene id)
  - `conditions` (flags/stats/inventory)
  - `onChoose` effects (optional)
  - `disabledHint` (required if conditions exist)

### State Conventions
- Flags: `snake_case` booleans.
- Inventory items: stable IDs + display names; never rely on display text for logic.
- Stats: numeric; define min/max in one place.

### Writing & UI Conventions
- Text style: short paragraphs, strong verbs, occasional flavor; keep choice labels action-oriented.
- Maintain DOS vibe:
  - limited palette, crisp pixel borders, no modern translucency by default.
  - monospace/pixel font; consistent line width.
- Avoid unwinnable states unless the gamebook explicitly includes them; if included, signpost clearly.

---

## 5. Repo Layout

Suggested structure:
- `/src/`
  - `/engine/` (state machine, scene runner, conditions/effects)
  - `/ui/` (DOS layout, components, input handling)
  - `/content/` (compiled content index used by runtime)
  - `/audio/` (music + sfx assets)
  - `/art/` (UI sprites, scene art)
  - `main.ts(x)`
- `/content/`
  - `/scenes/` (source scene JSON/YAML)
  - `manifest.json` (scene list, starting scene, endings)
  - `items.json`, `stats.json`
- `/docs/`
  - `GAME_DESIGN.md` (systems overview)
  - `STYLE_GUIDE.md` (DOS UI rules)
  - `TEST_PLAYTHROUGHS.md` (paths + expected outcomes)
  - `/rfcs/`
- `/scripts/` (conversion tools, validators)
- `/tests/` (unit tests for engine, validators)

---

## 6. QA & Validation Checklist

### Content Integrity
- [ ] Every scene ID referenced by a choice exists.
- [ ] Every scene is reachable or explicitly tagged `unreachable` with justification.
- [ ] No choice creates a null state (missing `to`, missing conditions schema, etc.).

### Playability
- [ ] Complete run from start to at least one ending without console errors.
- [ ] Save/load works across key milestones; export/import works.
- [ ] No softlocks (no available choices) unless it is an intentional ending.

### Rules Correctness
- [ ] Inventory gating works; removing/adding items behaves deterministically.
- [ ] Stat checks are consistent and documented.

### Presentation
- [ ] UI readable at common resolutions (1280×720 and up).
- [ ] Keyboard navigation: arrows/WSAD (optional), Enter to select, Esc opens menu.
- [ ] Audio does not autoplay in a way blocked by browsers; user gesture starts audio.

### Performance
- [ ] First load under reasonable size; assets optimized.
- [ ] No long blocking operations on transitions.

---

## 7. Kickoff Tasks (initial work per agent)

### Agent A
- Create initial milestone plan (phases + deliverables).
- Add PR template + issue template + definition-of-done checklist.
- Establish branching/ID conventions and lock repo layout.

### Agent B
- Read and map the gamebook structure into a node/choice graph.
- Produce `content/manifest.json` skeleton + list of required state variables.
- Identify endings and any ambiguous branches needing clarification.

### Agent C
- Implement minimal engine prototype: scene loader, state store, condition evaluator, effect applier.
- Implement save/load and content validation script (broken links, unreachable detection baseline).

### Agent D
- Produce DOS UI mock (layout, typography, palette) + component plan.
- Implement first-pass UI shell: main viewport, text panel, choices list, inventory/status panel.

### Agent E
- Draft `docs/TEST_PLAYTHROUGHS.md` with at least 3 critical paths.
- Define QA gates for “vertical slice complete” and “content complete”.

---

## 8. Guardrails (scope control, quality bar)

1. **Completeness over embellishment**: prioritize full start-to-end playability before adding extra art, side quests, or advanced systems.
2. **Data-driven content only**: no hardcoding narrative branches in UI code.
3. **No silent cuts**: if content must be adapted or trimmed, document in `/docs/rfcs/` and update manifest.
4. **One source of truth**: scene IDs and state variables defined centrally; avoid duplicated logic.
5. **Regression-first fixes**: any bug fix that affected playthrough adds a test path note or automated validation.
6. **Keep the DOS vibe consistent**: stylistic changes must align with `STYLE_GUIDE.md`.
