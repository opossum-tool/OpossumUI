// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { BrowserWindow, dialog } from 'electron';
import path from 'path';
import upath from 'upath';
import {
  Criticality,
  FollowUp,
  PackageInfo,
  ParsedFileContent,
} from '../../../shared/shared-types';
import {
  getGlobalBackendState,
  setGlobalBackendState,
} from '../../main/globalBackendState';
import { writeJsonToFile } from '../../output/writeJsonToFile';
import { OpossumOutputFile, ParsedOpossumInputFile } from '../../types/types';
import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { loadJsonFromFilePath } from '../importFromFile';
import { EMPTY_PROJECT_METADATA } from '../../../Frontend/shared-constants';
import * as fs from 'fs';
import * as zlib from 'zlib';
import { getMessageBoxForParsingError } from '../../errorHandling/errorHandling';
import writeFileAtomic from 'write-file-atomic';
import { createTempFolder, deleteFolder } from '../../test-helpers';

const externalAttributionUuid = 'ecd692d9-b154-4d4d-be8c-external';
const manualAttributionUuid = 'ecd692d9-b154-4d4d-be8c-manual';

jest.mock('electron', () => ({
  dialog: {
    showOpenDialogSync: jest.fn(),
    showMessageBox: jest.fn(),
  },
  BrowserWindow: {
    getFocusedWindow: jest.fn(),
  },
}));

jest.mock('electron-log');

jest.mock('../../errorHandling/errorHandling', () => ({
  getMessageBoxForParsingError: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: (): string => manualAttributionUuid,
}));

const mainWindow = {
  webContents: {
    send: jest.fn(),
  },
  setTitle: jest.fn(),
} as unknown as BrowserWindow;

const inputFileContent: ParsedOpossumInputFile = {
  metadata: {
    ...EMPTY_PROJECT_METADATA,
    projectTitle: 'Test Title',
  },
  resources: {
    a: 1,
    folder: {},
  },
  externalAttributions: {
    [externalAttributionUuid]: {
      source: {
        name: 'REUSER:HHC',
        documentConfidence: 13,
      },
      packageName: 'my app',
      packageVersion: '1.2.3',
      packageNamespace: 'org.apache.xmlgraphics',
      packageType: 'maven',
      packagePURLAppendix:
        '?repository_url=repo.spring.io/release#everybody/loves/dogs',
      copyright: '(c) first party',
      firstParty: true,
      excludeFromNotice: true,
      criticality: Criticality.High,
    },
  },
  frequentLicenses: [
    {
      shortName: 'MIT',
      fullName: 'MIT license',
      defaultText: 'MIT license text',
    },
  ],
  resourcesToAttributions: {
    '/a': [externalAttributionUuid],
    '/folder': [externalAttributionUuid],
  },
  externalAttributionSources: {
    SC: { name: 'ScanCode', priority: 1000 },
    OTHERSOURCE: { name: 'Crystal ball', priority: 2 },
  },
};

const expectedFileContent: ParsedFileContent = {
  metadata: {
    ...EMPTY_PROJECT_METADATA,
    projectTitle: 'Test Title',
  },
  resources: { a: 1, folder: {} },
  manualAttributions: {
    attributions: {},
    resourcesToAttributions: {},
  },
  externalAttributions: {
    attributions: {
      [externalAttributionUuid]: {
        source: {
          name: 'REUSER:HHC',
          documentConfidence: 13,
        },
        packageName: 'my app',
        packageVersion: '1.2.3',
        packageNamespace: 'org.apache.xmlgraphics',
        packagePURLAppendix:
          '?repository_url=repo.spring.io/release#everybody/loves/dogs',
        packageType: 'maven',
        copyright: '(c) first party',
        excludeFromNotice: true,
        firstParty: true,
        criticality: Criticality.High,
      },
    },
    resourcesToAttributions: {
      '/a': [externalAttributionUuid],
      '/folder/': [externalAttributionUuid],
    },
  },
  frequentLicenses: {
    nameOrder: ['MIT'],
    texts: {
      MIT: 'MIT license text',
    },
  },
  resolvedExternalAttributions: new Set(),
  attributionBreakpoints: new Set(),
  filesWithChildren: new Set(),
  baseUrlsForSources: {},
  externalAttributionSources: {
    SC: { name: 'ScanCode', priority: 1000 },
    OTHERSOURCE: { name: 'Crystal ball', priority: 2 },
  },
};

const validAttribution: PackageInfo = {
  packageName: 'Package',
  packageVersion: '1.0',
  licenseText: 'MIT',
  followUp: 'FOLLOW_UP',
};

const validMetadata = {
  projectId: inputFileContent.metadata.projectId,
  fileCreationDate: '1',
};

