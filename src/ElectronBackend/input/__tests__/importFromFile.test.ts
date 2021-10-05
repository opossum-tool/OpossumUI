// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { BrowserWindow, dialog } from 'electron';
// @ts-ignore
import path from 'path';
import upath from 'upath';
import { NIL as uuidNil } from 'uuid';
import {
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
import { IpcChannel } from '../../../shared/ipc-channels';
import { loadJsonFromFilePath } from '../importFromFile';
import { EMPTY_PROJECT_METADATA } from '../../../Frontend/shared-constants';
import * as fs from 'fs';
import * as zlib from 'zlib';
import { getMessageBoxForParsingError } from '../../errorHandling/errorHandling';
import writeFileAtomic from 'write-file-atomic';
import { createTempFolder, deleteFolder } from '../../test-helpers';

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

const mainWindow = {
  webContents: {
    send: jest.fn(),
  },
  setTitle: jest.fn(),
} as unknown as BrowserWindow;

const externalAttributionUuid = 'ecd692d9-b154-4d4d-be8c-cdab48d027cd';

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
    SC: { name: 'Scancode', priority: 1000 },
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
    SC: { name: 'Scancode', priority: 1000 },
    OTHERSOURCE: { name: 'Crystal ball', priority: 2 },
    MERGER: { name: 'Suggested', priority: 11 },
    HHC: { name: 'High High Compute', priority: 10 },
    MS: { name: 'Metadata Scanner', priority: 9 },
    'REUSER:HHC': { name: 'High High Compute (old scan)', priority: 8 },
    'REUSER:MS': { name: 'Metadata Scanner (old scan)', priority: 7 },
    'REUSER:SC': { name: 'ScanCode (old scan)', priority: 6 },
    'REUSER:HC': { name: 'High Compute (old scan)', priority: 5 },
    'REUSER:MERGER': { name: 'Suggested (old scan)', priority: 4 },
    HC: { name: 'High Compute', priority: 2 },
    HINT: { name: 'Hint', priority: 1 },
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

  test('Handles Parsing error correctly', async () => {
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
    assertAttributionFilePath();
    deleteFolder(temporaryPath);
  });

  describe('Load file and parse file successfully, no attribution file', () => {
    test('for json file', async () => {
      const temporaryPath: string = createTempFolder();
      const jsonPath = path.join(upath.toUnix(temporaryPath), 'test.json');
      writeJsonToFile(jsonPath, inputFileContent);

      Date.now = jest.fn(() => 1);

      setGlobalBackendState({});
      await loadJsonFromFilePath(mainWindow.webContents, jsonPath);

      expect(mainWindow.webContents.send).toHaveBeenCalledTimes(2);
      expect(mainWindow.webContents.send).toHaveBeenLastCalledWith(
        IpcChannel['FileLoaded'],
        expectedFileContent
      );

      expect(dialog.showMessageBox).not.toBeCalled();
      assertAttributionFilePath();
      deleteFolder(temporaryPath);
    });

    test('for json.gz file', async () => {
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
        IpcChannel['FileLoaded'],
        expectedFileContent
      );
      expect(dialog.showMessageBox).not.toBeCalled();
      assertAttributionFilePath();
      deleteFolder(temporaryPath);
    });
  });

  test('Load file and parse json successfully, attribution file', async () => {
    const testUuid: string = uuidNil;
    const temporaryPath: string = createTempFolder();
    const jsonName = 'test.json';
    const jsonPath = path.join(upath.toUnix(temporaryPath), jsonName);
    const attributionJsonPath = path.join(
      upath.toUnix(temporaryPath),
      'test_attributions.json'
    );
    const followUpFilePath = path.join(
      upath.toUnix(temporaryPath),
      'test_follow_up.csv'
    );
    const compactBomFilePath = path.join(
      upath.toUnix(temporaryPath),
      'test_compact_component_list.csv'
    );
    const detailedBomFilePath = path.join(
      upath.toUnix(temporaryPath),
      'test_detailed_component_list.csv'
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
    assertGlobalBackendState(
      jsonPath,
      attributionJsonPath,
      followUpFilePath,
      compactBomFilePath,
      detailedBomFilePath,
      inputFileContent.metadata.projectTitle
    );
    deleteFolder(temporaryPath);
  });

  test('Load file and parse json successfully, attribution file and preSelected attributions', async () => {
    const inputFileContentWithPreselectedAttribution: ParsedOpossumInputFile = {
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
    const attributionJsonPath = path.join(
      upath.toUnix(temporaryPath),
      'test_attributions.json'
    );
    const followUpFilePath = path.join(
      upath.toUnix(temporaryPath),
      'test_follow_up.csv'
    );
    const compactBomFilePath = path.join(
      upath.toUnix(temporaryPath),
      'test_compact_component_list.csv'
    );
    const detailedBomFilePath = path.join(
      upath.toUnix(temporaryPath),
      'test_detailed_component_list.csv'
    );

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
          [externalAttributionUuid]: {
            packageName: 'my app',
            packageVersion: '1.2.3',
            copyright: '(c) first party',
            preSelected: true,
            attributionConfidence: 17,
          },
        },
        resourcesToAttributions: {
          '/a': [externalAttributionUuid],
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
      attributionBreakpoints: new Set(['/another/path/', '/some/path/']),
      filesWithChildren: new Set(['/some/package.json/']),
      baseUrlsForSources: {
        '/': 'https://github.com/opossum-tool/opossumUI/',
      },
      externalAttributionSources: {
        SC: { name: 'ScanCode', priority: 1000 },
        OTHERSOURCE: { name: 'Crystal ball', priority: 2 },
        MERGER: { name: 'Suggested', priority: 11 },
        HHC: { name: 'High High Compute', priority: 10 },
        MS: { name: 'Metadata Scanner', priority: 9 },
        'REUSER:HHC': { name: 'High High Compute (old scan)', priority: 8 },
        'REUSER:MS': { name: 'Metadata Scanner (old scan)', priority: 7 },
        'REUSER:SC': { name: 'ScanCode (old scan)', priority: 6 },
        'REUSER:HC': { name: 'High Compute (old scan)', priority: 5 },
        'REUSER:MERGER': { name: 'Suggested (old scan)', priority: 4 },
        HC: { name: 'High Compute', priority: 2 },
        HINT: { name: 'Hint', priority: 1 },
      },
    };

    expect(mainWindow.webContents.send).toBeCalledWith(
      IpcChannel['FileLoaded'],
      expectedLoadedFile
    );
    expect(dialog.showMessageBox).not.toBeCalled();

    assertGlobalBackendState(
      jsonPath,
      attributionJsonPath,
      followUpFilePath,
      compactBomFilePath,
      detailedBomFilePath
    );
    deleteFolder(temporaryPath);
  });

  test('Load file and parse json successfully, custom metadata', async () => {
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
      IpcChannel['FileLoaded'],
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
    IpcChannel['FileLoaded'],
    expectedLoadedFile
  );
  expect(dialog.showMessageBox).not.toBeCalled();
}

function assertGlobalBackendState(
  jsonPath: string,
  attributionJsonPath: string,
  followUpFilePath: string,
  compactBomFilePath: string,
  detailedBomFilePath: string,
  projectTitle?: string
): void {
  const globalBackendState = getGlobalBackendState();
  expect(globalBackendState.resourceFilePath).toBe(jsonPath);
  expect(globalBackendState.attributionFilePath).toBe(attributionJsonPath);
  expect(globalBackendState.followUpFilePath).toBe(followUpFilePath);
  expect(globalBackendState.compactBomFilePath).toBe(compactBomFilePath);
  expect(globalBackendState.detailedBomFilePath).toBe(detailedBomFilePath);
  expect(globalBackendState.projectTitle).toBe(projectTitle);
}

function assertAttributionFilePath(): void {
  const attributionFilePath = getGlobalBackendState().attributionFilePath;
  expect(attributionFilePath).not.toBeUndefined();
  if (attributionFilePath) {
    expect(path.basename(attributionFilePath)).toBe('test_attributions.json');
  }
}
