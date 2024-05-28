// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

module.exports = {
  '*': [() => 'yarn copyright-lint-check', 'prettier --write --ignore-unknown'],
  '*.{ts,tsx}': 'eslint',
  '!(src/ElectronBackend/**/*)*.{ts,tsx}': () => 'tsc -p ./',
  'src/ElectronBackend/**/*.{ts,tsx}': () =>
    'tsc --noEmit -p src/ElectronBackend',
};
