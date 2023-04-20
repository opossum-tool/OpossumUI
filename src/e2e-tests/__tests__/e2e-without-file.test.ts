// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ElectronApplication, Page } from 'playwright';
import {
  E2E_TEST_TIMEOUT,
  getApp,
  getElementWithText,
  LOAD_TIMEOUT,
} from '../test-helpers/test-helpers';
import { expect, test } from '@playwright/test';

test.setTimeout(E2E_TEST_TIMEOUT);

test.describe('The OpossumUI', () => {
  let app: ElectronApplication;
  let window: Page;

  test.beforeEach(async () => {
    app = await getApp();
    window = await app.firstWindow();
    await window.waitForLoadState('networkidle', { timeout: LOAD_TIMEOUT });
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
