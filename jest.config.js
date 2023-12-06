// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

module.exports = {
  testEnvironment: 'jsdom',
  resetMocks: false,
  transformIgnorePatterns: ['/node_modules/(?!d3-*|internmap|axios)'],
  setupFilesAfterEnv: ['./setupTests.ts'],
  watchAll: false,
  roots: ['<rootDir>/src/Frontend', '<rootDir>/src/ElectronBackend'],
  modulePathIgnorePatterns: ['<rootDir>/build/'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};
