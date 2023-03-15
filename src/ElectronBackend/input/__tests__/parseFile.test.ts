// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
// @ts-ignore
import { NIL as uuidNil } from 'uuid';
import path from 'path';
import zlib from 'zlib';
import upath from 'upath';
import {
  OpossumOutputFile,
  ParsedOpossumInputAndOutput,
  ParsedOpossumInputFile,
  ParsedOpossumOutputFile,
} from '../../types/types';
import {
  parseInputJsonFile,
  parseOpossumFile,
  parseOutputJsonFile,
} from '../parseFile';
import { cloneDeep, set } from 'lodash';
import { createTempFolder, deleteFolder } from '../../test-helpers';
import { writeOpossumFile } from '../../output/writeJsonToOpossumFile';

jest.mock('electron', () => ({
  app: {
    getName: jest.fn(),
    getVersion: jest.fn(),
  },
}));

const testUuid: string = uuidNil;
const correctInput: ParsedOpossumInputFile = {
  metadata: {
    projectId: '2a58a469-738e-4508-98d3-a27bce6e71f7',
    fileCreationDate: '2020-07-23 11:47:13.764544',
  },
  externalAttributions: {
    [testUuid]: {
      source: {
        name: 'Clearlydefined',
        documentConfidence: 90.5,
      },
      attributionConfidence: 0,
      comment: 'https://www.npmjs.com/package/sample',
      packageName: 'Sample package',
      packageVersion: '16.13.1',
      preSelected: true,
      copyright:
        '(c) Jane Doe\nCopyright (c) 2013-present, Doe, Inc.\nCopyright (c) Doe, Inc. and its affiliates.',
      licenseText:
        'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated' +
        ' documentation files (the "Software"), to deal in the Software without restriction, including without ' +
        'limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies ' +
        'of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following ' +
        'conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or ' +
        'substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, ' +
        'EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR ' +
        'PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, ' +
        'DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR ' +
        'IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
      originId: '1b937bb4-7176-40a1-bdc1-c3175ad376b9',
    },
  },
  resources: {
    folder: {
      Types: {
        'types.ts': 1,
      },
    },
  },
  resourcesToAttributions: {
    '/folder/Types/types.ts': [testUuid],
  },
  attributionBreakpoints: ['/deep/path/please_no_attribution/'],
};

const corruptInput = {
  metadata: {
    projectId: '2a58a469-738e-4508-98d3-a27bce6e71f7',
    fileCreationDate: '2020-07-23 11:47:13.764544',
  },
  attributionsFromDb: {
    '/ElectronBackend/main.ts': [
      {
        source: {
          name: 'Clearlydefined',
          documentConfidence: 90.5,
        },
        attributionConfidence: 1,
        comment: '',
        packageName: 'Some package',
        packageVersion: '16.13.1',
        url: 'https://www.npmjs.com/package/sample',
        copyright:
          '(c) Jane Doe\nCopyright (c) 2013-present, Doe, Inc.\nCopyright (c) Doe, Inc. and its affiliates.',
        licenseText:
          'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated' +
          ' documentation files (the "Software"), to deal in the Software without restriction, including without' +
          ' limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies' +
          ' of the Software, and to permit persons to whom the Software is furnished to do so, subject to the' +
          ' following conditions:\n\nThe above copyright notice and this permission notice shall be included in' +
          ' all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT ' +
          'WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,' +
          ' FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS' +
          ' BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,' +
          ' ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
      },
    ],
  },
  resources: {
    folder: 'A string here is incorrect',
  },
};

const correctOutput: OpossumOutputFile = {
  metadata: {
    projectId: '2a58a469-738e-4508-98d3-a27bce6e71f7',
    fileCreationDate: 'Attributions',
  },
  manualAttributions: {
    [testUuid]: {
      packageName: 'Some package',
      packageVersion: '16.0.1',
      licenseText: '',
    },
  },
  resourcesToAttributions: {
    '/folder/Types/types.ts': [testUuid],
  },
  resolvedExternalAttributions: [],
};

const correctParsedOuput: ParsedOpossumOutputFile = {
  ...correctOutput,
  resolvedExternalAttributions: new Set(),
};

describe('parseOpossumFile', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('reads a .opossum file with only input correctly', async () => {
    const testInputContent = correctInput;
    const temporaryPath: string = createTempFolder();
    const opossumFilePath = path.join(
      upath.toUnix(temporaryPath),
      'test.opossum'
    );
    await writeOpossumFile(opossumFilePath, testInputContent, null);

    const parsingResult = (await parseOpossumFile(
      opossumFilePath
    )) as ParsedOpossumInputAndOutput;
    expect(parsingResult.input).toStrictEqual(testInputContent);
    expect(parsingResult.output).toBeNull;

    deleteFolder(temporaryPath);
  });

  it('reads a .opossum file with input and output correctly', async () => {
    const testInputContent = correctInput;
    const testOutputContent = correctOutput;
    const temporaryPath: string = createTempFolder();
    const opossumFilePath = path.join(
      upath.toUnix(temporaryPath),
      'test.opossum'
    );
    await writeOpossumFile(
      opossumFilePath,
      testInputContent,
      testOutputContent
    );

    const parsingResult = (await parseOpossumFile(
      opossumFilePath
    )) as ParsedOpossumInputAndOutput;
    expect(parsingResult.input).toStrictEqual(testInputContent);
    expect(parsingResult.output).toStrictEqual(correctParsedOuput);

    deleteFolder(temporaryPath);
  });

  it('returns JSONParsingError on an incorrect .opossum file', async () => {
    const testInputContent = corruptInput;
    const testOutputContent = correctOutput;
    const temporaryPath: string = createTempFolder();
    const opossumFilePath = path.join(
      upath.toUnix(temporaryPath),
      'test.opossum'
    ); //test

    await writeOpossumFile(
      opossumFilePath,
      testInputContent,
      testOutputContent
    );

    const result = await parseOpossumFile(opossumFilePath);
    expect(result).toEqual({
      message: expect.any(String),
      type: 'jsonParsingError',
    });
    deleteFolder(temporaryPath);
  });
});

