// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const { scripts, packageManager } = JSON.parse(
  readFileSync('package.json', 'utf8'),
);
const script = process.env.npm_lifecycle_event;
const platform = process.platform;
const arch = process.arch;

const selected = [
  `${script}:${platform}:${arch}`,
  `${script}:${platform}`,
].find((name) => Object.hasOwn(scripts, name));

if (!selected) {
  throw new Error(`No script found for ${script} on ${platform}/${arch}`);
}

const yarnVersion = packageManager.replace(/^yarn@/, '').replace(/\+.*$/, '');
const yarnPath = resolve(`.yarn/releases/yarn-${yarnVersion}.cjs`);
const child = spawn(
  process.execPath,
  [yarnPath, 'run', selected, ...process.argv.slice(2)],
  {
    shell: false,
    stdio: 'inherit',
  },
);

child.on('error', (error) => {
  console.error(error);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exitCode = code ?? 1;
  }
});
