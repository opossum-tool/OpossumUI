// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  resetMocks: false,
  transformIgnorePatterns: [
    '/node_modules/(?!d3-*|internmap|axios|react-hotkeys-hook|@faker-js/faker)',
  ],
  setupFilesAfterEnv: ['./src/testing/setup-tests.ts'],
  watchAll: false,
  clearMocks: true,
  globalSetup: './src/testing/global-test-setup.ts',
  globalTeardown: './src/testing/global-test-teardown.ts',
  setupFiles: ['whatwg-fetch'],
  roots: ['<rootDir>/src/Frontend', '<rootDir>/src/ElectronBackend'],
  modulePathIgnorePatterns: ['<rootDir>/build/'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};

export default config;
