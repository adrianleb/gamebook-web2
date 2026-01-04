# DOS Asset Standards for Phase 12 (Audio & Visual Polish)

**Project:** The Understage — Gamebook Web Adaptation
**Version:** 1.0
**Last Updated:** 2026-01-04
**Owner:** agent-d (Presentation Lens)
**Intent:** [agent-d] Issue #302

---

## Design Philosophy: Authentic DOS Aesthetics

**Permit Direction:** "fuck WCAG 2.1 AA compliance, we want authentic dos"

This document defines asset standards that prioritize **period-authentic DOS aesthetics** (1990-1995 era) over modern web accessibility guidelines. The goal is to recreate the genuine experience of playing a DOS-era adventure game like Monkey Island, Full Throttle, or Day of the Tentacle.

### Core Principle: Aesthetic Authenticity First

- **DOS-era visual fidelity** takes precedence over WCAG compliance
- CRT effects (scanlines, chromatic aberration, phosphor glow) are enabled by default
- Low contrast, limited color palettes, and pixelated aesthetics are intentional features
- Audio uses 8-bit/11kHz constraints to match Sound Blaster-era hardware

### Architectural Boundary (per agent-c)

- **Visual accessibility is a presentation layer concern**, not engine state
- Accessibility preferences stored in **localStorage** (NOT GameState)
- Engine remains pure and deterministic — same inputs → same outputs
- CSS-only solution: toggle between `dos-authentic.css` and optional `modern-accessible.css` (future)

---

## Audio Asset Standards

### DOS-Era Audio Constraints

Per human direction and period authenticity, audio assets should recreate the Sound Blaster 16 / AdLib experience:

| Constraint | Value | Rationale |
|------------|-------|-----------|
| **Format** | OGG Vorbis (primary) / MP3 (fallback) | Web compatibility, modern browser support |
| **Target Era** | 8-bit / 11.025kHz sampling | Sound Blaster 1.5 (1989) authentic fidelity |
| **Bitrate** | 64-96 kbps | Matches DOS-era audio compression |
| **Channels** | Mono (SFX) / Stereo (music) | DOS games primarily mono for SFX |
| **Max File Size (SFX)** | 50 KB per sound effect | Keep total asset budget reasonable |
| **Max File Size (Music)** | 500 KB per track | Background music loops |

### Sound Effect Categories

**Quantity Target:** 50-100 unique SFX for full game experience

| Category | Examples | Count | File Prefix |
|----------|----------|-------|-------------|
| **UI Interactions** | Button click, menu open/close, choice select | 5-8 | `ui_` |
| **Scene Transitions** | Fade in/out, door open, footsteps | 10-15 | `trans_` |
| **Ambience** | Theater hum, backstage creaks, crowd murmur | 10-15 | `amb_` |
| **Item Actions** | Key pickup, prop use, inventory sounds | 8-12 | `item_` |
| **Faction SFX** | Preservationist chime, Revisor buzz | 5-8 | `fact_` |
| **Stat Changes** | Stat increase/decrease jingles | 4-6 | `stat_` |
| **Ending Audio** | Victory fanfare, fail stinger, curtain close | 5-8 | `end_` |

### Music Asset Standards

**Quantity Target:** 8-12 background music tracks for full game

| Track Type | Duration | Loop | Examples |
|------------|----------|------|----------|
| **Main Theme** | 60-90s | Yes | Title screen, main menu |
| **Act 1 Music** | 90-120s | Yes | Backstage exploration theme |
| **Act 2 Music** | 90-120s | Yes | Green Room / Archives tension |
| **Act 3 Music** | 90-120s | Yes | Mainstage confrontation |
| **Ending Themes** | 30-60s | No | 5 unique ending stingers |
| **Menu Music** | 45-60s | Yes | Save/load, settings screens |

### Audio Fidelity Notes

**Authentic DOS Characteristics (intentional):**
- **Limited frequency range**: 11kHz sampling caps high frequencies, creating "muffled" vintage sound
- **8-bit quantization**: 256 amplitude levels introduces audible noise/fuzz
- **Mono SFX**: Most DOS games used mono for sound effects
- **Short loops**: Memory constraints required 60-120s music loops

**Modern Practicality:**
- Use OGG/MP3 for browser compatibility (NOT authentic MOD/8SVX formats)
- Apply post-processing to simulate 8-bit/11kHz constraints (bandlimit, bitcrush)
- Consider procedural generation (see "Future: Procedural DOS Audio" below)

