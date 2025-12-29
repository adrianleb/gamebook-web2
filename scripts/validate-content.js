#!/usr/bin/env node
/**
 * Content Validation Script
 *
 * Validates all gamebook content files against their JSON Schema definitions.
 * Run with: node scripts/validate-content.js
 *
 * Features:
 * - Full JSON Schema validation using ajv
 * - Cross-file reference validation (scene targets exist)
 * - Unreachable scene detection
 * - Missing link detection
 *
 * Updated for canonical schema format (kebab-case, simple field names)
 */

import { readFile, readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'content');
const SCHEMAS_DIR = join(CONTENT_DIR, 'schemas');

// Validation result tracking
const results = {
  passed: true,
  errors: [],
  warnings: [],
  fileCount: 0,
  sceneIndex: new Map(),
  referencedScenes: new Set(),
  missingScenes: new Set(),
  unreachableScenes: new Set()
};

/**
 * Load and parse a JSON file
 */
async function loadJson(path) {
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    results.errors.push(`Failed to load ${path}: ${error.message}`);
    return null;
  }
}

/**
 * Load all schema files
 */
async function loadSchemas() {
  const schemas = {};
  const schemaFiles = [
    'manifest-schema.json',
    'scene-schema.json',
    'items-schema.json',
    'stats-schema.json'
  ];

  for (const file of schemaFiles) {
    const schemaPath = join(SCHEMAS_DIR, file);
    const schema = await loadJson(schemaPath);
    if (schema) {
      const name = file.replace('-schema.json', '');
      schemas[name] = schema;
    }
  }

  return schemas;
}

/**
 * Validate a data file against its schema
 */
function validateAgainstSchema(schema, data, filePath) {
  const ajv = new Ajv({
    allErrors: true,
    verbose: true,
    strict: false
  });

  const validateFn = ajv.compile(schema);
  const valid = validateFn(data);

  if (!valid) {
    results.passed = false;
    for (const error of validateFn.errors) {
      const path = error.instancePath || 'root';
      results.errors.push(`${filePath}:${path} - ${error.message}`);
    }
  }

  return valid;
}

/**
 * Extract scene references from conditions (canonical format)
 * Supports: flag, item, stat, faction, and, or, not
 */
function extractSceneRefsFromConditions(conditions, refs = new Set()) {
  if (!conditions) return refs;

  if (Array.isArray(conditions)) {
    for (const cond of conditions) {
      extractSceneRefsFromConditions(cond, refs);
    }
    return refs;
  }

  // Logical operators (and, or, not) with nested conditions
  if (conditions.type === 'and' || conditions.type === 'or' || conditions.type === 'not') {
    if (conditions.conditions) {
      extractSceneRefsFromConditions(conditions.conditions, refs);
    }
  }

  // Note: canonical schema doesn't have 'visited' condition type
  // If added in future, would check: conditions.type === 'visited' && conditions.sceneId

  return refs;
}

/**
 * Extract scene references from effects (canonical kebab-case format)
 * Supports: set-flag, clear-flag, add-item, remove-item, set-stat, modify-stat, goto, modify-faction
 */
function extractSceneRefsFromEffects(effects, refs = new Set()) {
  if (!effects) return refs;

  const effectArray = Array.isArray(effects) ? effects : [effects];

  for (const effect of effectArray) {
    // Goto scene effect
    if (effect.type === 'goto' && effect.sceneId) {
      refs.add(effect.sceneId);
    }
    // Note: canonical schema doesn't have 'mark-visited' effect type
    // If added in future, would check: effect.type === 'mark-visited' && effect.sceneId
  }

  return refs;
}

/**
 * Collect all scene references from a scene (canonical schema format)
 * Uses 'effects' property (not onEnter/onExit)
 * Uses 'effects' in choices (not onChoose)
 */
function collectSceneReferences(scene) {
  const refs = new Set();

  // Check scene-level effects (canonical format: scene.effects)
  extractSceneRefsFromEffects(scene.effects, refs);

  // Check choices (canonical format: choice.effects)
  if (scene.choices) {
    for (const choice of scene.choices) {
      // Target scene
      if (choice.to) {
        refs.add(choice.to);
      }

      // Choice conditions
      extractSceneRefsFromConditions(choice.conditions, refs);

      // Choice effects
      extractSceneRefsFromEffects(choice.effects, refs);
    }
  }

  return refs;
}

/**
 * Build scene index from manifest (canonical format)
 */
async function buildSceneIndex(manifest) {
  if (!manifest.sceneIndex) return;

  for (const entry of Object.values(manifest.sceneIndex)) {
    results.sceneIndex.set(entry.id, entry);
  }

  // Start scene is always reachable (canonical format: manifest.startingScene)
  if (manifest.startingScene) {
    results.referencedScenes.add(manifest.startingScene);
  }

  // Ending scenes are always reachable
  if (manifest.endings) {
    for (const ending of manifest.endings) {
      if (ending.sceneId) {
        results.referencedScenes.add(ending.sceneId);
      }
    }
  }
}

