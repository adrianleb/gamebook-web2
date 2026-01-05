# Phase 11 DOS-Era Styling QA Checklist

**Intent #392 Item 14**: Manual QA checklist for DOS-era styling validation (monospace fonts, CGA/EGA palette, step easing animations).

## Purpose

This checklist validates the Phase 11 presentation enhancements maintain DOS-era aesthetic consistency per `STYLE_GUIDE.md`.

## Test Environment Setup

1. Open the game in a browser
2. Open browser DevTools (F12)
3. Enable responsive design mode
4. Set viewport to test size (see Mobile Viewport Tests below)

---

## 1. Typography (Monospace Fonts)

### Quest Completion Toasts
- [ ] Font is VT323 or similar monospace
- [ ] Font size is legible (minimum 14px on desktop, 12px on mobile)
- [ ] Text has terminal-style appearance (no anti-aliasing artifacts)
- [ ] "Quest Complete" title renders correctly
- [ ] Flag name/message renders correctly

### Faction Change Indicators
- [ ] Floating indicator uses monospace font
- [ ] +/- signs render correctly
- [ ] Faction name is readable
- [ ] Numbers are monospace-aligned

### Item Acquisition Toasts
- [ ] Item name uses monospace font
- [ ] Quantity badge (xN) uses monospace
- [ ] Emojis (📦, ⭐, 🏛️) display correctly

---

## 2. Color Palette (CGA/EGA Style)

### Quest Completion Toasts
- [ ] Background uses DOS-era colors (not gradients)
- [ ] Text has terminal-like contrast (high contrast)
- [ ] Border color is sharp (no blur effects)
- [ ] Star emoji (⭐) is visible and appropriately sized

