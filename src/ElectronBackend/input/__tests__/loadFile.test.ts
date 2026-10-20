// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import AdmZip from 'adm-zip';
import fs from 'fs';

import { EMPTY_PROJECT_METADATA } from '../../../Frontend/shared-constants';
import {
  type Attributions,
  Criticality,
  RawCriticality,
  type ReadonlyRule,
  type ResourcesToAttributions,
} from '../../../shared/shared-types';
import { writeOpossumFile } from '../../../shared/write-file';
import {
  INPUT_FILE_NAME,
  OUTPUT_FILE_NAME,
  SPLIT_INFO_FILE_NAME,
} from '../../../shared/write-file-utils';
import { faker } from '../../../testing/Faker';
import { saveFile } from '../../api/saveFile';
import { getDb } from '../../db/db';
import type {
  OpossumOutputFile,
  ParsedOpossumInputFile,
} from '../../types/types';
import {
  createOpossumOutputFile,
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

    const result = (await loadFile(opossumPath)) as LoadFileSuccess;

    expect(result.ok).toBe(true);
  });

  it('keeps merged external references when loading and saving output', async () => {
    const firstExternalUuid = 'external-first';
    const secondExternalUuid = 'external-second';
    const manualUuid = 'manual-reference';
    const projectId = faker.string.uuid();
    const source = faker.opossum.source();
    const input: ParsedOpossumInputFile = {
      metadata: { ...EMPTY_PROJECT_METADATA, projectId },
      resources: { a: 1, b: 1 },
      config: { classifications: {} },
      externalAttributions: {
        [firstExternalUuid]: {
          originId: 'origin-first',
          source,
          packageName: 'shared package',
          packageVersion: '1.0.0',
        },
        [secondExternalUuid]: {
          originId: 'origin-second',
          source,
          packageName: 'shared package',
          packageVersion: '1.0.0',
        },
      },
      frequentLicenses: [],
      resourcesToAttributions: {
        '/a': [firstExternalUuid, secondExternalUuid],
        '/b': [firstExternalUuid, secondExternalUuid],
      },
    };
    const output: OpossumOutputFile = {
      metadata: { projectId, fileCreationDate: '1' },
      manualAttributions: {
        [manualUuid]: {
          originId: 'origin-second',
          packageName: 'manual reference',
          criticality: RawCriticality[Criticality.None],
        },
      },
      resourcesToAttributions: { '/a': [manualUuid] },
      resolvedExternalAttributions: [],
    };
    const opossumPath = faker.outputPath(`${faker.string.uuid()}.opossum`);
    await writeOpossumFile({ input, output, path: opossumPath });

    const progressMessages: Array<string> = [];
    const firstLoad = (await loadFile(opossumPath, (message) => {
      progressMessages.push(message);
    })) as LoadFileSuccess;
    expect(firstLoad.ok).toBe(true);
    expect(progressMessages).toEqual([
      `Reading file ${opossumPath}`,
      'Deserializing signals',
      'Calculating signals to resources',
      'Merging similar signals',
      'Parsing frequent licenses from input',
      'Checking and converting configuration',
      'Deserializing attributions',
      'Loading into database',
    ]);

    const assertMergedAttributions = async () => {
      await expect(
        getDb()
          .selectFrom('attribution')
          .select(['uuid', 'is_external', 'original_attribution_id'])
          .orderBy('uuid')
          .execute(),
      ).resolves.toEqual([
        {
          uuid: firstExternalUuid,
          is_external: 1,
          original_attribution_id: firstExternalUuid,
        },
        {
          uuid: manualUuid,
          is_external: 0,
          original_attribution_id: firstExternalUuid,
        },
      ]);
      await expect(
        getDb()
          .selectFrom('resource_to_attribution as rta')
          .innerJoin('resource as r', 'r.id', 'rta.resource_id')
          .select([
            'r.path',
            'rta.attribution_uuid',
            'rta.attribution_is_external',
          ])
          .orderBy('r.path')
          .orderBy('rta.attribution_is_external')
          .execute(),
      ).resolves.toEqual([
        {
          path: '/a',
          attribution_uuid: manualUuid,
          attribution_is_external: 0,
        },
        {
          path: '/a',
          attribution_uuid: firstExternalUuid,
          attribution_is_external: 1,
        },
        {
          path: '/b',
          attribution_uuid: firstExternalUuid,
          attribution_is_external: 1,
        },
      ]);
    };
    await assertMergedAttributions();

    const inputAfterLoad = JSON.parse(
      new AdmZip(opossumPath).getEntry(INPUT_FILE_NAME)!.getData().toString(),
    ) as ParsedOpossumInputFile;
    expect(inputAfterLoad.resourcesToAttributions).toEqual(
      input.resourcesToAttributions,
    );

    await saveFile(
      { projectId, opossumFilePath: opossumPath },
      firstLoad.opossumZip!,
    );
    const reloaded = (await loadFile(opossumPath)) as LoadFileSuccess;
    expect(reloaded.ok).toBe(true);
    await assertMergedAttributions();
  });

  it('loads split metadata into the ephemeral database', async () => {
    const opossumPath = faker.outputPath(`${faker.string.uuid()}.opossum`);
    const expectedReadonlyRules: Array<ReadonlyRule> = [
      { path: '/folder', readonly: true },
    ];
    const zip = new AdmZip();
    zip.addFile(INPUT_FILE_NAME, Buffer.from(JSON.stringify(inputFileContent)));
    zip.addFile(
      SPLIT_INFO_FILE_NAME,
      Buffer.from(JSON.stringify({ readonlyRules: expectedReadonlyRules })),
    );
    await zip.writeZipPromise(opossumPath);

    const result = await loadFile(opossumPath);

    expect(result.ok).toBe(true);
    const readonlyRules = await getDb()
      .selectFrom('readonly_rule')
      .select(['path', 'readonly'])
      .execute();
    expect(readonlyRules).toEqual([
      {
        path: '/folder',
        readonly: Number(expectedReadonlyRules[0].readonly),
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
    const opossumPath = faker.outputPath(`${faker.string.uuid()}.opossum`);
    await writeOpossumFile({ input: inputWithPreselected, path: opossumPath });

    vi.spyOn(Date, 'now').mockReturnValue(1);

    const result = (await loadFile(opossumPath)) as LoadFileSuccess;

    expect(result.ok).toBe(true);

    const manualAttributions = await getDb()
      .selectFrom('attribution')
      .select([
        'additional_data',
        'package_name',
        'package_version',
        'comment',
        'copyright',
        'pre_selected',
        'attribution_confidence',
        'criticality',
      ])
      .where('is_external', '=', 0)
      .execute();

    expect(manualAttributions).toEqual([
      {
        additional_data: '{}',
        package_name: 'my app',
        package_version: '1.2.3',
        comment: 'some comment',
        copyright: '(c) first party',
        pre_selected: 1,
        attribution_confidence: 17,
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

  it('creates no manual attributions when none are preselected', () => {
    const externalAttributions: Attributions = {
      unselected: {
        id: 'unselected',
        criticality: Criticality.None,
        packageName: 'not selected',
        preSelected: false,
      },
    };

    const output = createOpossumOutputFile(
      externalAttributions,
      { '/resource': ['unselected'] },
      'project',
    );

    expect(output.manualAttributions).toEqual({});
    expect(output.resourcesToAttributions).toEqual({});
    expect(externalAttributions.unselected.packageName).toBe('not selected');
  });

  it('clones only selected attributions and remaps only their resource links', () => {
    const nestedMetadata = { nested: { value: 'unchanged' } };
    const getUnselectedMetadata = vi.fn(() => ({ nested: true }));
    const unselectedAttribution = {
      id: 'unselected',
      criticality: Criticality.None,
      packageName: 'unselected package',
      preSelected: false,
    };
    Object.defineProperty(unselectedAttribution, 'aiAttributions', {
      enumerable: true,
      get: getUnselectedMetadata,
    });
    const externalAttributions: Attributions = {
      selected: {
        id: 'selected',
        criticality: Criticality.None,
        packageName: 'selected package',
        preSelected: true,
        preferred: true,
        preferredOverOriginIds: ['origin'],
        source: { name: 'source' },
        aiAttributions: nestedMetadata,
      },
      unselected: unselectedAttribution,
    };
    const resourcesToExternalAttributions: ResourcesToAttributions = {
      '/selected': ['selected', 'unselected'],
      '/unselected': ['unselected'],
    };

    const output = createOpossumOutputFile(
      externalAttributions,
      resourcesToExternalAttributions,
      'project',
    );

    expect(output.manualAttributions).toEqual({
      [manualAttributionUuid]: {
        packageName: 'selected package',
        preSelected: true,
        criticality: undefined,
        aiAttributions: nestedMetadata,
      },
    });
    expect(output.resourcesToAttributions).toEqual({
      '/selected': [manualAttributionUuid],
    });
    expect(externalAttributions.selected).toMatchObject({
      preferred: true,
      preferredOverOriginIds: ['origin'],
      source: { name: 'source' },
    });
    expect(getUnselectedMetadata).not.toHaveBeenCalled();

    const clonedMetadata = output.manualAttributions[manualAttributionUuid]
      .aiAttributions as typeof nestedMetadata;
    clonedMetadata.nested.value = 'changed';
    expect(nestedMetadata.nested.value).toBe('unchanged');
  });

  it('creates manual output for all selected attributions', () => {
    const externalAttributions: Attributions = {
      selected: {
        id: 'selected',
        criticality: Criticality.None,
        packageName: 'selected package',
        preSelected: true,
      },
    };

    const output = createOpossumOutputFile(externalAttributions, {}, 'project');

    expect(output.manualAttributions[manualAttributionUuid].packageName).toBe(
      'selected package',
    );
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
    const opossumPath = faker.outputPath(`${faker.string.uuid()}.opossum`);
    await writeOpossumFile({
      input: inputWithFilesWithChildren,
      path: opossumPath,
    });

    vi.spyOn(Date, 'now').mockReturnValue(1);

    const result = (await loadFile(opossumPath)) as LoadFileSuccess;
    expect(result.ok).toBe(true);

    const outputEntry = new AdmZip(opossumPath).getEntry(OUTPUT_FILE_NAME);
    const output = JSON.parse(
      outputEntry!.getData().toString(),
    ) as OpossumOutputFile;

    expect(Object.keys(output.resourcesToAttributions)).toEqual([
      '/some/package.json',
    ]);

    await saveFile(
      {
        projectId: EMPTY_PROJECT_METADATA.projectId,
        opossumFilePath: opossumPath,
      },
      result.opossumZip!,
    );
    const reloaded = (await loadFile(opossumPath)) as LoadFileSuccess;
    expect(reloaded.ok).toBe(true);
    const reloadedOutput = JSON.parse(
      new AdmZip(opossumPath).getEntry(OUTPUT_FILE_NAME)!.getData().toString(),
    ) as OpossumOutputFile;
    expect(reloadedOutput.resourcesToAttributions).toEqual({
      '/some/package.json': [manualAttributionUuid],
    });
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
    const opossumPath = faker.outputPath(`${faker.string.uuid()}.opossum`);
    await writeOpossumFile({ input, path: opossumPath });

    vi.spyOn(Date, 'now').mockReturnValue(1);

    const result = (await loadFile(opossumPath)) as LoadFileSuccess;
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
    const result = (await loadFile(jsonPath)) as LoadFileError;

    expect(result.ok).toBe(false);
    expect(result.error.type).toBe('fileNotFoundError');
    expect(result.error.message).toContain('does not exist.');
  });

  it('returns unzipError for corrupt .opossum file', async () => {
    const opossumPath = faker.outputPath(`${faker.string.uuid()}.opossum`);
    await fs.promises.writeFile(opossumPath, '0');

    const result = (await loadFile(opossumPath)) as LoadFileError;

    expect(result.ok).toBe(false);
    expect(result.error.type).toBe('unzipError');
    expect(result.error.message).toContain('could not be unzipped');
  });

  it('returns jsonParsingError for corrupt json', async () => {
    const opossumPath = faker.outputPath(`${faker.string.uuid()}.opossum`);
    const zip = new AdmZip();
    zip.addFile(INPUT_FILE_NAME, Buffer.from('{"name": 3'));
    await zip.writeZipPromise(opossumPath);

    const result = (await loadFile(opossumPath)) as LoadFileError;

    expect(result.ok).toBe(false);
    expect(result.error.type).toBe('jsonParsingError');
  });
});
