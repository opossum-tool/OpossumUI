// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

const sharedRules = {
  '@typescript-eslint/array-type': ['error', { default: 'generic' }],
  '@typescript-eslint/await-thenable': 'error',
  '@typescript-eslint/ban-ts-comment': 'error',
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/no-empty-function': 'off',
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-magic-numbers': [
    'error',
    {
      ignore: [-1, 0, 1, 2, 100],
      ignoreArrayIndexes: true,
      ignoreTypeIndexes: true,
    },
  ],
  '@typescript-eslint/no-misused-promises': [
    'error',
    { checksVoidReturn: false },
  ],
  '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
  '@typescript-eslint/no-unnecessary-type-assertion': 'error',
  '@typescript-eslint/no-unused-vars': 'off',
  '@typescript-eslint/prefer-as-const': 'error',
  '@typescript-eslint/prefer-optional-chain': 'error',
  '@typescript-eslint/prefer-readonly': 'error',
  '@typescript-eslint/require-await': 'error',
  '@typescript-eslint/restrict-template-expressions': [
    'error',
    { allowBoolean: true, allowNumber: true, allowNever: true },
  ],
  '@typescript-eslint/switch-exhaustiveness-check': 'error',
  'jest/consistent-test-it': 'error',
  'jest/prefer-spy-on': 'error',
  'filenames/match-regex': [
    'error',
    '^[a-zA-Z0-9\\-]+(.d|.test|.style|.util|.util.test)?$',
    true,
  ],
  'no-alert': 'error',
  'no-console': 'off',
  'no-duplicate-imports': 'error',
  'no-else-return': 'error',
  'no-eval': 'error',
  'no-extend-native': 'error',
  'no-lone-blocks': 'error',
  'no-lonely-if': 'error',
  'no-magic-numbers': 'off',
  'no-multi-assign': 'error',
  'no-nested-ternary': 'off',
  'no-new-func': 'error',
  'no-restricted-imports': [
    'error',
    {
      paths: [
        {
          name: '@faker-js/faker',
          message: 'Please use shared faker instead.',
        },
        {
          name: 'react-hot-toast',
          message: 'Please use toast from Toaster instead.',
        },
      ],
    },
  ],
  'no-return-assign': 'error',
  'no-return-await': 'error',
  'no-self-compare': 'error',
  'no-sequences': 'error',
  'no-shadow': 'off',
  'no-template-curly-in-string': 'error',
  'no-throw-literal': 'error',
  'no-unused-expressions': 'off',
  'no-unused-vars': 'off',
  'no-use-before-define': 'off',
  'no-useless-call': 'error',
  'no-useless-computed-key': 'error',
  'no-useless-concat': 'error',
  'no-useless-constructor': 'off',
  'no-useless-rename': 'error',
  'no-useless-return': 'error',
  'object-shorthand': 'error',
  'prefer-arrow-callback': 'error',
  'prefer-template': 'error',
  curly: 'error',
  eqeqeq: 'error',
  quotes: [
    'warn',
    'single',
    { avoidEscape: true, allowTemplateLiterals: false },
  ],
  yoda: 'error',
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
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:testing-library/react',
    'plugin:jest/recommended',
    'plugin:jest/style',
    'plugin:jest-dom/recommended',
    'plugin:@tanstack/eslint-plugin-query/recommended',
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
    'commitlint.config.ts',
    'generateDotOpossum.js',
    'index.html',
    'jest.config.ts',
    'notices.template.html',
    'typings',
    'vite.config.mts',
  ],
  reportUnusedDisableDirectives: true,
  rules: {
    ...sharedRules,
    'react/display-name': 'off',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
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
    {
      files: [
        '**/*.test.ts',
        '**/*.test.tsx',
        'src/testing/**/*',
        'src/e2e-tests/**/*',
      ],
      rules: {
        '@typescript-eslint/no-magic-numbers': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],
};
