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
import { loadInputAndOutputFromFilePath } from '../../input/importFromFile';
import { createWindow } from '../createWindow';
import {
  openOpossumFileDialog,
  selectBaseURLDialog,
  selectFile,
  selectFiles,
  selectSaveFile,
} from '../dialogs';
import { setGlobalBackendState } from '../globalBackendState';
import {
  importFileListener,
  linkHasHttpSchema,
  openFileListener,
  openLinkListener,
  selectBaseURLListener,
  selectFileListener,
  selectFilesListener,
  selectSaveFileListener,
} from '../listeners';
import { importFileFormats } from '../menu/fileMenu';

vi.mock('electron', () => ({
  app: {
    on: vi.fn(),
    getPath: vi.fn(),
    getName: vi.fn(),
    getVersion: vi.fn(),
    whenReady: async (): Promise<unknown> => Promise.resolve(true),
  },
  BrowserWindow: class BrowserWindowMock {
    loadURL = vi.fn(() => Promise.resolve(null));
    setTitle = vi.fn();
    getFocusedWindow = vi.fn();
    webContents = {
      openDevTools: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
      session: {
        webRequest: {
          onHeadersReceived: vi.fn(),
        },
      },
    };
    close = vi.fn(() => Promise.resolve(null));
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
}));

vi.mock('../../input/importFromFile', () => ({
  loadInputAndOutputFromFilePath: vi.fn(),
}));

vi.mock('../dialogs', () => ({
  openOpossumFileDialog: vi.fn(),
  selectFile: vi.fn(),
  selectFiles: vi.fn(),
  selectSaveFile: vi.fn(),
  selectBaseURLDialog: vi.fn(),
}));

vi.mock('../user-settings-service', () => ({
  UserSettingsService: {
    get: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('getSelectBaseURLListener', () => {
  it('opens base url dialog and sends selected path to frontend', async () => {
    const mockCallback = vi.fn();
    const mainWindow = {
      webContents: { send: mockCallback as unknown } as WebContents,
    } as unknown as BrowserWindow;
    setGlobalBackendState({ projectId: 'test-project' });
    const baseURL = '/Users/path/to/sources';
    const expectedFormattedBaseURL = 'file:///Users/path/to/sources/{path}';

    (selectBaseURLDialog as Mock).mockReturnValueOnce([baseURL]);

    await selectBaseURLListener(mainWindow)();

    expect(selectBaseURLDialog).toHaveBeenCalled();
    expect(mainWindow.webContents.send).toHaveBeenCalledWith(
      AllowedFrontendChannels.SetBaseURLForRoot,
      expectedFormattedBaseURL,
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
      false,
    );
  });
});

describe('openFileListener', () => {
  it('opens the provided file path without showing the dialog', async () => {
    const mainWindow = initWindowAndBackendState();
    const updateMenu = vi.fn().mockResolvedValue(undefined);
    const listener = openFileListener(mainWindow, updateMenu);
    const filePath = '/home/input.opossum';

    await listener({} as Electron.IpcMainInvokeEvent, filePath);

    expect(openOpossumFileDialog).not.toHaveBeenCalled();
    expect(loadInputAndOutputFromFilePath).toHaveBeenCalledWith(
      mainWindow,
      filePath,
    );
  });
});

describe('selectFilesListener', () => {
  it('returns the files selected by the user', async () => {
    const mainWindow = initWindowAndBackendState();
    const fileFormat = importFileFormats[0];
    const selectedFilePath = '/home/input.json';

    const listener = selectFilesListener(mainWindow);

    vi.mocked(selectFiles).mockReturnValue([selectedFilePath]);

    const returnedFilePath = await listener(
      {} as Electron.IpcMainInvokeEvent,
      fileFormat,
    );

    expect(returnedFilePath).toEqual([selectedFilePath]);
  });

  it('returns an empty array when no file was selected', async () => {
    const mainWindow = initWindowAndBackendState();
    const fileFormat = importFileFormats[0];

    const listener = selectFilesListener(mainWindow);

    vi.mocked(selectFiles)
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

    expect(returnedFilePath1).toEqual([]);
    expect(returnedFilePath2).toEqual([]);
  });
});

describe('selectFileListener', () => {
  it('returns the selected file', async () => {
    const mainWindow = initWindowAndBackendState();
    const fileFormat = importFileFormats[0];
    const selectedFilePath = '/home/input.json';
    const listener = selectFileListener(mainWindow);

    vi.mocked(selectFile).mockReturnValue([selectedFilePath]);

    await expect(
      listener({} as Electron.IpcMainInvokeEvent, fileFormat),
    ).resolves.toBe(selectedFilePath);
  });

  it('returns an empty string when no file was selected', async () => {
    const mainWindow = initWindowAndBackendState();
    const listener = selectFileListener(mainWindow);

    vi.mocked(selectFile).mockReturnValue(undefined);

    await expect(
      listener({} as Electron.IpcMainInvokeEvent, importFileFormats[0]),
    ).resolves.toBe('');
  });
});

describe('selectSaveFileListener', () => {
  it('calls selectSaveFile and returns the selected path', async () => {
    const mainWindow = initWindowAndBackendState();
    const defaultPath = '/home';
    const selectedFilePath = '/home/input.opossum';

    const listener = selectSaveFileListener(mainWindow);

    vi.mocked(selectSaveFile).mockReturnValue(selectedFilePath);

    const returnedFilePath = await listener({} as Electron.IpcMainInvokeEvent, {
      defaultPath,
    });

    expect(selectSaveFile).toHaveBeenCalledWith({ defaultPath });
    expect(returnedFilePath).toBe(selectedFilePath);
  });

  it('returns an empty string when no save location was selected', async () => {
    const mainWindow = initWindowAndBackendState();

    const listener = selectSaveFileListener(mainWindow);

    vi.mocked(selectSaveFile).mockReturnValue(undefined);

    const returnedFilePath = await listener({} as Electron.IpcMainInvokeEvent, {
      defaultPath: '',
    });

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
