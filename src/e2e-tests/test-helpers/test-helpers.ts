// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { _electron, ElectronApplication, Locator, Page } from 'playwright';
import { expect, test } from '@playwright/test';
import {
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
  TestType,
} from '@playwright/test/types/test';

const ELECTRON_LAUNCH_TEST_TIMEOUT = 75000;
export const E2E_TEST_TIMEOUT = 120000;
export const EXPECT_TIMEOUT = 15000;

export async function getApp(
  commandLineArg?: string
): Promise<ElectronApplication> {
  const app = 'build/ElectronBackend/app.js';

  require('setimmediate'); // required to work with react-scripts v5
  return await _electron.launch({
    args: commandLineArg ? [app, commandLineArg] : [app],
    timeout: ELECTRON_LAUNCH_TEST_TIMEOUT,
    env: {
      DISPLAY: process.env.DISPLAY ?? ':99',
      RUNNING_IN_E2E_TEST: 'true',
    },
  });
}

export function conditionalTest(condition: boolean):
  | TestType<
      PlaywrightTestArgs & PlaywrightTestOptions,
      PlaywrightWorkerArgs & PlaywrightWorkerOptions
    >
  | {
      (): void;
    } {
  return condition ? test : test.skip;
}

export async function getElementWithText(
  window: Page,
  text: string
): Promise<Locator> {
  const element = window.locator(`text=${text}`);
  await expect(element).toHaveCount(1, { timeout: EXPECT_TIMEOUT });

  return element;
}

export async function getElementWithAriaLabel(
  window: Page,
  ariaLabel: string
): Promise<Locator> {
  const element = window.locator(`[aria-label="${ariaLabel}"]`);
  await expect(element).toHaveCount(1, { timeout: EXPECT_TIMEOUT });

  return element;
}