describe('Test of loading function', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('handles Parsing error correctly', async () => {
    const temporaryPath: string = createTempFolder();
    const corruptJsonPath = path.join(
      upath.toUnix(temporaryPath),
      'corrupt_test.json'
    );
    const jsonPath = path.join(upath.toUnix(temporaryPath), 'test.json');
    writeJsonToFile(jsonPath, inputFileContent);

    Date.now = jest.fn(() => 1);

    // @ts-ignore
    dialog.showMessageBox.mockImplementationOnce(
      jest.fn(() => {
        return Promise.resolve({
          response: 0,
        });
      })
    );

    setGlobalBackendState({});
    await loadJsonFromFilePath(mainWindow.webContents, jsonPath);
    const expectedBackendState = getGlobalBackendState();

    writeFileAtomic.sync(corruptJsonPath, '{"name": 3');

    await loadJsonFromFilePath(mainWindow.webContents, corruptJsonPath);

    expect(mainWindow.webContents.send).toHaveBeenCalledTimes(3);

    expect(getMessageBoxForParsingError).toHaveBeenCalled();
    expect(getGlobalBackendState()).toEqual(expectedBackendState);
    deleteFolder(temporaryPath);
  });

  describe('Load file and parse file successfully, no attribution file', () => {
    it('for json file', async () => {
      const temporaryPath: string = createTempFolder();
      const jsonPath = path.join(upath.toUnix(temporaryPath), 'test.json');
      writeJsonToFile(jsonPath, inputFileContent);

      Date.now = jest.fn(() => 1);

      setGlobalBackendState({});
      await loadJsonFromFilePath(mainWindow.webContents, jsonPath);

      expect(mainWindow.webContents.send).toHaveBeenCalledTimes(2);
      expect(mainWindow.webContents.send).toHaveBeenLastCalledWith(
        AllowedFrontendChannels.FileLoaded,
        expectedFileContent
      );

      expect(dialog.showMessageBox).not.toBeCalled();
      deleteFolder(temporaryPath);
    });

    it('for json.gz file', async () => {
      const temporaryPath: string = createTempFolder();
      const jsonPath = path.join(upath.toUnix(temporaryPath), 'test.json.gz');
      fs.writeFileSync(
        jsonPath,
        zlib.gzipSync(JSON.stringify(inputFileContent))
      );

      Date.now = jest.fn(() => 1);

      setGlobalBackendState({});
      await loadJsonFromFilePath(mainWindow.webContents, jsonPath);

      expect(mainWindow.webContents.send).toHaveBeenCalledTimes(2);
      expect(mainWindow.webContents.send).toHaveBeenLastCalledWith(
        AllowedFrontendChannels.FileLoaded,
        expectedFileContent
      );
      expect(dialog.showMessageBox).not.toBeCalled();
      deleteFolder(temporaryPath);
    });
  });

  it('loads file and parses json successfully, attribution file', async () => {
    const testUuid = 'test_uuid';
    const temporaryPath: string = createTempFolder();
    const jsonName = 'test.json';
    const jsonPath = path.join(upath.toUnix(temporaryPath), jsonName);
    const attributionJsonPath = path.join(
      upath.toUnix(temporaryPath),
      'test_attributions.json'
    );

    writeJsonToFile(jsonPath, inputFileContent);
    const attributions: OpossumOutputFile = {
      metadata: validMetadata,
      manualAttributions: {
        [testUuid]: validAttribution,
      },
      resourcesToAttributions: {
        '/path/1': [testUuid],
      },
      resolvedExternalAttributions: [],
    };
    writeJsonToFile(attributionJsonPath, attributions);

    Date.now = jest.fn(() => 1);

    const globalBackendState = {
      resourceFilePath: '/previous/file.json',
      attributionFilePath: '/previous/file.json',
    };

    setGlobalBackendState(globalBackendState);
    await loadJsonFromFilePath(mainWindow.webContents, jsonPath);

    assertFileLoadedCorrectly(testUuid);
    expect(getGlobalBackendState().projectTitle).toBe(
      inputFileContent.metadata.projectTitle
    );
    expect(getGlobalBackendState().projectId).toBe(
      inputFileContent.metadata.projectId
    );
    expect(getGlobalBackendState().inputContainsCriticalExternalAttributions)
      .toBeTruthy;
    deleteFolder(temporaryPath);
  });

  it(
    'loads file and parses json successfully, ' +
      'attribution file and preSelected attributions',
    async () => {
      const inputFileContentWithPreselectedAttribution: ParsedOpossumInputFile =
        {
          metadata: EMPTY_PROJECT_METADATA,
          resources: {
            a: 1,
          },
          externalAttributions: {
            [externalAttributionUuid]: {
              source: {
                name: 'REUSER:HHC',
                documentConfidence: 13,
              },
              packageName: 'my app',
              packageVersion: '1.2.3',
              copyright: '(c) first party',
              preSelected: true,
              attributionConfidence: 17,
              comment: 'some comment',
            },
          },
          frequentLicenses: [
            {
              shortName: 'MIT',
              fullName: 'MIT license',
              defaultText: 'MIT license text',
            },
            {
              shortName: 'GPL',
              fullName: 'GPL license',
              defaultText: 'GPL license text',
            },
          ],
          resourcesToAttributions: { '/a': [externalAttributionUuid] },
          attributionBreakpoints: ['/some/path/', '/another/path/'],
          filesWithChildren: ['/some/package.json/'],
          baseUrlsForSources: {
            '/': 'https://github.com/opossum-tool/opossumUI/',
          },
          externalAttributionSources: {
            SC: { name: 'ScanCode', priority: 1000 },
            OTHERSOURCE: { name: 'Crystal ball', priority: 2 },
          },
        };
      const temporaryPath: string = createTempFolder();
      const jsonName = 'test.json';
      const jsonPath = path.join(upath.toUnix(temporaryPath), jsonName);

      writeJsonToFile(jsonPath, inputFileContentWithPreselectedAttribution);

      Date.now = jest.fn(() => 1);

      const globalBackendState = {
        resourceFilePath: '/previous/file.json',
        attributionFilePath: '/previous/file.json',
      };

      setGlobalBackendState(globalBackendState);

      await loadJsonFromFilePath(mainWindow.webContents, jsonPath);
      const expectedLoadedFile: ParsedFileContent = {
        metadata: EMPTY_PROJECT_METADATA,
        resources: { a: 1 },
        manualAttributions: {
          attributions: {
            [manualAttributionUuid]: {
              packageName: 'my app',
              packageVersion: '1.2.3',
              comment: 'some comment',
              copyright: '(c) first party',
              preSelected: true,
              attributionConfidence: 17,
            },
          },
          resourcesToAttributions: {
            '/a': [manualAttributionUuid],
          },
        },
        externalAttributions: {
          attributions: {
            [externalAttributionUuid]: {
              source: {
                name: 'REUSER:HHC',
                documentConfidence: 13,
              },
              packageName: 'my app',
              packageVersion: '1.2.3',
              copyright: '(c) first party',
              preSelected: true,
              attributionConfidence: 17,
              comment: 'some comment',
            },
          },
          resourcesToAttributions: {
            '/a': [externalAttributionUuid],
          },
        },
        frequentLicenses: {
          nameOrder: ['MIT', 'GPL'],
          texts: {
            MIT: 'MIT license text',
            GPL: 'GPL license text',
          },
        },
        resolvedExternalAttributions: new Set(),
        attributionBreakpoints: new Set(['/some/path/', '/another/path/']),
        filesWithChildren: new Set(['/some/package.json/']),
        baseUrlsForSources: {
          '/': 'https://github.com/opossum-tool/opossumUI/',
        },
        externalAttributionSources: {
          SC: { name: 'ScanCode', priority: 1000 },
          OTHERSOURCE: { name: 'Crystal ball', priority: 2 },
        },
      };

      expect(mainWindow.webContents.send).toBeCalledWith(
        AllowedFrontendChannels.FileLoaded,
        expectedLoadedFile
      );
      expect(dialog.showMessageBox).not.toBeCalled();

      deleteFolder(temporaryPath);
    }
  );

  it('loads file and parses json successfully, custom metadata', async () => {
    const inputFileContentWithCustomMetadata: ParsedOpossumInputFile = {
      ...inputFileContent,
      metadata: {
        projectId: '2a58a469-738e-4508-98d3-a27bce6e71f7',
        fileCreationDate: '2020-07-23 11:47:13.764544',
        customObject: {
          foo: 'bar',
          nested: {
            object: 'value',
          },
        },
      },
    };
    const temporaryPath: string = createTempFolder();
    const jsonName = 'test.json';
    const jsonPath = path.join(upath.toUnix(temporaryPath), jsonName);

    writeJsonToFile(jsonPath, inputFileContentWithCustomMetadata);

    Date.now = jest.fn(() => 1);

    setGlobalBackendState({});
    await loadJsonFromFilePath(mainWindow.webContents, jsonPath);

    const expectedLoadedFile: ParsedFileContent = {
      ...expectedFileContent,
      metadata: inputFileContentWithCustomMetadata.metadata,
    };

    expect(mainWindow.webContents.send).toBeCalledWith(
      AllowedFrontendChannels.FileLoaded,
      expectedLoadedFile
    );
    expect(dialog.showMessageBox).not.toBeCalled();
    deleteFolder(temporaryPath);
  });
});

function assertFileLoadedCorrectly(testUuid: string): void {
  const expectedLoadedFile: ParsedFileContent = {
    ...expectedFileContent,
    manualAttributions: {
      attributions: {
        [testUuid]: {
          packageName: 'Package',
          packageVersion: '1.0',
          licenseText: 'MIT',
          followUp: FollowUp,
        },
      },
      resourcesToAttributions: {
        '/path/1': [testUuid],
      },
    },
  };

  expect(mainWindow.webContents.send).toBeCalledWith(
    AllowedFrontendChannels.FileLoaded,
    expectedLoadedFile
  );
  expect(dialog.showMessageBox).not.toBeCalled();
}
