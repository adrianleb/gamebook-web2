#!/usr/bin/env node
/**
 * Content Validation CLI
 *
 * Validates content files for errors before runtime.
 * Per RFC: Two-tier validation (full at CI/CLI, minimal at runtime)
 * Per agent-b request: JSON Schema vs TypeScript types vs Zod decision
 *
 * Usage:
 *   node scripts/validate-content.js
 *   node scripts/validate-content.js --content-path ./content
 *   node scripts/validate-content.js --fail-on-warnings
 */

import { SceneLoader } from '../src/engine/scene-loader.js';
import { readFileSync } from 'fs';

/**
 * CLI options.
 */
const options = {
  contentPath: process.argv.find(arg => arg.startsWith('--content-path='))?.split('=')[1] || './content',
  failOnWarnings: process.argv.includes('--fail-on-warnings'),
  json: process.argv.includes('--json'),
};

/**
 * ANSI color codes for terminal output.
 */
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

/**
 * Main validation function.
 */
async function validateContent() {
  console.log(`${colors.blue}🔍 Content Validator${colors.reset}`);
  console.log(`Content path: ${options.contentPath}\n`);

  const loader = new SceneLoader({ contentPath: options.contentPath });

  try {
    // Initialize loader (loads manifest)
    await loader.initialize();

    console.log(`${colors.green}✓ Manifest loaded${colors.reset}`);
    console.log(`  Gamebook: ${loader.getGamebookTitle()}`);
    console.log(`  Content version: ${loader.getContentVersion()}`);
    console.log(`  Total scenes: ${loader.getAllSceneIds().length}\n`);

    // Validate all content
    const result = await loader.validateAll();

    // Display results
    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      displayValidationResults(result);
    }

    // Exit with appropriate code
    if (!result.valid) {
      process.exit(1);
    }

    if (result.warnings.length > 0 && options.failOnWarnings) {
      process.exit(1);
    }

    process.exit(0);

  } catch (error) {
    if (options.json) {
      console.log(JSON.stringify({
        valid: false,
        errors: [{ type: 'fatal', message: error.message }],
      }));
    } else {
      console.error(`${colors.red}✗ Fatal error:${colors.reset}`, error.message);
    }
    process.exit(1);
  }
}

/**
 * Display validation results in human-readable format.
 */
function displayValidationResults(result) {
  const { valid, errors, warnings, brokenLinks, missingScenes } = result;

  // Errors
  if (errors.length > 0) {
    console.log(`${colors.red}❌ Errors (${errors.length}):${colors.reset}\n`);

    for (const error of errors) {
      console.log(`  ${colors.red}✗${colors.reset} [${error.type}] ${error.message}`);
      if (error.sceneId) {
        console.log(`    Scene: ${error.sceneId}`);
      }
    }
    console.log('');
  }

  // Broken links
  if (brokenLinks && brokenLinks.length > 0) {
    console.log(`${colors.red}🔗 Broken Links (${brokenLinks.length}):${colors.reset}\n`);

    for (const link of brokenLinks) {
      console.log(`  ${colors.red}✗${colors.reset} "${link.from}" → "${link.to}"`);
    }
    console.log('');
  }

  // Missing scenes
  if (missingScenes && missingScenes.length > 0) {
    console.log(`${colors.red}📄 Missing Scenes (${missingScenes.length}):${colors.reset}\n`);

    for (const sceneId of missingScenes) {
      console.log(`  ${colors.red}✗${colors.reset} ${sceneId}`);
    }
    console.log('');
  }

  // Warnings
  if (warnings.length > 0) {
    console.log(`${colors.yellow}⚠️  Warnings (${warnings.length}):${colors.reset}\n`);

    for (const warning of warnings) {
      console.log(`  ${colors.yellow}⚠${colors.reset} [${warning.type}] ${warning.message}`);
      if (warning.sceneId) {
        console.log(`    Scene: ${warning.sceneId}`);
      }
    }
    console.log('');
  }

  // Summary
  if (valid) {
    console.log(`${colors.green}✅ All validations passed!${colors.reset}`);
    if (warnings.length > 0) {
      console.log(`   ${warnings.length} warning(s) found`);
    }
  } else {
    console.log(`${colors.red}❌ Validation failed${colors.reset}`);
    console.log(`   ${errors.length} error(s), ${warnings.length} warning(s)`);
  }
}

/**
 * Display help message.
 */
function showHelp() {
  console.log(`
Content Validation CLI

Validates gamebook content files for errors and inconsistencies.

Usage:
  node scripts/validate-content.js [options]

Options:
  --content-path=<path>   Path to content directory (default: ./content)
  --fail-on-warnings      Exit with error if warnings are found
  --json                  Output results as JSON
  --help                  Show this help message

Examples:
  node scripts/validate-content.js
  node scripts/validate-content.js --content-path ./content
  node scripts/validate-content.js --fail-on-warnings
  node scripts/validate-content.js --json | jq .

Exit codes:
  0 - Validation passed (no errors)
  1 - Validation failed (errors or warnings with --fail-on-warnings)
`);
}

// Check for help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run validation
validateContent().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
