// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { type ElectronApplication, expect, type Page } from '@playwright/test';
import fs from 'fs';

import type { ResourcesTree } from '../page-objects/ResourcesTree';
import type { SplitDialog } from '../page-objects/SplitDialog';
import { faker, stubSaveDialogSync, test } from '../utils';

const [
  firstDirectoryName,
  secondDirectoryName,
  nestedDirectoryName,
  firstResourceName,
  secondResourceName,
] = faker.opossum.resourceNames({ count: 5 });
const firstResourcePath = faker.opossum.filePath(
  firstDirectoryName,
  firstResourceName,
);
const [attributionId, packageInfo] = faker.opossum.rawAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [firstDirectoryName]: { [firstResourceName]: 1 },
        [secondDirectoryName]: {
          [nestedDirectoryName]: { [secondResourceName]: 1 },
        },
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

// The dialog-UX tests of this suite (opening/cancelling via the tree context
// menu, opening via the File menu, and the unsaved-changes warning) live in
// src/Frontend/integration-tests/splitting-opossum-files.test.tsx. The tests
// below stay e2e: they create real partitions through the native save dialog
// stub and verify the resulting .opossum files on disk, which the
// integration harness cannot exercise.

test('opens the new split file', async ({
  attributionsPanel,
  menuBar,
  reportView,
  resourcesTree,
  splitDialog,
  topBar,
  window,
}, testInfo) => {
  const partitionPath = testInfo.outputPath('partition.opossum');
  await stubSaveDialogSync(window.app, partitionPath);

  await resourcesTree.openSplitDialog(firstDirectoryName);
  await splitDialog.destinationPathSelection.click();
  await splitDialog.assert.destinationPathIs(partitionPath);

  await splitDialog.createButton.click();

  await splitDialog.assert.succeeded();
  await expect.poll(() => fs.existsSync(partitionPath)).toBe(true);
  await splitDialog.closeButton.click();

  await resourcesTree.assert.resourceIsReadonly(firstDirectoryName);
  await resourcesTree.assert.resourceIsEditable(secondDirectoryName);
  await attributionsPanel.packageCard.assert.isReadonly(packageInfo);
  await topBar.gotoReportView();
  await reportView.assert.attributionIsHidden(attributionId);
  await topBar.gotoAuditView();

  await menuBar.openFileAndWaitForLoad(partitionPath);

  await resourcesTree.assert.resourceIsEditable(firstDirectoryName);
  await resourcesTree.assert.resourceIsReadonly(secondDirectoryName);
  await resourcesTree.goto(firstDirectoryName, firstResourceName);
  await attributionsPanel.packageCard.assert.isVisible(packageInfo);
});

test('creates a split from multiple resources', async ({
  menuBar,
  resourcesTree,
  splitDialog,
  window,
}, testInfo) => {
  const partitionPath = testInfo.outputPath('multiple-resources.opossum');
  await stubSaveDialogSync(window.app, partitionPath);

  await resourcesTree.openSplitDialog(firstDirectoryName);
  await splitDialog.toggleResourceSelection(secondDirectoryName);
  await splitDialog.destinationPathSelection.click();
  await splitDialog.createButton.click();

  await splitDialog.assert.succeeded();
  await expect.poll(() => fs.existsSync(partitionPath)).toBe(true);
  await splitDialog.closeButton.click();

  await resourcesTree.assert.resourceIsReadonly(firstDirectoryName);
  await resourcesTree.assert.resourceIsReadonly(secondDirectoryName);

  await menuBar.openFileAndWaitForLoad(partitionPath);

  await resourcesTree.assert.resourceIsEditable(firstDirectoryName);
  await resourcesTree.assert.resourceIsEditable(secondDirectoryName);
});

test('creates two consecutive partitions from writable resources', async ({
  menuBar,
  resourcesTree,
  splitDialog,
  window,
}, testInfo) => {
  const firstPartitionPath = testInfo.outputPath('first-partition.opossum');
  const secondPartitionPath = testInfo.outputPath('second-partition.opossum');

  await resourcesTree.goto(secondDirectoryName, nestedDirectoryName);
  await resourcesTree.assert.resourceIsVisible(secondResourceName);

  await createPartition({
    destinationPath: firstPartitionPath,
    resourceName: firstDirectoryName,
    resourcesTree,
    splitDialog,
    window,
  });
  await splitDialog.assert.resourceIsReadonly(firstDirectoryName);
  await splitDialog.assert.resourceIsEditable(secondDirectoryName);

  await stubSaveDialogSync(window.app, secondPartitionPath);
  await splitDialog.toggleResourceSelection(secondDirectoryName);
  await splitDialog.destinationPathSelection.click();
  await splitDialog.createButton.click();
  await splitDialog.assert.succeeded();

  await expect.poll(() => fs.existsSync(secondPartitionPath)).toBe(true);
  await splitDialog.closeButton.click();

  await resourcesTree.assert.resourceIsReadonly(firstDirectoryName);
  await resourcesTree.assert.resourceIsReadonly(secondDirectoryName);

  await menuBar.openFileAndWaitForLoad(firstPartitionPath);
  await resourcesTree.assert.resourceIsEditable(firstDirectoryName);
  await resourcesTree.assert.resourceIsReadonly(secondDirectoryName);

  await menuBar.openFileAndWaitForLoad(secondPartitionPath);
  await resourcesTree.assert.resourceIsReadonly(firstDirectoryName);
  await resourcesTree.assert.resourceIsEditable(secondDirectoryName);
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
