// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

const { fetchVersion } = require('gh-release-fetch');
const fs = require('fs');
const { exit } = require('process');
const { join } = require('path');

const VERSION = 'v0.1.0-ALPHA';

if (process.argv.length !== 3) {
  console.error(
    'downloadOpossumFileCLI.js requires an argument with the OS-specific suffix of the opossum-file binary.',
  );
  exit(1);
}

const OS = process.argv[2];
const OPOSSUM_FILE_BINARY_NAME = 'opossum-file-for-' + OS;
const DOWNLOAD_DESTINATION = 'bin';

fetchVersion({
  repository: 'opossum-tool/opossum-file',
  package: OPOSSUM_FILE_BINARY_NAME,
  destination: DOWNLOAD_DESTINATION,
  version: VERSION,
  extract: false,
})
  .then(() => {
    console.info(
      "Downloaded 'opossum-file@" + VERSION + "' to",
      DOWNLOAD_DESTINATION,
    );
    CURRENT_NAME = join(DOWNLOAD_DESTINATION, OPOSSUM_FILE_BINARY_NAME);
    TARGET_NAME = join(DOWNLOAD_DESTINATION, 'opossum-file');
    if (fs.existsSync(TARGET_NAME)) {
      console.info('Found opossum-file binary. Overwriting.');
    }

    fs.renameSync(CURRENT_NAME, TARGET_NAME);
    console.info('Renamed', CURRENT_NAME, 'to', TARGET_NAME);
    fs.chmod(TARGET_NAME, 0o755, (err) => {
      if (err) {
        console.error(
          'Could not mark',
          TARGET_NAME,
          'as executable.',
          err ?? '',
        );
        exit(1);
      }
    });
  })
  .catch((error) => {
    console.error(
      "Download of 'opossum-file' failed:",
      error.message,
      '\n',
      error,
    );
    exit(1);
  });
