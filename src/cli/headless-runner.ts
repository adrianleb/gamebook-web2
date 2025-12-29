#!/usr/bin/env node
/**
 * Headless Runner CLI
 *
 * Command-line interface for automated playthrough testing.
 * Supports CI integration with JUnit output and exit codes.
 *
 * Per agent-e and agent-d:
 * - run, run-all, coverage commands
 * - CI mode with --ci flag and JUnit output
 * - Exit codes 0 (success), 1 (failure), 2 (config error)
 * - Text wrapping validation for DOS UI
 *
 * @example
 * ```bash
 * # Run single playthrough
 * node dist/cli/headless-runner.js run --script test.json
 *
 * # Run all playthroughs in CI mode
 * node dist/cli/headless-runner.js run-all --dir tests/playthroughs/ --ci
 *
 * # Generate coverage report
 * node dist/cli/headless-runner.js coverage --dir tests/playthroughs/
 * ```
 */

import { promises as fs } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { HeadlessRunner } from '../engine/headless-runner.js';
import type {
  CliOptions,
  CliCommand,
  PlaythroughScript,
  PlaythroughResult,
  PlaythroughSummary,
} from '../engine/headless-types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * CLI argument parser.
 */
function parseArgs(args: string[]): CliOptions {
  const command = args[0] as CliCommand;

  if (!['run', 'run-all', 'coverage'].includes(command)) {
    console.error(`Unknown command: ${command}`);
    console.error('Valid commands: run, run-all, coverage');
    process.exit(2);
  }

  const options: CliOptions = {
    command,
    contentPath: './content',
    snapshotDir: './test-snapshots',
  };

  // Parse flags
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--script':
        options.script = args[++i];
        break;

      case '--dir':
        options.dir = args[++i];
        break;

      case '--content-path':
        options.contentPath = args[++i];
        break;

      case '--ci':
        options.ci = true;
        break;

      case '--output':
        options.output = args[++i];
        break;

      case '--junit-report':
        options.junitReport = args[++i];
        break;

      case '--snapshot-dir':
        options.snapshotDir = args[++i];
        break;

      case '--verbose':
      case '-v':
        options.verbose = true;
        break;

      case '--validate-text-wrap':
        options.validateTextWrap = true;
        break;

      case '--max-line-length':
        options.maxLineLength = parseInt(args[++i], 10);
        break;

      case '--no-autosave':
        options.noAutosave = true;
        break;

      case '--help':
      case '-h':
        printHelp(command);
        process.exit(0);

      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown flag: ${arg}`);
          process.exit(2);
        }
    }
  }

  return options;
}

/**
 * Print help message.
 */
function printHelp(command?: string): void {
  const help = {
    run: `
Usage: headless-runner run --script <file> [options]

Execute a single playthrough script.

Options:
  --script <file>        Playthrough script JSON file (required)
  --content-path <dir>   Content directory path (default: ./content)
  --snapshot-dir <dir>   Snapshot directory (default: ./test-snapshots)
  --verbose, -v          Verbose output
  --validate-text-wrap   Validate text wrapping (max 80 chars)
  --max-line-length <n>  Max line length for validation (default: 80)
  --no-autosave          Disable autosave during playthrough (per agent-e)

Examples:
  headless-runner run --script test-playthroughs/good_ending.json
  headless-runner run --script test.json --verbose --validate-text-wrap
`,

    'run-all': `
Usage: headless-runner run-all --dir <directory> [options]

Execute all playthrough scripts in a directory.

Options:
  --dir <directory>      Directory containing playthrough scripts (required)
  --content-path <dir>   Content directory path (default: ./content)
  --snapshot-dir <dir>   Snapshot directory (default: ./test-snapshots)
  --ci                   CI mode: non-interactive, exit 1 on failures
  --output <file>        Write JSON results to file
  --junit-report <file>  Write JUnit XML report to file
  --verbose, -v          Verbose output
  --validate-text-wrap   Validate text wrapping (max 80 chars)
  --max-line-length <n>  Max line length for validation (default: 80)
  --no-autosave          Disable autosave during playthroughs (per agent-e)

Exit codes:
  0 - All playthroughs passed
  1 - One or more playthroughs failed
  2 - Configuration error (missing files, invalid schema)

Examples:
  headless-runner run-all --dir test-playthroughs/
  headless-runner run-all --dir tests/ --ci --junit-report test-results.xml
`,

    coverage: `
Usage: headless-runner coverage --dir <directory> [options]

Generate scene coverage report for playthrough scripts.

Options:
  --dir <directory>      Directory containing playthrough scripts (required)
  --content-path <dir>   Content directory path (default: ./content)
  --output <file>        Write coverage report to file (JSON format)

Examples:
  headless-runner coverage --dir test-playthroughs/
  headless-runner coverage --dir tests/ --output coverage-report.json
`,
  };

  if (command && help[command as keyof typeof help]) {
    console.log(help[command as keyof typeof help]);
  } else {
    console.log(`
Headless Runner CLI - Automated Playthrough Testing

Commands:
  run       Execute a single playthrough script
  run-all   Execute all playthrough scripts in a directory
  coverage  Generate scene coverage report

Global options:
  --help, -h  Show this help message

Examples:
  headless-runner run --script test.json
  headless-runner run-all --dir tests/playthroughs/ --ci
  headless-runner coverage --dir tests/playthroughs/

Use 'headless-runner <command> --help' for command-specific help.
`);
  }
}

/**
 * Main CLI entry point.
 */
async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  try {
    switch (options.command) {
      case 'run':
        return await runCommand(options);

      case 'run-all':
        return await runAllCommand(options);

      case 'coverage':
        return await coverageCommand(options);

      default:
        console.error(`Unknown command: ${options.command}`);
        return 2;
    }
  } catch (error) {
    if (options.ci || !options.verbose) {
      console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } else {
      console.error(error);
    }
    return 2;
  }
}

/**
 * Run a single playthrough script.
 */
async function runCommand(options: CliOptions): Promise<number> {
  // Validate required options
  if (!options.script) {
    console.error('Error: --script is required for run command');
    return 2;
  }

  // Load playthrough script
  const scriptPath = resolve(options.script);
  let script: PlaythroughScript;

  try {
    const content = await fs.readFile(scriptPath, 'utf-8');
    script = JSON.parse(content);
  } catch (error) {
    console.error(`Error: Failed to load script: ${options.script}`);
    console.error(error instanceof Error ? error.message : 'Unknown error');
    return 2;
  }

  // Validate script schema
  const schemaErrors = validatePlaythroughSchema(script);
  if (schemaErrors.length > 0) {
    console.error(`Error: Invalid playthrough schema:\n${schemaErrors.join('\n')}`);
    return 2;
  }

  // Create and initialize runner
  const runner = new HeadlessRunner({
    contentPath: options.contentPath,
    snapshotDir: options.snapshotDir,
    disableAutosave: options.noAutosave,
  });

  try {
    await runner.initialize();
  } catch (error) {
    console.error(`Error: Failed to initialize runner: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return 2;
  }

  // Execute playthrough
  logPlaythroughStart(script, options.verbose ?? false);

  const startTime = Date.now();
  const result = await runner.executeScript(script);
  const duration = Date.now() - startTime;

  // Log results
  logPlaythroughResult(result, options.verbose ?? false);

  // Validate text wrapping if requested
  if (options.validateTextWrap) {
    const textWrapErrors = await validateTextWrapping(runner, options.maxLineLength ?? 80);
    if (textWrapErrors.length > 0) {
      console.error(`\nText wrapping validation failed:`);
      for (const error of textWrapErrors) {
        console.error(`  - ${error.scene}: ${error.line} (${error.length} chars)`);
      }
      if (options.ci) {
        return 1;
      }
    } else if (options.verbose) {
      console.log(`\nText wrapping validation passed.`);
    }
  }

  // Return exit code based on status
  if (options.ci) {
    return result.status === 'passed' ? 0 : 1;
  }

  return result.status === 'passed' ? 0 : 1;
}

