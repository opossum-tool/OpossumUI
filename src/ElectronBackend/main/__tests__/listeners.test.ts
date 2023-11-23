// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow, dialog, shell, WebContents } from 'electron';
import { strFromU8, unzip } from 'fflate';
import fs from 'fs';
import each from 'jest-each';
import * as MockDate from 'mockdate';
import path from 'path';
import upath from 'upath';

import { EMPTY_PROJECT_METADATA } from '../../../Frontend/shared-constants';
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
import { writeFile } from '../../../shared/write-file';
import { loadInputAndOutputFromFilePath } from '../../input/importFromFile';
import { writeCsvToFile } from '../../output/writeCsvToFile';
import { writeSpdxFile } from '../../output/writeSpdxFile';
import { createTempFolder, deleteFolder } from '../../test-helpers';
import { OpossumOutputFile, ParsedOpossumInputFile } from '../../types/types';
import { createWindow } from '../createWindow';
import { openFileDialog, selectBaseURLDialog } from '../dialogs';
import { setGlobalBackendState } from '../globalBackendState';
import {
  exportFile,
  getConvertInputFileToDotOpossumAndOpenListener,
  getDeleteAndCreateNewAttributionFileListener,
  getExportFileListener,
  getKeepFileListener,
  getOpenDotOpossumFileInsteadListener,
  getOpenFileListener,
  getOpenLinkListener,
  getOpenOutdatedInputFileListener,
  getSaveFileListener,
  getSelectBaseURLListener,
  linkHasHttpSchema,
} from '../listeners';

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

jest.mock('../../../shared/write-file', () => ({
  ...jest.requireActual('../../../shared/write-file'),
  writeFile: jest.fn(),
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
  openFileDialog: jest.fn(),
  selectBaseURLDialog: jest.fn(),
}));

const mockDate = 1603976726737;
MockDate.set(new Date(mockDate));

