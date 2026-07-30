// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
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
const [attributionId, packageInfo] = faker.opossum.rawAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [firstResourceName]: 1,
        [secondResourceName]: 1,
      }),
      metadata: faker.opossum.metadata({ projectId: 'test_project' }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [attributionId]: packageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [firstResourcePath]: [attributionId],
      }),
    }),
  },
});

test('opens and cancels the create split dialog', async ({
  resourcesTree,
  splitDialog,
}) => {
  await resourcesTree.openSplitDialog(firstResourceName);
  await splitDialog.assert.titleIsVisible();

  await splitDialog.cancelButton.click();

  await splitDialog.assert.titleIsHidden();
});

test('opens the create split dialog from the File menu', async ({
  menuBar,
  splitDialog,
}) => {
  await menuBar.createSplit();

  await splitDialog.assert.titleIsVisible();
  await expect(splitDialog.createButton).toBeDisabled();
});

test('warns user of unsaved changes before creating a split', async ({
  attributionDetails,
  notSavedPopup,
  resourcesTree,
}) => {
  await resourcesTree.goto(firstResourceName);
  await attributionDetails.attributionForm.comment.fill(
    faker.lorem.sentences(),
  );

  await resourcesTree.openSplitDialog(firstResourceName);

  await notSavedPopup.assert.isVisible();
});

test('creates complementary splits', async ({
  resourcesTree,
  splitDialog,
  window,
  filePaths,
}, testInfo) => {
  const partitionPath = testInfo.outputPath('partition.opossum');
  await stubSaveDialogSync(window.app, partitionPath);

  await resourcesTree.openSplitDialog(firstResourceName);
  await splitDialog.destinationPathSelection.click();
  await splitDialog.assert.destinationPathIs(partitionPath);

  await splitDialog.createButton.click();

  await splitDialog.assert.succeeded();
  await expect.poll(() => fs.existsSync(partitionPath)).toBe(true);

  expect(getReadonlyRules(filePaths!.opossum)).toEqual([
    { path: firstResourcePath, readonly: true },
  ]);
  expect(getReadonlyRules(partitionPath)).toEqual([
    { path: '/', readonly: true },
    { path: firstResourcePath, readonly: false },
  ]);
});

test('creates a split from multiple resources', async ({
  resourcesTree,
  splitDialog,
  window,
  filePaths,
}, testInfo) => {
  const partitionPath = testInfo.outputPath('multiple-resources.opossum');
  await stubSaveDialogSync(window.app, partitionPath);

  await resourcesTree.openSplitDialog(firstResourceName);
  await splitDialog.toggleResourceSelection(secondResourceName);
  await splitDialog.destinationPathSelection.click();
  await splitDialog.createButton.click();

  await splitDialog.assert.succeeded();
  await expect.poll(() => fs.existsSync(partitionPath)).toBe(true);

  const selectedResourcePaths = [firstResourcePath, secondResourcePath].sort();
  expect(getReadonlyRules(filePaths!.opossum)).toEqual(
    selectedResourcePaths.map((path) => ({ path, readonly: true })),
  );
  expect(getReadonlyRules(partitionPath)).toEqual([
    { path: '/', readonly: true },
    ...selectedResourcePaths.map((path) => ({ path, readonly: false })),
  ]);
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

  expect(getReadonlyRules(filePaths!.opossum)).toEqual([
    { path: firstResourcePath, readonly: true },
    { path: secondResourcePath, readonly: true },
  ]);
  expect(getReadonlyRules(firstPartitionPath)).toEqual([
    { path: '/', readonly: true },
    { path: firstResourcePath, readonly: false },
  ]);
  expect(getReadonlyRules(secondPartitionPath)).toEqual([
    { path: '/', readonly: true },
    { path: secondResourcePath, readonly: false },
  ]);
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
  await resourcesTree.openSplitDialog(firstResourceName);
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
  await resourcesTree.openSplitDialog(resourceName);
  await splitDialog.destinationPathSelection.click();
  await splitDialog.createButton.click();
  await splitDialog.assert.succeeded();
}

function getReadonlyRules(opossumFilePath: string) {
  return (
    JSON.parse(
      new AdmZip(opossumFilePath).readAsText(SPLIT_INFO_FILE_NAME),
    ) as {
      readonlyRules: Array<{ path: string; readonly: boolean }>;
    }
  ).readonlyRules;
}
