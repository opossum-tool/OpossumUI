// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow, dialog, shell, WebContents } from 'electron';
import { Mock } from 'vitest';

import {
  AllowedFrontendChannels,
  IpcChannel,
} from '../../../shared/ipc-channels';
import {
  Attributions,
  Criticality,
  ExportSpdxDocumentJsonArgs,
  ExportSpdxDocumentYamlArgs,
  ExportType,
} from '../../../shared/shared-types';
import { faker } from '../../../testing/Faker';
import * as errorHandling from '../../errorHandling/errorHandling';
import { writeCsvToFile } from '../../output/writeCsvToFile';
import { writeSpdxFile } from '../../output/writeSpdxFile';
import { createWindow } from '../createWindow';
import {
  openNonOpossumFileDialog,
  saveFileDialog,
  selectBaseURLDialog,
} from '../dialogs';
import { setGlobalBackendState } from '../globalBackendState';
import {
  exportFileListener,
  importFileListener,
  importFileSelectSaveLocationListener,
  linkHasHttpSchema,
  openLinkListener,
  selectBaseURLListener,
  selectFileListener,
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
}));

vi.mock('../../output/writeCsvToFile', () => ({
  writeCsvToFile: vi.fn(),
}));

vi.mock('../../output/writeSpdxFile', () => ({
  writeSpdxFile: vi.fn(),
}));

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

describe('getExportFollowUpListener', () => {
  it('throws error when followUpFilePath is not set', async () => {
    const mainWindow = initWindowAndBackendState();

    await exportFileListener(mainWindow)(IpcChannel.ExportFile, {
      type: ExportType.FollowUp,
      followUpAttributionsWithResources: {},
    });

    expect(dialog.showMessageBox).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        message: 'Error in app backend: Failed to create export',
        buttons: ['Reload File', 'Quit'],
      }),
    );
    expect(writeCsvToFile).not.toHaveBeenCalled();
  });

  it('calls getExportFollowUpListener', async () => {
    const mainWindow = initWindowAndBackendState();
    setGlobalBackendState({
      followUpFilePath: '/somefile.csv',
    });

    const listener = exportFileListener(mainWindow);

    const followUpAttributionsWithResources: Attributions = {
      key1: {
        followUp: undefined,
        licenseText: 'license text',
        firstParty: true,
        resources: ['/'],
        criticality: Criticality.None,
        id: faker.string.uuid(),
      },
      key2: {
        packageName: 'license text',
        resources: ['/a', '/b'],
        criticality: Criticality.None,
        id: faker.string.uuid(),
      },
    };

    await listener(IpcChannel.ExportFile, {
      type: ExportType.FollowUp,
      followUpAttributionsWithResources,
    });

    expect(writeCsvToFile).toHaveBeenCalledWith(
      '/somefile.csv',
      followUpAttributionsWithResources,
      [
        'packageName',
        'packageVersion',
        'url',
        'copyright',
        'licenseName',
        'resources',
      ],
      true,
    );
  });
});

describe('getExportBomListener', () => {
  it('throws error when bomFilePath is not set', async () => {
    const mainWindow = initWindowAndBackendState();

    await exportFileListener(mainWindow)(IpcChannel.ExportFile, {
      type: ExportType.CompactBom,
      bomAttributions: {},
    });

    expect(dialog.showMessageBox).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        message: 'Error in app backend: Failed to create export',
        buttons: ['Reload File', 'Quit'],
      }),
    );
    expect(writeCsvToFile).not.toHaveBeenCalled();
  });

  it('calls getExportBomListener for compact bom', async () => {
    const mainWindow = initWindowAndBackendState();

    const listener = exportFileListener(mainWindow);

    setGlobalBackendState({
      compactBomFilePath: '/somefile.csv',
    });

    const attributionsWithResources: Attributions = {
      key1: {
        followUp: undefined,
        licenseText: 'license text',
        firstParty: true,
        criticality: Criticality.None,
        id: faker.string.uuid(),
      },
      key2: {
        packageName: 'license text',
        criticality: Criticality.None,
        id: faker.string.uuid(),
      },
    };

    await listener(IpcChannel.ExportFile, {
      type: ExportType.CompactBom,
      bomAttributions: attributionsWithResources,
    });

    expect(writeCsvToFile).toHaveBeenNthCalledWith(
      1,
      '/somefile.csv',
      attributionsWithResources,
      ['packageName', 'packageVersion', 'licenseName', 'copyright', 'url'],
    );
  });

  it('calls getExportBomListener for detailed bom', async () => {
    const mainWindow = initWindowAndBackendState();

    const listener = exportFileListener(mainWindow);

    setGlobalBackendState({
      detailedBomFilePath: '/somefile.csv',
    });

    const attributionsWithResources: Attributions = {
      key1: {
        followUp: undefined,
        licenseText: 'license text',
        firstParty: true,
        resources: ['/somefile.csv'],
        criticality: Criticality.None,
        id: faker.string.uuid(),
      },
      key2: {
        packageName: 'license text',
        resources: ['/a', '/b'],
        criticality: Criticality.None,
        id: faker.string.uuid(),
      },
    };

    await listener(IpcChannel.ExportFile, {
      type: ExportType.DetailedBom,
      bomAttributionsWithResources: attributionsWithResources,
    });

    expect(writeCsvToFile).toHaveBeenNthCalledWith(
      1,
      '/somefile.csv',
      attributionsWithResources,
      [
        'packageName',
        'packageVersion',
        'packageNamespace',
        'packageType',
        'packagePURLAppendix',
        'url',
        'copyright',
        'licenseName',
        'licenseText',
        'resources',
      ],
    );
  });
});

