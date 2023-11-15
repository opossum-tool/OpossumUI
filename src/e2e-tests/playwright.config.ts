// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PlaywrightTestConfig } from '@playwright/test';

const CI_SINGLE_TEST_TIMEOUT = 60000;
const GLOBAL_TIMEOUT = 3000000;

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  outputDir: 'artifacts',
  preserveOutput: process.env.CI ? 'failures-only' : 'always',
  quiet: !!process.env.CI,
  reportSlowTests: null,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: process.env.CI ? CI_SINGLE_TEST_TIMEOUT : undefined,
  workers: process.env.CI ? 1 : undefined,
  globalTimeout: process.env.CI ? GLOBAL_TIMEOUT : undefined,
};

export default config;
