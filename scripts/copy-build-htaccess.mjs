import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDir, '..');
const deployFiles = ['.htaccess', '.user.ini'];

for (const fileName of deployFiles) {
  const sourcePath = resolve(projectRoot, fileName);
  const destinationPath = resolve(projectRoot, 'dist', fileName);

  if (!existsSync(sourcePath)) {
    throw new Error(`Missing required deploy file: ${fileName}`);
  }

  mkdirSync(dirname(destinationPath), { recursive: true });
  copyFileSync(sourcePath, destinationPath);
}
