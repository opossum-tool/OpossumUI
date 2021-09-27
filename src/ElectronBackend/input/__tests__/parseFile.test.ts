// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
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
  ParsedOpossumInputFile,
  ParsedOpossumOutputFile,
} from '../../types/types';
import { parseOpossumInputFile, parseOpossumOutputFile } from '../parseFile';
import { cloneDeep, set } from 'lodash';
import { createTempFolder, deleteFolder } from '../../test-helpers';

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

describe('parseResources', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('reads an input.json file correctly', async () => {
    const testFileContent = correctInput;
    const temporaryPath: string = createTempFolder();
    const resourcesPath = path.join(
      upath.toUnix(temporaryPath),
      'resources.json'
    );
    fs.writeFileSync(resourcesPath, JSON.stringify(testFileContent));

    const resources = await parseOpossumInputFile(resourcesPath);
    expect(resources).toStrictEqual(testFileContent);
    deleteFolder(temporaryPath);
  });

  test('reads custom metadata correctly', async () => {
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

    const resources = await parseOpossumInputFile(resourcesPath);

    expect(resources).toStrictEqual(testFileContent);
    deleteFolder(temporaryPath);
  });

  test('returns JSONParsingError on an incorrect Resource.json file', async () => {
    const testFileContent = corruptInput;
    const temporaryPath: string = createTempFolder();
    const resourcesPath = path.join(
      upath.toUnix(temporaryPath),
      'resources.json'
    );
    fs.writeFileSync(resourcesPath, JSON.stringify(testFileContent));

    const result = await parseOpossumInputFile(resourcesPath);
    expect(result).toEqual({
      message: expect.any(String),
      type: 'jsonParsingError',
    });
    deleteFolder(temporaryPath);
  });

  test('reads an input.json.gz file correctly', async () => {
    const testFileContent = zlib.gzipSync(JSON.stringify(correctInput));
    const temporaryPath: string = createTempFolder();
    const resourcesPath = path.join(
      upath.toUnix(temporaryPath),
      'resources.json.gz'
    );
    fs.writeFileSync(resourcesPath, testFileContent);

    const resources = await parseOpossumInputFile(resourcesPath);
    expect(resources).toStrictEqual(correctInput);
    deleteFolder(temporaryPath);
  });

  test('returns JSONParsingError on an incorrect Resource.json.gz file', async () => {
    const testFileContent = zlib.gzipSync(JSON.stringify(corruptInput));
    const temporaryPath: string = createTempFolder();
    const resourcesPath = path.join(
      upath.toUnix(temporaryPath),
      'resources.json.gz'
    );
    fs.writeFileSync(resourcesPath, testFileContent);

    const result = await parseOpossumInputFile(resourcesPath);
    expect(result).toEqual({
      message: expect.any(String),
      type: 'jsonParsingError',
    });
    deleteFolder(temporaryPath);
  });
});

describe('parseOpossumOutputFile', () => {
  const testCorrectFileContent: OpossumOutputFile = {
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

  const testCorrectParsedFileContent: ParsedOpossumOutputFile = {
    ...testCorrectFileContent,
    resolvedExternalAttributions: new Set(),
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('reads a correct file', () => {
    const temporaryPath: string = createTempFolder();
    const attributionPath = path.join(
      upath.toUnix(temporaryPath),
      'test_attributions.json'
    );
    fs.writeFileSync(attributionPath, JSON.stringify(testCorrectFileContent));

    const attributions = parseOpossumOutputFile(attributionPath);

    expect(attributions).toStrictEqual(testCorrectParsedFileContent);
    deleteFolder(temporaryPath);
  });

  test('throws when reading an incorrect file', () => {
    const temporaryPath: string = createTempFolder();
    const attributionPath = path.join(
      upath.toUnix(temporaryPath),
      'test_attributions.json'
    );
    fs.writeFileSync(
      attributionPath,
      JSON.stringify({ test: 'Invalid file.' })
    );

    expect(() => parseOpossumOutputFile(attributionPath)).toThrow(
      `Error: ${attributionPath} is not a valid attribution file.`
    );
    deleteFolder(temporaryPath);
  });

  test('tolerates an attribution file with wrong projectId', () => {
    const temporaryPath: string = createTempFolder();
    const attributionPath = path.join(
      upath.toUnix(temporaryPath),
      'test_attributions.json'
    );
    const fileContentWithWrongProjectId: OpossumOutputFile = set(
      cloneDeep(testCorrectFileContent),
      'metadata.projectId',
      'cff9095a-5c24-46e6-b84d-cc8596b17c58'
    );
    const parsedFileContentWithWrongProjectId: ParsedOpossumOutputFile = set(
      cloneDeep(testCorrectParsedFileContent),
      'metadata.projectId',
      'cff9095a-5c24-46e6-b84d-cc8596b17c58'
    );

    fs.writeFileSync(
      attributionPath,
      JSON.stringify(fileContentWithWrongProjectId)
    );

    const attributions = parseOpossumOutputFile(attributionPath);

    expect(attributions).toStrictEqual(parsedFileContentWithWrongProjectId);
    deleteFolder(temporaryPath);
  });
});
