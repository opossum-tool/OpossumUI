// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import { fetchLatest } from 'gh-release-fetch';
import { join } from 'path';

const EXECUTE_PERMISSIONS = 0o755;

async function downloadOpossumFile(osSuffix, downloadDestination = 'bin') {
  const TARGET_NAME = 'bin/opossum-file';
  const opossumFileBinaryName = `opossum-file-for-${osSuffix}`;
  const downloadedFileName = join(downloadDestination, opossumFileBinaryName);

  try {
    const release = {
      repository: 'opossum-tool/opossum-file',
      package: opossumFileBinaryName,
      destination: downloadDestination,
      version: undefined,
      extract: false,
    };
    await fetchLatest(release);
    console.info(
      `Downloaded 'opossum-file@${release.version}' to`,
      downloadedFileName,
    );
  } catch (error) {
    console.error(
      "Download of 'opossum-file' failed:",
      error.message,
      '\n',
      error,
    );
    process.exit(1);
  }

  if (fs.existsSync(TARGET_NAME)) {
    console.info('Found opossum-file binary. Overwriting.');
  }

  try {
    fs.renameSync(downloadedFileName, TARGET_NAME);
    console.info('Renamed', downloadedFileName, 'to', TARGET_NAME);
  } catch (error) {
    console.error('Renaming failed:', error);
    process.exit(1);
  }

  try {
    await fs.promises.chmod(TARGET_NAME, EXECUTE_PERMISSIONS);
  } catch (error) {
    console.error('Could not mark', TARGET_NAME, 'as executable.', error);
    process.exit(1);
  }
}

const osSuffix = process.argv[2];

if (!osSuffix) {
  console.error(
    'Please specify one of the following options: mac, ubuntu, windows.exe',
  );
  process.exit(1);
}

await downloadOpossumFile(osSuffix);
