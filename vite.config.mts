// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, InlineConfig, loadEnv } from 'vite';
import electron from 'vite-plugin-electron';
import svgrPlugin from 'vite-plugin-svgr';

function getElectronProcessViteConfig(): InlineConfig {
  return {
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
            vite: getElectronProcessViteConfig(),
          },
          {
            entry: 'src/ElectronBackend/app.ts',
            vite: getElectronProcessViteConfig(),
          },
          {
            entry: 'src/ElectronBackend/dbProcess/dbProcess.ts',
            vite: getElectronProcessViteConfig(),
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
      {
        extends: true,
        test: {
          environment: 'node',
          include: ['src/shared/**/__test{s,}__/**/*.test.{ts,tsx}'],
          name: { label: 'SH', color: 'yellow' },
        },
      },
      {
        extends: true,
        test: {
          environment: 'node',
          include: ['src/performance-tests/**/__test{s,}__/**/*.test.{ts,tsx}'],
          name: { label: 'PERF', color: 'magenta' },
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
