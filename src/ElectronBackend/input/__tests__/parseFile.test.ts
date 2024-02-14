// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { cloneDeep, set } from 'lodash';
import zlib from 'zlib';

import { writeFile, writeOpossumFile } from '../../../shared/write-file';
import { faker } from '../../../testing/Faker';
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

const testUuid: string = faker.string.uuid();
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
      originIds: ['1b937bb4-7176-40a1-bdc1-c3175ad376b9'],
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
      needsReview: true,
      preferred: true,
      preferredOverOriginIds: ['test-id'],
    },
  },
  resourcesToAttributions: {
    '/folder/Types/types.ts': [testUuid],
  },
  resolvedExternalAttributions: [],
};

const correctParsedOutput: ParsedOpossumOutputFile = {
  ...correctOutput,
  resolvedExternalAttributions: [],
};

describe('parseOpossumFile', () => {
  it('reads a .opossum file with only input correctly', async () => {
    const opossumFilePath = await writeOpossumFile({
      input: correctInput,
      path: faker.outputPath(`${faker.string.uuid()}.opossum`),
    });

    const parsingResult = (await parseOpossumFile(
      opossumFilePath,
    )) as ParsedOpossumInputAndOutput;
    expect(parsingResult.input).toStrictEqual(correctInput);
    expect(parsingResult.output).toBeNull();
  });

  it('reads a .opossum file with input and output correctly', async () => {
    const opossumFilePath = await writeOpossumFile({
      input: correctInput,
      output: correctOutput,
      path: faker.outputPath(`${faker.string.uuid()}.opossum`),
    });

    const parsingResult = (await parseOpossumFile(
      opossumFilePath,
    )) as ParsedOpossumInputAndOutput;
    expect(parsingResult.input).toStrictEqual(correctInput);
    expect(parsingResult.output).toStrictEqual(correctParsedOutput);
  });

  it('returns JSONParsingError on an incorrect .opossum file', async () => {
    const opossumFilePath = await writeOpossumFile({
      input: corruptInput,
      output: correctOutput,
      path: faker.outputPath(`${faker.string.uuid()}.opossum`),
    });

    const result = await parseOpossumFile(opossumFilePath);
    expect(result).toEqual({
      message: expect.any(String),
      type: 'jsonParsingError',
    });
  });
});

describe('parseInputJsonFile', () => {
  it('reads an input.json file correctly', async () => {
    const resourcesPath = faker.outputPath(`${faker.string.uuid()}.json`);
    await writeFile({ content: correctInput, path: resourcesPath });

    const resources = await parseInputJsonFile(resourcesPath);
    expect(resources).toStrictEqual(correctInput);
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
    const resourcesPath = faker.outputPath(`${faker.string.uuid()}.json`);
    await writeFile({ content: testFileContent, path: resourcesPath });

    const resources = await parseInputJsonFile(resourcesPath);

    expect(resources).toStrictEqual(testFileContent);
  });

  it('returns JSONParsingError on an incorrect Resource.json file', async () => {
    const resourcesPath = faker.outputPath(`${faker.string.uuid()}.json`);
    await writeFile({ content: corruptInput, path: resourcesPath });

    const result = await parseInputJsonFile(resourcesPath);
    expect(result).toEqual({
      message: expect.any(String),
      type: 'jsonParsingError',
    });
  });

  it('reads an input.json.gz file correctly', async () => {
    const resourcesPath = faker.outputPath(`${faker.string.uuid()}.json.gz`);
    await writeFile({
      content: zlib.gzipSync(JSON.stringify(correctInput)),
      path: resourcesPath,
    });

    const resources = await parseInputJsonFile(resourcesPath);
    expect(resources).toStrictEqual(correctInput);
  });

  it('returns JSONParsingError on an incorrect Resource.json.gz file', async () => {
    const resourcesPath = faker.outputPath(`${faker.string.uuid()}.json.gz`);
    await writeFile({
      content: zlib.gzipSync(JSON.stringify(corruptInput)),
      path: resourcesPath,
    });

    const result = await parseInputJsonFile(resourcesPath);
    expect(result).toEqual({
      message: expect.any(String),
      type: 'jsonParsingError',
    });
  });
});

describe('parseOutputJsonFile', () => {
  it('reads a correct file', async () => {
    const attributionPath = faker.outputPath(
      `${faker.string.uuid()}_attributions.json`,
    );
    await writeFile({ content: correctOutput, path: attributionPath });

    const attributions = parseOutputJsonFile(attributionPath);

    expect(attributions).toStrictEqual(correctParsedOutput);
  });

  it('throws when reading an incorrect file', async () => {
    const attributionPath = faker.outputPath(
      `${faker.string.uuid()}_attributions.json`,
    );
    await writeFile({
      content: { test: 'Invalid file.' },
      path: attributionPath,
    });

    expect(() => parseOutputJsonFile(attributionPath)).toThrow(
      `Error: ${attributionPath} contains an invalid output file.\n Original error message: instance requires property \"metadata\"`,
    );
  });

  it('tolerates an attribution file with wrong projectId', async () => {
    const fileContentWithWrongProjectId: OpossumOutputFile = set(
      cloneDeep(correctOutput),
      'metadata.projectId',
      'cff9095a-5c24-46e6-b84d-cc8596b17c58',
    );
    const parsedFileContentWithWrongProjectId: ParsedOpossumOutputFile = set(
      cloneDeep(correctParsedOutput),
      'metadata.projectId',
      'cff9095a-5c24-46e6-b84d-cc8596b17c58',
    );

    const attributionPath = faker.outputPath(
      `${faker.string.uuid()}_attributions.json`,
    );
    await writeFile({
      content: fileContentWithWrongProjectId,
      path: attributionPath,
    });

    const attributions = parseOutputJsonFile(attributionPath);

    expect(attributions).toStrictEqual(parsedFileContentWithWrongProjectId);
  });
});
