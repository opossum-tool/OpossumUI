// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import AdmZip from 'adm-zip';
import { createHash } from 'crypto';
import fs from 'fs';

import { EMPTY_PROJECT_METADATA } from '../../../Frontend/shared-constants';
import {
  Criticality,
  RawCriticality,
  type SplitInfo,
} from '../../../shared/shared-types';
import { writeFile, writeOpossumFile } from '../../../shared/write-file';
import {
  INPUT_FILE_NAME,
  SPLIT_INFO_FILE_NAME,
} from '../../../shared/write-file-utils';
import { faker } from '../../../testing/Faker';
import { getDb } from '../../db/db';
import type {
  OpossumOutputFile,
  ParsedOpossumInputFile,
} from '../../types/types';
import { getFilePathWithAppendix } from '../../utils/getFilePathWithAppendix';
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

describe('loadFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
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
  });

  it('loads split metadata into the ephemeral database', async () => {
    const opossumPath = faker.outputPath(`${faker.string.uuid()}.opossum`);
    const inputBytes = Buffer.from(JSON.stringify(inputFileContent));
    const splitInfo: SplitInfo = {
      splitId: '4d051d68-ecb4-4891-9495-804fbdd29c5e',
      inputSha256: createHash('sha256').update(inputBytes).digest('hex'),
      readonlyRules: [{ path: '/folder', readonly: true }],
    };
    const zip = new AdmZip();
    zip.addFile(INPUT_FILE_NAME, inputBytes);
    zip.addFile(SPLIT_INFO_FILE_NAME, Buffer.from(JSON.stringify(splitInfo)));
    await zip.writeZipPromise(opossumPath);

    const result = await loadFile(opossumPath, {});

    expect(result.ok).toBe(true);
    const splitInfoRow = await getDb()
      .selectFrom('split_info')
      .select(['split_id', 'input_sha256'])
      .executeTakeFirstOrThrow();
    expect(splitInfoRow).toEqual({
      split_id: splitInfo.splitId,
      input_sha256: splitInfo.inputSha256,
    });
    const readonlyRules = await getDb()
      .selectFrom('readonly_rule')
      .select(['path', 'readonly'])
      .execute();
    expect(readonlyRules).toEqual([
      {
        path: '/folder',
        readonly: Number(splitInfo.readonlyRules[0].readonly),
      },
    ]);
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

    const manualAttributions = await getDb()
      .selectFrom('attribution')
      .select('data')
      .where('is_external', '=', 0)
      .execute();

    expect(manualAttributions.map((a) => JSON.parse(a.data))).toEqual([
      {
        packageName: 'my app',
        packageVersion: '1.2.3',
        comment: 'some comment',
        copyright: '(c) first party',
        preSelected: true,
        attributionConfidence: 17,
        id: manualAttributionUuid,
        criticality: Criticality.None,
      },
    ]);

    const resourceToManualAttribution = await getDb()
      .selectFrom('resource_to_attribution as rta')
      .innerJoin('resource as r', 'r.id', 'rta.resource_id')
      .select(['r.path', 'attribution_uuid'])
      .where('attribution_is_external', '=', 0)
      .execute();

    expect(resourceToManualAttribution).toEqual([
      { attribution_uuid: manualAttributionUuid, path: '/a' },
    ]);
  });

  it('writes files-with-children attribution paths without a trailing slash to the created output', async () => {
    const externalUuid = 'ecd692d9-b154-4d4d-be8c-external';
    const inputWithFilesWithChildren: ParsedOpossumInputFile = {
      metadata: EMPTY_PROJECT_METADATA,
      // `/some/package.json` is a file-with-children: it is an object in the
      // resource tree (so it has children) but is also listed in
      // filesWithChildren, so on output its path must NOT get a trailing slash.
      resources: {
        some: {
          'package.json': {
            'nested-entry': 1,
          },
        },
      },
      config: { classifications: {} },
      externalAttributions: {
        [externalUuid]: {
          source: faker.opossum.source(),
          packageName: 'my app',
          packageVersion: '1.2.3',
          preSelected: true,
        },
      },
      frequentLicenses: [],
      // The input key is correctly written without a trailing slash.
      resourcesToAttributions: { '/some/package.json': [externalUuid] },
      filesWithChildren: ['/some/package.json'],
    };
    const jsonPath = faker.outputPath(`${faker.string.uuid()}.json`);
    await writeFile({ path: jsonPath, content: inputWithFilesWithChildren });

    vi.spyOn(Date, 'now').mockReturnValue(1);

    const result = (await loadFile(jsonPath, {})) as LoadFileSuccess;
    expect(result.ok).toBe(true);

    const outputPath = getFilePathWithAppendix(jsonPath, '_attributions.json');
    const output = JSON.parse(
      fs.readFileSync(outputPath, 'utf-8'),
    ) as OpossumOutputFile;

    expect(Object.keys(output.resourcesToAttributions)).toEqual([
      '/some/package.json',
    ]);
  });

  it('links attributions to the right resource regardless of the key form and drops unknown paths', async () => {
    const externalUuid = 'ecd692d9-b154-4d4d-be8c-external';
    const input: ParsedOpossumInputFile = {
      metadata: EMPTY_PROJECT_METADATA,
      resources: {
        folder: { file: 1 },
        'archive.zip': { inner: 1 },
        leaf: 1,
      },
      config: { classifications: {} },
      externalAttributions: {
        [externalUuid]: {
          source: faker.opossum.source(),
          packageName: 'my app',
        },
      },
      frequentLicenses: [],
      resourcesToAttributions: {
        '/folder/': [externalUuid], // folder, with trailing slash
        '/archive.zip': [externalUuid], // files-with-children, without slash
        '/leaf': [externalUuid], // plain file
        '/does/not/exist': [externalUuid], // unknown path, must be dropped
      },
      filesWithChildren: ['/archive.zip'],
    };
    const jsonPath = faker.outputPath(`${faker.string.uuid()}.json`);
    await writeFile({ path: jsonPath, content: input });

    vi.spyOn(Date, 'now').mockReturnValue(1);

    const result = (await loadFile(jsonPath, {})) as LoadFileSuccess;
    expect(result.ok).toBe(true);

    const links = await getDb()
      .selectFrom('resource_to_attribution as rta')
      .innerJoin('resource as r', 'r.id', 'rta.resource_id')
      .select('r.path')
      .where('attribution_is_external', '=', 1)
      .execute();

    // The DB stores resource paths without a trailing slash and resolves keys
    // via `removeTrailingSlash`, so every known key form maps to the right
    // resource and the unknown path is dropped.
    expect(links.map(({ path }) => path).sort()).toEqual([
      '/archive.zip',
      '/folder',
      '/leaf',
    ]);
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
