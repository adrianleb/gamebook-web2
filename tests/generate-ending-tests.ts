/**
 * Ending Test Generator - Metadata-driven test generation for ending validation
 *
 * Reads ending definitions from manifest.json and generates playthrough tests
 * for all ending variants (including quality tiers when implemented).
 *
 * Usage:
 *   npm run test:generate-ending-tests
 *   npm run test:validate-ending-feasibility
 *
 * Generated tests are stored in tests/playthroughs/endings/generated/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Types
interface EndingDefinition {
  id: number;
  sceneId: string;
  title: string;
  description: string;
  tier?: string;
  requirements: {
    faction?: string;
    factionLevel?: number;
    flag?: string;
  };
}

interface Manifest {
  endings: EndingDefinition[];
}

interface QualityTierConfig {
  tier: 'perfect' | 'good' | 'other';
  conditions: {
    factionLevel?: number;
    flags?: string[];
    items?: string[];
    allies?: number;
    noCasualties?: boolean;
  };
  description: string;
}

// Quality tier specifications per ending (from COMPREHENSIVE_ROADMAP.md)
// These are FUTURE requirements for v2.0.0 - not yet implemented in v1.0.0
const QUALITY_TIER_CONFIGS: Record<number, QualityTierConfig[]> = {
  // Ending 1: The Revised Draft (Revisionist)
  1: [
    {
      tier: 'perfect',
      conditions: {
        factionLevel: 9,
        flags: ['MAREN_ALLY', 'DIRECTOR_CONFIDANT'],
        allies: 2,
        noCasualties: true
      },
      description: 'Perfect: Max revisionist (9) + both key allies + no sacrifices'
    },
    {
      tier: 'good',
      conditions: { factionLevel: 7 },
      description: 'Good: Standard revisionist ending (>= 7)'
    },
    {
      tier: 'other',
      conditions: { factionLevel: 5 },
      description: 'Other: Low-tier revisionist ending (5-6)'
    }
  ],

  // Ending 2: The Open Book (Exiter)
  2: [
    {
      tier: 'perfect',
      conditions: {
        factionLevel: 9,
        flags: ['CHORUS_ALLY', 'PEACEFUL_RESOLUTION'],
        allies: 1,
        noCasualties: true
      },
      description: 'Perfect: Max exiter (9) + CHORUS ally + peaceful resolution'
    },
    {
      tier: 'good',
      conditions: { factionLevel: 7 },
      description: 'Good: Standard exiter ending (>= 7)'
    },
    {
      tier: 'other',
      conditions: { factionLevel: 5 },
      description: 'Other: Low-tier exiter ending (5-6)'
    }
  ],

  // Ending 3: The Closed Canon (Preservationist)
  3: [
    {
      tier: 'perfect',
      conditions: {
        factionLevel: 9,
        flags: ['COMPLETE_SEAL'],
        allies: 0,
        noCasualties: true
      },
      description: 'Perfect: Max preservationist (9) + complete seal + no casualties'
    },
    {
      tier: 'good',
      conditions: { factionLevel: 7 },
      description: 'Good: Standard preservationist ending (>= 7)'
    },
    {
      tier: 'other',
      conditions: { factionLevel: 5 },
      description: 'Other: Low-tier preservationist ending (5-6)'
    }
  ],

  // Ending 4: The Blank Page (Independent)
  // Note: Independent ending has NO quality tiers - single variant only
  4: [
    {
      tier: 'other', // Independent doesn't have "perfect/good" tiers
      conditions: { flags: ['editorState_revealedTruth'] },
      description: 'Independent: Truth path (no quality tiers)'
    }
  ],

  // Ending 5: The Eternal Rehearsal (Fail/Refusal)
  // Note: Fail ending has NO requirements - always reachable
  5: [
    {
      tier: 'other', // Fail ending has no quality tiers
      conditions: {},
      description: 'Fail: Always reachable (no requirements)'
    }
  ]
};

/**
 * Read and parse manifest.json
 */
function readManifest(): Manifest {
  const manifestPath = path.resolve(process.cwd(), 'content/manifest.json');
  const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  return JSON.parse(manifestContent);
}

/**
 * Generate playthrough test for a single ending variant
 */
function generateEndingTest(
  ending: EndingDefinition,
  tierConfig?: QualityTierConfig
): string {
  const endingId = ending.id;
  const sceneId = ending.sceneId;
  const title = ending.title;

  // Determine test name and tier suffix
  const tierSuffix = tierConfig ? `-${tierConfig.tier}` : '';
  const testName = `PT-END-${String(endingId).padStart(3, '0')}${tierSuffix}`;
  const fileName = `ending-${endingId}${tierSuffix}.json`;

  // Build starting state based on requirements
  const startingState = buildStartingState(ending, tierConfig);

  // Build ending criteria
  const endingCriteria = buildEndingCriteria(ending, tierConfig);

  // Build notes
  const notes = buildNotes(ending, tierConfig);

  // Generate JSON test
  const testJson = {
    $schema: '../../src/engine/headless-schema.json',
    meta: {
      name: testName,
      description: `${title}${tierConfig ? ` (${tierConfig.tier} tier)` : ''} - Tests ${
        tierConfig?.description || ending.description
      }`,
      author: 'agent-e (generated)',
      version: '1.0',
      generated: true,
      sourceEnding: endingId,
      tier: tierConfig?.tier || 'base'
    },
    startingState,
    steps: generateTestSteps(ending, tierConfig),
    endingCriteria,
    softlockDetection: {
      enabled: true,
      maxSceneRevisits: 3,
      failOnDetection: true
    },
    notes
  };

  return JSON.stringify(testJson, null, 2);
}

