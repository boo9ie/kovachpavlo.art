/**
 * Post-build step.
 *
 * 1. Copies the deploy-only files (.htaccess, .user.ini) into dist/.
 * 2. Injects Vite's hashed asset tags into dist/index.php.
 *
 * index.php is copied verbatim out of public/ by Vite and carries a
 * <!--VITE_ASSETS--> marker, because at authoring time we do not know the
 * content hashes. Failing loudly here is deliberate: a dist/index.php without
 * asset tags would serve a page with no JavaScript at all.
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDir, '..');
const distDir = resolve(projectRoot, 'dist');

const deployFiles = ['.htaccess', '.user.ini'];

for (const fileName of deployFiles) {
  const sourcePath = resolve(projectRoot, fileName);
  const destinationPath = resolve(distDir, fileName);

  if (!existsSync(sourcePath)) {
    throw new Error(`Missing required deploy file: ${fileName}`);
  }

  mkdirSync(dirname(destinationPath), { recursive: true });
  copyFileSync(sourcePath, destinationPath);
}

const ASSET_MARKER = '<!--VITE_ASSETS-->';

const indexHtmlPath = resolve(distDir, 'index.html');
const indexPhpPath = resolve(distDir, 'index.php');

if (!existsSync(indexHtmlPath)) {
  throw new Error('dist/index.html not found — did vite build run?');
}

if (!existsSync(indexPhpPath)) {
  throw new Error('dist/index.php not found — public/index.php should be copied by vite.');
}

const builtHtml = readFileSync(indexHtmlPath, 'utf8');

// Every <script>/<link> Vite emitted that points at the hashed asset bundle.
const assetTags = builtHtml.match(
  /<(?:script|link)\b[^>]*(?:src|href)="\/assets\/[^"]+"[^>]*>(?:<\/script>)?/g
);

if (!assetTags || assetTags.length === 0) {
  throw new Error('No hashed asset tags found in dist/index.html — cannot build index.php.');
}

const indexPhp = readFileSync(indexPhpPath, 'utf8');

if (!indexPhp.includes(ASSET_MARKER)) {
  throw new Error(`Marker ${ASSET_MARKER} missing from dist/index.php.`);
}

writeFileSync(
  indexPhpPath,
  indexPhp.replace(ASSET_MARKER, assetTags.map((tag) => `    ${tag}`).join('\n')),
  'utf8'
);

console.log(`prepare-dist: injected ${assetTags.length} asset tag(s) into dist/index.php`);
