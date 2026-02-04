// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import '@testing-library/jest-dom/vitest';
import { noop } from 'lodash';
import { vi } from 'vitest';

import { executeCommand } from '../ElectronBackend/api/commands';
import { DEFAULT_USER_SETTINGS } from '../shared/shared-constants';
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

vi.mock('../ElectronBackend/main/logger.ts', () => ({
  default: vi.fn(),
  info: vi.fn(),
}));

class ResizeObserver {
  observe = noop;
  unobserve = noop;
  disconnect = noop;
}

window.ResizeObserver = ResizeObserver;

global.window.electronAPI = {
  quit: vi.fn(),
  relaunch: vi.fn(),
  openLink: vi.fn().mockReturnValue(Promise.resolve()),
  openFile: vi.fn(),
  selectFile: vi.fn(),
  importFileSelectSaveLocation: vi.fn(),
  importFileConvertAndLoad: vi.fn(),
  mergeFileAndLoad: vi.fn(),
  exportFile: vi.fn(),
  saveFile: vi.fn(),
  stopLoading: vi.fn(),
  on: vi.fn().mockReturnValue(vi.fn()),
  getUserSettings: vi.fn().mockReturnValue(DEFAULT_USER_SETTINGS),
  updateUserSettings: vi.fn(),
  setFrontendPopupOpen: vi.fn(),
  api: vi.fn().mockImplementation(executeCommand),
} satisfies ElectronAPI;

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

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