/**
 * Build starting state for test
 */
function buildStartingState(
  ending: EndingDefinition,
  tierConfig?: QualityTierConfig
) {
  const state: any = {
    flags: ['game_started', 'act1_complete', 'act2_complete', 'mainstage_reached'],
    inventory: [],
    stats: {
      script: 2,
      stage_presence: 2,
      improv: 2
    },
    factions: {
      preservationist: 1,
      revisionist: 1,
      exiter: 1,
      independent: 1
    },
    currentScene: 'sc_3_4_098'
  };

  // Add tier-specific flags
  if (tierConfig?.conditions.flags) {
    state.flags.push(...tierConfig.conditions.flags);
  }

  // Add required faction level
  if (tierConfig?.conditions.factionLevel) {
    const faction = ending.requirements.faction || 'independent';
    state.factions[faction] = tierConfig.conditions.factionLevel;
  } else if (ending.requirements.faction && ending.requirements.factionLevel) {
    state.factions[ending.requirements.faction] = ending.requirements.factionLevel;
  }

  // Independent ending (ending 4) needs balanced factions
  if (ending.id === 4) {
    state.factions = {
      preservationist: 3,
      revisionist: 3,
      exiter: 3,
      independent: 4
    };
  }

  return state;
}

/**
 * Build ending criteria for test
 */
function buildEndingCriteria(
  ending: EndingDefinition,
  tierConfig?: QualityTierConfig
) {
  const criteria: any = {
    sceneId: ending.sceneId,
    flagsRequired: ['game_started', 'act1_complete', 'act2_complete', 'ending_achieved'],
    inventoryRequired: [],
    statsRequired: {
      script: 2,
      stage_presence: 2,
      improv: 2
    },
    factionsRequired: {
      preservationist: 1,
      revisionist: 1,
      exiter: 1,
      independent: 1
    }
  };

  // Add tier-specific flags
  if (tierConfig?.conditions.flags) {
    criteria.flagsRequired.push(...tierConfig.conditions.flags);
  }

  // Add required faction level
  if (tierConfig?.conditions.factionLevel) {
    const faction = ending.requirements.faction || 'independent';
    criteria.factionsRequired[faction] = tierConfig.conditions.factionLevel;
  } else if (ending.requirements.faction && ending.requirements.factionLevel) {
    criteria.factionsRequired[ending.requirements.faction] = ending.requirements.factionLevel;
  }

  // Independent ending (ending 4) needs balanced factions
  if (ending.id === 4) {
    criteria.factionsRequired = {
      preservationist: 3,
      revisionist: 3,
      exiter: 3,
      independent: 4
    };
  }

  return criteria;
}

/**
 * Generate test steps
 */
function generateTestSteps(ending: EndingDefinition, tierConfig?: QualityTierConfig) {
  const choiceLabel = ending.title;
  const factionReason = ending.requirements.faction
    ? `${ending.requirements.faction} >= ${tierConfig?.conditions.factionLevel || ending.requirements.factionLevel}`
    : ending.requirements.flag
    ? `flag: ${ending.requirements.flag}`
    : 'no requirements';

  return [
    {
      sequence: 1,
      action: 'checkpoint',
      description: `Arrived at Last Curtain Call with ${tierConfig?.tier || 'base'} ending requirements`,
      assertions: {
        currentScene: 'sc_3_4_098'
      }
    },
    {
      sequence: 2,
      action: 'verify',
      description: `Verify '${choiceLabel}' choice is enabled`,
      assertions: {
        choiceEnabled: choiceLabel,
        reason: factionReason
      }
    },
    {
      sequence: 3,
      action: 'choose',
      choiceLabel,
      description: `Choose ${tierConfig?.tier || ending.requirements.faction || 'independent'} ending path`,
      expectedScene: ending.sceneId,
      checkpoint: true
    },
    {
      sequence: 4,
      action: 'checkpoint',
      description: 'Arrived at ending scene',
      assertions: {
        currentScene: ending.sceneId,
        flagsSet: ['ending_achieved']
      }
    }
  ];
}

/**
 * Build test notes
 */
