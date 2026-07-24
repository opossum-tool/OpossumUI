// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AdmZip from 'adm-zip';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';

import type { SplitInfo } from '../../../shared/shared-types';
import { INPUT_FILE_NAME } from '../../../shared/write-file-utils';
import { faker } from '../../../testing/Faker';
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
  it('creates complementary rules for an initial split', async () => {
    const { complement, selected, selectedPartitionPath, sourcePath } =
      await splitArchive({
        selectedFolderPaths: ['/docs', '/frontend'],
        splitInfo: null,
      });

    expect(complement.readonlyRules).toEqual([
      { path: '/docs', readonly: true },
      { path: '/frontend', readonly: true },
    ]);
    expect(selected.readonlyRules).toEqual([
      { path: '/', readonly: true },
      { path: '/docs', readonly: false },
      { path: '/frontend', readonly: false },
    ]);
    expect(new AdmZip(sourcePath).readAsText('additional-data.txt')).toBe(
      'kept',
    );
    expect(
      new AdmZip(selectedPartitionPath).readAsText('additional-data.txt'),
    ).toBe('kept');
  });

  it('removes a writable override when that folder is split', async () => {
    const { complement, selected } = await splitArchive({
      selectedFolderPaths: ['/frontend'],
      splitInfo: createSplitInfo([
        { path: '/', readonly: true },
        { path: '/frontend', readonly: false },
      ]),
    });

    expect(complement.readonlyRules).toEqual([{ path: '/', readonly: true }]);
    expect(selected.readonlyRules).toEqual([
      { path: '/', readonly: true },
      { path: '/frontend', readonly: false },
    ]);
  });

  it('locks only the selected nested folder in the complement', async () => {
    const { complement, selected } = await splitArchive({
      selectedFolderPaths: ['/frontend/components'],
      splitInfo: createSplitInfo([
        { path: '/', readonly: true },
        { path: '/frontend', readonly: false },
      ]),
    });

    expect(complement.readonlyRules).toEqual([
      { path: '/', readonly: true },
      { path: '/frontend', readonly: false },
      { path: '/frontend/components', readonly: true },
    ]);
    expect(selected.readonlyRules).toEqual([
      { path: '/', readonly: true },
      { path: '/frontend/components', readonly: false },
    ]);
  });

  it('rewrites rules for several folders in an existing partition', async () => {
    const { complement, selected } = await splitArchive({
      selectedFolderPaths: ['/docs', '/frontend/components'],
      splitInfo: createSplitInfo([
        { path: '/', readonly: true },
        { path: '/frontend', readonly: false },
        { path: '/docs', readonly: false },
      ]),
    });

    expect(complement.readonlyRules).toEqual([
      { path: '/', readonly: true },
      { path: '/frontend', readonly: false },
      { path: '/frontend/components', readonly: true },
    ]);
    expect(selected.readonlyRules).toEqual([
      { path: '/', readonly: true },
      { path: '/docs', readonly: false },
      { path: '/frontend/components', readonly: false },
    ]);
  });

  it('rejects a folder that is readonly under existing rules', () => {
    expect(() =>
      validateSelectedFolderPaths(
        ['/docs'],
        createSplitInfo([
          { path: '/', readonly: true },
          { path: '/frontend', readonly: false },
        ]).readonlyRules,
      ),
    ).toThrow("'/docs' is readonly");
  });

  it.each([
    { selectedFolderPaths: [] },
    { selectedFolderPaths: ['/frontend', '/frontend/components'] },
    { selectedFolderPaths: ['/'] },
  ])('rejects invalid folder selections', ({ selectedFolderPaths }) => {
    expect(() => validateSelectedFolderPaths(selectedFolderPaths, [])).toThrow(
      SplitOpossumFileError,
    );
  });

  it('rejects a destination symlink that points to the source archive', async () => {
    const sourcePath = faker.outputPath(`${faker.string.uuid()}.opossum`);
    const selectedPartitionPath = faker.outputPath(
      `${faker.string.uuid()}.opossum`,
    );
    const sourceZip = new AdmZip();
    sourceZip.addFile(INPUT_FILE_NAME, Buffer.from(JSON.stringify(input)));
    sourceZip.writeZip(sourcePath);
    fs.symlinkSync(path.resolve(sourcePath), selectedPartitionPath);

    await expect(
      splitOpossumArchive({
        opossumFilePath: sourcePath,
        overwriteExistingDestination: true,
        selectedFolderPaths: ['/docs'],
        selectedPartitionPath,
        sourceZip,
        splitInfo: null,
      }),
    ).rejects.toThrow('Destination file must differ');

    fs.unlinkSync(selectedPartitionPath);
    fs.unlinkSync(sourcePath);
  });
});

function createSplitInfo(readonlyRules: SplitInfo['readonlyRules']): SplitInfo {
  const inputBytes = Buffer.from(JSON.stringify(input));
  return {
    splitId: 'split-id',
    inputSha256: createHash('sha256').update(inputBytes).digest('hex'),
    readonlyRules,
  };
}

async function splitArchive({
  selectedFolderPaths,
  splitInfo,
}: {
  selectedFolderPaths: Array<string>;
  splitInfo: SplitInfo | null;
}): Promise<{
  complement: SplitInfo;
  selected: SplitInfo;
  selectedPartitionPath: string;
  sourcePath: string;
}> {
  const sourcePath = faker.outputPath(`${faker.string.uuid()}.opossum`);
  const selectedPartitionPath = faker.outputPath(
    `${faker.string.uuid()}.opossum`,
  );
  const sourceZip = new AdmZip();
  sourceZip.addFile(INPUT_FILE_NAME, Buffer.from(JSON.stringify(input)));
  sourceZip.addFile('additional-data.txt', Buffer.from('kept'));
  await splitOpossumArchive({
    opossumFilePath: sourcePath,
    selectedFolderPaths,
    selectedPartitionPath,
    sourceZip,
    splitInfo,
  });
  return {
    complement: await parseSplitInfo(sourcePath),
    selected: await parseSplitInfo(selectedPartitionPath),
    selectedPartitionPath,
    sourcePath,
  };
}

async function parseSplitInfo(filePath: string) {
  const parsedFile = await parseOpossumFile(filePath);
  if ('type' in parsedFile || !parsedFile.splitInfo) {
    throw new Error('Expected a valid .opossum file with split metadata.');
  }
  return parsedFile.splitInfo;
}