describe('getOpenFileListener', () => {
  it('sends signal for opening FileSupportPopup to frontend when .opossum file is not existent', async () => {
    const mainWindow = {
      webContents: {
        send: jest.fn(),
      },
      setTitle: jest.fn(),
    } as unknown as BrowserWindow;

    const fileName = 'resources_file.json';
    const temporaryPath: string = createTempFolder();
    const jsonPath = path.join(upath.toUnix(temporaryPath), fileName);

    fs.writeFileSync(jsonPath, 'dummy resource data');
    (openFileDialog as jest.Mock).mockReturnValueOnce([jsonPath]);

    await getOpenFileListener(mainWindow)();

    expect(openFileDialog).toBeCalled();
    expect(mainWindow.webContents.send).toHaveBeenCalledWith(
      AllowedFrontendChannels.ShowFileSupportPopup,
      { showFileSupportPopup: true, dotOpossumFileAlreadyExists: false },
    );
    deleteFolder(temporaryPath);
  });

  it('sends signal for opening FileSupportPopupDotOpossumExistent to frontend when .opossum file exists', async () => {
    const mainWindow = {
      webContents: {
        send: jest.fn(),
      },
      setTitle: jest.fn(),
    } as unknown as BrowserWindow;

    const fileName = 'resources_file.json';
    const temporaryPath: string = createTempFolder();
    const jsonPath = path.join(upath.toUnix(temporaryPath), fileName);
    fs.writeFileSync(jsonPath, 'dummy resource data');

    const dotOpossumFileName = 'resources_file.opossum';
    const dotOpossumPath = path.join(
      upath.toUnix(temporaryPath),
      dotOpossumFileName,
    );
    fs.writeFileSync(dotOpossumPath, 'dummy resource data');

    (openFileDialog as jest.Mock).mockReturnValueOnce([jsonPath]);

    await getOpenFileListener(mainWindow)();

    expect(openFileDialog).toBeCalled();
    expect(mainWindow.webContents.send).toHaveBeenCalledWith(
      AllowedFrontendChannels.ShowFileSupportPopup,
      { showFileSupportPopup: true, dotOpossumFileAlreadyExists: true },
    );
    deleteFolder(temporaryPath);
  });

  it('handles _attributions.json files correctly if .json present', async () => {
    const mainWindow = {
      webContents: {
        send: jest.fn(),
      },
      setTitle: jest.fn(),
    } as unknown as BrowserWindow;

    (writeFile as jest.Mock).mockImplementationOnce(
      jest.requireActual('../../../shared/write-file').writeFile,
    );

    const temporaryPath: string = createTempFolder();
    const attributionsPath = path.join(
      upath.toUnix(temporaryPath),
      'path_attributions.json',
    );

    const resourcePath = path.join(upath.toUnix(temporaryPath), 'path.json');
    await writeFile({ path: resourcePath, content: {} });

    (openFileDialog as jest.Mock).mockReturnValueOnce([attributionsPath]);

    await getOpenFileListener(mainWindow)();

    expect(openFileDialog).toBeCalled();
    expect(mainWindow.webContents.send).toHaveBeenCalledWith(
      AllowedFrontendChannels.ShowFileSupportPopup,
      { showFileSupportPopup: true, dotOpossumFileAlreadyExists: false },
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

    (writeFile as jest.Mock).mockImplementationOnce(
      jest.requireActual('../../../shared/write-file').writeFile,
    );

    const temporaryPath: string = createTempFolder();
    const attributionsPath = path.join(
      upath.toUnix(temporaryPath),
      'path_attributions.json',
    );

    const resourcePath = path.join(upath.toUnix(temporaryPath), 'path.json.gz');
    await writeFile({ path: resourcePath, content: {} });

    (openFileDialog as jest.Mock).mockReturnValueOnce([attributionsPath]);

    await getOpenFileListener(mainWindow)();

    expect(openFileDialog).toBeCalled();
    expect(mainWindow.webContents.send).toHaveBeenCalledWith(
      AllowedFrontendChannels.ShowFileSupportPopup,
      { showFileSupportPopup: true, dotOpossumFileAlreadyExists: false },
    );
    deleteFolder(temporaryPath);
  });
});

describe('getUseOutdatedInputFileFormatListener', () => {
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

      setGlobalBackendState({
        resourceFilePath: jsonPath,
      });

      await getOpenOutdatedInputFileListener(mainWindow)();

      expect(loadInputAndOutputFromFilePath).toHaveBeenCalledWith(
        expect.anything(),
        jsonPath,
      );
      expect(mainWindow.setTitle).toBeCalledWith(expectedTitle);
      deleteFolder(temporaryPath);
    },
  );

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
      'path.json',
    );

    (writeFile as jest.Mock).mockImplementationOnce(
      jest.requireActual('../../../shared/write-file').writeFile,
    );

    await writeFile({ path: resourcesFilePath, content: {} });

    const attributionsFilePath = path.join(
      upath.toUnix(temporaryPath),
      'path_attributions.json',
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
        test_uuid: validAttribution,
      },
      resourcesToAttributions: {
        '/path/1': ['test_uuid'],
      },
      resolvedExternalAttributions: [],
    };

    (writeFile as jest.Mock).mockImplementationOnce(
      jest.requireActual('../../../shared/write-file').writeFile,
    );

    await writeFile({ path: attributionsFilePath, content: attributions_data });

    setGlobalBackendState({
      resourceFilePath: resourcesFilePath,
    });

    await getOpenOutdatedInputFileListener(mainWindow)();

    expect(mainWindow.webContents.send).toHaveBeenCalledWith(
      AllowedFrontendChannels.ShowChangedInputFilePopup,
      {
        showChangedInputFilePopup: true,
      },
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

    (loadInputAndOutputFromFilePath as jest.Mock).mockImplementationOnce(
      jest.requireActual('../../input/importFromFile')
        .loadInputAndOutputFromFilePath,
    );
    (writeFile as jest.Mock).mockImplementationOnce(
      jest.requireActual('../../../shared/write-file').writeFile,
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
    setGlobalBackendState({
      resourceFilePath: jsonPath,
    });

    await getOpenOutdatedInputFileListener(mainWindow)();
    expect(mainWindow.setTitle).toBeCalledWith('Test Title');
    deleteFolder(temporaryPath);
  });
});