describe('getExportSpdxDocumentListener', () => {
  it('throws if path is not set', async () => {
    const mainWindow = initWindowAndBackendState();

    await exportFileListener(mainWindow)(IpcChannel.ExportFile, {
      type: ExportType.SpdxDocumentYaml,
      spdxAttributions: {},
    });

    expect(dialog.showMessageBox).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        buttons: ['Reload File', 'Quit'],
      }),
    );

    expect(writeSpdxFile).not.toHaveBeenCalled();
  });

  it('calls getExportSpdxDocumentListener for yaml', async () => {
    const mainWindow = initWindowAndBackendState();
    const testArgs: ExportSpdxDocumentYamlArgs = {
      type: ExportType.SpdxDocumentYaml,
      spdxAttributions: {},
    };

    const listener = exportFileListener(mainWindow);

    setGlobalBackendState({ spdxYamlFilePath: '/test.yaml' });

    await listener(IpcChannel.ExportFile, testArgs);

    expect(writeSpdxFile).toHaveBeenNthCalledWith(1, '/test.yaml', testArgs);
  });

  it('calls getExportSpdxDocumentListener for json', async () => {
    const mainWindow = initWindowAndBackendState();
    const testArgs: ExportSpdxDocumentJsonArgs = {
      type: ExportType.SpdxDocumentJson,
      spdxAttributions: {},
    };

    const listener = exportFileListener(mainWindow);

    setGlobalBackendState({ spdxJsonFilePath: '/test.json' });

    await listener(IpcChannel.ExportFile, testArgs);

    expect(writeSpdxFile).toHaveBeenNthCalledWith(1, '/test.json', testArgs);
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

describe('_exportFileAndOpenFolder', () => {
  it('calls the createFile function', async () => {
    const mainWindow = initWindowAndBackendState();
    const testSpdxDocumentYamlFilePath = '/some/path.json';
    setGlobalBackendState({ spdxYamlFilePath: testSpdxDocumentYamlFilePath });
    const testArgs: ExportSpdxDocumentYamlArgs = {
      type: ExportType.SpdxDocumentYaml,
      spdxAttributions: {},
    };

    await exportFileListener(mainWindow)(undefined, testArgs);

    expect(writeSpdxFile).toHaveBeenNthCalledWith(
      1,
      testSpdxDocumentYamlFilePath,
      testArgs,
    );
    expect(shell.showItemInFolder).toHaveBeenCalledWith(
      testSpdxDocumentYamlFilePath,
    );
  });

  it('throws if outputFilePath is not set', async () => {
    const mainWindow = initWindowAndBackendState();
    setGlobalBackendState({ spdxYamlFilePath: undefined });
    const testArgs: ExportSpdxDocumentYamlArgs = {
      type: ExportType.SpdxDocumentYaml,
      spdxAttributions: {},
    };

    vi.spyOn(errorHandling, 'showListenerErrorInMessageBox').mockImplementation(
      vi.fn(),
    );

    await exportFileListener(mainWindow)(undefined, testArgs);

    expect(errorHandling.showListenerErrorInMessageBox).toHaveBeenCalledWith(
      expect.anything(),
      new Error('Failed to create export'),
    );
    expect(writeSpdxFile).not.toHaveBeenCalled();
    expect(shell.showItemInFolder).not.toHaveBeenCalled();
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
  (writeCsvToFile as Mock).mockReset();
  setGlobalBackendState({});

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
