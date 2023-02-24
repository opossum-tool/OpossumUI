// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { BrowserWindow, dialog, shell, WebContents } from 'electron';
import {
  AllowedFrontendChannels,
  IpcChannel,
} from '../../../shared/ipc-channels';
import {
  Attributions,
  AttributionsWithResources,
  ExportSpdxDocumentJsonArgs,
  ExportSpdxDocumentYamlArgs,
  ExportType,
  PackageInfo,
} from '../../../shared/shared-types';
import { loadInputAndOutputFromFilePath } from '../../input/importFromFile';
import { openFileDialog, selectBaseURLDialog } from '../dialogs';
import { writeCsvToFile } from '../../output/writeCsvToFile';
import { writeJsonToFile } from '../../output/writeJsonToFile';
import { createWindow } from '../createWindow';
import { setGlobalBackendState } from '../globalBackendState';
import {
  _exportFileAndOpenFolder,
  getDeleteAndCreateNewAttributionFileListener,
  getExportFileListener,
  getKeepFileListener,
  getOpenFileListener,
  getOpenLinkListener,
  getSaveFileListener,
  getSelectBaseURLListener,
  linkHasHttpSchema,
} from '../listeners';

import * as MockDate from 'mockdate';

import path from 'path';
import upath from 'upath';
import { writeSpdxFile } from '../../output/writeSpdxFile';
import { createTempFolder, deleteFolder } from '../../test-helpers';
import each from 'jest-each';
import fs from 'fs';
import { OpossumOutputFile, ParsedOpossumInputFile } from '../../types/types';
import { EMPTY_PROJECT_METADATA } from '../../../Frontend/shared-constants';
import { getFilePathWithAppendix } from '../../utils/getFilePathWithAppendix';

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
  loadInputAndOutputFromFilePath: jest.fn(),
}));

jest.mock('../../utils/getFilePathWithAppendix', () => ({
  getFilePathWithAppendix: jest.fn(),
}));

jest.mock('../dialogs', () => ({
  openFileDialog: jest.fn(),
  selectBaseURLDialog: jest.fn(),
}));

const mockDate = 1603976726737;
MockDate.set(new Date(mockDate));