function buildNotes(ending: EndingDefinition, tierConfig?: QualityTierConfig) {
  const notes: string[] = [];

  if (ending.requirements.faction) {
    notes.push(
      `Faction gate: ${ending.requirements.faction} >= ${
        tierConfig?.conditions.factionLevel || ending.requirements.factionLevel
      } required for this ending`
    );
  }

  if (ending.requirements.flag) {
    notes.push(`Flag gate: ${ending.requirements.flag} required for this ending`);
  }

  if (tierConfig?.conditions.flags) {
    notes.push(
      `Additional flags required: ${tierConfig.conditions.flags.join(', ')}`
    );
  }

  if (tierConfig?.conditions.noCasualties) {
    notes.push('Perfect tier requirement: No NPC sacrifices (SACRIFICED_* flags not set)');
  }

  if (tierConfig?.conditions.allies !== undefined) {
    notes.push(`Perfect tier requirement: ${tierConfig.conditions.allies} or more allies`);
  }

  notes.push('Ending 5 (The Eternal Rehearsal) must always be available as fallback');

  if (tierConfig) {
    notes.push(`Quality tier: ${tierConfig.tier.toUpperCase()} - ${tierConfig.description}`);
  }

  return notes;
}

/**
 * Validate mathematical feasibility of quality tier requirements
 */
function validateTierFeasibility(
  endingId: number,
  tierConfig: QualityTierConfig
): { feasible: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check 1: Faction level within stat cap (0-10)
  if (
    tierConfig.conditions.factionLevel &&
    tierConfig.conditions.factionLevel > 10
  ) {
    issues.push(
      `Faction level ${tierConfig.conditions.factionLevel} exceeds stat cap of 10`
    );
  }

  // Check 2: Mutually exclusive flags
  if (tierConfig.conditions.noCasualties && tierConfig.conditions.flags) {
    // Check if any flag implies a sacrifice
    const sacrificeFlags = tierConfig.conditions.flags.filter((f) =>
      f.includes('SACRIFICED')
    );
    if (sacrificeFlags.length > 0) {
      issues.push(
        `Mutually exclusive: Tier requires noCasualties=true but has SACRIFICED_* flags: ${sacrificeFlags.join(
          ', '
        )}`
      );
    }
  }

  // Check 3: Independent ending (4) and Fail ending (5) don't have quality tiers
  if ((endingId === 4 || endingId === 5) && tierConfig.tier !== 'other') {
    issues.push(
      `Ending ${endingId} does not support quality tiers - only single variant exists`
    );
  }

  // Check 4: Perfect tier requirements are significantly harder than Good tier
  if (
    tierConfig.tier === 'perfect' &&
    tierConfig.conditions.factionLevel &&
    tierConfig.conditions.factionLevel <= 7
  ) {
    issues.push(
      `Perfect tier faction level (${tierConfig.conditions.factionLevel}) is not higher than Good tier requirement (7)`
    );
  }

  return {
    feasible: issues.length === 0,
    issues
  };
}

/**
 * Main generation function
 */
function generateAllTests(): void {
  console.log('🧪 Generating ending playthrough tests from manifest.json...\n');

  const manifest = readManifest();
  const generatedDir = path.resolve(
    process.cwd(),
    'tests/playthroughs/endings/generated'
  );

  // Ensure output directory exists
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
  }

  let totalTests = 0;
  let feasibilityIssues: string[] = [];

  // Generate tests for each ending
  for (const ending of manifest.endings) {
    console.log(`\n📝 Ending ${ending.id}: ${ending.title}`);

    // Check if this ending has quality tier configs
    const tierConfigs = QUALITY_TIER_CONFIGS[ending.id];

    if (!tierConfigs) {
      console.log(`  ⚠️  No quality tier config found for ending ${ending.id}`);
      continue;
    }

    // Generate test for each tier
    for (const tierConfig of tierConfigs) {
      console.log(`  └─ Tier: ${tierConfig.tier.toUpperCase()}`);

      // Validate feasibility
      const validation = validateTierFeasibility(ending.id, tierConfig);
      if (!validation.feasible) {
        console.log(`    ❌ Feasibility issues:`);
        for (const issue of validation.issues) {
          console.log(`       - ${issue}`);
          feasibilityIssues.push(
            `Ending ${ending.id} (${tierConfig.tier}): ${issue}`
          );
        }
      } else {
        console.log(`    ✅ Mathematically feasible`);
      }

      // Generate test
      const testJson = generateEndingTest(ending, tierConfig);
      const fileName = `ending-${ending.id}-${tierConfig.tier}.json`;
      const filePath = path.join(generatedDir, fileName);

      fs.writeFileSync(filePath, testJson);
      console.log(`    📄 Generated: ${fileName}`);
      totalTests++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(`✅ Generated ${totalTests} ending playthrough tests`);
  console.log(`📁 Output directory: ${generatedDir}`);

  if (feasibilityIssues.length > 0) {
    console.log('\n⚠️  FEASIBILITY ISSUES FOUND:');
    for (const issue of feasibilityIssues) {
      console.log(`  - ${issue}`);
    }
    console.log(
      '\n⚠️  These issues should be resolved before implementing quality tiers in v2.0.0'
    );
    process.exit(1);
  } else {
    console.log('\n✅ All quality tier requirements are mathematically feasible');
  }

  console.log('='.repeat(60));
}

// Run generation if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllTests();
}

export { generateAllTests, validateTierFeasibility, QUALITY_TIER_CONFIGS };