describe('parseInputJsonFile', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('reads an input.json file correctly', async () => {
    const testFileContent = correctInput;
    const temporaryPath: string = createTempFolder();
    const resourcesPath = path.join(
      upath.toUnix(temporaryPath),
      'resources.json'
    );
    fs.writeFileSync(resourcesPath, JSON.stringify(testFileContent));

    const resources = await parseInputJsonFile(resourcesPath);
    expect(resources).toStrictEqual(testFileContent);
    deleteFolder(temporaryPath);
  });

  it('reads custom metadata correctly', async () => {
    const testFileContent = {
      ...correctInput,
      metadata: {
        ...correctInput.metadata,
        customObject: {
          foo: 'bar',
          nested: {
            object: 'value',
          },
        },
      },
    };
    const temporaryPath: string = createTempFolder();
    const resourcesPath = path.join(
      upath.toUnix(temporaryPath),
      'resources.json'
    );
    fs.writeFileSync(resourcesPath, JSON.stringify(testFileContent));

    const resources = await parseInputJsonFile(resourcesPath);

    expect(resources).toStrictEqual(testFileContent);
    deleteFolder(temporaryPath);
  });

  it('returns JSONParsingError on an incorrect Resource.json file', async () => {
    const testFileContent = corruptInput;
    const temporaryPath: string = createTempFolder();
    const resourcesPath = path.join(
      upath.toUnix(temporaryPath),
      'resources.json'
    );
    fs.writeFileSync(resourcesPath, JSON.stringify(testFileContent));

    const result = await parseInputJsonFile(resourcesPath);
    expect(result).toEqual({
      message: expect.any(String),
      type: 'jsonParsingError',
    });
    deleteFolder(temporaryPath);
  });

  it('reads an input.json.gz file correctly', async () => {
    const testFileContent = zlib.gzipSync(JSON.stringify(correctInput));
    const temporaryPath: string = createTempFolder();
    const resourcesPath = path.join(
      upath.toUnix(temporaryPath),
      'resources.json.gz'
    );
    fs.writeFileSync(resourcesPath, testFileContent);

    const resources = await parseInputJsonFile(resourcesPath);
    expect(resources).toStrictEqual(correctInput);
    deleteFolder(temporaryPath);
  });

  it('returns JSONParsingError on an incorrect Resource.json.gz file', async () => {
    const testFileContent = zlib.gzipSync(JSON.stringify(corruptInput));
    const temporaryPath: string = createTempFolder();
    const resourcesPath = path.join(
      upath.toUnix(temporaryPath),
      'resources.json.gz'
    );
    fs.writeFileSync(resourcesPath, testFileContent);

    const result = await parseInputJsonFile(resourcesPath);
    expect(result).toEqual({
      message: expect.any(String),
      type: 'jsonParsingError',
    });
    deleteFolder(temporaryPath);
  });
});

describe('parseOutputJsonFile', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('reads a correct file', () => {
    const temporaryPath: string = createTempFolder();
    const attributionPath = path.join(
      upath.toUnix(temporaryPath),
      'test_attributions.json'
    );
    fs.writeFileSync(attributionPath, JSON.stringify(correctOutput));

    const attributions = parseOutputJsonFile(attributionPath);

    expect(attributions).toStrictEqual(correctParsedOuput);
    deleteFolder(temporaryPath);
  });

  it('throws when reading an incorrect file', () => {
    const temporaryPath: string = createTempFolder();
    const attributionPath = path.join(
      upath.toUnix(temporaryPath),
      'test_attributions.json'
    );
    fs.writeFileSync(
      attributionPath,
      JSON.stringify({ test: 'Invalid file.' })
    );

    expect(() => parseOutputJsonFile(attributionPath)).toThrow(
      `Error: ${attributionPath} is not a valid attribution file.`
    );
    deleteFolder(temporaryPath);
  });

  it('tolerates an attribution file with wrong projectId', () => {
    const temporaryPath: string = createTempFolder();
    const attributionPath = path.join(
      upath.toUnix(temporaryPath),
      'test_attributions.json'
    );
    const fileContentWithWrongProjectId: OpossumOutputFile = set(
      cloneDeep(correctOutput),
      'metadata.projectId',
      'cff9095a-5c24-46e6-b84d-cc8596b17c58'
    );
    const parsedFileContentWithWrongProjectId: ParsedOpossumOutputFile = set(
      cloneDeep(correctParsedOuput),
      'metadata.projectId',
      'cff9095a-5c24-46e6-b84d-cc8596b17c58'
    );

    fs.writeFileSync(
      attributionPath,
      JSON.stringify(fileContentWithWrongProjectId)
    );

    const attributions = parseOutputJsonFile(attributionPath);

    expect(attributions).toStrictEqual(parsedFileContentWithWrongProjectId);
    deleteFolder(temporaryPath);
  });
});