describe('getOpenFileListener', () => {
  each([
    ['path.json', 'path.json'],
    ['path%20with%2Fencoding.json', 'path with/encoding.json'],
  ]).it(
    'calls loadInputAndOutputFromFilePath and handles %s correctly',
    async (filePath: string, expectedTitle: string) => {
      const mainWindow = {
        webContents: {
          send: jest.fn(),
        },
        setTitle: jest.fn(),
      } as unknown as BrowserWindow;

      const temporaryPath: string = createTempFolder();
      const jsonPath = path.join(upath.toUnix(temporaryPath), filePath);

      fs.writeFileSync(jsonPath, 'dummy data');
      // @ts-ignore
      openFileDialog.mockReturnValueOnce([jsonPath]);

      await getOpenFileListener(mainWindow)();

      expect(openFileDialog).toBeCalled();
      expect(loadInputAndOutputFromFilePath).toHaveBeenCalledWith(
        expect.anything(),
        jsonPath
      );
      expect(getFilePathWithAppendix).toHaveBeenCalledWith(
        expect.anything(),
        '_attributions.json'
      );
      expect(getFilePathWithAppendix).toHaveBeenCalledWith(
        expect.anything(),
        '_follow_up.csv'
      );
      expect(getFilePathWithAppendix).toHaveBeenCalledWith(
        expect.anything(),
        '_compact_component_list.csv'
      );
      expect(mainWindow.setTitle).toBeCalledWith(expectedTitle);
      deleteFolder(temporaryPath);
    }
  );

  it('handles _attributions.json files correctly if .json present', async () => {
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
    expect(loadInputAndOutputFromFilePath).toHaveBeenCalledWith(
      expect.anything(),
      expectedPath
    );
    deleteFolder(temporaryPath);
  });

  it('checks the case with non-matching checksums', async () => {
    const mainWindow = {
      webContents: {
        send: jest.fn(),
      },
      setTitle: jest.fn(),
    } as unknown as BrowserWindow;

    const temporaryPath: string = createTempFolder();
    const resourcesFilePath = path.join(
      upath.toUnix(temporaryPath),
      'path.json'
    );

    // @ts-ignore
    getFilePathWithAppendix.mockImplementation(
      jest.requireActual('../../utils/getFilePathWithAppendix')
        .getFilePathWithAppendix
    );
    // @ts-ignore
    writeJsonToFile.mockImplementationOnce(
      jest.requireActual('../../output/writeJsonToFile').writeJsonToFile
    );

    writeJsonToFile(resourcesFilePath, {});

    const attributionsFilePath = path.join(
      upath.toUnix(temporaryPath),
      'path_attributions.json'
    );
    const validAttribution: PackageInfo = {
      packageName: 'Package',
      packageVersion: '1.0',
      licenseText: 'MIT',
      followUp: 'FOLLOW_UP',
    };
    const attributions_data: OpossumOutputFile = {
      metadata: {
        projectId: 'test_id',
        fileCreationDate: '1',
        inputFileMD5Checksum: 'fake_checksum',
      },
      manualAttributions: {
        ['test_uuid']: validAttribution,
      },
      resourcesToAttributions: {
        '/path/1': ['test_uuid'],
      },
      resolvedExternalAttributions: [],
    };

    // @ts-ignore
    writeJsonToFile.mockImplementationOnce(
      jest.requireActual('../../output/writeJsonToFile').writeJsonToFile
    );

    writeJsonToFile(attributionsFilePath, attributions_data);

    // @ts-ignore
    openFileDialog.mockReturnValueOnce([resourcesFilePath]);

    await getOpenFileListener(mainWindow)();

    expect(openFileDialog).toBeCalled();
    expect(mainWindow.webContents.send).toHaveBeenCalledWith(
      AllowedFrontendChannels.ShowChangedInputFilePopup,
      {
        showChangedInputFilePopup: true,
      }
    );
    deleteFolder(temporaryPath);
  });

  it('handles _attributions.json files correctly if .json.gz present', async () => {
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
    expect(loadInputAndOutputFromFilePath).toHaveBeenCalledWith(
      expect.anything(),
      expectedPath
    );
    deleteFolder(temporaryPath);
  });

  it('sets title to project title if available', async () => {
    const mainWindow = {
      webContents: {
        send: jest.fn(),
      },
      setTitle: jest.fn(),
    } as unknown as BrowserWindow;

    // @ts-ignore
    loadInputAndOutputFromFilePath.mockImplementationOnce(
      jest.requireActual('../../input/importFromFile')
        .loadInputAndOutputFromFilePath
    );
    // @ts-ignore
    getFilePathWithAppendix.mockImplementation(
      jest.requireActual('../../utils/getFilePathWithAppendix')
        .getFilePathWithAppendix
    );
    // @ts-ignore
    writeJsonToFile.mockImplementationOnce(
      jest.requireActual('../../output/writeJsonToFile').writeJsonToFile
    );

    const temporaryPath: string = createTempFolder();
    const jsonPath = path.join(upath.toUnix(temporaryPath), 'path.json');
    const inputFileContent: ParsedOpossumInputFile = {
      metadata: {
        ...EMPTY_PROJECT_METADATA,
        projectTitle: 'Test Title',
      },
      resources: {},
      externalAttributions: {},
      frequentLicenses: [],
      resourcesToAttributions: {},
      externalAttributionSources: {},
    };
    fs.writeFileSync(jsonPath, JSON.stringify(inputFileContent));
    // @ts-ignore
    openFileDialog.mockReturnValueOnce([jsonPath]);

    await getOpenFileListener(mainWindow)();

    expect(openFileDialog).toBeCalled();
    expect(mainWindow.setTitle).toBeCalledWith('Test Title');
    deleteFolder(temporaryPath);
  });
});

describe('getDeleteAndCreateNewAttributionFileListener', () => {
  it('deletes attribution file and calls loadInputAndOutputFromFilePath', async () => {
    const mainWindow = {
      webContents: {
        send: jest.fn(),
      },
      setTitle: jest.fn(),
    } as unknown as BrowserWindow;

    const attributionFilePath = '/somefile_attribution.json';
    const temporaryPath: string = createTempFolder();
    const jsonPath = path.join(
      upath.toUnix(temporaryPath),
      attributionFilePath
    );
    fs.writeFileSync(jsonPath, 'dummy data');

    setGlobalBackendState({
      resourceFilePath: '/somefile.json',
      attributionFilePath: jsonPath,
    });

    await getDeleteAndCreateNewAttributionFileListener(mainWindow)();

    expect(fs.existsSync(jsonPath)).toBeFalsy();
    expect(loadInputAndOutputFromFilePath).toHaveBeenCalledWith(
      expect.anything(),
      '/somefile.json'
    );
    deleteFolder(temporaryPath);
  });
});

