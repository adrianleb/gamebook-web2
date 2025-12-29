# Playthrough Test Scripts

This directory contains automated playthrough test scripts for the headless runner CLI. These scripts validate game mechanics, content integrity, and enable regression testing.

## Test Script Categories

### 1. Content Validation Tests
- **preservationist-early-path.json**: Tests the early Preservationist faction branch with conditional choices and flag tracking.
- **inventory-gating-test.json**: Validates inventory-based choice gating and disabledHint functionality.

### 2. Mechanic Tests
- **stat-boundary-test.json**: Tests stat check boundaries (pass/fail at threshold values).
- **softlock-scenarios.json**: Intentional softlock tests to validate softlock detection.

### 3. Regression Tests
- **save-load-regression.json**: Tests save/load round-trip and state serialization.

## Script Schema

Each playthrough script follows this schema:

```json
{
  "meta": {
    "name": "unique_identifier",
    "description": "Human-readable description",
    "author": "agent-name",
    "version": "1.0"
  },
  "startingState": {
    "flags": [],
    "inventory": [],
    "stats": {},
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
node dist/cli/headless-runner.js run --script test-playthroughs/preservationist-early-path.json
```

### Run all playthroughs:
```bash
node dist/cli/headless-runner.js run-all --dir test-playthroughs/
```

### Run in CI mode:
```bash
node dist/cli/headless-runner.js run-all --dir test-playthroughs/ --ci --junit-report test-results.xml
```

### Generate coverage report:
```bash
node dist/cli/headless-runner.js coverage --dir test-playthroughs/
```

## Integration with TEST_PLAYTHROUGHS.md

These JSON scripts correspond to the test scenarios documented in `/docs/TEST_PLAYTHROUGHS.md`:

| TEST_PLAYTHROUGHS.md Section | JSON Script |
|------------------------------|-------------|
| Preservationist Path - First Branch | preservationist-early-path.json |
| Inventory Gating Tests | inventory-gating-test.json |
| Stat Check Boundaries | stat-boundary-test.json |
| Softlock Detection | softlock-scenarios.json |
| Save/Load Regression Tests | save-load-regression.json |

## Adding New Tests

When adding new test scenarios:

1. Create a new JSON file in this directory
2. Use a descriptive name following the pattern: `{feature}-{test-type}.json`
3. Include the meta section with name, description, author, and version
4. Define steps with assertions for validation
5. Add softlockDetection configuration
6. Update this README to document the new test
7. Update `/docs/TEST_PLAYTHROUGHS.md` if it's a canonical playthrough path

## Assertion Types

- **flagsSet**: Verifies flags are present in state
- **flagsCleared**: Verifies flags are NOT present in state
- **inventoryContains**: Verifies items are in inventory
- **inventoryExcludes**: Verifies items are NOT in inventory
- **stats**: Verifies exact stat values
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
