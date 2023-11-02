// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PlaywrightTestConfig } from '@playwright/test';

// The timeouts are chosen so large, as some of the machines used in
// GitHub actions are slow (for Win and Mac).
const TIMEOUT_VALUE = 60000;
const EXPECT_TIMEOUT = 15000;

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: TIMEOUT_VALUE,
  retries: process.env.CI ? 2 : 0,
  quiet: !!process.env.CI,
  expect: {
    timeout: EXPECT_TIMEOUT,
  },
  use: {
    video: 'off',
    trace: 'off',
  },
};

export default config;
