// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

// Get Node.js version bundled with Electron
const nodeVersion = execSync(
  'ELECTRON_RUN_AS_NODE=1 ./node_modules/.bin/electron -e "console.log(process.versions.node)"',
  { encoding: 'utf-8' },
).trim();

const majorVersion = nodeVersion.split('.')[0];

console.log(`Electron bundles Node.js ${nodeVersion}`);

// Update .nvmrc
const nvmrcPath = '.nvmrc';
const currentNvmrc = readFileSync(nvmrcPath, 'utf-8').trim();
if (currentNvmrc !== nodeVersion) {
  writeFileSync(nvmrcPath, `${nodeVersion}\n`);
  console.log(`.nvmrc: ${currentNvmrc} → ${nodeVersion}`);
} else {
  console.log(`.nvmrc: already ${nodeVersion}`);
}

// Update package.json
const packageJsonPath = 'package.json';
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
let packageJsonChanged = false;

// Update engines.node
const currentEngines = packageJson.engines?.node;
const newEngines = `>=${majorVersion}.0.0`;
if (currentEngines !== newEngines) {
  packageJson.engines = { ...packageJson.engines, node: newEngines };
  packageJsonChanged = true;
  console.log(`engines.node: ${currentEngines} → ${newEngines}`);
} else {
  console.log(`engines.node: already ${newEngines}`);
}

if (packageJsonChanged) {
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

// Update @types/node
const currentTypesNode = packageJson.devDependencies?.['@types/node'];
const currentTypesMajor = currentTypesNode?.split('.')[0];
if (currentTypesMajor !== majorVersion) {
  console.log(`@types/node: updating to ^${majorVersion}...`);
  execSync(`yarn add -D @types/node@^${majorVersion}`, { stdio: 'inherit' });
} else {
  console.log(`@types/node: already on major ${majorVersion}`);
}
