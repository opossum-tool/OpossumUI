// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { test as base, _electron as electron, Page } from '@playwright/test';

const ELECTRON_LAUNCH_TEST_TIMEOUT = 75000;
const LOAD_TIMEOUT = 100000;

export { expect } from '@playwright/test';
export const test = base.extend<{ window: Page; file: string | undefined }>({
  file: undefined,
  window: async ({ file }, use) => {
    const app = await electron.launch({
      args: [
        'build/ElectronBackend/app.js',
        '--disable-devtools',
        ...(file ? [file] : []),
      ],
      timeout: ELECTRON_LAUNCH_TEST_TIMEOUT,
    });

    const window = await app.firstWindow();
    await window.waitForLoadState('networkidle', { timeout: LOAD_TIMEOUT });

    await use(window);

    await app.close();
  },
});
