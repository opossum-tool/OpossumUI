// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { setupBrowser } from '@testing-library/webdriverio';
import { getApp, INTEGRATION_TEST_TIMEOUT } from '../test-helpers/test-helpers';

jest.setTimeout(INTEGRATION_TEST_TIMEOUT);

describe('The OpossumUI', () => {
  const app = getApp();

  beforeEach(async () => {
    await app.start();
  });

  afterEach(() => {
    if (app && app.isRunning()) {
      return app.stop();
    }
  });

  it('should launch app', async () => {
    // eslint-disable-next-line @typescript-eslint/await-thenable
    const isVisible = await app.browserWindow.isVisible();
    expect(isVisible).toBe(true);
  });

  it('displays a window', async () => {
    await app.client.waitUntilWindowLoaded();
    const windowCount = await app.client.getWindowCount();
    expect(windowCount).toBe(2);
  });

  it('should find view buttons', async () => {
    const { getByText } = setupBrowser(app.client);

    await getByText('Audit');
    await getByText('Attribution');
    await getByText('Report');
  });
});

describe('Open file via command line', () => {
  const app = getApp('src/e2e-tests/test-resources/opossum_input_e2e.json');

  beforeEach(async () => {
    await app.start();
  });

  afterEach(() => {
    if (app && app.isRunning()) {
      return app.stop();
    }
  });

  it('should open file when provided as command line arg', async () => {
    const { getByText } = setupBrowser(app.client);

    await getByText('Frontend');
    const electronBackendEntry = await getByText('ElectronBackend');
    await electronBackendEntry.click();

    const mainTsEntry = await getByText('main.ts');
    await mainTsEntry.click();

    expect(await getByText(/jQuery, 16.13.1/)).toBeTruthy();
  });
});
