// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const rangePattern = /^[\^~]/;
const offenders = [];

for (const section of ['dependencies', 'devDependencies']) {
  const deps = pkg[section];
  if (!deps) {
    continue;
  }
  for (const [name, version] of Object.entries(deps)) {
    if (rangePattern.test(version)) {
      offenders.push(`${section}: ${name} -> ${version}`);
    }
  }
}

if (offenders.length > 0) {
  console.error(
    'All versions in package.json must be pinned exactly (no ^ or ~). Found non-exact versions:',
  );
  for (const offender of offenders) {
    console.error(`  ${offender}`);
  }
  process.exit(1);
}
