// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { PlaywrightTestConfig } from '@playwright/test';
import path from 'node:path';

import e2eConfig from '../e2e-tests/playwright.config';

const PERFORMANCE_TEST_TIMEOUT = 900000;
const PERFORMANCE_EXPECT_TIMEOUT = 15000;

const config: PlaywrightTestConfig = {
  ...e2eConfig,
  testDir: 'playwright',
  outputDir: path.resolve(__dirname, '..', '..', 'performance-artifacts'),
  globalSetup: path.resolve(__dirname, 'performance-global-setup.ts'),
  preserveOutput: 'always',
  reporter: 'list',
  workers: 1,
  timeout: PERFORMANCE_TEST_TIMEOUT,
  expect: {
    timeout: PERFORMANCE_EXPECT_TIMEOUT,
  },
};

export default config;
