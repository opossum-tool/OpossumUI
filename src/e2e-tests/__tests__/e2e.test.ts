// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ElectronApplication, Page } from 'playwright';
import {
  conditionalIt,
  E2E_TEST_TIMEOUT,
  getApp,
  getElementWithAriaLabel,
  getElementWithText,
} from '../test-helpers/test-helpers';
import * as os from 'os';
import { expect } from '@playwright/test';

jest.setTimeout(E2E_TEST_TIMEOUT);

describe('The OpossumUI', () => {
  let app: ElectronApplication;
  let window: Page;

  beforeEach(async () => {
    app = await getApp();
    window = await app.firstWindow();
    await window.waitForLoadState();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should launch app', async () => {
    expect(await window.title()).toBe('OpossumUI');
  });

  it('should find view buttons', async () => {
    await getElementWithText(window, 'Audit');
    await getElementWithText(window, 'Attribution');
    await getElementWithText(window, 'Report');
  });
});

describe('Open file via command line', () => {
  let app: ElectronApplication;
  let window: Page;

  beforeEach(async () => {
    app = await getApp('src/e2e-tests/test-resources/opossum_input_e2e.json');
    window = await app.firstWindow();
    await window.waitForLoadState();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should open file when provided as command line arg', async () => {
    await getElementWithText(window, 'Frontend');

    const electronBackendEntry = await getElementWithText(
      window,
      'ElectronBackend'
    );
    await electronBackendEntry.click();

    await expect(window.locator(`text=${'jQuery, 16.13.1'}`)).toBeVisible();
    await expect(
      window.locator(`text=${'Test Component'}`).first()
    ).toBeVisible();
    await expect(
      window.locator(`text=${'Test Component'}`).last()
    ).toBeVisible();

    const signalsInFolderContentEntry = await getElementWithText(
      window,
      'Signals in Folder Content'
    );
    await signalsInFolderContentEntry.click();

    await expect(window.locator(`text=${'jQuery, 16.13.1'}`)).toBeHidden();
    await expect(
      window.locator(`text=${'Test Component'}`).first()
    ).toBeHidden();
    await expect(
      window.locator(`text=${'Test Component'}`).last()
    ).toBeVisible();

    const attributionsInFolderContentEntry = await getElementWithText(
      window,
      'Attributions in Folder Content'
    );

    await attributionsInFolderContentEntry.click();

    await expect(window.locator(`text=${'jQuery, 16.13.1'}`)).toBeHidden();
    await expect(
      window.locator(`text=${'Test Component'}`).first()
    ).toBeHidden();
    await expect(
      window.locator(`text=${'Test Component'}`).last()
    ).toBeHidden();

    const mainTsEntry = await getElementWithText(window, 'main.ts');
    await mainTsEntry.click();

    await expect(window.locator(`text=${'jQuery, 16.13.1'}`)).toBeVisible();
    await expect(
      window.locator(`text=${'Test Component'}`).first()
    ).toBeVisible();
    await expect(
      window.locator(`text=${'Test Component'}`).last()
    ).toBeVisible();

    const signalsEntry = await getElementWithText(window, 'Signals');
    await signalsEntry.click();

    await expect(window.locator(`text=${'jQuery, 16.13.1'}`)).toBeHidden();
    await expect(
      window.locator(`text=${'Test Component'}`).first()
    ).toBeVisible();
    await expect(
      window.locator(`text=${'Test Component'}`).last()
    ).toBeHidden();
  });

  // getOpenLinkListener does not work properly on Linux
  conditionalIt(os.platform() !== 'linux')(
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
