// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import '@testing-library/jest-dom/extend-expect';
import { IpcRenderer } from 'electron';

const TEST_TIMEOUT = 15000;
jest.setTimeout(TEST_TIMEOUT);

let originalIpcRenderer: IpcRenderer;

jest.mock('./src/Frontend/web-workers/get-new-accordion-workers');

beforeAll(() => {
  originalIpcRenderer = global.window.ipcRenderer;
  const mockInvoke = jest.fn();
  mockInvoke.mockReturnValue(Promise.resolve());
  global.window.ipcRenderer = {
    on: jest.fn(),
    removeListener: jest.fn(),
    invoke: mockInvoke,
  } as unknown as IpcRenderer;

  jest.spyOn(console, 'info').mockImplementation();
});

beforeEach(() => jest.clearAllMocks());

afterAll(() => {
  // Important to restore the original value.
  global.window.ipcRenderer = originalIpcRenderer;
});
