// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { writeOpossumFile } from '../../../shared/write-file';
import { faker } from '../../../testing/Faker';
import type {
  OpossumOutputFile,
  ParsedOpossumOutputFile,
} from '../../types/types';
import { loadOpossumFile } from '../parseFile';

const testUuid: string = faker.string.uuid();
const correctInput = {
  metadata: {
    projectId: '2a58a469-738e-4508-98d3-a27bce6e71f7',
    fileCreationDate: '2020-07-23 11:47:13.764544',
  },
  config: {
    classifications: {
      0: 'GOOD',
      1: 'BAD',
    },
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

describe('loadOpossumFile', () => {
  it('reads a .opossum file with only input correctly', async () => {
    const opossumFilePath = await writeOpossumFile({
      input: correctInput,
      path: faker.outputPath(`${faker.string.uuid()}.opossum`),
    });

    const result = await loadOpossumFile(opossumFilePath);
    if ('type' in result) {
      throw new Error(`Unexpected error: ${result.message}`);
    }
    expect(result.input).toStrictEqual(correctInput);
    expect(result.output).toBeNull();
  });

  it('reads a .opossum file with input and output correctly', async () => {
    const opossumFilePath = await writeOpossumFile({
      input: correctInput,
      output: correctOutput,
      path: faker.outputPath(`${faker.string.uuid()}.opossum`),
    });

    const result = await loadOpossumFile(opossumFilePath);
    if ('type' in result) {
      throw new Error(`Unexpected error: ${result.message}`);
    }
    expect(result.input).toStrictEqual(correctInput);
    expect(result.output).toStrictEqual(correctParsedOutput);
  });

  it('returns JSONParsingError on an incorrect .opossum file', async () => {
    const opossumFilePath = await writeOpossumFile({
      input: corruptInput,
      output: correctOutput,
      path: faker.outputPath(`${faker.string.uuid()}.opossum`),
    });

    const result = await loadOpossumFile(opossumFilePath);
    expect(result).toEqual({
      message: expect.any(String),
      type: 'jsonParsingError',
    });
  });
});
