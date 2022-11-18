// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ElectronApplication, Page } from 'playwright';
import {
  conditionalTest,
  E2E_TEST_TIMEOUT,
  EXPECT_TIMEOUT,
  getApp,
  getElementWithAriaLabel,
  getElementWithText,
} from '../test-helpers/test-helpers';
import * as os from 'os';
import fs from 'fs';
import { expect, test } from '@playwright/test';

test.setTimeout(E2E_TEST_TIMEOUT);

test.describe('The OpossumUI', () => {
  let app: ElectronApplication;
  let window: Page;

  test.beforeEach(async () => {
    app = await getApp();
    window = await app.firstWindow();
    await window.waitForLoadState();
  });

  test.afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  test('should launch app', async () => {
    expect(await window.title()).toBe('OpossumUI');
  });

  test('should find view buttons', async () => {
    await getElementWithText(window, 'Audit');
    await getElementWithText(window, 'Attribution');
    await getElementWithText(window, 'Report');
  });
});

test.describe('Open file via command line', () => {
  let app: ElectronApplication;
  let window: Page;

  test.beforeEach(async () => {
    app = await getApp('src/e2e-tests/test-resources/opossum_input_e2e.json');
    window = await app.firstWindow();
    await window.waitForLoadState();
  });

  test.afterEach(async () => {
    if (app) {
      await app.close();
      fs.unlinkSync(
        'src/e2e-tests/test-resources/opossum_input_e2e_attributions.json'
      );
    }
  });

  test('should open file when provided as command line arg', async () => {
    await getElementWithText(window, 'Frontend');

    const electronBackendEntry = await getElementWithText(
      window,
      'ElectronBackend'
    );
    await electronBackendEntry.click();
  });

  test('should show signals and attributions in accordions', async () => {
    const electronBackendEntry = await getElementWithText(
      window,
      'ElectronBackend'
    );
    await electronBackendEntry.click();

    await expect(window.locator(`text=${'jQuery, 16.13.1'}`)).toBeVisible({
      timeout: EXPECT_TIMEOUT,
    });

    // Apache appears in both 'signals in folder content' and 'attributions in folder content' accordions
    await expect(window.locator(`text=${'Apache'}`)).toHaveCount(2, {
      timeout: EXPECT_TIMEOUT,
    });

    const signalsInFolderContentEntry = await getElementWithText(
      window,
      'Signals in Folder Content'
    );
    await signalsInFolderContentEntry.click();

    await expect(window.locator(`text=${'jQuery, 16.13.1'}`)).toBeHidden();
  });

  // getOpenLinkListener does not work properly on Linux
  conditionalTest(os.platform() !== 'linux')(
    'should open an error popup if the base url is invalid',
    async () => {
      const electronBackendEntry = await getElementWithText(
        window,
        'ElectronBackend'
      );
      await electronBackendEntry.click();
      const openLinkIcon = await getElementWithAriaLabel(
        window,
        'link to open'
      );
      await openLinkIcon.click();

      await getElementWithText(window, 'Cannot open link.');

      const typesEntry = await getElementWithText(window, 'Types');
      await typesEntry.click();

      const anotherOpenLinkIcon = await getElementWithAriaLabel(
        window,
        'link to open'
      );
      await anotherOpenLinkIcon.click();

      await getElementWithText(window, 'Cannot open link.');
    }
  );
});
