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
import {
  getGlobalBackendState,
  setGlobalBackendState,
} from '../globalBackendState';
import {
  handleOpeningFile,
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
import { UserSettingsService } from '../user-settings-service';

vi.mock('electron', async () => ({
  app: {
    on: vi.fn(),
    getPath: vi.fn(),
    getName: vi.fn(),
    getVersion: vi.fn(),
    whenReady: async (): Promise<unknown> => Promise.resolve(true),
  },
  BrowserWindow: class BrowserWindowMock {
    loadURL = vi.fn(() => Promise.resolve(null));
    maximize = vi.fn();
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
  ...(await import('./electron-mocks')).menuMock,
  ...(await import('./electron-mocks')).screenMock,
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
    vi.mocked(loadInputAndOutputFromFilePath).mockResolvedValue(true);

    await listener({} as Electron.IpcMainInvokeEvent, filePath);

    expect(openOpossumFileDialog).not.toHaveBeenCalled();
    expect(loadInputAndOutputFromFilePath).toHaveBeenCalledWith(
      mainWindow,
      filePath,
    );
    expect(mainWindow.webContents.send).toHaveBeenCalledWith(
      AllowedFrontendChannels.ProjectOpened,
    );
    expect(vi.mocked(mainWindow.webContents.send).mock.calls.slice(-2)).toEqual(
      [
        [AllowedFrontendChannels.ProjectOpened],
        [
          AllowedFrontendChannels.ProcessingStateChanged,
          { type: 'ProcessingDone' },
        ],
      ],
    );
  });

  it('preserves an open dialog while initializing another project', async () => {
    const mainWindow = initWindowAndBackendState();
    setGlobalBackendState({ frontendPopupOpen: true });
    vi.mocked(loadInputAndOutputFromFilePath).mockResolvedValue(true);
    const updateMenu = vi.fn().mockImplementation(() => {
      expect(getGlobalBackendState().frontendPopupOpen).toBe(true);
      return Promise.resolve();
    });

    await openFileListener(mainWindow, updateMenu)(
      {} as Electron.IpcMainInvokeEvent,
      '/home/another-project.opossum',
    );

    expect(updateMenu).toHaveBeenCalled();
    expect(getGlobalBackendState()).toMatchObject({
      frontendPopupOpen: true,
      opossumFilePath: '/home/another-project.opossum',
    });
  });

  it('does not notify the frontend after a handled load failure and ends processing', async () => {
    const mainWindow = initWindowAndBackendState();
    vi.mocked(loadInputAndOutputFromFilePath).mockResolvedValue(false);

    await openFileListener(mainWindow, vi.fn().mockResolvedValue(undefined))(
      {} as Electron.IpcMainInvokeEvent,
      '/home/invalid.opossum',
    );

    const sentEvents = vi.mocked(mainWindow.webContents.send).mock.calls;
    expect(sentEvents).not.toContainEqual([
      AllowedFrontendChannels.ProjectOpened,
    ]);
    expect(sentEvents).toContainEqual([
      AllowedFrontendChannels.ProcessingStateChanged,
      { type: 'ProcessingDone' },
    ]);
  });

  it('does not notify the frontend when the open dialog is cancelled', async () => {
    const mainWindow = initWindowAndBackendState();
    vi.mocked(openOpossumFileDialog).mockReturnValue(undefined);

    await openFileListener(
      mainWindow,
      vi.fn().mockResolvedValue(undefined),
    )({} as Electron.IpcMainInvokeEvent);

    expect(mainWindow.webContents.send).not.toHaveBeenCalledWith(
      AllowedFrontendChannels.ProjectOpened,
    );
  });
});

describe('handleOpeningFile', () => {
  it.each(['recent paths read', 'recent paths update', 'final menu update'])(
    'notifies despite a failed %s and still ends processing',
    async (operation) => {
      const mainWindow = initWindowAndBackendState();
      const error = new Error(`${operation} failed`);
      const updateMenu = vi
        .fn<() => Promise<void>>()
        .mockResolvedValue(undefined);
      vi.mocked(loadInputAndOutputFromFilePath).mockResolvedValue(true);

      switch (operation) {
        case 'recent paths read':
          vi.mocked(UserSettingsService.get).mockRejectedValueOnce(error);
          break;
        case 'recent paths update':
          vi.mocked(UserSettingsService.update).mockRejectedValueOnce(error);
          break;
        case 'final menu update':
          updateMenu
            .mockResolvedValueOnce(undefined)
            .mockRejectedValueOnce(error);
          break;
      }

      await expect(
        handleOpeningFile(mainWindow, '/home/input.opossum', updateMenu),
      ).rejects.toBe(error);

      expect(
        vi.mocked(mainWindow.webContents.send).mock.calls.slice(-2),
      ).toEqual([
        [AllowedFrontendChannels.ProjectOpened],
        [
          AllowedFrontendChannels.ProcessingStateChanged,
          { type: 'ProcessingDone' },
        ],
      ]);
      expect(
        vi
          .mocked(mainWindow.webContents.send)
          .mock.calls.filter(
            ([channel]) => channel === AllowedFrontendChannels.ProjectOpened,
          ),
      ).toHaveLength(1);
    },
  );

  it('ends processing without notifying when loading throws', async () => {
    const mainWindow = initWindowAndBackendState();
    const error = new Error('loading failed');
    vi.mocked(loadInputAndOutputFromFilePath).mockRejectedValueOnce(error);

    await expect(
      handleOpeningFile(mainWindow, '/home/input.opossum', vi.fn()),
    ).rejects.toBe(error);

    expect(mainWindow.webContents.send).not.toHaveBeenCalledWith(
      AllowedFrontendChannels.ProjectOpened,
    );
    expect(mainWindow.webContents.send).toHaveBeenLastCalledWith(
      AllowedFrontendChannels.ProcessingStateChanged,
      { type: 'ProcessingDone' },
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
