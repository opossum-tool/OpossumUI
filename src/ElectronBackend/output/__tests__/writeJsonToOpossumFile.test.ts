// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path';
import * as upath from 'upath';
import {
  OpossumOutputFile,
  ParsedOpossumInputAndOutput,
  ParsedOpossumInputFile,
  ParsedOpossumOutputFile,
} from '../../types/types';
import { Criticality, FollowUp } from '../../../shared/shared-types';
import { createTempFolder, deleteFolder } from '../../test-helpers';
import {
  writeOpossumFile,
  writeOutputJsonToOpossumFile,
} from '../writeJsonToOpossumFile';
import { parseOpossumFile } from '../../input/parseFile';

const metadata = {
  projectId: '2a58a469-738e-4508-98d3-a27bce6e71f7',
  fileCreationDate: '2',
};

const inputFileContent: ParsedOpossumInputFile = {
  metadata,
  resources: {
    a: 1,
    folder: {},
  },
  externalAttributions: {
    uuid_1: {
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
    '/a': ['uuid_1'],
    '/folder': ['uuid_1'],
  },
  externalAttributionSources: {
    SC: { name: 'ScanCode', priority: 1000 },
    OTHERSOURCE: { name: 'Crystal ball', priority: 2 },
  },
};

const outputFileContent: OpossumOutputFile = {
  metadata,
  manualAttributions: {
    uuid_2: {
      packageName: 'minimal attribution',
    },
    uuid_3: {
      packageName: 'full info attribution',
      packageVersion: '1.0',
      packageNamespace: 'org.apache.xmlgraphics',
      packagePURLAppendix:
        '?repository_url=repo.spring.io/release#everybody/loves/dogs',
      packageType: 'maven',
      firstParty: true,
      followUp: FollowUp,
      attributionConfidence: 100,
      comment: 'I found it!',
      url: 'https://www.theauthor.com/package',
      copyright: '(c) many people 1989',
      licenseName: 'MIT',
      licenseText: 'This is totally an MIT license!!111!',
      originIds: ['846f978e-8479-4b25-a010-63c1deac2e45'],
    },
  },
  resourcesToAttributions: {
    mypath: ['uuid_1', 'uuid_2'],
  },
  resolvedExternalAttributions: [],
};

const parsedOutputFileContent: ParsedOpossumOutputFile = {
  metadata,
  manualAttributions: {
    uuid_2: {
      packageName: 'minimal attribution',
    },
    uuid_3: {
      packageName: 'full info attribution',
      packageVersion: '1.0',
      packageNamespace: 'org.apache.xmlgraphics',
      packagePURLAppendix:
        '?repository_url=repo.spring.io/release#everybody/loves/dogs',
      packageType: 'maven',
      firstParty: true,
      followUp: FollowUp,
      attributionConfidence: 100,
      comment: 'I found it!',
      url: 'https://www.theauthor.com/package',
      copyright: '(c) many people 1989',
      licenseName: 'MIT',
      licenseText: 'This is totally an MIT license!!111!',
      originIds: ['846f978e-8479-4b25-a010-63c1deac2e45'],
    },
  },
  resourcesToAttributions: {
    mypath: ['uuid_1', 'uuid_2'],
  },
  resolvedExternalAttributions: new Set(),
};

describe('writeOutputJsonToOpossumFile', () => {
  it('writes new output', async () => {
    const temporaryPath: string = createTempFolder();
    const opossumPath = path.join(upath.toUnix(temporaryPath), 'test.opossum');
    await writeOpossumFile(opossumPath, inputFileContent, null);

    await writeOutputJsonToOpossumFile(opossumPath, outputFileContent);

    const parsingResult = (await parseOpossumFile(
      opossumPath,
    )) as ParsedOpossumInputAndOutput;
    expect(parsingResult.input).toStrictEqual(inputFileContent);
    expect(parsingResult.output).toStrictEqual(parsedOutputFileContent);

    deleteFolder(temporaryPath);
  });

  it('overwrites existing output', async () => {
    const temporaryPath: string = createTempFolder();
    const opossumPath = path.join(upath.toUnix(temporaryPath), 'test.opossum');
    const outputToBeOverwritten = { test: 'test' };
    await writeOpossumFile(
      opossumPath,
      inputFileContent,
      outputToBeOverwritten,
    );

    await writeOutputJsonToOpossumFile(opossumPath, outputFileContent);

    const parsingResult = (await parseOpossumFile(
      opossumPath,
    )) as ParsedOpossumInputAndOutput;
    expect(parsingResult.input).toStrictEqual(inputFileContent);
    expect(parsingResult.output).toStrictEqual(parsedOutputFileContent);

    deleteFolder(temporaryPath);
  });
});
