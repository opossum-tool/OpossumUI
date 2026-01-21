// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { BrowserWindow, dialog } from 'electron';
import * as zlib from 'zlib';

import { EMPTY_PROJECT_METADATA } from '../../../Frontend/shared-constants';
import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import {
  Criticality,
  ParsedFileContentSerializable,
  RawCriticality,
} from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { writeFile, writeOpossumFile } from '../../../shared/write-file';
import { faker } from '../../../testing/Faker';
import {
  getGlobalBackendState,
  setGlobalBackendState,
} from '../../main/globalBackendState';
import {
  FileNotFoundError,
  JsonParsingError,
  OpossumOutputFile,
  ParsedOpossumInputFile,
  UnzipError,
} from '../../types/types';
import {
  getMessageBoxForFileNotFoundError,
  getMessageBoxForInvalidDotOpossumFileError,
  getMessageBoxForParsingError,
  getMessageBoxForUnzipError,
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

type SendCall = {
  channel: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: Array<any>;
};

class MockWebContents {
  #calls: Array<SendCall> = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  send(channel: string, args: Array<any>): void {
    this.#calls.push({ channel, args });
  }

  #callsFromChannel(channel: AllowedFrontendChannels): Array<SendCall> {
    return this.#calls.filter(
      (sendCall) => sendCall.channel === String(channel),
    );
  }

  numberOfCallsFromChannel(channel: AllowedFrontendChannels): number {
    return this.#callsFromChannel(channel).length;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastArgumentFromChannel(channel: AllowedFrontendChannels): any {
    const callsFromChannel = this.#callsFromChannel(channel);
    if (callsFromChannel.length) {
      return callsFromChannel[callsFromChannel.length - 1].args;
    }
    return undefined;
  }

  reset(): void {
    this.#calls = [];
  }
}

const mainWindow = {
  webContents: new MockWebContents(),
  setTitle: jest.fn(),
} as unknown as BrowserWindow;