describe('getConvertInputFileToDotOpossumListener', () => {
  it('converts outdated input file formats correctly and loads .opossum', async () => {
    const mainWindow = {
      webContents: {
        send: jest.fn(),
      },
      setTitle: jest.fn(),
    } as unknown as BrowserWindow;

    const temporaryPath: string = createTempFolder();

    const resourceFileName = 'some_resource_file.json';
    const resourcesJsonPath = path.join(
      upath.toUnix(temporaryPath),
      resourceFileName,
    );
    const resourcesJson = 'dummy resource data';
    fs.writeFileSync(resourcesJsonPath, resourcesJson);

    const attributionsFileName = 'some_resource_file_attributions.json';
    const attributionsJsonPath = path.join(
      upath.toUnix(temporaryPath),
      attributionsFileName,
    );
    const attributionsJson = 'dummy attribution data';
    fs.writeFileSync(attributionsJsonPath, attributionsJson);

    setGlobalBackendState({
      resourceFilePath: resourcesJsonPath,
    });

    await getConvertInputFileToDotOpossumAndOpenListener(mainWindow)();

    const expectedDotOpossumFileName = 'some_resource_file.opossum';
    const expectedDotOpossumFilePath = path.join(
      upath.toUnix(temporaryPath),
      expectedDotOpossumFileName,
    );

    expect(loadInputAndOutputFromFilePath).toHaveBeenCalledWith(
      expect.anything(),
      expectedDotOpossumFilePath,
    );

    let parsedInputJson: unknown;
    let parsedOutputJson: unknown;

    await new Promise<void>((resolve) => {
      fs.readFile(expectedDotOpossumFilePath, (err, data) => {
        if (err) {
          throw err;
        }

        unzip(data, (err, unzippedData) => {
          if (err) {
            throw err;
          }
          parsedInputJson = strFromU8(unzippedData['input.json']);
          parsedOutputJson = strFromU8(unzippedData['output.json']);

          resolve();
        });
      });
    });

    expect(parsedInputJson).toEqual(resourcesJson);
    expect(parsedOutputJson).toEqual(attributionsJson);
    deleteFolder(temporaryPath);
  });
});

describe('getOpenDotOpossumFileListener', () => {
  it('opens .opossum file', async () => {
    const mainWindow = {
      webContents: {
        send: jest.fn(),
      },
      setTitle: jest.fn(),
    } as unknown as BrowserWindow;

    const temporaryPath: string = createTempFolder();

    const dotOpossumFileName = 'some_resource_file.opossum';
    const dotOpossumFilePath = path.join(
      upath.toUnix(temporaryPath),
      dotOpossumFileName,
    );

    setGlobalBackendState({
      opossumFilePath: dotOpossumFilePath,
    });

    await getOpenDotOpossumFileInsteadListener(mainWindow)();

    expect(loadInputAndOutputFromFilePath).toHaveBeenCalledWith(
      expect.anything(),
      dotOpossumFilePath,
    );
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
      attributionFilePath,
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
      '/somefile.json',
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
      '/somefile.json',
    );
  });
});

describe('getSelectBaseURLListener', () => {
  it('opens base url dialog and sends selected path to frontend', () => {
    const mockCallback = jest.fn();
    const mainWindow = {
      webContents: { send: mockCallback as unknown } as WebContents,
    } as unknown as BrowserWindow;
    const baseURL = '/Users/path/to/sources';
    const expectedFormattedBaseURL = 'file:///Users/path/to/sources/{path}';

    (selectBaseURLDialog as jest.Mock).mockReturnValueOnce([baseURL]);

    getSelectBaseURLListener(mainWindow)();

    expect(selectBaseURLDialog).toBeCalled();
    expect(mainWindow.webContents.send).toBeCalledWith(
      AllowedFrontendChannels.SetBaseURLForRoot,
      {
        baseURLForRoot: expectedFormattedBaseURL,
      },
    );
  });
});

