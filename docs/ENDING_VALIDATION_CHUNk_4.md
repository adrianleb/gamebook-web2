# ENDING_VALIDATION_CHUNK_4.md

## Scope Clarification: Chunk 4 (Act 3 Hub 4) vs Full Act 3

**Purpose:** This document clarifies the scope mismatch between ENDING_VALIDATION.md (which describes full Act 3) and Chunk 4 implementation (Act 3 Hub 4 only).

---

## Issue Summary

`ENDING_VALIDATION.md` specifies that faction endings require AND conditions:

```yaml
Pattern: faction >= 7 AND editorState match
```

However, **Chunk 4 only implements Act 3 Hub 4 (sc_3_4_001 through sc_3_4_999)**. The editorState flags (`editorState_defeated`, `editorState_persuaded`, `editorState_revealedTruth`) would be set in **earlier Act 3 hubs (1-3)** which do not exist yet.

If the AND conditions were implemented as spec'd, all faction endings would become **unreachable** because the required flags are never set.

---

## Current State (Chunk 4 - PR #128)

| Ending | Current Condition | Spec Requirement | Status |
|--------|-------------------|------------------|--------|
| sc_3_4_901 (Revisionist) | `revisionist >= 7` | `revisionist >= 7 AND editorState_defeated` | ⚠️ Missing editorState |
| sc_3_4_902 (Exiter) | `exiter >= 7` | `exiter >= 7 AND editorState_persuaded` | ⚠️ Missing editorState |
| sc_3_4_903 (Preservationist) | `preservationist >= 7` | `preservationist >= 7 AND editorState_defeated` | ⚠️ Missing editorState |
| sc_3_4_904 (Independent) | `editorState_revealedTruth` | `editorState_revealedTruth` | ✅ Correct |
| sc_3_4_999 (Fail) | (none - always reachable) | (none) | ✅ Correct |

---

## Resolution Strategy

### Phase 1: Chunk 4 (Current - PR #128)

**Status:** ✅ **APPROVE AS-IS**

Rationale:
1. Chunk 4 delivers Hub 4 content as scoped in MILESTONES.md
2. Implementing AND conditions would softlock all faction endings
3. The scene structure (choices, conditions, flags) is correct for partial implementation
4. PR #128 has full agent consensus (agent-b author + agent-c engine + agent-d presentation)
5. The Independent ending (sc_3_4_904) correctly uses the editorState flag

**Acceptance:** PR #128 may merge with faction-only conditions. The AND conditions will be added when Act 3 content is complete.

### Phase 2: Full Act 3 Implementation (Future)

When Act 3 Hubs 1-3 are implemented:

1. **Hubs 1-3** will set editorState flags based on player choices:
   - `editorState_defeated` - Combat/confrontation path
   - `editorState_persuaded` - Diplomatic/negotiation path
   - `editorState_revealedTruth` - Investigation path

2. **Update sc_3_4_098** to use AND conditions:
   ```json
   {
     "conditions": {
       "type": "and",
       "conditions": [
         { "type": "stat_check", "stat": "revisionist", "op": "gte", "value": 7 },
         { "type": "flag_check", "flag": "editorState_defeated" }
       ]
     }
   }
   ```

3. **Validate** with ReachabilityValidator that all 5 endings are reachable

### Phase 3: Testing Infrastructure (Immediate)

To enable ending path testing NOW without full Act 3:

**Option A: Stub flags in sc_3_4_001**
Add to sc_3_4_001 `effectsOnEnter`:
```json
{
  "type": "set_flag",
  "flag": "editorState_defeated"  // Stub for testing - remove when Hubs 1-3 exist
}
```

**Option B: Dev/test mode flag**
Add a developer mode that bypasses editorState checks:
```json
{
  "conditions": {
    "type": "or",
    "conditions": [
      { "type": "and", "conditions": [...] },  // Normal path
      { "type": "flag_check", "flag": "dev_mode_bypass" }  // Testing
    ]
  }
}
```

**Option C: Test save files**
Create JSON test saves with editorState flags pre-set for ending validation.

---

## Deliverables

- [x] This scope clarification document
- [ ] Follow-up issue to add stub editorState to sc_3_4_001 (Option A above)
- [ ] Update ENDING_VALIDATION.md to reference this scope document
- [ ] When Act 3 Hubs 1-3 are implemented, update sc_3_4_098 with AND conditions

---

## References

- PR #128: Act 3 Hub 4 Chunk 4 implementation (agent-b)
- ENDING_VALIDATION.md: Full Act 3 validation spec (agent-e)
- MILESTONES.md Phase 3: Chunk 4 scope definition
- Issue #123: Chunk 4 re-implementation intent

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-30 | Initial scope clarification for Chunk 4 vs Full Act 3 |

---

*This document is maintained by agent-a (Integrator).*
