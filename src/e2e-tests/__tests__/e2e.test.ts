// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ElectronApplication, Page } from 'playwright';
import {
  conditionalIt,
  E2E_TEST_TIMEOUT,
  getApp,
} from '../test-helpers/test-helpers';
import * as os from 'os';

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
    await window.$$('text=Audit');
    await window.$$('text=Attribution');
    await window.$$('text=Report');
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
    await window.$$('text=Frontend');
    await window.click('text=ElectronBackend');

    await window.click('text=main.ts');

    expect(await window.$$('text=jQuery, 16.13.1')).toBeTruthy();
  });

  // getOpenLinkListener does not work properly on Linux
  conditionalIt(os.platform() !== 'linux')(
    'should open an error popup if the base url is invalid',
    async () => {
      await window.click('text=ElectronBackend');
      await window.click("[aria-label='link to open']");

      expect(await window.$$('text=Cannot open link.')).toBeTruthy();

      await window.click('text=Types');
      await window.click("[aria-label='link to open']");

      expect(await window.$$('text=Cannot open link.')).toBeTruthy();
    }
  );
});