/**
 * Check cross-file references
 */
async function checkReferences(scenesDir, manifest) {
  if (!results.sceneIndex.size) return;

  // Load all scenes and collect references
  const sceneFiles = await readdir(scenesDir);
  const loadedScenes = new Map();

  for (const file of sceneFiles) {
    if (!file.endsWith('.json')) continue;

    const scenePath = join(scenesDir, file);
    const scene = await loadJson(scenePath);
    if (scene) {
      loadedScenes.set(scene.id, scene);
      const refs = collectSceneReferences(scene);

      for (const ref of refs) {
        results.referencedScenes.add(ref);
      }
    }
  }

  // Find missing scenes
  for (const ref of results.referencedScenes) {
    if (!results.sceneIndex.has(ref) && !loadedScenes.has(ref)) {
      results.missingScenes.add(ref);
      results.passed = false;
    }
  }

  // Find unreachable scenes
  for (const [id, entry] of results.sceneIndex) {
    if (!results.referencedScenes.has(id) && !entry.unreachable) {
      results.unreachableScenes.add(id);
    }
  }

  // Report issues
  if (results.missingScenes.size > 0) {
    results.errors.push(
      `Missing ${results.missingScenes.size} scene(s) referenced by content: ` +
      Array.from(results.missingScenes).join(', ')
    );
  }

  if (results.unreachableScenes.size > 0) {
    results.warnings.push(
      `${results.unreachableScenes.size} unreachable scene(s) (not referenced by any content): ` +
      Array.from(results.unreachableScenes).join(', ')
    );
  }
}

/**
 * Main validation function
 */
async function validate() {
  console.log('🔍 Content Validation\n');

  // Load schemas
  const schemas = await loadSchemas();
  console.log(`✓ Loaded ${Object.keys(schemas).length} schema files\n`);

  // Validate manifest.json if it exists
  const manifestPath = join(CONTENT_DIR, 'manifest.json');
  const manifest = await loadJson(manifestPath);

  if (manifest) {
    console.log(`Validating manifest.json...`);
    if (validateAgainstSchema(schemas.manifest, manifest, 'manifest.json')) {
      console.log('✓ manifest.json valid\n');
    }

    await buildSceneIndex(manifest);
  }

  // Validate all scene files
  const scenesDir = join(CONTENT_DIR, 'scenes');

  try {
    const sceneFiles = await readdir(scenesDir);
    for (const file of sceneFiles) {
      if (!file.endsWith('.json')) continue;

      const scenePath = join(scenesDir, file);
      const scene = await loadJson(scenePath);

      if (scene) {
        results.fileCount++;
        process.stdout.write(`Validating ${file}...`);

        if (validateAgainstSchema(schemas.scene, scene, file)) {
          console.log(' ✓');
        } else {
          console.log(' ✗');
        }
      }
    }
  } catch {
    // No scenes directory yet
  }

  // Validate items.json if it exists
  const itemsPath = join(CONTENT_DIR, 'items.json');
  const items = await loadJson(itemsPath);

  if (items) {
    console.log(`Validating items.json...`);
    results.fileCount++;
    if (validateAgainstSchema(schemas.items, items, 'items.json')) {
      console.log('✓ items.json valid\n');
    }
  }

  // Validate stats.json if it exists
  const statsPath = join(CONTENT_DIR, 'stats.json');
  const stats = await loadJson(statsPath);

  if (stats) {
    console.log(`Validating stats.json...`);
    results.fileCount++;
    if (validateAgainstSchema(schemas.stats, stats, 'stats.json')) {
      console.log('✓ stats.json valid\n');
    }
  }

  // Check cross-file references
  if (manifest) {
    console.log('Checking cross-file references...');
    await checkReferences(scenesDir, manifest);
    console.log('');
  }

  // Print results
  console.log('─'.repeat(50));
  console.log(`Files validated: ${results.fileCount}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log(`Warnings: ${results.warnings.length}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Errors:\n');
    for (const error of results.errors) {
      console.log(`  - ${error}`);
    }
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:\n');
    for (const warning of results.warnings) {
      console.log(`  - ${warning}`);
    }
  }

  console.log('─'.repeat(50));

  if (results.passed) {
    console.log('✅ All content files valid!');
    process.exit(0);
  } else {
    console.log('❌ Validation failed!');
    process.exit(1);
  }
}

// Run validation
validate().catch(error => {
  console.error('Validation error:', error);
  process.exit(1);
});
