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
    react(),
    viteTsconfigPaths(),
    svgrPlugin(),
    ...(mode === 'e2e'
      ? []
      : electron({
          entry: 'src/ElectronBackend/main/main.ts',
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
}));
