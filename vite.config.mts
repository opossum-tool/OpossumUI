// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, InlineConfig, loadEnv } from 'vite';
import electron from 'vite-plugin-electron';
import svgrPlugin from 'vite-plugin-svgr';

// The dev DB cache only restores cached databases whose schema matches the
// current code. Hashing the schema-defining module at build time ties the
// cache invalidation to the actual schema without a manually managed version
// constant.
function getDbSchemaHash(): string {
  const initializeDbPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    'src/ElectronBackend/db/initializeDb.ts',
  );
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(initializeDbPath, 'utf-8'))
    .digest('hex')
    .slice(0, 16);
}

function getElectronProcessViteConfig(mode: string): InlineConfig {
  return {
    define: {
      // Baked at build time so the dev DB cache can never be enabled in
      // production bundles, regardless of the host environment.
      'process.env.OPOSSUM_DEV_MODE': mode === 'development' ? '"1"' : '"0"',
      'process.env.OPOSSUM_DB_SCHEMA_HASH': JSON.stringify(getDbSchemaHash()),
    },
    build: {
      minify: true,
      outDir: 'build/ElectronBackend',
      rollupOptions: {
        external: [
          'electron',
          'better-sqlite3',
          'bindings',
          'file-uri-to-path',
        ],
      },
    },
  };
}

let electronStartCount = 0;

/**
 * Starts Electron and records whether this spawn is a watcher restart (e.g.
 * after a backend code change) or the initial start of a `yarn start` run.
 *
 * The vite dev server process persists across Electron restarts, so a module
 * level counter cleanly distinguishes the two cases. The flag propagates to
 * Electron via the inherited environment and gates the dev-only last-file
 * auto-reopen (see `main.ts`).
 */
function handleElectronStart({
  startup,
}: {
  startup: (...args: never[]) => unknown;
}): void {
  process.env.OPOSSUM_ELECTRON_RESTARTED = electronStartCount++ > 0 ? '1' : '0';
  startup();
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
            vite: getElectronProcessViteConfig(mode),
            onstart: handleElectronStart,
          },
          {
            entry: 'src/ElectronBackend/app.ts',
            vite: getElectronProcessViteConfig(mode),
            onstart: handleElectronStart,
          },
          {
            entry: 'src/ElectronBackend/dbProcess/dbProcess.ts',
            vite: getElectronProcessViteConfig(mode),
            onstart: handleElectronStart,
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
          setupFiles: [
            './src/testing/setup.ts',
            './src/testing/frontend-setup.ts',
          ],
        },
      },
      {
        extends: true,
        test: {
          environment: 'happy-dom',
          include: ['src/integration-tests/**/*.test.{ts,tsx}'],
          name: { label: 'INT', color: 'cyan' },
          setupFiles: [
            './src/testing/setup.ts',
            './src/testing/frontend-setup.ts',
          ],
          testTimeout: 30000,
        },
      },
      {
        extends: true,
        test: {
          environment: 'node',
          include: ['src/ElectronBackend/**/__test{s,}__/**/*.test.{ts,tsx}'],
          name: { label: 'BE', color: 'blue' },
          setupFiles: ['./src/testing/setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          environment: 'node',
          include: ['src/shared/**/__test{s,}__/**/*.test.{ts,tsx}'],
          name: { label: 'SH', color: 'yellow' },
          setupFiles: ['./src/testing/setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          environment: 'node',
          include: ['src/performance-tests/**/__test{s,}__/**/*.test.{ts,tsx}'],
          name: { label: 'PERF', color: 'magenta' },
          setupFiles: ['./src/testing/setup.ts'],
        },
      },
    ],
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
            '@emotion/react',
          ],
        },
      },
    },
  },
}));
