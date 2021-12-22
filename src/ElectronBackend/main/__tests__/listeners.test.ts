// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { BrowserWindow, dialog, shell, WebContents } from 'electron';
import { IpcChannel } from '../../../shared/ipc-channels';
import {
  Attributions,
  AttributionsWithResources,
  ExportSpdxDocumentJsonArgs,
  ExportSpdxDocumentYamlArgs,
  ExportType,
} from '../../../shared/shared-types';
import { loadJsonFromFilePath } from '../../input/importFromFile';
import { openFileDialog, selectBaseURLDialog } from '../dialogs';
import { writeCsvToFile } from '../../output/writeCsvToFile';
import { writeJsonToFile } from '../../output/writeJsonToFile';
import { createWindow } from '../createWindow';
import { setGlobalBackendState } from '../globalBackendState';
import {
  _exportFileAndOpenFolder,
  getExportFileListener,
  getOpenFileListener,
  getOpenLinkListener,
  getSaveFileListener,
  getSelectBaseURLListener,
} from '../listeners';

import * as MockDate from 'mockdate';
import each from 'jest-each';

import path from 'path';
import upath from 'upath';
import { writeSpdxFile } from '../../output/writeSpdxFile';
import { createTempFolder, deleteFolder } from '../../test-helpers';

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

jest.mock('electron-log');

jest.mock('../../output/writeJsonToFile', () => ({
  writeJsonToFile: jest.fn(),
}));

jest.mock('../../output/writeCsvToFile', () => ({
  writeCsvToFile: jest.fn(),
}));

jest.mock('../../output/writeSpdxFile', () => ({
  writeSpdxFile: jest.fn(),
}));

jest.mock('../../input/importFromFile', () => ({
  loadJsonFromFilePath: jest.fn(),
}));

jest.mock('../dialogs', () => ({
  openFileDialog: jest.fn(),
  selectBaseURLDialog: jest.fn(),
}));

const mockDate = 1603976726737;
MockDate.set(new Date(mockDate));

describe('getOpenFileListener', () => {
  each([
    ['json/path.json', 'path.json'],
    ['json/path%20with%2Fencoding.json', 'path with/encoding.json'],
  ]).test(
    'calls loadJsonFromFilePath and handles %s correctly',
    async (filePath: string, expectedTitle: string) => {
      const mainWindow = {
        webContents: {
          send: jest.fn(),
        },
        setTitle: jest.fn(),
      } as unknown as BrowserWindow;

      const jsonPath = filePath;
      // @ts-ignore
      openFileDialog.mockReturnValueOnce([jsonPath]);

      await getOpenFileListener(mainWindow)();

      expect(openFileDialog).toBeCalled();
      expect(loadJsonFromFilePath).toHaveBeenCalledWith(
        expect.anything(),
        jsonPath
      );
      expect(mainWindow.setTitle).toBeCalledWith(expectedTitle);
    }
  );

  test('handles _attributions.json files correctly if .json present', async () => {
    const mainWindow = {
      webContents: {
        send: jest.fn(),
      },
      setTitle: jest.fn(),
    } as unknown as BrowserWindow;

    // @ts-ignore
    writeJsonToFile.mockImplementationOnce(
      jest.requireActual('../../output/writeJsonToFile').writeJsonToFile
    );

    const temporaryPath: string = createTempFolder();
    const jsonPath = path.join(
      upath.toUnix(temporaryPath),
      'path_attributions.json'
    );

    const expectedPath = path.join(upath.toUnix(temporaryPath), 'path.json');

    writeJsonToFile(expectedPath, {});

    // @ts-ignore
    openFileDialog.mockReturnValueOnce([jsonPath]);

    await getOpenFileListener(mainWindow)();

    expect(openFileDialog).toBeCalled();
    expect(loadJsonFromFilePath).toHaveBeenCalledWith(
      expect.anything(),
      expectedPath
    );
    deleteFolder(temporaryPath);
  });

  test('handles _attributions.json files correctly if .json.gz present', async () => {
    const mainWindow = {
      webContents: {
        send: jest.fn(),
      },
      setTitle: jest.fn(),
    } as unknown as BrowserWindow;

    // @ts-ignore
    writeJsonToFile.mockImplementationOnce(
      jest.requireActual('../../output/writeJsonToFile').writeJsonToFile
    );

    const temporaryPath: string = createTempFolder();
    const jsonPath = path.join(
      upath.toUnix(temporaryPath),
      'path_attributions.json'
    );

    const expectedPath = path.join(upath.toUnix(temporaryPath), 'path.json.gz');

    writeJsonToFile(expectedPath, {});

    // @ts-ignore
    openFileDialog.mockReturnValueOnce([jsonPath]);

    await getOpenFileListener(mainWindow)();

    expect(openFileDialog).toBeCalled();
    expect(loadJsonFromFilePath).toHaveBeenCalledWith(
      expect.anything(),
      expectedPath
    );
    deleteFolder(temporaryPath);
  });

  test('sets title to project title if available', async () => {
    const mainWindow = {
      webContents: {
        send: jest.fn(),
      },
      setTitle: jest.fn(),
    } as unknown as BrowserWindow;

    const jsonPath = 'json/path.json';
    // @ts-ignore
    openFileDialog.mockReturnValueOnce([jsonPath]);

    setGlobalBackendState({
      projectTitle: 'Test Title',
    });

    await getOpenFileListener(mainWindow)();

    expect(openFileDialog).toBeCalled();
    expect(mainWindow.setTitle).toBeCalledWith('Test Title');
  });
});

