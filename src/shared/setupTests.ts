// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import '@testing-library/jest-dom';

import { ElectronAPI } from './shared-types';

// We suppress the recharts warning that is due to our mocking in tests.
const SUBSTRINGS_TO_SUPPRESS_IN_CONSOLE_WARN = [
  'The width(0) and height(0) of chart should be greater than 0,',
];

// this is a quick fix for #938
const SUBSTRINGS_TO_SUPPRESS_IN_CONSOLE_ERROR = [
  'should be wrapped into act(...)',
];

jest.mock('../ElectronBackend/main/logger.ts');

const originalResizeObserver = window.ResizeObserver;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

function mockResizeObserver(): void {
  window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
}

beforeAll(() => {
  global.window.electronAPI = {
    openLink: jest.fn().mockReturnValue(Promise.resolve()),
    openFile: jest.fn(),
    deleteFile: jest.fn(),
    keepFile: jest.fn(),
    convertInputFileToDotOpossum: jest.fn(),
    useOutdatedInputFileFormat: jest.fn(),
    openDotOpossumFile: jest.fn(),
    sendErrorInformation: jest.fn(),
    exportFile: jest.fn(),
    saveFile: jest.fn(),
    on: jest.fn().mockReturnValue(jest.fn()),
    getUserSetting: jest.fn().mockReturnValue(undefined),
    setUserSetting: jest.fn(),
  } satisfies ElectronAPI;

  mockResizeObserver();

  mockConsoleImplementation(SUBSTRINGS_TO_SUPPRESS_IN_CONSOLE_WARN, 'warn');
  mockConsoleImplementation(SUBSTRINGS_TO_SUPPRESS_IN_CONSOLE_ERROR, 'error');
});

beforeEach(() => jest.clearAllMocks());

afterAll(() => {
  window.ResizeObserver = originalResizeObserver;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.info = originalConsoleInfo;
  jest.restoreAllMocks();
});

function mockConsoleImplementation(
  selectors: Array<string>,
  type: 'info' | 'warn' | 'error',
): void {
  jest
    .spyOn(console, type)
    .mockImplementation(getMockConsoleImplementation(selectors, type));
}

function getMockConsoleImplementation(
  selectors: Array<string>,
  type: 'info' | 'warn' | 'error',
) {
  return (...args: Array<unknown>): void => {
    if (
      selectors.filter(
        (selector) => typeof args[0] === 'string' && args[0].includes(selector),
      ).length
    ) {
      return;
    }
    switch (type) {
      case 'error': {
        return originalConsoleError.call(console, args);
      }
      case 'warn': {
        return originalConsoleWarn.call(console, args);
      }
      case 'info': {
        return originalConsoleInfo.call(console, args);
      }
    }
  };
}
