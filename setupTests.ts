// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import '@testing-library/jest-dom/extend-expect';
import { IpcRenderer } from 'electron';
import { TEST_TIMEOUT } from './src/Frontend/test-helpers/general-test-helpers';

let originalIpcRenderer: IpcRenderer;

jest.setTimeout(TEST_TIMEOUT);

beforeAll(() => {
  originalIpcRenderer = global.window.ipcRenderer;
  const mockInvoke = jest.fn();
  mockInvoke.mockReturnValue(Promise.resolve());
  global.window.ipcRenderer = {
    on: jest.fn(),
    removeListener: jest.fn(),
    invoke: mockInvoke,
  } as unknown as IpcRenderer;
});

beforeEach(() => jest.clearAllMocks());

afterAll(() => {
  // Important to restore the original value.
  global.window.ipcRenderer = originalIpcRenderer;
});
