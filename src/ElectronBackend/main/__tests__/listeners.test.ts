// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type BrowserWindow, shell, type WebContents } from 'electron';
import type { Mock } from 'vitest';

import {
  AllowedFrontendChannels,
  IpcChannel,
} from '../../../shared/ipc-channels';
import { createWindow } from '../createWindow';
import {
  openNonOpossumFileDialog,
  saveFileDialog,
  selectBaseURLDialog,
} from '../dialogs';
import {
  importFileListener,
  importFileSelectSaveLocationListener,
  linkHasHttpSchema,
  openLinkListener,
  selectBaseURLListener,
  selectFileListener,
} from '../listeners';
import { importFileFormats } from '../menu/fileMenu';

vi.mock('electron', () => {
  const mockElectron = {
    app: {
      on: vi.fn(),
      getPath: vi.fn(),
      getName: vi.fn(),
      getVersion: vi.fn(),
      whenReady: async (): Promise<unknown> => Promise.resolve(true),
    },
    BrowserWindow: class BrowserWindowMock {
      constructor() {
        return {
          loadURL: vi.fn(() => {
            return Promise.resolve(null);
          }),
          setTitle: vi.fn(),
          getFocusedWindow: vi.fn(),
          webContents: {
            openDevTools: vi.fn(),
            send: vi.fn(),
            close: vi.fn(),
            session: {
              webRequest: {
                onHeadersReceived: vi.fn(),
              },
            },
          },
          close: vi.fn(() => {
            return Promise.resolve(null);
          }),
        };
      }
    },
    Menu: {
      setApplicationMenu: vi.fn(),
      buildFromTemplate: vi.fn(),
      getApplicationMenu: vi.fn(),
    },
    dialog: {
      showOpenDialogSync: vi.fn(),
      showMessageBox: vi.fn(() => {
        return Promise.resolve({
          response: 0,
        });
      }),
    },
    shell: { showItemInFolder: vi.fn(), openExternal: vi.fn() },
  };

  return {
    default: mockElectron,
    ...mockElectron,
  };
});

vi.mock('../../input/importFromFile', () => ({
  loadInputAndOutputFromFilePath: vi.fn(),
}));

vi.mock('../dialogs', () => ({
  openOpossumFileDialog: vi.fn(),
  openNonOpossumFileDialog: vi.fn(),
  saveFileDialog: vi.fn(),
  selectBaseURLDialog: vi.fn(),
}));

describe('getSelectBaseURLListener', () => {
  it('opens base url dialog and sends selected path to frontend', async () => {
    const mockCallback = vi.fn();
    const mainWindow = {
      webContents: { send: mockCallback as unknown } as WebContents,
    } as unknown as BrowserWindow;
    const baseURL = '/Users/path/to/sources';
    const expectedFormattedBaseURL = 'file:///Users/path/to/sources/{path}';

    (selectBaseURLDialog as Mock).mockReturnValueOnce([baseURL]);

    await selectBaseURLListener(mainWindow)();

    expect(selectBaseURLDialog).toHaveBeenCalled();
    expect(mainWindow.webContents.send).toHaveBeenCalledWith(
      AllowedFrontendChannels.SetBaseURLForRoot,
      {
        baseURLForRoot: expectedFormattedBaseURL,
      },
    );
  });
});

describe('getOpenLinkListener', () => {
  it('opens link', async () => {
    const testLink = 'https://www.test.de/link';
    await openLinkListener(IpcChannel.OpenLink, {
      link: testLink,
    });

    expect(shell.openExternal).toHaveBeenCalledWith(testLink);
  });
});

describe('getImportFileListener', () => {
  it('sends an IPC message on the ImportFileShowDialog channel', () => {
    const mainWindow = initWindowAndBackendState();

    const fileFormat = importFileFormats[0];

    const listener = importFileListener(mainWindow, fileFormat);

    listener();

    expect(mainWindow.webContents.send).toHaveBeenCalledWith(
      AllowedFrontendChannels.ShowImportDialog,
      fileFormat,
    );
  });
});

describe('getImportFileSelectInputListener', () => {
  it('returns file path selected by user', async () => {
    const mainWindow = initWindowAndBackendState();
    const fileFormat = importFileFormats[0];
    const selectedFilePath = '/home/input.json';

    const listener = selectFileListener(mainWindow);

    vi.mocked(openNonOpossumFileDialog).mockReturnValue([selectedFilePath]);

    const returnedFilePath = await listener(
      {} as Electron.IpcMainInvokeEvent,
      fileFormat,
    );

    expect(returnedFilePath).toBe(selectedFilePath);
  });

  it('returns an empty string when no file was selected', async () => {
    const mainWindow = initWindowAndBackendState();
    const fileFormat = importFileFormats[0];

    const listener = selectFileListener(mainWindow);

    vi.mocked(openNonOpossumFileDialog)
      .mockReturnValueOnce([])
      .mockReturnValueOnce(undefined);

    const returnedFilePath1 = await listener(
      {} as Electron.IpcMainInvokeEvent,
      fileFormat,
    );
    const returnedFilePath2 = await listener(
      {} as Electron.IpcMainInvokeEvent,
      fileFormat,
    );

    expect(returnedFilePath1).toBe('');
    expect(returnedFilePath2).toBe('');
  });
});

describe('getImportFileSelectSaveLocationListener', () => {
  it('calls saveFileDialog and returns received file path', async () => {
    const mainWindow = initWindowAndBackendState();
    const defaultPath = '/home';
    const selectedFilePath = '/home/input.opossum';

    const listener = importFileSelectSaveLocationListener(mainWindow);

    vi.mocked(saveFileDialog).mockReturnValue(selectedFilePath);

    const returnedFilePath = await listener(
      {} as Electron.IpcMainInvokeEvent,
      defaultPath,
    );

    expect(saveFileDialog).toHaveBeenCalledWith(defaultPath);
    expect(returnedFilePath).toBe(selectedFilePath);
  });

  it('returns an empty string when no save location was selected', async () => {
    const mainWindow = initWindowAndBackendState();

    const listener = importFileSelectSaveLocationListener(mainWindow);

    vi.mocked(saveFileDialog).mockReturnValue(undefined);

    const returnedFilePath = await listener(
      {} as Electron.IpcMainInvokeEvent,
      '',
    );

    expect(returnedFilePath).toBe('');
  });
});

function initWindowAndBackendState(): BrowserWindow {
  return createWindow();
}

describe('linkHasHttpSchema', () => {
  it('throws for invalid url', () => {
    expect(() => {
      linkHasHttpSchema('/some/local/file');
    }).toThrow();
  });

  it('returns true for http', () => {
    expect(linkHasHttpSchema('http://opossum.de')).toBeTruthy();
  });

  it('return true for https', () => {
    expect(linkHasHttpSchema('https://opossum.de')).toBeTruthy();
  });

  it('returns false for ftp', () => {
    expect(linkHasHttpSchema('ftp://opossum.de')).toBeFalsy();
  });
});
