import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDir, '..');
const sourcePath = resolve(projectRoot, '.htaccess');
const destinationPath = resolve(projectRoot, 'dist', '.htaccess');

if (!existsSync(sourcePath)) {
  throw new Error('Missing root .htaccess file. Build output cannot be deployed safely.');
}

mkdirSync(dirname(destinationPath), { recursive: true });
copyFileSync(sourcePath, destinationPath);
