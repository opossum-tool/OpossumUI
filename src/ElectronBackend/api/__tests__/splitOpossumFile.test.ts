// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AdmZip from 'adm-zip';
import fs from 'fs';

import {
  INPUT_FILE_NAME,
  SPLIT_INFO_FILE_NAME,
} from '../../../shared/write-file-utils';
import { faker } from '../../../testing/Faker';
import {
  initializeDbWithTestData,
  pathsToResources,
} from '../../../testing/global-test-helpers';
import { getReadonlyRules } from '../../db/split-info';
import { saveFile } from '../saveFile';
import { splitOpossumFile } from '../splitOpossumFile';

vi.mock('../saveFile', () => ({ saveFile: vi.fn() }));

const inputBytes = Buffer.from('{"resources":{}}');

describe('splitOpossumFile', () => {
  beforeEach(() => {
    vi.mocked(saveFile).mockReset();
  });

  it('stores the complement split info after an initial split', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/docs/README.md', '/frontend/App.tsx']),
    });
    const { opossumFilePath, selectedPartitionPath } = createPaths();

    await splitOpossumFile(
      {
        projectId: 'project-id',
        opossumFilePath,
        selectedFolderPaths: ['/docs'],
        selectedPartitionPath,
      },
      createOpossumZip(),
    );

    expect(await getReadonlyRules()).toEqual([
      { path: '/docs', readonly: true },
    ]);
    expect(getReadonlyRulesFromArchive(selectedPartitionPath)).toEqual([
      { path: '/', readonly: true },
      { path: '/docs', readonly: false },
    ]);
    expect(saveFile).toHaveBeenCalledWith(
      {
        projectId: 'project-id',
        opossumFilePath,
      },
      expect.anything(),
    );
  });

  it('allows splitting an individual file resource', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/docs/README.md']),
    });
    const { opossumFilePath, selectedPartitionPath } = createPaths();

    await splitOpossumFile(
      {
        projectId: 'project-id',
        opossumFilePath,
        selectedFolderPaths: ['/docs/README.md'],
        selectedPartitionPath,
      },
      createOpossumZip(),
    );

    expect(await getReadonlyRules()).toEqual([
      { path: '/docs/README.md', readonly: true },
    ]);
    expect(getReadonlyRulesFromArchive(selectedPartitionPath)).toEqual([
      { path: '/', readonly: true },
      { path: '/docs/README.md', readonly: false },
    ]);
  });

  it('retains readonly rules across consecutive splits', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/frontend/components/Button.tsx']),
    });
    const firstPaths = createPaths();

    await splitOpossumFile(
      {
        projectId: 'project-id',
        opossumFilePath: firstPaths.opossumFilePath,
        selectedFolderPaths: ['/frontend'],
        selectedPartitionPath: firstPaths.selectedPartitionPath,
      },
      createOpossumZip(),
    );
    const firstReadonlyRules = getReadonlyRulesFromArchive(
      firstPaths.selectedPartitionPath,
    );
    if (!firstReadonlyRules) {
      throw new Error('Expected split metadata in selected archive.');
    }

    await initializeDbWithTestData({
      resources: pathsToResources(['/frontend/components/Button.tsx']),
      readonlyRules: firstReadonlyRules,
    });
    const secondPaths = createPaths();

    await splitOpossumFile(
      {
        projectId: 'project-id',
        opossumFilePath: firstPaths.selectedPartitionPath,
        selectedFolderPaths: ['/frontend/components'],
        selectedPartitionPath: secondPaths.selectedPartitionPath,
      },
      new AdmZip(firstPaths.selectedPartitionPath),
    );

    expect(await getReadonlyRules()).toEqual([
      { path: '/', readonly: true },
      { path: '/frontend', readonly: false },
      { path: '/frontend/components', readonly: true },
    ]);
  });

  it('rejects a selected resource path that does not exist', async () => {
    await initializeDbWithTestData({
      resources: pathsToResources(['/docs/README.md']),
    });
    const { opossumFilePath, selectedPartitionPath } = createPaths();

    await expect(
      splitOpossumFile(
        {
          projectId: 'project-id',
          opossumFilePath,
          selectedFolderPaths: ['/missing'],
          selectedPartitionPath,
        },
        createOpossumZip(),
      ),
    ).rejects.toThrow("Selected resource '/missing' does not exist");

    expect(fs.existsSync(selectedPartitionPath)).toBe(false);
  });
});

function createOpossumZip(): AdmZip {
  const zip = new AdmZip();
  zip.addFile(INPUT_FILE_NAME, inputBytes);
  return zip;
}

function createPaths(): {
  opossumFilePath: string;
  selectedPartitionPath: string;
} {
  return {
    opossumFilePath: faker.outputPath(`${faker.string.uuid()}.opossum`),
    selectedPartitionPath: faker.outputPath(`${faker.string.uuid()}.opossum`),
  };
}

function getReadonlyRulesFromArchive(filePath: string) {
  return JSON.parse(new AdmZip(filePath).readAsText(SPLIT_INFO_FILE_NAME))
    .readonlyRules as Awaited<ReturnType<typeof getReadonlyRules>>;
}
