// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow, dialog, shell, WebContents } from 'electron';
import fs from 'fs';

import {
  AllowedFrontendChannels,
  IpcChannel,
} from '../../../shared/ipc-channels';
import {
  Attributions,
  ExportSpdxDocumentJsonArgs,
  ExportSpdxDocumentYamlArgs,
  ExportType,
} from '../../../shared/shared-types';
import { writeFile } from '../../../shared/write-file';
import { faker } from '../../../testing/Faker';
import * as errorHandling from '../../errorHandling/errorHandling';
import { loadInputAndOutputFromFilePath } from '../../input/importFromFile';
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
  deleteAndCreateNewAttributionFileListener,
  exportFileListener,
  importFileListener,
  importFileSelectInputListener,
  importFileSelectSaveLocationListener,
  linkHasHttpSchema,
  openLinkListener,
  selectBaseURLListener,
} from '../listeners';
import { importFileFormats } from '../menu/fileMenu';

jest.mock('electron', () => ({
  app: {
    on: jest.fn(),
    getPath: jest.fn(),
    getName: jest.fn(),
    getVersion: jest.fn(),
    whenReady: async (): Promise<unknown> => Promise.resolve(true),
  },
  BrowserWindow: class BrowserWindowMock {
    constructor() {
      return {
        loadURL: jest.fn(() => {
          return Promise.resolve(null);
        }),
        setTitle: jest.fn(),
        getFocusedWindow: jest.fn(),
        webContents: {
          openDevTools: jest.fn(),
          send: jest.fn(),
          close: jest.fn(),
          session: {
            webRequest: {
              onHeadersReceived: jest.fn(),
            },
          },
        },
        close: jest.fn(() => {
          return Promise.resolve(null);
        }),
      };
    }
  },
  Menu: {
    setApplicationMenu: jest.fn(),
    buildFromTemplate: jest.fn(),
    getApplicationMenu: jest.fn(),
  },
  dialog: {
    showOpenDialogSync: jest.fn(),
    showMessageBox: jest.fn(() => {
      return Promise.resolve({
        response: 0,
      });
    }),
  },
  shell: { showItemInFolder: jest.fn(), openExternal: jest.fn() },
}));

jest.mock('../../output/writeCsvToFile', () => ({
  writeCsvToFile: jest.fn(),
}));

jest.mock('../../output/writeSpdxFile', () => ({
  writeSpdxFile: jest.fn(),
}));

jest.mock('../../input/importFromFile', () => ({
  loadInputAndOutputFromFilePath: jest.fn(),
}));

jest.mock('../dialogs', () => ({
  openOpossumFileDialog: jest.fn(),
  openNonOpossumFileDialog: jest.fn(),
  saveFileDialog: jest.fn(),
  selectBaseURLDialog: jest.fn(),
}));

describe('getDeleteAndCreateNewAttributionFileListener', () => {
  it('deletes attribution file and calls loadInputAndOutputFromFilePath', async () => {
    const mainWindow = {
      webContents: {
        send: jest.fn(),
      },
      setTitle: jest.fn(),
    } as unknown as BrowserWindow;

    const fileName = faker.string.uuid();
    const resourceFilePath = `${fileName}.json`;
    const jsonPath = await writeFile({
      content: faker.string.sample(),
      path: faker.outputPath(`${fileName}_attribution.json`),
    });

    setGlobalBackendState({
      resourceFilePath,
      attributionFilePath: jsonPath,
    });

    await deleteAndCreateNewAttributionFileListener(mainWindow, () => {})();

    expect(fs.existsSync(jsonPath)).toBeFalsy();
    expect(loadInputAndOutputFromFilePath).toHaveBeenCalledWith(
      expect.anything(),
      resourceFilePath,
    );
  });
});