---

## Visual Asset Standards

### DOS-Era Image Constraints

Authentic DOS games (1990-1995) had severe graphical limitations:

| Constraint | Value | Rationale |
|------------|-------|-----------|
| **Resolution** | 320×200 (VGA mode 13h) native, upscaled to fit viewport | DOS VGA standard |
| **Color Depth** | 256-color palette (8-bit VGA) | VGA mode 13h |
| **Aspect Ratio** | 4:3 (stretched pixels on CRT) | CRT non-square pixels |
| **File Format** | PNG (palette-quantized) or WebP (lossless) | Web compatibility |
| **Max File Size** | 200 KB per background | Keep total asset budget reasonable |
| **Dimensions** | 640×480 or 800×600 (2-3x VGA) | Modern displays with retro aesthetic |

### Background Image Standards

**Quantity Target:** 15-20 unique backgrounds for full game

| Scene Type | Examples | Count | File Prefix |
|------------|----------|-------|-------------|
| **Act 1 Locations** | Backstage corridors, dressing rooms, prop storage | 5-8 | `bg_a1_` |
| **Act 2 Locations** | Green Room, Archives aisles, script vault | 4-6 | `bg_a2_` |
| **Act 3 Locations** | Mainstage, wings, audience seating | 4-6 | `bg_a3_` |
| **Ending Screens** | 5 unique ending illustrations | 5 | `bg_end_` |

### Color Palette Standards

Per STYLE_GUIDE.md, maintain the DOS-inspired palette:

```css
/* VGA-inspired 256-color palette subset */
--dos-black: #000000;
--dos-blue: #0000AA;
--dos-green: #00AA00;
--dos-cyan: #00AAAA;
--dos-red: #AA0000;
--dos-magenta: #AA00AA;
--dos-brown: #AA5500;
--dos-light-gray: #AAAAAA;
--dos-dark-gray: #555555;
--dos-light-blue: #5555FF;
--dos-light-green: #55FF55;
--dos-light-cyan: #55FFFF;
--dos-light-red: #FF5555;
--dos-light-magenta: #FF55FF;
--dos-yellow: #FFFF55;
--dos-white: #FFFFFF;
```

**Palette Constraints:**
- Maximum 256 colors per image (VGA mode 13h)
- Dithering allowed for gradient simulation (Floyd-Steinberg)
- Indexed color mode (PNG-8) preferred for authenticity

### CRT Effect Standards

Per STYLE_GUIDE.md v1.1 (Phase 4 Polish), CRT filter enabled by default:

**CRT Visual Effects:**
- **Scanlines**: Horizontal line overlay (1-2px gap, 50% opacity)
- **Chromatic Aberration**: RGB channel offset (1-2px) simulating CRT convergence issues
- **Phosphor Glow**: Subtle text bloom (text-shadow)
- **Border Glow**: Interactive elements get CRT phosphor activation

**CSS Implementation:**
```css
/* Authentic DOS CRT effects (enabled by default per human direction) */
body.crt-enabled {
  /* Scanline overlay */
  background-image: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.15),
    rgba(0, 0, 0, 0.15) 1px,
    transparent 1px,
    transparent 2px
  );

  /* Chromatic aberration on text */
  text-shadow:
    -1px 0 rgba(255, 0, 0, 0.3),
    1px 0 rgba(0, 255, 255, 0.3);
}
```

**Accessibility Note:** Per human direction, CRT effects are ON by default. Future work may add `modern-accessible.css` for players who need WCAG compliance.

---

## Asset File Naming Conventions

### Audio Files

```
audio/sfx/ui_choice_select.ogg
audio/sfx/trans_door_open.ogg
audio/sfx/amb_theater_hum.ogg
audio/sfx/item_key_pickup.ogg
audio/music/main_theme_loop.ogg
audio/music/act1_backstage.ogg
```

### Image Files

```
assets/bg_a1_001_backstage_corridor.png
assets/bg_a2_001_green_room.png
assets/bg_a3_001_mainstage.png
assets/bg_end_901_preservationist.png
```

---

## Licensing Sources

### Free Asset Sources

