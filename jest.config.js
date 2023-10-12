// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  resetMocks: false,
  transformIgnorePatterns: ['/node_modules/(?!d3-*|internmap|axios)'],
  transform: {
    '/node_modules/(?!d3-*|internmap|axios)': 'babel-jest',
    '^.+\\.tsx?$': ['ts-jest', { diagnostics: false }],
  },
  setupFilesAfterEnv: ['./setupTests.ts'],
  watchAll: false,
  modulePathIgnorePatterns: ['<rootDir>/build/'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};
