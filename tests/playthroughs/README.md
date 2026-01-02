# Playthrough Test Scripts

This directory contains automated playthrough test scripts for the headless runner CLI. These scripts validate game mechanics, content integrity, and enable regression testing.

## Test Script Categories

### 1. Vertical Slice Tests (Act 1)
- **pt-vs-001-direct-route.json**: Tests direct path through Act 1 to climax.
- **pt-vs-002-inventory-gated.json**: Validates inventory-based choice gating and disabledHint functionality.
- **pt-vs-003-stat-check-success.json**: Tests successful stat check outcomes.
- **pt-vs-004-stat-check-failure.json**: Tests failed stat check branches and attemptable patterns.
- **pt-vs-005-act1-climax-convergence.json**: Tests Act 1 convergence to sc_1_1_099.

### 2. Ending Tests (Act 3)
- **endings/ending-1-revised-draft.json**: Tests Revisionist faction ending (requires revisionist >= 7).
- **endings/ending-2-open-book.json**: Tests Exiter faction ending (requires exiter >= 7).
- **endings/ending-3-closed-canon.json**: Tests Preservationist faction ending (requires preservationist >= 7).
- **endings/ending-4-blank-page.json**: Tests Independent ending (requires editorState_revealedTruth flag).
- **endings/ending-5-eternal-rehearsal.json**: Tests fail-state ending (no requirements).

### 3. Edge Case Tests
- **pt-edge-001.json**: Tests boundary conditions and edge cases.
- **pt-edge-002.json**: Tests additional edge scenarios.
- **pt-edge-003.json**: Tests complex edge case interactions.

### 4. Save/Load Regression Tests
- **pt-sl-001.json**: Tests save/load round-trip and state serialization.
- **pt-sl-002.json**: Tests save/load with complex state changes.

## Script Schema

Each playthrough script follows the schema defined in `src/engine/headless-schema.json`. Key sections:

```json
{
  "$schema": "../../src/engine/headless-schema.json",
  "meta": {
    "name": "PT-XXX-NNN",
    "description": "Human-readable description",
    "author": "agent-name",
    "version": "1.0"
  },
  "startingState": {
    "flags": [],
    "inventory": [],
    "stats": {
      "script": 2,
      "stage_presence": 2,
      "improv": 2
    },
    "currentScene": "sc_1_0_001"
  },
  "steps": [
    {
      "sequence": 1,
      "action": "choose|checkpoint|save_snapshot|load_snapshot",
      "choiceIndex": 0,
      "expectedScene": "sc_1_0_010",
      "assertions": {
        "flagsSet": [],
        "flagsCleared": [],
        "inventoryContains": [],
        "inventoryExcludes": [],
        "stats": {},
        "visitedCount": {},
        "choicesAvailable": 2
      }
    }
  ],
  "endingCriteria": {
    "sceneId": "sc_1_1_000",
    "flagsRequired": [],
    "inventoryRequired": [],
    "statsRequired": {}
  },
  "softlockDetection": {
    "enabled": true,
    "maxSceneRevisits": 3,
    "maxStepsWithoutProgress": 15,
    "failOnDetection": true
  }
}
```

## Running Tests

### Run a single playthrough:
```bash
node dist/cli/headless-runner.js run --script tests/playthroughs/endings/ending-1-revised-draft.json
```

### Run all playthroughs:
```bash
node dist/cli/headless-runner.js run-all --dir tests/playthroughs/
```

### Run in CI mode:
```bash
node dist/cli/headless-runner.js run-all --dir tests/playthroughs/ --ci --junit-report test-results.xml
```

### Generate coverage report:
```bash
node dist/cli/headless-runner.js coverage --dir tests/playthroughs/
```

## Integration with TEST_PLAYTHROUGHS.md

These JSON scripts correspond to the test scenarios documented in `/docs/TEST_PLAYTHROUGHS.md`:

| TEST_PLAYTHROUGHS.md Section | JSON Script |
|------------------------------|-------------|
| PT-VS-001: Direct Route | pt-vs-001-direct-route.json |
| PT-VS-002: Inventory Gated | pt-vs-002-inventory-gated.json |
| PT-VS-003: Stat Check Success | pt-vs-003-stat-check-success.json |
| PT-VS-004: Stat Check Failure | pt-vs-004-stat-check-failure.json |
| PT-VS-005: Act 1 Climax | pt-vs-005-act1-climax-convergence.json |
| PT-END-001: Revisionist Ending | endings/ending-1-revised-draft.json |
| PT-END-002: Exiter Ending | endings/ending-2-open-book.json |
| PT-END-003: Preservationist Ending | endings/ending-3-closed-canon.json |
| PT-END-004: Independent Ending | endings/ending-4-blank-page.json |
| PT-END-005: Fail Ending | endings/ending-5-eternal-rehearsal.json |
| PT-SL-001/002: Save/Load Regression | pt-sl-001.json, pt-sl-002.json |
| PT-EDGE-001/002/003: Edge Cases | pt-edge-001.json, pt-edge-002.json, pt-edge-003.json |

## Adding New Tests

When adding new test scenarios:

1. Create a new JSON file in this directory (or `endings/` subdirectory for ending tests)
2. Use a descriptive name following the pattern: `pt-{category}-{number}.json` or `ending-{number}-{name}.json`
3. Include the `$schema` reference for validation
4. Include the meta section with name, description, author, and version
5. Define steps with assertions for validation
6. Add softlockDetection configuration
7. Update this README to document the new test
8. Update `/docs/TEST_PLAYTHROUGHS.md` if it's a canonical playthrough path

## Assertion Types

- **flagsSet**: Verifies flags are present in state
- **flagsCleared**: Verifies flags are NOT present in state
- **inventoryContains**: Verifies items are in inventory
- **inventoryExcludes**: Verifies items are NOT in inventory
- **stats**: Verifies exact stat values (uses canonical stats: script, stage_presence, improv)
- **visitedCount**: Verifies scene visit counts (for softlock detection)
- **currentScene**: Verifies current scene ID
- **choicesAvailable**: Verifies minimum number of available choices

## Softlock Detection

Configure softlock detection per playthrough:

- **enabled**: Enable/disable softlock detection (default: true)
- **maxSceneRevisits**: Maximum times a scene can be revisited (default: 3)
- **maxStepsWithoutProgress**: Maximum steps without flag/quest changes (default: 15)
- **exemptScenes**: Array of scene IDs exempt from softlock detection (e.g., hub areas)
- **failOnDetection**: Fail playthrough if softlock detected (default: true for CI)
- **continueOnDetection**: Continue execution after softlock for debugging (default: false)

## CI Integration

These playthrough scripts integrate with CI/CD pipelines:

- Exit code 0: All playthroughs passed
- Exit code 1: One or more playthroughs failed
- Exit code 2: Configuration error (missing files, invalid schema)
- JUnit XML output for test result parsing
- JSON output for result aggregation

## Canonical Stats Note

All tests use the canonical stat system defined in `content/stats.json`:
- **script** (1-4): Player's scriptwriting capability
- **stage_presence** (1-4): Player's stage presence and charisma
- **improv** (1-4): Player's improvisation skill

Legacy stats (health, courage, insight) are no longer used.
