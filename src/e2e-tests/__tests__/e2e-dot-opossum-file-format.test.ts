// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  E2E_TEST_TIMEOUT,
  EXPECT_TIMEOUT,
  getApp,
  getElementWithText,
  LOAD_TIMEOUT,
} from '../test-helpers/test-helpers';
import { ElectronApplication, expect, Page, test } from '@playwright/test';

test.setTimeout(E2E_TEST_TIMEOUT);

test.describe('Open .opossum file via command line', () => {
  let app: ElectronApplication;
  let window: Page;

  test.beforeEach(async () => {
    app = await getApp(
      'src/e2e-tests/test-resources/opossum_input_and_output_e2e.opossum',
    );
    window = await app.firstWindow();
    await window.waitForLoadState('networkidle', { timeout: LOAD_TIMEOUT });
    await window.title();
  });

  test.afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  test('should open file when provided as command line arg', async () => {
    await getElementWithText(window, 'Frontend');

    const closeProjectStatisticsPopupButton = await getElementWithText(
      window,
      'Close',
    );
    await closeProjectStatisticsPopupButton.click();

    const electronBackendEntry = await getElementWithText(
      window,
      'ElectronBackend',
    );
    await electronBackendEntry.click();
  });

  test('should show signals and attributions in accordions', async () => {
    const closeProjectStatisticsPopupButton = await getElementWithText(
      window,
      'Close',
    );
    await closeProjectStatisticsPopupButton.click();

    const electronBackendEntry = await getElementWithText(
      window,
      'ElectronBackend',
    );
    await electronBackendEntry.click();

    await expect(window.locator(`text=${'jQuery, 16.13.1'}`)).toBeVisible({
      timeout: EXPECT_TIMEOUT,
    });

    await expect(window.locator(`text=${'Apache'}`)).toHaveCount(1, {
      timeout: EXPECT_TIMEOUT,
    });

    const signalsInFolderContentEntry = await getElementWithText(
      window,
      'Signals in Folder Content',
    );
    await signalsInFolderContentEntry.click();

    await expect(window.locator(`text=${'jQuery, 16.13.1'}`)).toBeHidden();
  });
});
