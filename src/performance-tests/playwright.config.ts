// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { PlaywrightTestConfig } from '@playwright/test';
import path from 'node:path';

import e2eConfig from '../e2e-tests/playwright.config';

const PERFORMANCE_TEST_TIMEOUT = 900000;
const PERFORMANCE_EXPECT_TIMEOUT = 15000;
const DEFAULT_REPEAT_EACH = 3;
const repeatEach = Number(
  process.env.PERFORMANCE_REPEAT_EACH ?? DEFAULT_REPEAT_EACH,
);

if (!Number.isInteger(repeatEach) || repeatEach < 1) {
  throw new Error('PERFORMANCE_REPEAT_EACH must be a positive integer.');
}

const config: PlaywrightTestConfig = {
  ...e2eConfig,
  testDir: 'playwright',
  outputDir: path.resolve(__dirname, '..', '..', 'performance-artifacts'),
  globalSetup: path.resolve(__dirname, 'performance-global-setup.ts'),
  preserveOutput: 'always',
  reporter: [
    ['list'],
    [path.resolve(__dirname, 'playwright/performance-reporter.ts')],
  ],
  repeatEach,
  workers: 1,
  timeout: PERFORMANCE_TEST_TIMEOUT,
  expect: {
    timeout: PERFORMANCE_EXPECT_TIMEOUT,
  },
};

export default config;