**Audio:**
| Source | License | Notes |
|--------|---------|-------|
| [Freesound.org](https://freesound.org/) | CC0 / CC-BY | Filter by "8-bit", "retro", "chiptune" tags |
| [OpenGameArt.org](https://opengameart.org/) | CC-BY / GPL | DOS-style SFX packs available |
| [Itch.io](https://itch.io/game-assets/free/tag-sound) | Varies | Search "retro", "DOS", "chiptune" |

**Images:**
| Source | License | Notes |
|--------|---------|-------|
| [OpenGameArt.org](https://opengameart.org/) | CC-BY / GPL | Pixel art backgrounds, sprites |
| [Itch.io](https://itch.io/game-assets/free/tag-2d) | Varies | Search "pixel art", "DOS", "retro" |

### Paid Asset Sources

**Audio:**
| Source | Price Range | Notes |
|--------|-------------|-------|
| [AudioJungle](https://audiojungle.net/) | $1-20 per track | Retro/8-bit music packs |
| [Unity Asset Store](https://assetstore.unity.com/) | $5-50 per pack | Chiptune SFX bundles |

**Images:**
| Source | Price Range | Notes |
|--------|-------------|-------|
| [Itch.io](https://itch.io/game-assets/paid) | $5-30 per pack | Pixel art background sets |

### Licensing Requirements

Per agent-b (Narrative Fidelity lens), assets must:
- **CC0, CC-BY, or GPL-compatible** for free sources
- **Commercial use allowed** (game will be publicly accessible)
- **No attribution required** (CC0 preferred) or minimal attribution (CC-BY acceptable)
- **Document all licenses** in `docs/ASSET_LICENSES.md` (future deliverable)

---

## Future: Procedural DOS Asset Generation

Per human suggestion (issue #302), explore pixel art frameworks for authentic DOS asset generation:

### Potential Frameworks

| Framework | Description | DOS Relevance |
|-----------|-------------|---------------|
| **data-pixel** | Pixel art generation library | Research needed for capabilities |
| **obelisk.js** | Procedural pixel art toolkit | Research needed for capabilities |
| **PixiJS** | 2D WebGL renderer | Can simulate VGA rendering |
| **p5.js** | Creative coding library | Can generate pixel art, 8-bit audio |

### Procedural Audio Generation

| Tool | Description | DOS Relevance |
|------|-------------|---------------|
| **Tone.js** | Web Audio framework | Can synthesize 8-bit/11kHz sounds |
| **AudioWorklet API** | Browser-native audio processing | Implement bitcrusher, bandlimit filters |
| **ScriptProcessorNode** | Real-time audio synthesis | Generate MOD-like chiptune music |

**Phase 12+ Deliverable:** If time allows, implement procedural generation system to create authentic DOS assets without external dependencies.

---

## Total Asset Budget

For the complete 145-scene game:

| Asset Type | Count | Avg Size | Total |
|------------|-------|----------|-------|
| **SFX** | 100 | 30 KB | ~3 MB |
| **Music** | 12 | 300 KB | ~3.6 MB |
| **Backgrounds** | 20 | 150 KB | ~3 MB |
| **UI Assets** | 10 | 20 KB | ~200 KB |
| **TOTAL** | - | - | **~10 MB** |

**Rationale:** ~10 MB total asset budget is reasonable for web delivery in 2026 while maintaining authentic DOS aesthetic constraints.

---

## Implementation Checklist

### Phase 12 Audio & Visual Polish

- [ ] Create `assets/audio/` directory structure
- [ ] Create `assets/images/` directory structure
- [ ] Acquire/license 50-100 SFX files
- [ ] Acquire/license 8-12 music tracks
- [ ] Acquire/license 15-20 background images
- [ ] Apply 8-bit/11kHz post-processing to all audio (bandlimit + bitcrush)
- [ ] Quantize all images to 256-color VGA palette
- [ ] Implement procedural generation system (if time allows)
- [ ] Create `docs/ASSET_LICENSES.md` documenting all sources
- [ ] Update `src/ui/audio-manager.ts` with new SFX references
- [ ] Update CSS for background image display per scene
- [ ] Test all assets for loading performance
- [ ] Verify total asset budget under 10 MB

---

## Related Documentation

- **STYLE_GUIDE.md** — DOS/LucasArts UI aesthetic system
- **MILESTONES.md** — Phase 12 roadmap (future phase)
- **Issue #302** — [agent-d] Intent tracking for this deliverable

---

## Version History

- v1.0 (2026-01-04) — Initial DOS asset standards for Phase 12, prioritizing authentic DOS aesthetics per human direction
