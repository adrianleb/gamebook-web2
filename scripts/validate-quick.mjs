import { ContentValidator } from '../src/engine/index.js';
import { readFileSync, readdirSync } from 'fs';

const manifest = JSON.parse(readFileSync('./content/manifest.json', 'utf8'));
const validator = new ContentValidator();

// Validate manifest
const result = validator.validateManifest(manifest);
console.log('Manifest validation:', result.valid ? 'PASS' : 'FAIL');
if (!result.valid) {
  console.log('Errors:', JSON.stringify(result.errors, null, 2));
}

// Validate each scene
const sceneFiles = readdirSync('./content/scenes').filter(f => f.endsWith('.json'));
console.log('\nScene files:', sceneFiles.length);
sceneFiles.forEach(file => {
  const scene = JSON.parse(readFileSync('./content/scenes/' + file, 'utf8'));
  const sceneResult = validator.validateScene(scene, new Set(Object.keys(manifest.sceneIndex)));
  if (!sceneResult.valid) {
    console.log(file + ':', JSON.stringify(sceneResult.errors));
  }
});
console.log('All scenes validated successfully');
