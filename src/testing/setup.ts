// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import '@testing-library/jest-dom/vitest';
import { noop } from 'lodash';

import { executeCommand } from '../ElectronBackend/api/commands';
import { DEFAULT_USER_SETTINGS } from '../shared/shared-constants';
import { ElectronAPI } from '../shared/shared-types';

class ResizeObserver {
  observe = noop;
  unobserve = noop;
  disconnect = noop;
}

if (typeof window !== 'undefined') {
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

  window.ResizeObserver = ResizeObserver;

  // Mock DOM layout APIs for MUI Popover/Popper positioning
  // This prevents "anchorEl is invalid" warnings in tests
  const mockDOMRect: DOMRect = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    top: 0,
    right: 100,
    bottom: 100,
    left: 0,
    toJSON: () => ({}),
  };

  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
    mockDOMRect,
  );
  vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([
    mockDOMRect,
  ] as unknown as DOMRectList);
  vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(noop);
  vi.spyOn(Range.prototype, 'getBoundingClientRect').mockReturnValue(
    mockDOMRect,
  );
  vi.spyOn(Range.prototype, 'getClientRects').mockReturnValue([
    mockDOMRect,
  ] as unknown as DOMRectList);
}

// Suppress specific console logs to make the tests cleaner.
interface ConsoleType {
  type: 'error' | 'warn';
  suppressedMessage: string;
  original: (...args: Array<unknown>) => void;
}
for (const { type, suppressedMessage, original } of [
  {
    type: 'error',
    suppressedMessage: 'should be wrapped into act(...)',
    original: console.error,
  },
  {
    type: 'warn',
    suppressedMessage: 'of chart should be greater than 0,',
    original: console.warn,
  },
] satisfies Array<ConsoleType>) {
  vi.spyOn(console, type).mockImplementation((...args: Array<unknown>) => {
    if (!(typeof args[0] === 'string' && args[0].includes(suppressedMessage))) {
      original(...args);
    }
  });
}

vi.mock('../../ElectronBackend/main/ProcessingStatusUpdater.ts', () => ({
  ProcessingStatusUpdater: vi.fn().mockImplementation(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    startProcessing: vi.fn(),
    endProcessing: vi.fn(),
  })),
}));

vi.mock('electron-log', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../ElectronBackend/main/logger.ts', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));
