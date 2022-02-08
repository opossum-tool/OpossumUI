// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { _electron, ElectronApplication } from 'playwright';

const ELECTRON_LAUNCH_TEST_TIMEOUT = 60000;
export const E2E_TEST_TIMEOUT = 40000;
export const E2E_LARGE_TEST_TIMEOUT = 480000;

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

export function conditionalIt(condition: boolean): jest.It {
  return condition ? it : it.skip;
}