describe('getSaveFileListener', () => {
  beforeEach(() => {
    (writeFile as jest.Mock).mockReset();
  });

  it('throws error when projectId is not set', async () => {
    const mockCallback = jest.fn();
    const mainWindow = {
      webContents: { send: mockCallback as unknown } as WebContents,
    } as unknown as BrowserWindow;
    setGlobalBackendState({});

    await getSaveFileListener(mainWindow)(
      AllowedFrontendChannels.SaveFileRequest,
      {
        manualAttributions: {},
        resourcesToAttributions: {},
        resolvedExternalAttributions: new Set(),
      },
    );

    expect(dialog.showMessageBox).toBeCalledWith(
      expect.objectContaining({
        type: 'error',
        message:
          'Error in app backend: Failed to save data. ' +
          'The projectId is incorrect.\nprojectId: undefined',
        buttons: ['Reload File', 'Quit'],
      }),
    );
    expect(writeFile).not.toBeCalled();
  });

  it('throws error when attributionFilePath and opossumFilePath are not set', async () => {
    const mockCallback = jest.fn();
    const mainWindow = {
      webContents: { send: mockCallback as unknown } as WebContents,
    } as unknown as BrowserWindow;
    setGlobalBackendState({});

    setGlobalBackendState({
      projectId: 'uuid_1',
    });

    await getSaveFileListener(mainWindow)(
      AllowedFrontendChannels.SaveFileRequest,
      {
        manualAttributions: {},
        resourcesToAttributions: {},
        resolvedExternalAttributions: new Set(),
      },
    );

    expect(dialog.showMessageBox).toBeCalledWith(
      expect.objectContaining({
        type: 'error',
        message:
          'Error in app backend: Tried to get file type when no file is loaded',
        buttons: ['Reload File', 'Quit'],
      }),
    );
    expect(writeFile).not.toBeCalled();
  });

  it(
    'calls createListenerCallBackWithErrorHandling when ' +
      'resourceFilePath, attributionFilePath and projectId are set',
    async () => {
      const mockCallback = jest.fn();
      const mainWindow = {
        webContents: { send: mockCallback as unknown } as WebContents,
      } as unknown as BrowserWindow;
      setGlobalBackendState({});

      const listener = getSaveFileListener(mainWindow);

      setGlobalBackendState({
        resourceFilePath: '/resourceFile.json',
        attributionFilePath: '/attributionFile.json',
        projectId: 'uuid_1',
      });

      await listener(AllowedFrontendChannels.SaveFileRequest, {
        manualAttributions: {},
        resourcesToAttributions: {},
        resolvedExternalAttributions: new Set<string>().add('id_1').add('id_2'),
      });

      expect(writeFile).toHaveBeenCalledWith({
        path: '/attributionFile.json',
        content: {
          manualAttributions: {},
          metadata: {
            projectId: 'uuid_1',
            fileCreationDate: `${mockDate}`,
          },
          resourcesToAttributions: {},
          resolvedExternalAttributions: ['id_1', 'id_2'],
        },
      });
    },
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
        message: 'Error in app backend: Failed to create export',
        buttons: ['Reload File', 'Quit'],
      }),
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
      true,
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
        message: 'Error in app backend: Failed to create export',
        buttons: ['Reload File', 'Quit'],
      }),
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
      ['packageName', 'packageVersion', 'licenseName', 'copyright', 'url'],
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
      ],
    );
  });
});

describe('getExportSpdxDocumentListener', () => {
  beforeEach(() => {
    (writeSpdxFile as jest.Mock).mockReset();
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
      }),
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

    await exportFile(mainWindow)(undefined, testArgs);

    expect(writeSpdxFile).toHaveBeenNthCalledWith(
      1,
      testSpdxDocumentYamlFilePath,
      testArgs,
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

    await expect(exportFile(mainWindow)(undefined, testArgs)).rejects.toThrow(
      'Failed to create export',
    );
    expect(writeSpdxFile).not.toBeCalled();
    expect(shell.showItemInFolder).not.toBeCalled();
  });
});

function prepareBomSPdxAndFollowUpit(): Promise<BrowserWindow> {
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
