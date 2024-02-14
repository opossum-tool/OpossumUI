// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow, dialog } from 'electron';
import * as zlib from 'zlib';

import { EMPTY_PROJECT_METADATA } from '../../../Frontend/shared-constants';
import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { Criticality, ParsedFileContent } from '../../../shared/shared-types';
import { writeFile, writeOpossumFile } from '../../../shared/write-file';
import { faker } from '../../../testing/Faker';
import {
  getGlobalBackendState,
  setGlobalBackendState,
} from '../../main/globalBackendState';
import {
  JsonParsingError,
  OpossumOutputFile,
  ParsedOpossumInputFile,
} from '../../types/types';
import {
  getMessageBoxForInvalidDotOpossumFileError,
  getMessageBoxForParsingError,
  loadInputAndOutputFromFilePath,
} from '../importFromFile';

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
  app: { exit: jest.fn(), getName: jest.fn(), getVersion: jest.fn() },
}));

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
      preferred: true,
      preferredOverOriginIds: ['test-id'],
      wasPreferred: true,
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
    attributionsToResources: {},
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
        preferred: true,
        preferredOverOriginIds: ['test-id'],
        wasPreferred: true,
        id: externalAttributionUuid,
      },
    },
    resourcesToAttributions: {
      '/a': [externalAttributionUuid],
      '/folder/': [externalAttributionUuid],
    },
    attributionsToResources: {
      [externalAttributionUuid]: ['/a', '/folder/'],
    },
  },
  frequentLicenses: {
    nameOrder: [{ shortName: 'MIT', fullName: 'MIT license' }],
    texts: {
      MIT: 'MIT license text',
      'MIT license': 'MIT license text',
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

const validMetadata = {
  projectId: inputFileContent.metadata.projectId,
  fileCreationDate: '1',
};

describe('Test of loading function', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('handles Parsing error correctly', async () => {
    const jsonPath = faker.outputPath(`${faker.string.uuid()}.json`);
    await writeFile({ path: jsonPath, content: inputFileContent });

    jest.spyOn(Date, 'now').mockReturnValue(1);

    (dialog.showMessageBox as jest.Mock).mockImplementationOnce(
      jest.fn(() => {
        return Promise.resolve({
          response: 0,
        });
      }),
    );

    setGlobalBackendState({});
    await loadInputAndOutputFromFilePath(mainWindow, jsonPath);
    const expectedBackendState = getGlobalBackendState();

    const corruptJsonPath = faker.outputPath(`${faker.string.uuid()}.json`);
    await writeFile({ path: corruptJsonPath, content: '{"name": 3' });

    await loadInputAndOutputFromFilePath(mainWindow, corruptJsonPath);

    const expectedNumberOfCalls = 3;
    expect(mainWindow.webContents.send).toHaveBeenCalledTimes(
      expectedNumberOfCalls,
    );

    expect(getGlobalBackendState()).toEqual(expectedBackendState);
  });

  it('loads .opossum file and parses jsons successfully', async () => {
    const testUuid = 'test_uuid';
    const opossumPath = faker.outputPath(`${faker.string.uuid()}.opossum`);

    const attributions: OpossumOutputFile = {
      metadata: validMetadata,
      manualAttributions: {
        [testUuid]: {
          packageName: 'Package',
          packageVersion: '1.0',
          licenseText: 'MIT',
          followUp: 'FOLLOW_UP',
        },
      },
      resourcesToAttributions: {
        '/path/1': [testUuid],
      },
      resolvedExternalAttributions: [],
    };
    await writeOpossumFile({
      input: inputFileContent,
      output: attributions,
      path: opossumPath,
    });

    jest.spyOn(Date, 'now').mockReturnValue(1);

    const globalBackendState = {
      resourceFilePath: '/previous/file.opossum',
    };

    setGlobalBackendState(globalBackendState);
    await loadInputAndOutputFromFilePath(mainWindow, opossumPath);

    assertFileLoadedCorrectly(testUuid);
    expect(getGlobalBackendState().projectTitle).toBe(
      inputFileContent.metadata.projectTitle,
    );
    expect(getGlobalBackendState().projectId).toBe(
      inputFileContent.metadata.projectId,
    );
  });

  it('loads .opossum file, no output.json', async () => {
    const opossumPath = faker.outputPath(`${faker.string.uuid()}.opossum`);

    await writeOpossumFile({
      input: inputFileContent,
      path: opossumPath,
    });

    jest.spyOn(Date, 'now').mockReturnValue(1691761892037);

    setGlobalBackendState({});
    await loadInputAndOutputFromFilePath(mainWindow, opossumPath);

    expect(mainWindow.webContents.send).toHaveBeenLastCalledWith(
      AllowedFrontendChannels.FileLoaded,
      expectedFileContent,
    );
    expect(mainWindow.webContents.send).toHaveBeenCalledTimes(2);

    expect(dialog.showMessageBox).not.toHaveBeenCalled();
  });

  describe('Load file and parse file successfully, no attribution file', () => {
    it('for json file', async () => {
      const jsonPath = faker.outputPath(`${faker.string.uuid()}.json`);
      await writeFile({ path: jsonPath, content: inputFileContent });

      jest.spyOn(Date, 'now').mockReturnValue(1);

      setGlobalBackendState({});
      await loadInputAndOutputFromFilePath(mainWindow, jsonPath);

      expect(mainWindow.webContents.send).toHaveBeenCalledTimes(2);
      expect(mainWindow.webContents.send).toHaveBeenLastCalledWith(
        AllowedFrontendChannels.FileLoaded,
        expectedFileContent,
      );

      expect(dialog.showMessageBox).not.toHaveBeenCalled();
    });

    it('for json.gz file', async () => {
      const jsonPath = faker.outputPath(`${faker.string.uuid()}.json.gz`);
      await writeFile({
        content: zlib.gzipSync(JSON.stringify(inputFileContent)),
        path: jsonPath,
      });

      jest.spyOn(Date, 'now').mockReturnValue(1);

      setGlobalBackendState({});
      await loadInputAndOutputFromFilePath(mainWindow, jsonPath);

      expect(mainWindow.webContents.send).toHaveBeenCalledTimes(2);
      expect(mainWindow.webContents.send).toHaveBeenLastCalledWith(
        AllowedFrontendChannels.FileLoaded,
        expectedFileContent,
      );
      expect(dialog.showMessageBox).not.toHaveBeenCalled();
    });
  });

  it('loads file and parses json successfully, attribution file', async () => {
    const testUuid = 'test_uuid';
    const fileName = faker.string.uuid();
    const jsonPath = faker.outputPath(`${fileName}.json`);
    const attributionJsonPath = faker.outputPath(
      `${fileName}_attributions.json`,
    );

    await writeFile({ path: jsonPath, content: inputFileContent });
    const attributions: OpossumOutputFile = {
      metadata: validMetadata,
      manualAttributions: {
        [testUuid]: {
          packageName: 'Package',
          packageVersion: '1.0',
          licenseText: 'MIT',
          followUp: 'FOLLOW_UP',
        },
      },
      resourcesToAttributions: {
        '/path/1': [testUuid],
      },
      resolvedExternalAttributions: [],
    };
    await writeFile({ path: attributionJsonPath, content: attributions });

    jest.spyOn(Date, 'now').mockReturnValue(1);

    const globalBackendState = {
      resourceFilePath: '/previous/file.json',
      attributionFilePath: '/previous/file.json',
    };

    setGlobalBackendState(globalBackendState);
    await loadInputAndOutputFromFilePath(mainWindow, jsonPath);

    assertFileLoadedCorrectly(testUuid);
    expect(getGlobalBackendState().projectTitle).toBe(
      inputFileContent.metadata.projectTitle,
    );
    expect(getGlobalBackendState().projectId).toBe(
      inputFileContent.metadata.projectId,
    );
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
              preferred: true,
              preferredOverOriginIds: ['test-id'],
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
              fullName: 'General Public License',
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
      const jsonPath = faker.outputPath(`${faker.string.uuid()}.json`);

      await writeFile({
        path: jsonPath,
        content: inputFileContentWithPreselectedAttribution,
      });

      jest.spyOn(Date, 'now').mockReturnValue(1);

      const globalBackendState = {
        resourceFilePath: '/previous/file.json',
        attributionFilePath: '/previous/file.json',
      };

      setGlobalBackendState(globalBackendState);

      await loadInputAndOutputFromFilePath(mainWindow, jsonPath);
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
              id: manualAttributionUuid,
            },
          },
          resourcesToAttributions: {
            '/a': [manualAttributionUuid],
          },
          attributionsToResources: {
            [manualAttributionUuid]: ['/a'],
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
              preferred: true,
              preferredOverOriginIds: ['test-id'],
              id: externalAttributionUuid,
            },
          },
          resourcesToAttributions: {
            '/a': [externalAttributionUuid],
          },
          attributionsToResources: {
            [externalAttributionUuid]: ['/a'],
          },
        },
        frequentLicenses: {
          nameOrder: [
            { shortName: 'MIT', fullName: 'MIT license' },
            {
              shortName: 'GPL',
              fullName: 'General Public License',
            },
          ],
          texts: {
            MIT: 'MIT license text',
            'MIT license': 'MIT license text',
            GPL: 'GPL license text',
            'General Public License': 'GPL license text',
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

      expect(mainWindow.webContents.send).toHaveBeenLastCalledWith(
        AllowedFrontendChannels.FileLoaded,
        expectedLoadedFile,
      );
      expect(dialog.showMessageBox).not.toHaveBeenCalled();
    },
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
    const jsonPath = faker.outputPath(`${faker.string.uuid()}.json`);

    await writeFile({
      path: jsonPath,
      content: inputFileContentWithCustomMetadata,
    });

    jest.spyOn(Date, 'now').mockReturnValue(1);

    setGlobalBackendState({});
    await loadInputAndOutputFromFilePath(mainWindow, jsonPath);

    const expectedLoadedFile: ParsedFileContent = {
      ...expectedFileContent,
      metadata: inputFileContentWithCustomMetadata.metadata,
    };

    expect(mainWindow.webContents.send).toHaveBeenLastCalledWith(
      AllowedFrontendChannels.FileLoaded,
      expectedLoadedFile,
    );
    expect(dialog.showMessageBox).not.toHaveBeenCalled();
  });

  it('loads file and parses json successfully, origin Ids and original source', async () => {
    const inputFileContentWithOriginIds: ParsedOpossumInputFile = {
      ...inputFileContent,
      externalAttributions: {
        uuid: {
          source: faker.opossum.source({
            name: 'MERGER',
            documentConfidence: 13,
            additionalName: 'Original Source',
          }),
          packageName: 'react',
          originIds: ['abc', 'def'],
        },
      },
      resourcesToAttributions: {
        '/a': ['uuid'],
      },
    };
    const jsonPath = faker.outputPath(`${faker.string.uuid()}.json`);

    await writeFile({ path: jsonPath, content: inputFileContentWithOriginIds });

    jest.spyOn(Date, 'now').mockReturnValue(1);

    setGlobalBackendState({});
    await loadInputAndOutputFromFilePath(mainWindow, jsonPath);

    const expectedLoadedFile: ParsedFileContent = {
      ...expectedFileContent,
      externalAttributions: {
        attributions: {
          uuid: {
            source: faker.opossum.source({
              name: 'MERGER',
              documentConfidence: 13,
              additionalName: 'Original Source',
            }),
            packageName: 'react',
            originIds: ['abc', 'def'],
            id: 'uuid',
          },
        },
        resourcesToAttributions: {
          '/a': ['uuid'],
        },
        attributionsToResources: {
          uuid: ['/a'],
        },
      },
    };

    expect(mainWindow.webContents.send).toHaveBeenCalledTimes(2);
    expect(mainWindow.webContents.send).toHaveBeenLastCalledWith(
      AllowedFrontendChannels.FileLoaded,
      expectedLoadedFile,
    );
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
          followUp: true,
          id: testUuid,
        },
      },
      resourcesToAttributions: {
        '/path/1': [testUuid],
      },
      attributionsToResources: {
        [testUuid]: ['/path/1'],
      },
    },
  };

  expect(mainWindow.webContents.send).toHaveBeenCalledWith(
    AllowedFrontendChannels.FileLoaded,
    expectedLoadedFile,
  );
  expect(dialog.showMessageBox).not.toHaveBeenCalled();
}

describe('getMessageBoxForParsingError', () => {
  it('returns a messageBox', async () => {
    const parsingError: JsonParsingError = {
      message: 'parsingErrorMessage',
      type: 'jsonParsingError',
    };

    await getMessageBoxForParsingError(parsingError.message);

    expect(dialog.showMessageBox).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        message: 'Error parsing the input file.',
        detail: 'parsingErrorMessage',
        buttons: ['OK'],
      }),
    );
  });
});

describe('getMessageBoxForInvalidDotOpossumFileError', () => {
  it('returns a message box with correct content', async () => {
    const testFilesInArchive = 'inpt.json, output.json';

    await getMessageBoxForInvalidDotOpossumFileError(testFilesInArchive);

    expect(dialog.showMessageBox).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        message: "Error loading '.opossum' file.",
        detail:
          "The '.opossum' file is invalid as it does not contain an 'input.json'. " +
          `Actual files in the archive: ${testFilesInArchive}.`,
        buttons: ['OK'],
      }),
    );
  });
});
