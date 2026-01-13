
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
// We are in server/scripts. Root is ../..
const rootDir = path.resolve(__dirname, '../../');
const clientVersionPath = path.join(rootDir, 'client/src/version.ts');
const packageJsonPath = path.join(rootDir, 'package.json');

// Read current version from package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const currentVersion = packageJson.version; // e.g., "1.0.0"

console.log(`Current version: ${currentVersion}`);

// Increment patch version
const parts = currentVersion.split('.').map(Number);
parts[2] += 1;
const newVersion = parts.join('.');

console.log(`Bumping to: ${newVersion}`);

// Update package.json
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

// Update client/src/version.ts
const versionFileContent = `export const APP_VERSION = "${newVersion}";\n`;
fs.writeFileSync(clientVersionPath, versionFileContent);

console.log('Version updated successfully.');
