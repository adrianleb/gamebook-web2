# Scene ID Conventions
> Canonical scene identification scheme for The Understage gamebook adaptation.

## Overview

This document defines the stable scene ID system used across the entire gamebook adaptation. Scene IDs are assigned sequentially within act/hub ranges to support:
- Content validation (broken link detection)
- Save/load state tracking
- Implementation status tracking
- Cross-referencing between content and test documents

## ID Format

### Structure
```
sc_<ACT>_<HUB>_<SEQUENTIAL>
```

### Components
| Component | Values | Example |
|-----------|--------|---------|
| `sc` | Fixed prefix for "scene" | `sc` |
| `<ACT>` | Act number: `1`, `2`, `3` | `1` |
| `<HUB>` | Hub number within act: `1`, `2`, `3` (or `0` for pre-hub/intro) | `1` |
| `<SEQUENTIAL>` | Zero-padded 3-digit number within hub | `001` |

### Example IDs
| ID | Location |
|----|----------|
| `sc_1_0_001` | Act 1, Intro (The Prompter's Booth opening) |
| `sc_1_1_015` | Act 1, Hub 1, scene 15 |
| `sc_2_2_003` | Act 2, Hub 2 (The Green Room), scene 3 |
| `sc_2_3_042` | Act 2, Hub 3 (The Archives), scene 42 |
| `sc_3_4_001` | Act 3, Hub 4 (The Mainstage), opening |
| `sc_3_4_999` | Act 3, ending scene |

## Scene ID Ranges

### Act 1: The Breach (25-35 estimated nodes)
| Hub | ID Range | Location | Node Count (est) |
|------|----------|----------|------------------|
| Hub 0 | `sc_1_0_001` - `sc_1_0_050` | Intro / Pre-hub discovery | 5-8 |
| Hub 1 | `sc_1_1_001` - `sc_1_1_050` | The Prompter's Booth | 20-27 |

### Act 2: The Descent (50-70 estimated nodes)
| Hub | ID Range | Location | Node Count (est) |
|------|----------|----------|------------------|
| Hub 2 | `sc_2_2_001` - `sc_2_2_099` | The Green Room | 25-35 |
| Hub 3 | `sc_2_3_001` - `sc_2_3_099` | The Archives | 25-35 |

### Act 3: The Final Act (30-40 estimated nodes)
| Hub | ID Range | Location | Node Count (est) |
|------|----------|----------|------------------|
| Hub 4 | `sc_3_4_001` - `sc_3_4_099` | The Mainstage | 30-40 |

### Special Ranges
| Range | Purpose |
|-------|---------|
| `sc_X_X_000` | Reserved (not used) |
| `sc_X_X_900` - `sc_X_X_999` | Ending scenes |
| `sc_X_X_998` | Generic "death" ending (if applicable) |
| `sc_X_X_999` | Eternal Rehearsal (ambiguous ending) |

## Ending Scene IDs

Based on OUTLINE.md, the five endings have dedicated IDs:

| Ending | Scene ID | Title | Faction Requirement |
|--------|----------|-------|---------------------|
| 1 | `sc_3_4_901` | The Revised Draft | Revisionist 7+ |
| 2 | `sc_3_4_902` | The Open Book | Exiter 7+ |
| 3 | `sc_3_4_903` | The Closed Canon | Preservationist 7+ |
| 4 | `sc_3_4_904` | The Blank Page | Independent |
| 5 | `sc_3_4_999` | The Eternal Rehearsal | None (failed/refused choice) |

## Assignment Rules

### Sequential Assignment
Within each hub range, assign IDs sequentially starting from 001:
1. Leave gaps sparingly (only for clear structural divisions)
2. Insert new scenes at next available number
3. Never renumber existing scenes (breaks save compatibility)

### Special Cases
| Case | Convention |
|------|------------|
| Climax scenes | Use next sequential, document as `CLIMAX` in metadata |
| Branch convergence | Continue sequential from each branch; merge scenes get new IDs |
| Retcon/revision | Add new scene, mark old scene `DEPRECATED` in metadata |

## File Naming

### Scene Files
Scene JSON files use the scene ID as filename:
```
content/scenes/sc_1_1_001.json
content/scenes/sc_2_2_042.json
content/scenes/sc_3_4_901.json
```

### Metadata in Scene Files
Each scene file must include:
```json
{
  "id": "sc_1_1_001",
  "title": "The Booth Awakens",
  "act": 1,
  "hub": 1,
  "location": "The Prompter's Booth",
  "implementationStatus": "pending|draft|complete|reviewed"
}
```

## Implementation Status Tracking

The manifest.json tracks implementation status per scene:
- `pending` — Not yet written
- `draft` — First pass, needs review
- `complete` — Ready for testing
- `reviewed` — Passed QA

### Validation
All `to` references in choices must resolve to valid scene IDs. The content validator will:
1. Check every `to` value against known scene IDs
2. Flag references to `pending` scenes as warnings
3. Flag references to non-existent scenes as errors

## Migration from Source Gamebook

The source gamebook (github.com/adrianleb/gamebook) uses `node-XXX.md` format. When converting:

| Source Format | Target Format |
|---------------|---------------|
| `act1/node-001.md` | `content/scenes/sc_1_0_001.json` |
| `act2/node-100.md` | `content/scenes/sc_2_2_001.json` (if first Green Room) |

**Note:** Source node numbers are preserved as comments in scene metadata for traceability:
```json
{
  "id": "sc_2_2_042",
  "sourceNode": "node-142",
  "title": "..."
}
```

## Appendix: Quick Reference

### ID Components by Act
| Act | Hub 0 | Hub 1 | Hub 2 | Hub 3 | Hub 4 |
|-----|-------|-------|-------|-------|-------|
| 1 | `sc_1_0_xxx` | `sc_1_1_xxx` | — | — | — |
| 2 | — | — | `sc_2_2_xxx` | `sc_2_3_xxx` | — |
| 3 | — | — | — | — | `sc_3_4_xxx` |

### Ending IDs (900-series)
| ID | Ending |
|----|--------|
| `sc_3_4_901` | The Revised Draft |
| `sc_3_4_902` | The Open Book |
| `sc_3_4_903` | The Closed Canon |
| `sc_3_4_904` | The Blank Page |
| `sc_3_4_999` | The Eternal Rehearsal |

---

🤖 Generated by **agent-b** agent
