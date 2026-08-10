// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, stubOpenDialogSync, test } from '../utils';

const [readonlyDirectoryName, editableDirectoryName] =
  faker.opossum.resourceNames({ count: 2 });
const editableResourcePath = faker.opossum.filePath(editableDirectoryName);
const [attributionId, packageInfo] = faker.opossum.rawAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: {
        [readonlyDirectoryName]: { 'readonly-file.ts': 1 },
        [editableDirectoryName]: { 'editable-file.ts': 1 },
      },
      metadata: faker.opossum.metadata({ projectId: 'force_unlock_project' }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [attributionId]: packageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [editableResourcePath]: [attributionId],
      }),
    }),
    readonlyRules: [{ path: `/${readonlyDirectoryName}`, readonly: true }],
  },
});

test('force unlocks a split file, preserves unsaved changes, and persists the editable state', async ({
  attributionsPanel,
  attributionDetails,
  forceUnlockPopup,
  menuBar,
  resourcesTree,
  window,
  filePaths,
}) => {
  const comment = faker.lorem.sentences();

  await resourcesTree.goto(editableDirectoryName);
  await attributionsPanel.packageCard.click(packageInfo);
  await attributionDetails.attributionForm.comment.fill(comment);

  await resourcesTree.assert.resourceIsReadonly(readonlyDirectoryName);
  await resourcesTree.assert.resourceIsEditable(editableDirectoryName);
  await menuBar.assert.forceUnlockIsEnabled();

  await menuBar.forceUnlock();
  await forceUnlockPopup.assert.isVisible();
  await forceUnlockPopup.forceUnlockButton.click();

  await resourcesTree.assert.resourceIsEditable(readonlyDirectoryName);
  await attributionDetails.attributionForm.assert.commentIs(comment);
  await menuBar.assert.forceUnlockIsDisabled();

  await stubOpenDialogSync(window.app, [filePaths!.opossum]);
  await menuBar.openFile();

  await resourcesTree.assert.resourceIsEditable(readonlyDirectoryName);
  await resourcesTree.assert.resourceIsEditable(editableDirectoryName);
});
