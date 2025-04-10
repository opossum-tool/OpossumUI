// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const CI_SINGLE_TEST_TIMEOUT = 60000;
const GLOBAL_TIMEOUT = 3000000;

const devWebServer: PlaywrightTestConfig['webServer'] = {
  command: 'yarn test:prepare',
  url: 'http://localhost:5173/index.html',
  reuseExistingServer: true,
  stderr: 'pipe',
  stdout: 'pipe',
  gracefulShutdown: {
    timeout: 500,
    signal: 'SIGTERM',
  },
};

const config: PlaywrightTestConfig = {
  outputDir: 'artifacts',
  preserveOutput: process.env.CI ? 'failures-only' : 'always',
  quiet: !!process.env.CI,
  reportSlowTests: null,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: process.env.CI ? CI_SINGLE_TEST_TIMEOUT : undefined,
  workers: process.env.CI ? 1 : (process.env.WORKERS ?? 1),
  globalTimeout: process.env.CI ? GLOBAL_TIMEOUT : undefined,
  webServer: process.env.CI || process.env.RELEASE ? undefined : devWebServer,
};

export default config;