describe('getSelectBaseURLListener', () => {
  test('opens base url dialog and sends selected path to frontend', () => {
    const mockCallback = jest.fn();
    const webContents = { send: mockCallback as unknown } as WebContents;
    const baseURL = '/Users/path/to/sources';
    const expectedFormattedBaseURL = 'file:///Users/path/to/sources/{path}';

    // @ts-ignore
    selectBaseURLDialog.mockReturnValueOnce([baseURL]);

    getSelectBaseURLListener(webContents)();

    expect(selectBaseURLDialog).toBeCalled();
    expect(webContents.send).toBeCalledWith(IpcChannel.SetBaseURLForRoot, {
      baseURLForRoot: expectedFormattedBaseURL,
    });
  });
});

describe('getSaveFileListener', () => {
  beforeEach(() => {
    // @ts-ignore
    writeJsonToFile.mockReset();
  });

  test('throws error when attributionFilePath and projectId are not set', async () => {
    const mockCallback = jest.fn();
    const webContents = { send: mockCallback as unknown } as WebContents;
    setGlobalBackendState({});

    await getSaveFileListener(webContents)(IpcChannel.SaveFileRequest, {
      manualAttributions: {},
      resourcesToAttributions: {},
      resolvedExternalAttributions: new Set(),
    });

    expect(dialog.showMessageBox).toBeCalledWith(
      expect.objectContaining({
        type: 'error',
        message:
          'Error in app backend: Failed to save data. Either projectId or file' +
          ' path are incorrect.\nprojectId: undefined\nattributionFilePath: undefined',
        buttons: ['Reload File', 'Quit'],
      })
    );
    expect(writeJsonToFile).not.toBeCalled();
  });

  test(
    'calls createListenerCallBackWithErrorHandling when ' +
      'attributionFilePath and projectId are set',
    () => {
      const mockCallback = jest.fn();
      const webContents = { send: mockCallback as unknown } as WebContents;
      setGlobalBackendState({});

      const listener = getSaveFileListener(webContents);

      setGlobalBackendState({
        attributionFilePath: '/somefile.json',
        projectId: 'uuid_1',
      });

      listener(IpcChannel.SaveFileRequest, {
        manualAttributions: {},
        resourcesToAttributions: {},
        resolvedExternalAttributions: new Set<string>().add('id_1').add('id_2'),
      });

      expect(writeJsonToFile).toBeCalledWith('/somefile.json', {
        manualAttributions: {},
        metadata: {
          projectId: 'uuid_1',
          fileCreationDate: `${mockDate}`,
        },
        resourcesToAttributions: {},
        resolvedExternalAttributions: ['id_1', 'id_2'],
      });
    }
  );
});

