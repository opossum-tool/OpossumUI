// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ElectronApplication, Page } from 'playwright';
import {
  conditionalIt,
  E2E_LARGE_TEST_TIMEOUT,
  getApp,
} from '../test-helpers/test-helpers';
import os from 'os';

jest.setTimeout(E2E_LARGE_TEST_TIMEOUT);

describe('Open large zipped file via command line', () => {
  let app: ElectronApplication;
  let window: Page;

  beforeEach(async () => {
    app = await getApp('src/e2e-tests/test-resources/input_from_ort.json.gz');
    window = await app.firstWindow();
    await window.waitForLoadState();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  // The test was flaky on mac. Not sure which machines are available
  // in that case to run the test.
  conditionalIt(os.platform() !== 'darwin')(
    'should open large zipped file via command line',
    async () => {
      await window.$$('text=package.json');
    }
  );
});
