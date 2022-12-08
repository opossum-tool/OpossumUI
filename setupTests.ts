// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import '@testing-library/jest-dom/extend-expect';

const TEST_TIMEOUT = 15000;
const SUBSTRINGS_TO_SUPPRESS_IN_CONSOLE_INFO = [
  'Web worker error in workers context',
  'Error in rendering folder progress bar',
  'Error in ResourceDetailsTab',
];
// this is a quick fix for #938
const SUBSTRINGS_TO_SUPPRESS_IN_CONSOLE_ERROR = [
  'should be wrapped into act(...)',
];

jest.setTimeout(TEST_TIMEOUT);

jest.mock('./src/Frontend/web-workers/get-new-accordion-workers');
jest.mock('./src/Frontend/web-workers/get-new-progress-bar-workers');

const originalConsoleError = console.error;
const originalConsoleInfo = console.info;

beforeAll(() => {
  global.window.electronAPI = {
    openLink: jest.fn().mockReturnValue(Promise.resolve()),
    openFile: jest.fn(),
    deleteFile: jest.fn(),
    keepFile: jest.fn(),
    sendErrorInformation: jest.fn(),
    exportFile: jest.fn(),
    saveFile: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
  };

  mockConsoleImplementation(SUBSTRINGS_TO_SUPPRESS_IN_CONSOLE_INFO, 'info');
  mockConsoleImplementation(SUBSTRINGS_TO_SUPPRESS_IN_CONSOLE_ERROR, 'error');
});

beforeEach(() => jest.clearAllMocks());

afterAll(() => {
  console.error = originalConsoleError;
  console.error = originalConsoleInfo;
});

function mockConsoleImplementation(
  selectors: Array<string>,
  type: 'info' | 'error'
): void {
  jest
    .spyOn(console, type)
    .mockImplementation(getMockConsoleImplementation(selectors, type));
}

function getMockConsoleImplementation(
  selectors: Array<string>,
  type: 'info' | 'error'
) {
  return (...args: Array<unknown>): void => {
    if (
      selectors.filter(
        (selector) => typeof args[0] === 'string' && args[0].includes(selector)
      ).length
    ) {
      return;
    }
    return type === 'error'
      ? originalConsoleError.call(console, args)
      : originalConsoleInfo.call(console, args);
  };
}