describe('getExportFollowUpListener', () => {
  test('throws error when followUpFilePath is not set', async () => {
    const mainWindow = await prepareBomSPdxAndFollowUpTest();

    await getExportFileListener(mainWindow)(IpcChannel.ExportFile, {
      type: ExportType.FollowUp,
      followUpAttributionsWithResources: {},
    });

    expect(dialog.showMessageBox).toBeCalledWith(
      expect.objectContaining({
        type: 'error',
        message: 'Error in app backend: Failed to create FollowUp export.',
        buttons: ['Reload File', 'Quit'],
      })
    );
    expect(writeCsvToFile).not.toBeCalled();
  });

  test('calls getExportFollowUpListener', async () => {
    const mainWindow = await prepareBomSPdxAndFollowUpTest();
    setGlobalBackendState({
      followUpFilePath: '/somefile.csv',
    });

    const listener = getExportFileListener(mainWindow);

    const followUpAttributionsWithResources: AttributionsWithResources = {
      key1: {
        followUp: undefined,
        licenseText: 'license text',
        firstParty: true,
        resources: ['/'],
      },
      key2: {
        packageName: 'license text',
        resources: ['/a', '/b'],
      },
    };

    await listener(IpcChannel.ExportFile, {
      type: ExportType.FollowUp,
      followUpAttributionsWithResources,
    });

    expect(writeCsvToFile).toBeCalledWith(
      '/somefile.csv',
      followUpAttributionsWithResources,
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
        'excludeFromNotice',
        'resources',
      ],
      true
    );
  });
});

