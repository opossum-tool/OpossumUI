// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AdmZip from 'adm-zip';

import type { ReadonlyRule } from '../../../shared/shared-types';
import { INPUT_FILE_NAME } from '../../../shared/write-file-utils';
import { faker } from '../../../testing/Faker';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import { parseOpossumFile } from '../../input/parseFile';
import type { ParsedOpossumInputFile } from '../../types/types';
import {
  splitOpossumArchive,
  SplitOpossumFileError,
  validateSelectedFolderPaths,
} from '../split-opossum-file';

const input: ParsedOpossumInputFile = {
  metadata: {
    projectId: 'project-id',
    fileCreationDate: 'today',
  },
  resources: {
    frontend: {
      components: {
        'Button.tsx': 1,
      },
      'App.tsx': 1,
    },
    docs: {
      'README.md': 1,
    },
    backend: {
      'main.ts': 1,
    },
  },
  externalAttributions: {},
  resourcesToAttributions: {},
};

describe('splitOpossumArchive', () => {
  it('creates source rules for an initial split', async () => {
    const { source, selected, partitionOutputPath, sourcePath } =
      await splitArchive({
        selectedFolderPaths: ['/docs', '/frontend'],
        readonlyRules: [],
      });

    expect(source).toEqual([
      { path: '/docs', readonly: true },
      { path: '/frontend', readonly: true },
    ]);
    expect(selected).toEqual([
      { path: '/', readonly: true },
      { path: '/docs', readonly: false },
      { path: '/frontend', readonly: false },
    ]);
    expect(new AdmZip(sourcePath).readAsText('additional-data.txt')).toBe(
      'kept',
    );
    expect(
      new AdmZip(partitionOutputPath).readAsText('additional-data.txt'),
    ).toBe('kept');
  });

  it('removes a writable override when that folder is split', async () => {
    const { source, selected } = await splitArchive({
      selectedFolderPaths: ['/frontend'],
      readonlyRules: [
        { path: '/', readonly: true },
        { path: '/frontend', readonly: false },
      ],
    });

    expect(source).toEqual([{ path: '/', readonly: true }]);
    expect(selected).toEqual([
      { path: '/', readonly: true },
      { path: '/frontend', readonly: false },
    ]);
  });

  it('locks only the selected nested folder in the source', async () => {
    const { source, selected } = await splitArchive({
      selectedFolderPaths: ['/frontend/components'],
      readonlyRules: [
        { path: '/', readonly: true },
        { path: '/frontend', readonly: false },
      ],
    });

    expect(source).toEqual([
      { path: '/', readonly: true },
      { path: '/frontend', readonly: false },
      { path: '/frontend/components', readonly: true },
    ]);
    expect(selected).toEqual([
      { path: '/', readonly: true },
      { path: '/frontend/components', readonly: false },
    ]);
  });

  it('preserves readonly overrides below a selected folder', async () => {
    const { source, selected } = await splitArchive({
      selectedFolderPaths: ['/frontend'],
      readonlyRules: [
        { path: '/', readonly: true },
        { path: '/docs', readonly: false },
        { path: '/frontend', readonly: false },
        { path: '/frontend/components', readonly: true },
      ],
    });

    expect(source).toEqual([
      { path: '/', readonly: true },
      { path: '/docs', readonly: false },
    ]);
    expect(selected).toEqual([
      { path: '/', readonly: true },
      { path: '/frontend', readonly: false },
      { path: '/frontend/components', readonly: true },
    ]);
  });

  it('moves descendant rules when the selected folder has no explicit rule', async () => {
    const { source, selected } = await splitArchive({
      selectedFolderPaths: ['/frontend'],
      readonlyRules: [{ path: '/frontend/components', readonly: true }],
    });

    expect(source).toEqual([{ path: '/frontend', readonly: true }]);
    expect(selected).toEqual([
      { path: '/', readonly: true },
      { path: '/frontend', readonly: false },
      { path: '/frontend/components', readonly: true },
    ]);
  });

  it('rewrites rules for several folders in an existing partition', async () => {
    const { source, selected } = await splitArchive({
      selectedFolderPaths: ['/docs', '/frontend/components'],
      readonlyRules: [
        { path: '/', readonly: true },
        { path: '/frontend', readonly: false },
        { path: '/docs', readonly: false },
      ],
    });

    expect(source).toEqual([
      { path: '/', readonly: true },
      { path: '/frontend', readonly: false },
      { path: '/frontend/components', readonly: true },
    ]);
    expect(selected).toEqual([
      { path: '/', readonly: true },
      { path: '/docs', readonly: false },
      { path: '/frontend/components', readonly: false },
    ]);
  });

  it('rejects a folder that is readonly under existing rules', async () => {
    await expect(
      validateSelectedFolderPaths(
        ['/docs'],
        [
          { path: '/', readonly: true },
          { path: '/frontend', readonly: false },
        ],
      ),
    ).rejects.toThrow("'/docs' is readonly");
  });

  it('requires selected resource paths to exist', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/docs/README.md']),
    });

    await expect(
      validateSelectedFolderPaths(['/docs/README.md'], []),
    ).resolves.toBeUndefined();
    await expect(validateSelectedFolderPaths(['/missing'], [])).rejects.toThrow(
      "Selected resource '/missing' does not exist",
    );
  });

  it.each([
    { selectedFolderPaths: [] },
    { selectedFolderPaths: ['/frontend', '/frontend/components'] },
    { selectedFolderPaths: ['/foo', '/foo.txt', '/foo/bar'] },
    { selectedFolderPaths: ['/'] },
  ])('rejects invalid folder selections', async ({ selectedFolderPaths }) => {
    await expect(
      validateSelectedFolderPaths(selectedFolderPaths, []),
    ).rejects.toThrow(SplitOpossumFileError);
  });
});

async function splitArchive({
  selectedFolderPaths,
  readonlyRules,
}: {
  selectedFolderPaths: Array<string>;
  readonlyRules: Array<ReadonlyRule>;
}): Promise<{
  source: Array<ReadonlyRule>;
  selected: Array<ReadonlyRule>;
  partitionOutputPath: string;
  sourcePath: string;
}> {
  const sourcePath = faker.outputPath(`${faker.string.uuid()}.opossum`);
  const partitionOutputPath = faker.outputPath(
    `${faker.string.uuid()}.opossum`,
  );
  const sourceZip = new AdmZip();
  sourceZip.addFile(INPUT_FILE_NAME, Buffer.from(JSON.stringify(input)));
  sourceZip.addFile('additional-data.txt', Buffer.from('kept'));
  await splitOpossumArchive({
    paths: {
      opossumFilePath: sourcePath,
      selectedFolderPaths,
      partitionOutputPath,
    },
    sourceZip,
    readonlyRules,
  });
  return {
    source: await parseReadonlyRules(sourcePath),
    selected: await parseReadonlyRules(partitionOutputPath),
    partitionOutputPath,
    sourcePath,
  };
}

async function parseReadonlyRules(filePath: string) {
  const parsedFile = await parseOpossumFile(filePath);
  if ('type' in parsedFile) {
    throw new Error('Expected a valid .opossum file with split metadata.');
  }
  return parsedFile.readonlyRules;
}
