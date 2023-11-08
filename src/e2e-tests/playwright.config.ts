// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PlaywrightTestConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  quiet: !!process.env.CI,
  globalTeardown:
    process.env.DEBUG === 'true' ? undefined : './utils/global-teardown.ts',
};

export default config;
