// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, InlineConfig, loadEnv, type Plugin } from 'vite';
import electron from 'vite-plugin-electron';
import svgrPlugin from 'vite-plugin-svgr';

// @vitejs/plugin-react injects its react-refresh preamble as an inline
// script during development, which the Content-Security-Policy in
// index.html (script-src 'self') blocks. Relax the CSP for the dev
// server only; production builds keep serving the strict policy.
function allowInlineScriptsInDevServer(): Plugin {
  return {
    name: 'allow-inline-scripts-in-dev-server',
    apply: 'serve',
    transformIndexHtml(html) {
      return html.replace(
        `content="script-src 'self';`,
        `content="script-src 'self' 'unsafe-inline';`,
      );
    },
  };
}

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
    allowInlineScriptsInDevServer(),
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
