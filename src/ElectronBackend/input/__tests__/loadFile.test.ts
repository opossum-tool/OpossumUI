// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { EMPTY_PROJECT_METADATA } from '../../../Frontend/shared-constants';
import {
  Criticality,
  type ParsedFrontendFileContent,
  RawCriticality,
} from '../../../shared/shared-types';
import { writeFile, writeOpossumFile } from '../../../shared/write-file';
import { faker } from '../../../testing/Faker';
import {
  type OpossumOutputFile,
  type ParsedOpossumInputFile,
} from '../../types/types';
import {
  loadFile,
  type LoadFileError,
  type LoadFileSuccess,
} from '../loadFile';

const externalAttributionUuid = 'ecd692d9-b154-4d4d-be8c-external';
const manualAttributionUuid = 'ecd692d9-b154-4d4d-be8c-manual';

vi.mock('uuid', () => ({
  v4: (): string => manualAttributionUuid,
}));

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

const expectedFrontendData: ParsedFrontendFileContent = {
  metadata: {
    ...EMPTY_PROJECT_METADATA,
    projectTitle: 'Test Title',
  },
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

describe('loadFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads .opossum file with output successfully', async () => {
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

    vi.spyOn(Date, 'now').mockReturnValue(1);

    const result = (await loadFile(opossumPath, {})) as LoadFileSuccess;

    expect(result.ok).toBe(true);
    expect(result.frontendData).toEqual({
      ...expectedFrontendData,
      manualAttributions: {
        attributions: {
          [testUuid]: {
            packageName: 'Package',
            packageVersion: '1.0',
            licenseText: 'MIT',
            followUp: true,
            id: testUuid,
            criticality: Criticality.None,
          },
        },
        resourcesToAttributions: {
          '/folder/': [testUuid],
        },
        attributionsToResources: {
          [testUuid]: ['/folder/'],
        },
      },
    });
    expect(result.projectTitle).toBe(inputFileContent.metadata.projectTitle);
    expect(result.projectId).toBe(inputFileContent.metadata.projectId);
  });

  it('loads .opossum file without output and creates one', async () => {
    const opossumPath = faker.outputPath(`${faker.string.uuid()}.opossum`);

    await writeOpossumFile({
      input: inputFileContent,
      path: opossumPath,
    });

    vi.spyOn(Date, 'now').mockReturnValue(1691761892037);

    const result = (await loadFile(opossumPath, {})) as LoadFileSuccess;

    expect(result.ok).toBe(true);
    expect(result.frontendData).toEqual(expectedFrontendData);
  });

  it('converts preSelected external attributions to manual attributions', async () => {
    const source = faker.opossum.source();
    const inputWithPreselected: ParsedOpossumInputFile = {
      metadata: EMPTY_PROJECT_METADATA,
      resources: { a: 1 },
      config: { classifications: { 0: 'GOOD', 1: 'BAD' } },
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
    await writeFile({ path: jsonPath, content: inputWithPreselected });

    vi.spyOn(Date, 'now').mockReturnValue(1);

    const result = (await loadFile(jsonPath, {})) as LoadFileSuccess;

    expect(result.ok).toBe(true);
    expect(result.frontendData.manualAttributions).toEqual({
      attributions: {
        [manualAttributionUuid]: {
          packageName: 'my app',
          packageVersion: '1.2.3',
          comment: 'some comment',
          copyright: '(c) first party',
          preSelected: true,
          attributionConfidence: 17,
          id: manualAttributionUuid,
          criticality: Criticality.None,
        },
      },
      resourcesToAttributions: { '/a': [manualAttributionUuid] },
      attributionsToResources: { [manualAttributionUuid]: ['/a'] },
    });
    expect(result.frontendData.attributionBreakpoints).toEqual(
      new Set(['/some/path/', '/another/path/']),
    );
    expect(result.frontendData.filesWithChildren).toEqual(
      new Set(['/some/package.json/']),
    );
  });

  it('returns fileNotFoundError for non-existing file', async () => {
    const jsonPath = faker.outputPath(`${faker.string.uuid()}.json`);
    const result = (await loadFile(jsonPath, {})) as LoadFileError;

    expect(result.ok).toBe(false);
    expect(result.error.type).toBe('fileNotFoundError');
    expect(result.error.message).toContain('does not exist.');
  });

  it('returns unzipError for corrupt .opossum file', async () => {
    const opossumPath = faker.outputPath(`${faker.string.uuid()}.opossum`);
    await writeFile({ path: opossumPath, content: '0' });

    const result = (await loadFile(opossumPath, {})) as LoadFileError;

    expect(result.ok).toBe(false);
    expect(result.error.type).toBe('unzipError');
    expect(result.error.message).toContain('could not be unzipped');
  });

  it('returns jsonParsingError for corrupt json', async () => {
    const jsonPath = faker.outputPath(`${faker.string.uuid()}.json`);
    await writeFile({ path: jsonPath, content: '{"name": 3' });

    const result = (await loadFile(jsonPath, {})) as LoadFileError;

    expect(result.ok).toBe(false);
    expect(result.error.type).toBe('jsonParsingError');
  });
});