/**
 * Run all playthrough scripts in a directory.
 */
async function runAllCommand(options: CliOptions): Promise<number> {
  // Validate required options
  if (!options.dir) {
    console.error('Error: --dir is required for run-all command');
    return 2;
  }

  // Find all playthrough scripts
  const scriptsDir = resolve(options.dir);
  let scriptFiles: string[];

  try {
    const entries = await fs.readdir(scriptsDir, { withFileTypes: true });
    scriptFiles = entries
      .filter((e) => e.isFile() && e.name.endsWith('.json'))
      .map((e) => join(scriptsDir, e.name));
  } catch (error) {
    console.error(`Error: Failed to read directory: ${options.dir}`);
    return 2;
  }

  if (scriptFiles.length === 0) {
    console.error(`Error: No playthrough scripts found in ${options.dir}`);
    return 2;
  }

  if (options.verbose) {
    console.log(`Found ${scriptFiles.length} playthrough script(s)\n`);
  }

  // Execute all playthroughs
  const results: PlaythroughResult[] = [];
  const startTime = Date.now();

  for (const scriptFile of scriptFiles) {
    const scriptName = getScriptName(scriptFile);

    if (options.verbose) {
      console.log(`[${results.length + 1}/${scriptFiles.length}] Running: ${scriptName}`);
    }

    let content: string;
    let script: PlaythroughScript;

    try {
      content = await fs.readFile(scriptFile, 'utf-8');
      script = JSON.parse(content);
    } catch (error) {
      console.error(`Error: Failed to load script: ${scriptName}`);
      continue;
    }

    // Validate script schema
    const schemaErrors = validatePlaythroughSchema(script);
    if (schemaErrors.length > 0) {
      console.error(`Error: Invalid playthrough schema in ${scriptName}`);
      continue;
    }

    // Create runner for this playthrough
    const runner = new HeadlessRunner({
      contentPath: options.contentPath,
      snapshotDir: options.snapshotDir,
      disableAutosave: options.noAutosave,
    });

    try {
      await runner.initialize();
      const result = await runner.executeScript(script);
      results.push(result);

      // Log result (compact in CI mode)
      if (options.ci) {
        const icon = result.status === 'passed' ? '✓' : '✗';
        console.log(`${icon} ${scriptName}: ${result.status} (${result.duration}ms)`);
      } else if (options.verbose) {
        logPlaythroughResult(result, true);
      }
    } catch (error) {
      console.error(`Error executing ${scriptName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const totalDuration = Date.now() - startTime;

  // Generate summary
  const summary: PlaythroughSummary = {
    total: results.length,
    passed: results.filter((r) => r.status === 'passed').length,
    failed: results.filter((r) => r.status !== 'passed').length,
    duration: `${totalDuration}ms`,
    results,
  };

  // Log summary
  logSummary(summary, options.ci ?? false);

  // Write JSON output if requested
  if (options.output) {
    await fs.writeFile(options.output, JSON.stringify(summary, null, 2));
    if (options.verbose) {
      console.log(`\nResults written to: ${options.output}`);
    }
  }

  // Write JUnit report if requested
  if (options.junitReport) {
    await writeJUnitReport(options.junitReport, summary);
    if (options.verbose) {
      console.log(`JUnit report written to: ${options.junitReport}`);
    }
  }

  // Return exit code based on results
  if (options.ci) {
    return summary.failed === 0 ? 0 : 1;
  }

  return summary.failed === 0 ? 0 : 1;
}

/**
 * Generate scene coverage report.
 */
async function coverageCommand(options: CliOptions): Promise<number> {
  // Validate required options
  if (!options.dir) {
    console.error('Error: --dir is required for coverage command');
    return 2;
  }

  // Find all playthrough scripts
  const scriptsDir = resolve(options.dir);
  let scriptFiles: string[];

  try {
    const entries = await fs.readdir(scriptsDir, { withFileTypes: true });
    scriptFiles = entries
      .filter((e) => e.isFile() && e.name.endsWith('.json'))
      .map((e) => join(scriptsDir, e.name));
  } catch (error) {
    console.error(`Error: Failed to read directory: ${options.dir}`);
    return 2;
  }

  // Collect visited scenes from all playthroughs
  const visitedScenes = new Set<string>();
  const allScenes = new Set<string>();

  for (const scriptFile of scriptFiles) {
    let content: string;
    let script: PlaythroughScript;

    try {
      content = await fs.readFile(scriptFile, 'utf-8');
      script = JSON.parse(content);
    } catch {
      continue;
    }

    // Extract scene references from steps
    for (const step of script.steps) {
      if (step.action === 'choose' && step.expectedScene) {
        visitedScenes.add(step.expectedScene);
        allScenes.add(step.expectedScene);
      }
    }

    // Add starting scene
    if (script.startingState?.currentScene) {
      visitedScenes.add(script.startingState.currentScene);
      allScenes.add(script.startingState.currentScene);
    }

    // Add ending scene
    if (script.endingCriteria?.sceneId) {
      visitedScenes.add(script.endingCriteria.sceneId);
      allScenes.add(script.endingCriteria.sceneId);
    }
  }

  // Generate coverage report
  const coverage = {
    totalScenes: allScenes.size,
    coveredScenes: visitedScenes.size,
    coveragePercent: allScenes.size > 0
      ? Math.round((visitedScenes.size / allScenes.size) * 100)
      : 0,
    uncoveredScenes: [] as string[],
    // Would need to load manifest to get all scenes
  };

  console.log('\nScene Coverage Report:');
  console.log(`  Total scenes: ${coverage.totalScenes}`);
  console.log(`  Covered: ${coverage.coveredScenes} (${coverage.coveragePercent}%)`);

  if (coverage.coveragePercent < 80) {
    console.log(`  Warning: Coverage below 80%`);
  }

  // Write output if requested
  if (options.output) {
    await fs.writeFile(options.output, JSON.stringify(coverage, null, 2));
    if (options.verbose) {
      console.log(`\nCoverage report written to: ${options.output}`);
    }
  }

  return 0;
}

/**
 * Validate playthrough script schema.
 */
function validatePlaythroughSchema(script: PlaythroughScript): string[] {
  const errors: string[] = [];

  // Check meta
  if (!script.meta || !script.meta.name) {
    errors.push('meta.name is required');
  }

  // Check steps
  if (!script.steps || script.steps.length === 0) {
    errors.push('steps array is required and must not be empty');
  } else {
    // Validate each step
    for (const step of script.steps) {
      if (!step.sequence) {
        errors.push(`step missing sequence number`);
      }
      if (!step.action) {
        errors.push(`step missing action type`);
      }
      if (step.action === 'choose' && (step as any).choiceIndex === undefined) {
        errors.push(`choose step missing choiceIndex`);
      }
    }
  }

  return errors;
}

/**
 * Log playthrough execution start.
 */
function logPlaythroughStart(script: PlaythroughScript, verbose: boolean): void {
  if (!verbose) {
    console.log(`Running: ${script.meta.name}`);
    if (script.meta.description) {
      console.log(`  ${script.meta.description}`);
    }
  } else {
    console.log(`\n=== ${script.meta.name} ===`);
    if (script.meta.description) {
      console.log(`${script.meta.description}\n`);
    }
    console.log(`Starting scene: ${script.startingState?.currentScene || '(default)'}`);
    console.log(`Steps: ${script.steps.length}`);
  }
}

/**
 * Log playthrough execution result.
 */
function logPlaythroughResult(result: PlaythroughResult, verbose: boolean): void {
  const icon = result.status === 'passed' ? '✓' : '✗';

  if (verbose) {
    console.log(`\n${icon} Result: ${result.status.toUpperCase()}`);
    console.log(`  Steps: ${result.steps}`);
    console.log(`  Duration: ${result.duration}ms`);

    if (result.snapshots.length > 0) {
      console.log(`  Snapshots: ${result.snapshots.join(', ')}`);
    }

    if (result.failure) {
      console.log(`\n  Failure at step ${result.failure.step}:`);
      console.log(`    Reason: ${result.failure.reason}`);
      if (result.failure.expected) {
        console.log(`    Expected: ${result.failure.expected}`);
      }
      if (result.failure.actual) {
        console.log(`    Actual: ${result.failure.actual}`);
      }
    }

    if (result.softlock?.softlocked) {
      console.log(`\n  Softlock detected:`);
      console.log(`    Reason: ${result.softlock.reason}`);
      if (result.softlock.sceneId) {
        console.log(`    Scene: ${result.softlock.sceneId}`);
      }
      if (result.softlock.visitCount) {
        console.log(`    Visits: ${result.softlock.visitCount}`);
      }
    }
  } else {
    console.log(`${icon} ${result.playthrough}: ${result.status} (${result.duration}ms)`);
  }
}

/**
 * Log summary of multiple playthroughs.
 */
function logSummary(summary: PlaythroughSummary, ciMode: boolean): void {
  if (ciMode) {
    console.log(`\n=== Summary ===`);
    console.log(`Total: ${summary.total}, Passed: ${summary.passed}, Failed: ${summary.failed}`);
    console.log(`Duration: ${summary.duration}`);
  } else {
    console.log(`\n${summary.passed}/${summary.total} playthroughs passed (${summary.duration})`);
    if (summary.failed > 0) {
      console.log(`\nFailed playthroughs:`);
      for (const result of summary.results) {
        if (result.status !== 'passed') {
          console.log(`  - ${result.playthrough}: ${result.status}`);
          if (result.failure) {
            console.log(`    Step ${result.failure.step}: ${result.failure.reason}`);
          }
        }
      }
    }
  }
}

/**
 * Write JUnit XML report.
 */
async function writeJUnitReport(filepath: string, summary: PlaythroughSummary): Promise<void> {
  const xml = generateJUnitXml(summary);
  await fs.writeFile(filepath, xml);
}

/**
 * Generate JUnit XML from playthrough summary.
 */
function generateJUnitXml(summary: PlaythroughSummary): string {
  const testsuites = summary.results.map((result) => {
    const failure = result.status !== 'passed'
      ? `    <failure message="${result.failure?.reason || result.status}">\n` +
        `      Expected: ${result.failure?.expected || '(none)'}\n` +
        `      Actual: ${result.failure?.actual || '(none)'}\n` +
        `    </failure>`
      : '';

    return `  <testsuite name="${result.playthrough}" tests="1" failures="${result.status !== 'passed' ? 1 : 0}" time="${result.duration / 1000}">
    <testcase name="${result.playthrough}" classname="playthrough" time="${result.duration / 1000}">
${failure}
    </testcase>
  </testsuite>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="playthroughs" tests="${summary.total}" failures="${summary.failed}" time="${parseFloat(summary.duration) / 1000}">
${testsuites}
</testsuites>`;
}

/**
 * Validate text wrapping in current scene.
 * Per agent-d: Check viewport text doesn't exceed DOS line width.
 */
async function validateTextWrapping(
  runner: HeadlessRunner,
  maxLineLength: number
): Promise<Array<{ scene: string; line: string; length: number }>> {
  const errors: Array<{ scene: string; line: string; length: number }> = [];

  const engine = runner.getEngine();
  const scene = engine.getCurrentScene();

  if (!scene) {
    return errors;
  }

  // Check each line in scene text
  const lines = scene.text.split('\n');
  for (const line of lines) {
    // Remove ANSI codes and check length
    const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
    if (cleanLine.length > maxLineLength) {
      errors.push({
        scene: scene.id,
        line: cleanLine.substring(0, 50) + '...',
        length: cleanLine.length,
      });
    }
  }

  return errors;
}

/**
 * Get script name from file path.
 */
function getScriptName(filepath: string): string {
  const basename = filepath.split('/').pop() || filepath;
  return basename.replace('.json', '');
}

// Run CLI
main().then((exitCode) => {
  process.exit(exitCode);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(2);
});
