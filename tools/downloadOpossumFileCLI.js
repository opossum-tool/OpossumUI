// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

const { fetchVersion } = require('gh-release-fetch');

const VERSION = 'v0.1.0-ALPHA';
fetchVersion({
  repository: 'opossum-tool/opossum-file',
  package: 'opossum-file-for-ubuntu',
  destination: 'bin',
  version: VERSION,
  extract: false,
})
  .then(() => {
    console.log("Downloaded 'opossum-file@'" + VERSION + "'");
  })
  .catch((error) => {
    console.error(
      "Download of 'opossum-file' failed:",
      error.message,
      '\n',
      error,
    );
  });
