// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

const sharedRules = {
  '@typescript-eslint/await-thenable': 2,
  '@typescript-eslint/ban-ts-comment': 0,
  '@typescript-eslint/ban-ts-ignore': 0,
  '@typescript-eslint/explicit-function-return-type': 2,
  '@typescript-eslint/no-empty-function': 0,
  '@typescript-eslint/no-explicit-any': 2,
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-magic-numbers': [
    'error',
    { ignore: [-1, 0, 1, 2, 100] },
  ],
  '@typescript-eslint/no-misused-promises': [
    'error',
    { checksVoidReturn: false },
  ],
  '@typescript-eslint/no-unnecessary-type-assertion': 2,
  '@typescript-eslint/no-unused-vars': 0,
  '@typescript-eslint/require-await': 2,
  'filenames/match-regex': [2, '^[a-zA-Z0-9\\-]+(.d|.test)?$', true],
  'object-shorthand': 2,
};

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
    'plugin:@typescript-eslint/recommended',
    'plugin:jest-dom/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:testing-library/react',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  plugins: ['filenames'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: [
    '.eslintrc.js',
    '.lintstagedrc.js',
    'build_scripts',
    'generateDotOpossum.js',
    'index.html',
    'jest.config.js',
    'notices.template.html',
    'vite.config.mts',
  ],
  reportUnusedDisableDirectives: true,
  rules: {
    ...sharedRules,
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 0,
    'testing-library/no-node-access': 'off', // TODO: remove this line and fix warnings
  },
  overrides: [
    {
      files: ['src/e2e-tests/**/*'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:playwright/recommended',
      ],
      rules: {
        ...sharedRules,
        'playwright/expect-expect': 'off',
        'testing-library/prefer-screen-queries': 'off',
      },
    },
  ],
};
