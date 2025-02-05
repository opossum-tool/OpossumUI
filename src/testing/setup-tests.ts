// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import '@testing-library/jest-dom';
import { noop } from 'lodash';

import { ElectronAPI } from '../shared/shared-types';
import { faker } from './Faker';

// We suppress the recharts warning that is due to our mocking in tests.
const SUBSTRINGS_TO_SUPPRESS_IN_CONSOLE_WARN = [
  'The width(0) and height(0) of chart should be greater than 0,',
];

// this is a quick fix for #938
const SUBSTRINGS_TO_SUPPRESS_IN_CONSOLE_ERROR = [
  'should be wrapped into act(...)',
];

jest.mock('../ElectronBackend/main/logger.ts');

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

class ResizeObserver {
  observe = noop;
  unobserve = noop;
  disconnect = noop;
}

global.window.electronAPI = {
  quit: jest.fn(),
  relaunch: jest.fn(),
  openLink: jest.fn().mockReturnValue(Promise.resolve()),
  openFile: jest.fn(),
  importFileSelectInput: jest.fn(),
  importFileSelectSaveLocation: jest.fn(),
  importFileConvertAndLoad: jest.fn(),
  exportFile: jest.fn(),
  saveFile: jest.fn(),
  on: jest.fn().mockReturnValue(jest.fn()),
  getUserSetting: jest.fn().mockReturnValue(undefined),
  setUserSetting: jest.fn(),
} satisfies ElectronAPI;

window.ResizeObserver = ResizeObserver;

console.warn = getMockConsoleImplementation(
  SUBSTRINGS_TO_SUPPRESS_IN_CONSOLE_WARN,
  'warn',
);
console.error = getMockConsoleImplementation(
  SUBSTRINGS_TO_SUPPRESS_IN_CONSOLE_ERROR,
  'error',
);
faker.packageSearch.usePackageNames();
faker.packageSearch.usePackageNamespaces();
faker.packageSearch.usePackageVersions();

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
