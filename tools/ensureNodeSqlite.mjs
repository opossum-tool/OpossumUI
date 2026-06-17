// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
//
// Probes whether the better-sqlite3 native module was compiled for the
// current Node.js ABI. If it was built for Electron instead (a different
// ABI version), rebuilds it automatically.
//
// This is needed because `yarn db:generate` (run by the pre-commit hook and
// `yarn typecheck`) requires the Node-compiled variant, but `yarn install`
// or `yarn rebuild:electron` may leave the Electron-compiled binary in place.
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nativeBinary = path.join(
  __dirname,
  '..',
  'node_modules',
  'better-sqlite3',
  'build',
  'Release',
  'better_sqlite3.node',
);

function readAbiVersion(filePath) {
  // The Node.js module version is stored as a uint32 at a fixed offset
  // in the .node binary. We read it from the binary's export table.
  // However, the simplest cross-platform approach is to compare against
  // process.versions.modules using a child process probe.
  return null;
}

function probeInChildProcess() {
  try {
    const result = execSync(
      "node -e \"new (require('better-sqlite3'))(':memory:')\"",
      { encoding: 'utf-8', stdio: 'pipe' },
    );
    return true;
  } catch {
    return false;
  }
}

if (!probeInChildProcess()) {
  console.log(
    'better-sqlite3 native module has wrong ABI, rebuilding for Node…',
  );
  execSync('npm rebuild better-sqlite3', { stdio: 'inherit' });

  if (!probeInChildProcess()) {
    console.error(
      'better-sqlite3 still fails after rebuild. ' +
        'Try `npm rebuild better-sqlite3` manually.',
    );
    process.exit(1);
  }
}
