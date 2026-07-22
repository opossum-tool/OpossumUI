// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type ElectronApplication, expect, type Page } from '@playwright/test';
import AdmZip from 'adm-zip';
import fs from 'fs';

import { SPLIT_INFO_FILE_NAME } from '../../shared/write-file-utils';
import type { ResourcesTree } from '../page-objects/ResourcesTree';
import type { SplitDialog } from '../page-objects/SplitDialog';
import { faker, stubSaveDialogSync, test } from '../utils';

const [firstResourceName, secondResourceName] = faker.opossum.resourceNames({
  count: 2,
});
const firstResourcePath = faker.opossum.filePath(firstResourceName);
const secondResourcePath = faker.opossum.filePath(secondResourceName);

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [firstResourceName]: 1,
        [secondResourceName]: 1,
      }),
      metadata: faker.opossum.metadata({ projectId: 'test_project' }),
    }),
    outputData: faker.opossum.outputData({}),
  },
});

test('opens and cancels the create collaborative partition dialog', async ({
  resourcesTree,
  splitDialog,
}) => {
  await resourcesTree.openCreateCollaborativePartitionDialog(firstResourceName);
  await splitDialog.assert.titleIsVisible(firstResourcePath);

  await splitDialog.cancelButton.click();

  await splitDialog.assert.titleIsHidden(firstResourcePath);
});

test('creates complementary collaborative partitions', async ({
  resourcesTree,
  splitDialog,
  window,
  filePaths,
}, testInfo) => {
  const partitionPath = testInfo.outputPath('partition.opossum');
  await stubSaveDialogSync(window.app, partitionPath);

  await resourcesTree.openCreateCollaborativePartitionDialog(firstResourceName);
  await splitDialog.destinationPathSelection.click();
  await splitDialog.assert.destinationPathIs(partitionPath);

  await splitDialog.createButton.click();

  await splitDialog.assert.succeeded();
  await expect.poll(() => fs.existsSync(partitionPath)).toBe(true);

  const sourceSplitInfo = getSplitInfo(filePaths!.opossum);
  const partitionSplitInfo = getSplitInfo(partitionPath);
  expect(sourceSplitInfo).toEqual({
    splitId: expect.any(String),
    inputSha256: expect.any(String),
    readonlyRules: [{ path: firstResourcePath, readonly: true }],
  });
  expect(partitionSplitInfo).toEqual({
    splitId: sourceSplitInfo.splitId,
    inputSha256: sourceSplitInfo.inputSha256,
    readonlyRules: [
      { path: '/', readonly: true },
      { path: firstResourcePath, readonly: false },
    ],
  });
});

test('creates two consecutive partitions from writable resources', async ({
  resourcesTree,
  splitDialog,
  window,
  filePaths,
}, testInfo) => {
  const firstPartitionPath = testInfo.outputPath('first-partition.opossum');
  const secondPartitionPath = testInfo.outputPath('second-partition.opossum');

  await createPartition({
    destinationPath: firstPartitionPath,
    resourceName: firstResourceName,
    resourcesTree,
    splitDialog,
    window,
  });
  await splitDialog.closeButton.click();

  await createPartition({
    destinationPath: secondPartitionPath,
    resourceName: secondResourceName,
    resourcesTree,
    splitDialog,
    window,
  });

  await expect.poll(() => fs.existsSync(secondPartitionPath)).toBe(true);

  const sourceSplitInfo = getSplitInfo(filePaths!.opossum);
  const firstPartitionSplitInfo = getSplitInfo(firstPartitionPath);
  const secondPartitionSplitInfo = getSplitInfo(secondPartitionPath);
  expect(sourceSplitInfo.readonlyRules).toEqual([
    { path: firstResourcePath, readonly: true },
    { path: secondResourcePath, readonly: true },
  ]);
  expect(firstPartitionSplitInfo).toMatchObject({
    splitId: sourceSplitInfo.splitId,
    inputSha256: sourceSplitInfo.inputSha256,
  });
  expect(secondPartitionSplitInfo).toMatchObject({
    splitId: sourceSplitInfo.splitId,
    inputSha256: sourceSplitInfo.inputSha256,
    readonlyRules: [
      { path: '/', readonly: true },
      { path: secondResourcePath, readonly: false },
    ],
  });
});

test('rejects a second split of a readonly resource', async ({
  resourcesTree,
  splitDialog,
  window,
}, testInfo) => {
  const firstPartitionPath = testInfo.outputPath('first-partition.opossum');
  const rejectedPartitionPath = testInfo.outputPath(
    'rejected-partition.opossum',
  );

  await createPartition({
    destinationPath: firstPartitionPath,
    resourceName: firstResourceName,
    resourcesTree,
    splitDialog,
    window,
  });
  await splitDialog.closeButton.click();

  await stubSaveDialogSync(window.app, rejectedPartitionPath);
  await resourcesTree.openCreateCollaborativePartitionDialog(firstResourceName);
  await splitDialog.destinationPathSelection.click();
  await splitDialog.createButton.click();

  await splitDialog.assert.showsError(`'${firstResourcePath}' is readonly`);
  expect(fs.existsSync(rejectedPartitionPath)).toBe(false);
});

async function createPartition({
  destinationPath,
  resourceName,
  resourcesTree,
  splitDialog,
  window,
}: {
  destinationPath: string;
  resourceName: string;
  resourcesTree: ResourcesTree;
  splitDialog: SplitDialog;
  window: Page & { app: ElectronApplication };
}): Promise<void> {
  await stubSaveDialogSync(window.app, destinationPath);
  await resourcesTree.openCreateCollaborativePartitionDialog(resourceName);
  await splitDialog.destinationPathSelection.click();
  await splitDialog.createButton.click();
  await splitDialog.assert.succeeded();
}

function getSplitInfo(opossumFilePath: string) {
  return JSON.parse(
    new AdmZip(opossumFilePath).readAsText(SPLIT_INFO_FILE_NAME),
  ) as {
    inputSha256: string;
    readonlyRules: Array<{ path: string; readonly: boolean }>;
    splitId: string;
  };
}
