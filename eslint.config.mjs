// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fixupPluginRules } from '@eslint/compat';
import { includeIgnoreFile } from '@eslint/compat';
import eslint from '@eslint/js';
import eslintPluginQuery from '@tanstack/eslint-plugin-query';
import eslintPluginCheckFile from 'eslint-plugin-check-file';
import eslintConfigJest from 'eslint-plugin-jest';
import eslintConfigJestDom from 'eslint-plugin-jest-dom';
import eslintConfigPlaywright from 'eslint-plugin-playwright';
import eslintConfigReact from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintConfigTestingLibrary from 'eslint-plugin-testing-library';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  {
    name: 'Global ignore patterns',
    ignores: [
      '.lintstagedrc.js',
      'commitlint.config.ts',
      'eslint.config.mjs',
      'index.html',
      'jest.config.mjs',
      'notices.template.html',
      'vite.config.mts',
      '.yarn',
    ],
  },
  {
    plugins: {
      'check-file': eslintPluginCheckFile,
      jest: eslintConfigJest,
      '@tanstack/query': eslintPluginQuery,
      // @ts-ignore
      'react-hooks': fixupPluginRules(eslintPluginReactHooks),
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly',
        fetch: true,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2018,
        sourceType: 'module',
        project: [
          'tsconfig.json',
          'tsconfig.eslint.json',
          'src/ElectronBackend/tsconfig.json',
        ],
      },
    },
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      eslintConfigReact.configs.flat?.recommended,
      eslintConfigTestingLibrary.configs['flat/react'],
      eslintConfigJest.configs['flat/recommended'],
      eslintConfigJest.configs['flat/style'],
      eslintConfigJestDom.configs['flat/recommended'],
    ],
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...eslintPluginQuery.configs.recommended.rules,
      ...eslintPluginReactHooks.configs.recommended.rules,
      'react/display-name': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
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
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowBoolean: true, allowNumber: true, allowNever: true },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true },
      ],
      'jest/consistent-test-it': 'error',
      'jest/prefer-spy-on': 'error',
      'check-file/filename-naming-convention': [
        'error',
        {
          '**/*.{js,mjs,ts,tsx}':
            '+([a-zA-Z0-9-])*(.(d|test|style|util|util.test))',
        },
        { ignoreMiddleExtensions: true },
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
    },
  },
  {
    files: ['src/e2e-tests/**/*'],
    extends: [eslintConfigPlaywright.configs['flat/recommended']],
    rules: {
      'playwright/expect-expect': 'off',
      'testing-library/prefer-screen-queries': 'off',
      'testing-library/no-node-access': 'off',
      'react-hooks/rules-of-hooks': 'off',
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
);
