// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import electron from 'vite-plugin-electron';
import svgrPlugin from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(
      mode === 'test'
        ? {}
        : { babel: { plugins: ['babel-plugin-react-compiler'] } },
    ),
    viteTsconfigPaths(),
    svgrPlugin(),
    ...(mode === 'e2e' || mode === 'test'
      ? []
      : electron({
          entry: [
            'src/ElectronBackend/app.ts',
            'src/ElectronBackend/preload.ts',
          ],
          onstart(options) {
            if (process.platform === 'linux') {
              // See github.com/electron-vite/vite-plugin-electron/issues/264
              options.startup(undefined, {
                stdio: ['inherit', 'inherit', 'inherit', 'ignore', 'ipc'],
              });
            } else {
              options.startup();
            }
          },
          vite: {
            build: {
              minify: true,
              outDir: 'build/ElectronBackend',
              rollupOptions: {
                external: [
                  'electron',
                  'better-sqlite3-electron',
                  'bindings',
                  'file-uri-to-path',
                ],
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
          },
        })),
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
          include: [
            'src/Frontend/Components/ProjectStatisticsPopup/__tests__/ProjectStatisticsPopup.test.tsx',
            'src/Frontend/Components/GlobalPopup/__tests__/GlobalPopup.test.tsx',
          ],
          pool: 'threads',
        },
      },
      {
        extends: true,
        test: {
          environment: 'happy-dom',
          include: ['src/Frontend/**/__test{s,}__/**/*.test.{ts,tsx}'],
          exclude: [
            'src/Frontend/Components/ProjectStatisticsPopup/__tests__/ProjectStatisticsPopup.test.tsx',
            'src/Frontend/Components/GlobalPopup/__tests__/GlobalPopup.test.tsx',
          ],
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
    pool: 'vmThreads',
    maxWorkers: '100%',
  },
}));