const source = faker.opossum.source();
const inputFileContent: ParsedOpossumInputFile = {
  metadata: {
    ...EMPTY_PROJECT_METADATA,
    projectTitle: 'Test Title',
  },
  resources: {
    a: 1,
    folder: {},
  },
  config: {
    classifications: {
      0: 'GOOD',
      1: 'BAD',
    },
  },
  externalAttributions: {
    [externalAttributionUuid]: {
      source,
      packageName: 'my app',
      packageVersion: '1.2.3',
      packageNamespace: 'org.apache.xmlgraphics',
      packageType: 'maven',
      packagePURLAppendix:
        '?repository_url=repo.spring.io/release#everybody/loves/dogs',
      copyright: '(c) first party',
      firstParty: true,
      excludeFromNotice: true,
      criticality: RawCriticality[Criticality.High],
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

const expectedFileContent: ParsedFileContentSerializable = {
  metadata: {
    ...EMPTY_PROJECT_METADATA,
    projectTitle: 'Test Title',
  },
  resources: { a: 1, folder: {} },
  config: {
    classifications: {
      0: 'GOOD',
      1: 'BAD',
    },
  },
  manualAttributions: {
    attributions: {},
    resourcesToAttributions: {},
    attributionsToResources: {},
  },
  externalAttributions: {
    attributions: {
      [externalAttributionUuid]: {
        source,
        packageName: 'my app',
        packageVersion: '1.2.3',
        packageNamespace: 'org.apache.xmlgraphics',
        packageType: 'maven',
        packagePURLAppendix:
          '?repository_url=repo.spring.io/release#everybody/loves/dogs',
        copyright: '(c) first party',
        firstParty: true,
        excludeFromNotice: true,
        preferred: true,
        preferredOverOriginIds: ['test-id'],
        wasPreferred: true,
        criticality: Criticality.High,
        originalAttributionId: externalAttributionUuid,
        originalAttributionSource: source,
        originalAttributionWasPreferred: true,
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
  resolvedExternalAttributions: [],
  attributionBreakpoints: [],
  filesWithChildren: [],
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
    (mainWindow.webContents as unknown as MockWebContents).reset();
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

    const webContents = mainWindow.webContents as unknown as MockWebContents;
    expect(
      webContents.numberOfCallsFromChannel(
        AllowedFrontendChannels.ResetLoadedFile,
      ),
    ).toBe(2);
    expect(
      webContents.numberOfCallsFromChannel(AllowedFrontendChannels.FileLoaded),
    ).toBe(1);

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
        '/folder/': [testUuid],
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

    const webContents = mainWindow.webContents as unknown as MockWebContents;
    expect(
      webContents.lastArgumentFromChannel(AllowedFrontendChannels.FileLoaded),
    ).toEqual(JSON.stringify(expectedFileContent));
    expect(
      webContents.numberOfCallsFromChannel(AllowedFrontendChannels.FileLoaded),
    ).toBe(1);
    expect(
      webContents.numberOfCallsFromChannel(
        AllowedFrontendChannels.ResetLoadedFile,
      ),
    ).toBe(1);

    expect(dialog.showMessageBox).not.toHaveBeenCalled();
  });

  describe('Load file and parse file successfully, no attribution file', () => {
    it('for json file', async () => {
      const jsonPath = faker.outputPath(`${faker.string.uuid()}.json`);
      await writeFile({ path: jsonPath, content: inputFileContent });

      jest.spyOn(Date, 'now').mockReturnValue(1);

      setGlobalBackendState({});
      await loadInputAndOutputFromFilePath(mainWindow, jsonPath);

      const webContents = mainWindow.webContents as unknown as MockWebContents;
      expect(
        webContents.numberOfCallsFromChannel(
          AllowedFrontendChannels.FileLoaded,
        ),
      ).toBe(1);
      expect(
        webContents.lastArgumentFromChannel(AllowedFrontendChannels.FileLoaded),
      ).toEqual(JSON.stringify(expectedFileContent));
      expect(
        webContents.numberOfCallsFromChannel(
          AllowedFrontendChannels.ResetLoadedFile,
        ),
      ).toBe(1);

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

      const webContents = mainWindow.webContents as unknown as MockWebContents;
      expect(
        webContents.numberOfCallsFromChannel(
          AllowedFrontendChannels.FileLoaded,
        ),
      ).toBe(1);
      expect(
        webContents.lastArgumentFromChannel(AllowedFrontendChannels.FileLoaded),
      ).toEqual(JSON.stringify(expectedFileContent));
      expect(
        webContents.numberOfCallsFromChannel(
          AllowedFrontendChannels.ResetLoadedFile,
        ),
      ).toBe(1);
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
        '/folder': [testUuid], // this folder is missing the trailing slash intentionally - it gets sanitized during loading
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
      const source = faker.opossum.source();
      const inputFileContentWithPreselectedAttribution: ParsedOpossumInputFile =
        {
          metadata: EMPTY_PROJECT_METADATA,
          resources: {
            a: 1,
          },
          config: {
            classifications: {
              0: 'GOOD',
              1: 'BAD',
            },
          },
          externalAttributions: {
            [externalAttributionUuid]: {
              source,
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
      const expectedLoadedFile: ParsedFileContentSerializable = {
        metadata: EMPTY_PROJECT_METADATA,
        resources: { a: 1 },
        config: {
          classifications: {
            0: 'GOOD',
            1: 'BAD',
          },
        },
        manualAttributions: {
          attributions: {
            [manualAttributionUuid]: {
              packageName: 'my app',
              packageVersion: '1.2.3',
              copyright: '(c) first party',
              preSelected: true,
              attributionConfidence: 17,
              criticality: Criticality.None,
              comment: 'some comment',
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
              source,
              packageName: 'my app',
              packageVersion: '1.2.3',
              copyright: '(c) first party',
              preSelected: true,
              attributionConfidence: 17,
              preferred: true,
              preferredOverOriginIds: ['test-id'],
              criticality: Criticality.None,
              originalAttributionId: externalAttributionUuid,
              originalAttributionSource: source,
              comment: 'some comment',
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
        resolvedExternalAttributions: [],
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

      const webContents = mainWindow.webContents as unknown as MockWebContents;
      expect(
        webContents.lastArgumentFromChannel(AllowedFrontendChannels.FileLoaded),
      ).toEqual(JSON.stringify(expectedLoadedFile));
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

    const expectedLoadedFile: ParsedFileContentSerializable = {
      ...expectedFileContent,
      metadata: inputFileContentWithCustomMetadata.metadata,
    };

    const webContents = mainWindow.webContents as unknown as MockWebContents;
    expect(
      webContents.lastArgumentFromChannel(AllowedFrontendChannels.FileLoaded),
    ).toEqual(JSON.stringify(expectedLoadedFile));
    expect(dialog.showMessageBox).not.toHaveBeenCalled();
  });

  it('loads file and parses json successfully, origin Ids and original source', async () => {
    const source = faker.opossum.source();
    const inputFileContentWithOriginIds: ParsedOpossumInputFile = {
      ...inputFileContent,
      externalAttributions: {
        uuid: {
          source,
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

    const expectedLoadedFile: ParsedFileContentSerializable = {
      ...expectedFileContent,
      externalAttributions: {
        attributions: {
          uuid: {
            source,
            packageName: 'react',
            originIds: ['abc', 'def'],
            criticality: Criticality.None,
            originalAttributionId: 'uuid',
            originalAttributionSource: source,
            originalAttributionWasPreferred: undefined,
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

    const webContents = mainWindow.webContents as unknown as MockWebContents;
    expect(
      webContents.lastArgumentFromChannel(AllowedFrontendChannels.FileLoaded),
    ).toEqual(JSON.stringify(expectedLoadedFile));
    expect(
      webContents.numberOfCallsFromChannel(AllowedFrontendChannels.FileLoaded),
    ).toBe(1);
    expect(
      webContents.numberOfCallsFromChannel(
        AllowedFrontendChannels.ResetLoadedFile,
      ),
    ).toBe(1);
  });

  it('handles non existing file correctly', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1);

    const dialogMock = dialog.showMessageBox as jest.Mock;
    dialogMock.mockImplementationOnce(
      jest.fn(() => {
        return Promise.resolve({
          response: 0,
        });
      }),
    );

    setGlobalBackendState({});
    const jsonPath = faker.outputPath(`${faker.string.uuid()}.json`);
    await loadInputAndOutputFromFilePath(mainWindow, jsonPath);
    const expectedBackendState = getGlobalBackendState();
    const webContents = mainWindow.webContents as unknown as MockWebContents;
    expect(
      webContents.numberOfCallsFromChannel(
        AllowedFrontendChannels.ResetLoadedFile,
      ),
    ).toBe(1);
    expect(
      webContents.numberOfCallsFromChannel(AllowedFrontendChannels.FileLoaded),
    ).toBe(0);
    expect(dialogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.stringContaining('does not exist.'),
      }),
    );
    expect(getGlobalBackendState()).toEqual(expectedBackendState);
  });

  it('handles corrupt zip files correctly', async () => {
    const opossumPath = faker.outputPath(`${faker.string.uuid()}.opossum`);
    await writeFile({ path: opossumPath, content: '0' });

    jest.spyOn(Date, 'now').mockReturnValue(1);
    const dialogMock = dialog.showMessageBox as jest.Mock;
    dialogMock.mockImplementationOnce(
      jest.fn(() => {
        return Promise.resolve({
          response: 0,
        });
      }),
    );

    setGlobalBackendState({});
    await loadInputAndOutputFromFilePath(mainWindow, opossumPath);

    const expectedBackendState = getGlobalBackendState();
    const webContents = mainWindow.webContents as unknown as MockWebContents;
    expect(
      webContents.numberOfCallsFromChannel(
        AllowedFrontendChannels.ResetLoadedFile,
      ),
    ).toBe(1);
    expect(
      webContents.numberOfCallsFromChannel(AllowedFrontendChannels.FileLoaded),
    ).toBe(0);
    expect(dialogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.stringContaining('could not be unzipped'),
      }),
    );
    expect(getGlobalBackendState()).toEqual(expectedBackendState);
  });
});

function assertFileLoadedCorrectly(testUuid: string): void {
  const expectedLoadedFile: ParsedFileContentSerializable = {
    ...expectedFileContent,
    manualAttributions: {
      attributions: {
        [testUuid]: {
          packageName: 'Package',
          packageVersion: '1.0',
          licenseText: 'MIT',
          followUp: true,
          criticality: Criticality.None,
          id: testUuid,
        },
      },
      resourcesToAttributions: {
        '/folder/': [testUuid],
      },
      attributionsToResources: {
        [testUuid]: ['/folder/'],
      },
    },
  };

  const webContents = mainWindow.webContents as unknown as MockWebContents;
  expect(
    webContents.lastArgumentFromChannel(AllowedFrontendChannels.FileLoaded),
  ).toEqual(JSON.stringify(expectedLoadedFile));
  expect(
    webContents.numberOfCallsFromChannel(AllowedFrontendChannels.FileLoaded),
  ).toBe(1);
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
        detail: `parsingErrorMessage\n${text.errorBoundary.outdatedAppVersion}`,
        buttons: ['OK'],
      }),
    );
  });
});

describe('getMessageBoxForFileNotFoundError', () => {
  it('returns a messageBox', async () => {
    const fileNotFoundError: FileNotFoundError = {
      message: 'fileNotFoundErrorMessage',
      type: 'fileNotFoundError',
    };

    await getMessageBoxForFileNotFoundError(fileNotFoundError.message);

    expect(dialog.showMessageBox).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        message: 'An error occurred while trying to open the file.',
        detail: 'fileNotFoundErrorMessage',
        buttons: ['OK'],
      }),
    );
  });
});

describe('getMessageBoxForUnzipError', () => {
  it('returns a messageBox', async () => {
    const unzipError: UnzipError = {
      message: 'unzipErrorMessage',
      type: 'unzipError',
    };

    await getMessageBoxForUnzipError(unzipError.message);

    expect(dialog.showMessageBox).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        message: 'An error occurred while trying to unzip the file.',
        detail: 'unzipErrorMessage',
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
