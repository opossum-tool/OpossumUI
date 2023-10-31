// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  _electron,
  ElectronApplication,
  expect,
  Locator,
  Page,
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
  test,
  TestType,
} from '@playwright/test';

// The timeouts are chosen so large, as some of the machines used in
// Github actions are slow (for Win and Mac).

const ELECTRON_LAUNCH_TEST_TIMEOUT = 75000;
export const E2E_TEST_TIMEOUT = 120000;
export const EXPECT_TIMEOUT = 50000;
export const LOAD_TIMEOUT = 100000;

export async function getApp(
  commandLineArg?: string,
): Promise<ElectronApplication> {
  const app = 'build/ElectronBackend/app.js';

  return await _electron.launch({
    args: commandLineArg ? [app, commandLineArg] : [app],
    timeout: ELECTRON_LAUNCH_TEST_TIMEOUT,
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
  text: string,
): Promise<Locator> {
  const element = window.locator(`text=${text}`);
  await expect(element).toHaveCount(1, { timeout: EXPECT_TIMEOUT });

  return element;
}

export async function getElementWithAriaLabel(
  window: Page,
  ariaLabel: string,
): Promise<Locator> {
  const element = window.locator(`[aria-label="${ariaLabel}"]`);
  await expect(element).toHaveCount(1, { timeout: EXPECT_TIMEOUT });

  return element;
}

export async function getButtonWithName(
  window: Page,
  name: string,
): Promise<Locator> {
  const element = window.locator(`//button[text()='${name}']`);
  await expect(element).toHaveCount(1, { timeout: EXPECT_TIMEOUT });

  return element;
}
