// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export default {
  '*': [
    () => 'yarn copyright-lint-check',
    () => 'knip',
    'prettier --write --ignore-unknown',
  ],
  'package.json': () => 'yarn check-exact-versions',
  '*.{ts,tsx}': 'eslint',
  '!(src/ElectronBackend/**/*)*.{ts,tsx}': () => 'tsc -p ./',
  'src/ElectronBackend/**/*.{ts,tsx}': () => [
    'yarn db:generate',
    'tsc --noEmit -p src/ElectronBackend',
  ],
};