describe('getKeepFileListener', () => {
  it('calls loadInputAndOutputFromFilePath with a correct path', async () => {
    const mainWindow = {
      webContents: {
        send: jest.fn(),
      },
      setTitle: jest.fn(),
    } as unknown as BrowserWindow;

    setGlobalBackendState({
      resourceFilePath: '/somefile.json',
    });

    await getKeepFileListener(mainWindow)();

    expect(loadInputAndOutputFromFilePath).toHaveBeenCalledWith(
      expect.anything(),
      '/somefile.json'
    );
  });
});

describe('getSelectBaseURLListener', () => {
  it('opens base url dialog and sends selected path to frontend', () => {
    const mockCallback = jest.fn();
    const webContents = { send: mockCallback as unknown } as WebContents;
    const baseURL = '/Users/path/to/sources';
    const expectedFormattedBaseURL = 'file:///Users/path/to/sources/{path}';

    // @ts-ignore
    selectBaseURLDialog.mockReturnValueOnce([baseURL]);

    getSelectBaseURLListener(webContents)();

    expect(selectBaseURLDialog).toBeCalled();
    expect(webContents.send).toBeCalledWith(
      AllowedFrontendChannels.SetBaseURLForRoot,
      {
        baseURLForRoot: expectedFormattedBaseURL,
      }
    );
  });
});

describe('getSaveFileListener', () => {
  beforeEach(() => {
    // @ts-ignore
    writeJsonToFile.mockReset();
  });

  it('throws error when projectId is not set', async () => {
    const mockCallback = jest.fn();
    const webContents = { send: mockCallback as unknown } as WebContents;
    setGlobalBackendState({});

    await getSaveFileListener(webContents)(
      AllowedFrontendChannels.SaveFileRequest,
      {
        manualAttributions: {},
        resourcesToAttributions: {},
        resolvedExternalAttributions: new Set(),
      }
    );

    expect(dialog.showMessageBox).toBeCalledWith(
      expect.objectContaining({
        type: 'error',
        message:
          'Error in app backend: Failed to save data. ' +
          'The projectId is incorrect.\nprojectId: undefined',
        buttons: ['Reload File', 'Quit'],
      })
    );
    expect(writeJsonToFile).not.toBeCalled();
  });

  it('throws error when attributionFilePath is not set', async () => {
    const mockCallback = jest.fn();
    const webContents = { send: mockCallback as unknown } as WebContents;
    setGlobalBackendState({});

    setGlobalBackendState({
      projectId: 'uuid_1',
    });

    await getSaveFileListener(webContents)(
      AllowedFrontendChannels.SaveFileRequest,
      {
        manualAttributions: {},
        resourcesToAttributions: {},
        resolvedExternalAttributions: new Set(),
      }
    );

    expect(dialog.showMessageBox).toBeCalledWith(
      expect.objectContaining({
        type: 'error',
        message:
          'Error in app backend: Failed to save data. ' +
          'The file paths are incorrect.\nresourceFilePath: undefined' +
          '\nattributionFilePath: undefined',
        buttons: ['Reload File', 'Quit'],
      })
    );
    expect(writeJsonToFile).not.toBeCalled();
  });

  it(
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

      listener(AllowedFrontendChannels.SaveFileRequest, {
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
  it('throws error when followUpFilePath is not set', async () => {
    const mainWindow = await prepareBomSPdxAndFollowUpit();

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

  it('calls getExportFollowUpListener', async () => {
    const mainWindow = await prepareBomSPdxAndFollowUpit();
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
        'url',
        'copyright',
        'licenseName',
        'resources',
      ],
      true
    );
  });
});

describe('getExportBomListener', () => {
  it('throws error when bomFilePath is not set', async () => {
    const mainWindow = await prepareBomSPdxAndFollowUpit();

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

  it('calls getExportBomListener for compact bom', async () => {
    const mainWindow = await prepareBomSPdxAndFollowUpit();

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

  it('calls getExportBomListener for detailed bom', async () => {
    const mainWindow = await prepareBomSPdxAndFollowUpit();

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
    const mainWindow = await prepareBomSPdxAndFollowUpit();

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
    const mainWindow = await prepareBomSPdxAndFollowUpit();
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
    const mainWindow = await prepareBomSPdxAndFollowUpit();
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
  it('opens link', async () => {
    const testLink = 'https://www.test.de/link';
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
    const mainWindow = await prepareBomSPdxAndFollowUpit();
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
    const mainWindow = await prepareBomSPdxAndFollowUpit();
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

async function prepareBomSPdxAndFollowUpit(): Promise<BrowserWindow> {
  // @ts-ignore
  writeCsvToFile.mockReset();
  setGlobalBackendState({});

  return await createWindow();
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
