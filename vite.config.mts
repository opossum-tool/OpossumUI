// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, InlineConfig, loadEnv } from 'vite';
import electron, { withExternalBuiltins } from 'vite-plugin-electron';
import svgrPlugin from 'vite-plugin-svgr';

import packageJson from './package.json' with { type: 'json' };

const externalizedElectronDependencies = new Set([
  ...Object.keys(packageJson.dependencies).filter(
    (dependency) =>
      dependency !== 'better-sqlite3' && dependency !== 'spdx-license-ids',
  ),
  'bindings',
  'file-uri-to-path',
]);

function isExternalElectronDependency(id: string): boolean {
  for (const dependency of externalizedElectronDependencies) {
    if (id === dependency || id.startsWith(`${dependency}/`)) {
      return true;
    }
  }

  return false;
}

function getElectronProcessViteConfig(entryFileName: string): InlineConfig {
  return withExternalBuiltins({
    build: {
      minify: true,
      outDir: 'build/ElectronBackend',
      rollupOptions: {
        external: isExternalElectronDependency,
        output: {
          format: 'es',
          entryFileNames: entryFileName,
          chunkFileNames: 'chunks/[name]-[hash].mjs',
        },
      },
    },
    resolve: {
      alias: {
        // Electron needs its dependencies to be rebuilt to fit its packaged node version: https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules
        // Our local node can't work with the rebuilt binaries
        // So we install better-sqlite3 twice, once with the `-electron` suffix, and then we rebuild only that one
        // Then we make electron use the rebuilt one using this alias
        'better-sqlite3': 'better-sqlite3-electron',
      },
    },
  });
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // The React compiler offers little benefit in component/unit tests, so we only use it in E2E tests and production
    mode === 'test'
      ? undefined
      : babel({
          presets: [reactCompilerPreset()],
        }),
    svgrPlugin(),
    ...(mode === 'e2e' || mode === 'test'
      ? []
      : electron([
          {
            entry: 'src/ElectronBackend/preload.ts',
            vite: getElectronProcessViteConfig('preload.mjs'),
          },
          {
            entry: 'src/ElectronBackend/app.ts',
            vite: getElectronProcessViteConfig('app.mjs'),
          },
        ])),
  ],
  define: {
    'process.env.CI': loadEnv(mode, process.cwd()).CI,
  },
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 2000,
  },
  resolve: {
    conditions: ['mui-modern', 'module', 'browser', 'development|production'],
  },
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          environment: 'happy-dom',
          include: ['src/Frontend/**/__test{s,}__/**/*.test.{ts,tsx}'],
          name: { label: 'FE', color: 'green' },
        },
      },
      {
        extends: true,
        test: {
          environment: 'node',
          include: ['src/ElectronBackend/**/__test{s,}__/**/*.test.{ts,tsx}'],
          name: { label: 'BE', color: 'blue' },
        },
      },
    ],
    setupFiles: './src/testing/setup.ts',
    globalSetup: './src/testing/globalSetup.ts',
    clearMocks: true,
    unstubGlobals: true,
    pool: 'threads',
    maxWorkers: '80%',
    deps: {
      optimizer: {
        client: {
          enabled: true,
          include: [
            '@testing-library/react',
            '@testing-library/user-event',
            '@reduxjs/toolkit',
            'react-redux',
            '@mui/material',
            '@mui/icons-material',
            '@emotion/react',
          ],
        },
      },
    },
  },
}));