### Faction Change Indicators
- [ ] Positive changes use gold/amber color (#ffd700)
- [ ] Negative changes use red color (#ff4757)
- [ ] Colors are flat (no gradients)

### Item Acquisition Toasts
- [ ] Icon color matches category (see `CATEGORY_COLORS` in game-renderer.ts)
- [ ] Text has high contrast against background

### General
- [ ] No shadow effects (or sharp terminal-style shadows only)
- [ ] No blur/backdrop-filter effects
- [ ] No gradient backgrounds
- [ ] Colors are from CGA/EGA palette era

---

## 3. Border and Spacing (DOS UI Style)

### All Notification Types
- [ ] Borders have sharp corners (no border-radius)
- [ ] Border width is 1px or 2px (no thin hairline borders)
- [ ] Borders use solid line style
- [ ] Padding is uniform (8px or multiples thereof)
- [ ] Margins follow grid system (4px base unit)

### Container
- [ ] Notification container positioned correctly (top-right or top-center)
- [ ] Notifications stack vertically with consistent gap
- [ ] Max-width constraint prevents overflow on wide screens

---

## 4. Animations (Step Easing)

### Slide-in Animation
- [ ] Notifications slide in from right edge
- [ ] Animation uses step easing (not smooth/linear)
- [ ] Duration is ~300ms (not too slow, not too fast)
- [ ] Respects `prefers-reduced-motion` media query

### Dismiss Animation
- [ ] Dismissed notifications fade/slide out smoothly
- [ ] Duration is ~300ms
- [ ] No bounce or elastic effects

### Floating Indicators
- [ ] Faction change indicators float upward from stats panel
- [ ] Animation uses step easing
- [ ] Duration is ~2000ms before auto-removal
- [ ] Fades out at end

---

## 5. Iconography

### Quest Completion
- [ ] Star emoji (⭐) displays correctly across platforms
- [ ] Icon size is proportional to text (16px-24px)
- [ ] Icon is vertically centered with text

### Faction Changes
- [ ] Building emoji (🏛️) displays correctly
- [ ] Icon is appropriately sized

### Item Acquisition
- [ ] Package emoji (📦) displays correctly
- [ ] Category icons display correctly when available
- [ ] Fallback colored box displays for missing icons

---

## 6. Accessibility (A11y)

### ARIA Attributes
- [ ] Notifications have `role="status"`
- [ ] Notifications have `aria-live="polite"`
- [ ] Dismiss buttons have `aria-label="Dismiss notification"`
- [ ] Icons have appropriate aria labels or are decorative

### Keyboard Navigation
- [ ] Dismiss buttons are keyboard accessible (Tab key)
- [ ] Enter/Space activates dismiss button
- [ ] Focus indicator is visible

### Screen Reader Compatibility
- [ ] Quest name is announced correctly
- [ ] Faction change direction (+/-) is announced
- [ ] Item name and quantity are announced
- [ ] "Dismiss" action is announced

### Color Contrast
- [ ] Text-to-background contrast ratio meets WCAG AA (4.5:1)
- [ ] Icon colors have sufficient contrast
- [ ] Error states use high contrast colors

---

## 7. Responsive Behavior

### Desktop (> 768px)
- [ ] Notifications positioned top-right or top-center
- [ ] Max-width is appropriate (~400px)
- [ ] Text is comfortably readable

### Tablet (768px - 414px)
- [ ] Notifications scale appropriately
- [ ] No horizontal overflow
- [ ] Text remains legible

### Mobile (< 414px)
- [ ] Full-width notifications on smallest screens
- [ ] Text size adjusts for readability
- [ ] Icons remain visible
- [ ] Dismiss button is tappable (min 44x44px)

---

## 8. Edge Cases

### Long Quest Names
- [ ] Quest names longer than container width wrap or truncate
- [ ] No text overflow
- [ ] No horizontal scrolling

### Large Quantities
- [ ] Item quantities > 99 display as "99+"
- [ ] Badge doesn't break layout

### Rapid Notifications
- [ ] 10+ concurrent notifications display correctly
- [ ] Queue eviction is smooth (no flickering)
- [ ] Oldest notifications are removed first

### Empty States
- [ ] No error when queue is empty
- [ ] Container remains functional

---

## 9. Performance

### Render Performance
- [ ] Notification appearance doesn't block main thread (> 100ms)
- [ ] Animations run at 60fps
- [ ] No layout thrashing

### Memory Leaks
- [ ] Destroy/cleanup removes all DOM elements
- [ ] No orphaned event listeners
- [ ] Timer cleanup is complete

---

## 10. Integration Testing

### Quest Completion Scenes
- [ ] Test with actual quest completion (sc_2_2_031-034)
- [ ] Flag detection works correctly
- [ ] Notification appears at right time

### Faction Changes
- [ ] Test with actual faction modifications
- [ ] Positive changes show gold indicators
- [ ] Negative changes show red indicators
- [ ] Floating indicators originate from stats panel

### Item Acquisition
- [ ] Test with actual add-item effects
- [ ] Single item shows correctly
- [ ] Multiple items show quantity badge
- [ ] First item acquisition triggers notification

---

## Browser Compatibility

### Chrome/Edge (Chromium)
- [ ] All styles render correctly
- [ ] Animations are smooth

### Firefox
- [ ] All styles render correctly
- [ ] Animations are smooth

### Safari (WebKit)
- [ ] All styles render correctly
- [ ] Emoji font fallback works
- [ ] Animations are smooth

### Mobile Browsers
- [ ] iOS Safari: Works correctly
- [ ] Android Chrome: Works correctly
- [ ] Touch targets are appropriately sized

---

## Sign-off

**Tester**: ___________________
**Date**: ___________________
**Browser/Version**: ___________________
**Viewport Sizes Tested**: ___________________
**Issues Found**: ___________________
**Overall Pass/Fail**: ___________________

---

## Notes

Use this space to record any issues found during testing:

1. _______________________________________________________________
2. _______________________________________________________________
3. _______________________________________________________________
4. _______________________________________________________________
5. _______________________________________________________________