describe('getSelectBaseURLListener', () => {
  it('opens base url dialog and sends selected path to frontend', async () => {
    const mockCallback = jest.fn();
    const mainWindow = {
      webContents: { send: mockCallback as unknown } as WebContents,
    } as unknown as BrowserWindow;
    const baseURL = '/Users/path/to/sources';
    const expectedFormattedBaseURL = 'file:///Users/path/to/sources/{path}';

    (selectBaseURLDialog as jest.Mock).mockReturnValueOnce([baseURL]);

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
    const mainWindow = await initWindowAndBackendState();

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
    const mainWindow = await initWindowAndBackendState();
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
        id: faker.string.uuid(),
      },
      key2: {
        packageName: 'license text',
        resources: ['/a', '/b'],
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
    const mainWindow = await initWindowAndBackendState();

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
    const mainWindow = await initWindowAndBackendState();

    const listener = exportFileListener(mainWindow);

    setGlobalBackendState({
      compactBomFilePath: '/somefile.csv',
    });

    const attributionsWithResources: Attributions = {
      key1: {
        followUp: undefined,
        licenseText: 'license text',
        firstParty: true,
        id: faker.string.uuid(),
      },
      key2: {
        packageName: 'license text',
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
    const mainWindow = await initWindowAndBackendState();

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
        id: faker.string.uuid(),
      },
      key2: {
        packageName: 'license text',
        resources: ['/a', '/b'],
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
    const mainWindow = await initWindowAndBackendState();

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
    const mainWindow = await initWindowAndBackendState();
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
    const mainWindow = await initWindowAndBackendState();
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
    const mainWindow = await initWindowAndBackendState();
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
    const mainWindow = await initWindowAndBackendState();
    setGlobalBackendState({ spdxYamlFilePath: undefined });
    const testArgs: ExportSpdxDocumentYamlArgs = {
      type: ExportType.SpdxDocumentYaml,
      spdxAttributions: {},
    };

    jest
      .spyOn(errorHandling, 'showListenerErrorInMessageBox')
      .mockImplementation(jest.fn());

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
  it('sends an IPC message on the ImportFileShowDialog channel', async () => {
    const mainWindow = await initWindowAndBackendState();

    const fileFormat = importFileFormats[0];

    const listener = importFileListener(mainWindow, fileFormat);

    listener();

    expect(mainWindow.webContents.send).toHaveBeenCalledWith(
      AllowedFrontendChannels.ImportFileShowDialog,
      fileFormat,
    );
  });
});

describe('getImportFileSelectInputListener', () => {
  it('returns file path selected by user', async () => {
    const mainWindow = await initWindowAndBackendState();
    const fileFormat = importFileFormats[0];
    const selectedFilePath = '/home/input.json';

    const listener = importFileSelectInputListener(mainWindow);

    jest.mocked(openNonOpossumFileDialog).mockReturnValue([selectedFilePath]);

    const returnedFilePath = await listener(
      {} as Electron.IpcMainInvokeEvent,
      fileFormat,
    );

    expect(returnedFilePath).toBe(selectedFilePath);
  });

  it('returns an empty string when no file was selected', async () => {
    const mainWindow = await initWindowAndBackendState();
    const fileFormat = importFileFormats[0];

    const listener = importFileSelectInputListener(mainWindow);

    jest
      .mocked(openNonOpossumFileDialog)
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
    const mainWindow = await initWindowAndBackendState();
    const defaultPath = '/home';
    const selectedFilePath = '/home/input.opossum';

    const listener = importFileSelectSaveLocationListener(mainWindow);

    jest.mocked(saveFileDialog).mockReturnValue(selectedFilePath);

    const returnedFilePath = await listener(
      {} as Electron.IpcMainInvokeEvent,
      defaultPath,
    );

    expect(saveFileDialog).toHaveBeenCalledWith(defaultPath);
    expect(returnedFilePath).toBe(selectedFilePath);
  });

  it('returns an empty string when no save location was selected', async () => {
    const mainWindow = await initWindowAndBackendState();

    const listener = importFileSelectSaveLocationListener(mainWindow);

    jest.mocked(saveFileDialog).mockReturnValue(undefined);

    const returnedFilePath = await listener(
      {} as Electron.IpcMainInvokeEvent,
      '',
    );

    expect(returnedFilePath).toBe('');
  });
});

function initWindowAndBackendState(): Promise<BrowserWindow> {
  (writeCsvToFile as jest.Mock).mockReset();
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