describe('getExportBomListener', () => {
  test('throws error when bomFilePath is not set', async () => {
    const mainWindow = await prepareBomSPdxAndFollowUpTest();

    await getExportFileListener(mainWindow)(IpcChannel.ExportFile, {
      type: ExportType.CompactBom,
      bomAttributions: {},
    });

    expect(dialog.showMessageBox).toBeCalledWith(
      expect.objectContaining({
        type: 'error',
        message: 'Error in app backend: Failed to create CompactBom export.',
        buttons: ['Reload File', 'Quit'],
      })
    );
    expect(writeCsvToFile).not.toBeCalled();
  });

  test('calls getExportBomListener for compact bom', async () => {
    const mainWindow = await prepareBomSPdxAndFollowUpTest();

    const listener = getExportFileListener(mainWindow);

    setGlobalBackendState({
      compactBomFilePath: '/somefile.csv',
    });

    const attributionsWithResources: Attributions = {
      key1: {
        followUp: undefined,
        licenseText: 'license text',
        firstParty: true,
      },
      key2: {
        packageName: 'license text',
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
      ['packageName', 'packageVersion', 'licenseName', 'copyright', 'url']
    );
  });

  test('calls getExportBomListener for detailed bom', async () => {
    const mainWindow = await prepareBomSPdxAndFollowUpTest();

    const listener = getExportFileListener(mainWindow);

    setGlobalBackendState({
      detailedBomFilePath: '/somefile.csv',
    });

    const attributionsWithResources: AttributionsWithResources = {
      key1: {
        followUp: undefined,
        licenseText: 'license text',
        firstParty: true,
        resources: ['/somefile.csv'],
      },
      key2: {
        packageName: 'license text',
        resources: ['/a', '/b'],
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
      ]
    );
  });
});

describe('getExportSpdxDocumentListener', () => {
  beforeEach(() => {
    // @ts-ignore
    writeSpdxFile.mockReset();
  });

  it('throws if path is not set', async () => {
    const mainWindow = await prepareBomSPdxAndFollowUpTest();

    await getExportFileListener(mainWindow)(IpcChannel.ExportFile, {
      type: ExportType.SpdxDocumentYaml,
      spdxAttributions: {},
    });

    expect(dialog.showMessageBox).toBeCalledWith(
      expect.objectContaining({
        type: 'error',
        buttons: ['Reload File', 'Quit'],
      })
    );

    expect(writeSpdxFile).not.toBeCalled();
  });

  it('calls getExportSpdxDocumentListener for yaml', async () => {
    const mainWindow = await prepareBomSPdxAndFollowUpTest();
    const testArgs: ExportSpdxDocumentYamlArgs = {
      type: ExportType.SpdxDocumentYaml,
      spdxAttributions: {},
    };

    const listener = getExportFileListener(mainWindow);

    setGlobalBackendState({ spdxYamlFilePath: '/test.yaml' });

    await listener(IpcChannel.ExportFile, testArgs);

    expect(writeSpdxFile).toHaveBeenNthCalledWith(1, '/test.yaml', testArgs);
  });

  it('calls getExportSpdxDocumentListener for json', async () => {
    const mainWindow = await prepareBomSPdxAndFollowUpTest();
    const testArgs: ExportSpdxDocumentJsonArgs = {
      type: ExportType.SpdxDocumentJson,
      spdxAttributions: {},
    };

    const listener = getExportFileListener(mainWindow);

    setGlobalBackendState({ spdxJsonFilePath: '/test.json' });

    await listener(IpcChannel.ExportFile, testArgs);

    expect(writeSpdxFile).toHaveBeenNthCalledWith(1, '/test.json', testArgs);
  });
});

describe('getOpenLinkListener', () => {
  test('opens link', async () => {
    const testLink = 'www.test.de/link';
    await getOpenLinkListener()(IpcChannel.OpenLink, {
      link: testLink,
    });

    expect(shell.openExternal).toBeCalledWith(testLink);
  });
});

describe('_exportFileAndOpenFolder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the createFile function', async () => {
    const mainWindow = await prepareBomSPdxAndFollowUpTest();
    const testSpdxDocumentYamlFilePath = '/some/path.json';
    setGlobalBackendState({ spdxYamlFilePath: testSpdxDocumentYamlFilePath });
    const testArgs: ExportSpdxDocumentYamlArgs = {
      type: ExportType.SpdxDocumentYaml,
      spdxAttributions: {},
    };

    await _exportFileAndOpenFolder(mainWindow)(undefined, testArgs);

    expect(writeSpdxFile).toHaveBeenNthCalledWith(
      1,
      testSpdxDocumentYamlFilePath,
      testArgs
    );
    expect(shell.showItemInFolder).toBeCalledWith(testSpdxDocumentYamlFilePath);
  });

  it('throws if outputFilePath is not set', async () => {
    const mainWindow = await prepareBomSPdxAndFollowUpTest();
    setGlobalBackendState({ spdxYamlFilePath: undefined });
    const testArgs: ExportSpdxDocumentYamlArgs = {
      type: ExportType.SpdxDocumentYaml,
      spdxAttributions: {},
    };

    await expect(
      _exportFileAndOpenFolder(mainWindow)(undefined, testArgs)
    ).rejects.toThrow('Failed to create SpdxDocumentYaml export.');
    expect(writeSpdxFile).not.toBeCalled();
    expect(shell.showItemInFolder).not.toBeCalled();
  });
});

async function prepareBomSPdxAndFollowUpTest(): Promise<BrowserWindow> {
  // @ts-ignore
  writeCsvToFile.mockReset();
  setGlobalBackendState({});

  return await createWindow();
}
