// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
    jest: true,
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
    project: ['tsconfig.json', 'src/ElectronBackend/tsconfig.json'],
  },
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'prettier',
    'plugin:react-hooks/recommended',
    'plugin:testing-library/react',
    'plugin:jest-dom/recommended',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  plugins: ['react', 'prettier', 'testing-library', 'jest-dom', 'filenames'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    '@typescript-eslint/ban-ts-ignore': 0,
    '@typescript-eslint/ban-ts-comment': 0,
    '@typescript-eslint/no-empty-function': 0,
    '@typescript-eslint/no-explicit-any': 2,
    '@typescript-eslint/no-unused-vars': 2,
    '@typescript-eslint/explicit-function-return-type': 2,
    '@typescript-eslint/await-thenable': 2,
    '@typescript-eslint/require-await': 2,
    '@typescript-eslint/no-magic-numbers': [
      'error',
      { ignore: [-1, 0, 1, 2, 100] },
    ],
    '@typescript-eslint/no-unnecessary-type-assertion': 2,
    'object-shorthand': 2,
    'react/prop-types': 'off',
    'testing-library/no-node-access': 'off', // TODO: remove this line and fix warnings
    'filenames/match-regex': [2, '^[a-zA-Z0-9\\-]+(.d|.test)?$', true],
    quotes: [2, 'single', { avoidEscape: true }],
  },
};
