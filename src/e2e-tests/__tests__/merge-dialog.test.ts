// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, stubOpenDialogSync, test } from '../utils';

const [resourceName] = faker.opossum.resourceName();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName]: 1,
      }),
      metadata: faker.opossum.metadata({
        projectId: 'test_project',
        projectTitle: 'Test Project',
      }),
    }),
    outputData: faker.opossum.outputData({}),
  },
});

test('opens, displays and closes merge dialog', async ({
  menuBar,
  mergeDialog,
}) => {
  await menuBar.mergeLegacyOpossumFile();
  await mergeDialog.assert.titleIsVisible();

  await mergeDialog.cancelButton.click();

  await mergeDialog.assert.titleIsHidden();
});

test('merges legacy opossum file', async ({
  menuBar,
  mergeDialog,
  resourcesTree,
  window,
  filePaths,
}) => {
  await stubOpenDialogSync(window.app, [filePaths!.json]);

  await menuBar.mergeLegacyOpossumFile();
  await mergeDialog.assert.titleIsVisible();

  await mergeDialog.inputFileSelection.click();
  await mergeDialog.assert.inputFilePathIs(filePaths!.json);
  await mergeDialog.mergeButton.click();

  await mergeDialog.assert.titleIsHidden();
  await resourcesTree.assert.resourceIsVisible(resourceName);
});

test('merges scancode file', async ({
  menuBar,
  mergeDialog,
  resourcesTree,
  window,
}) => {
  await stubOpenDialogSync(window.app, [mergeDialog.scancodeFilePath]);

  await menuBar.mergeScanCodeFile();
  await mergeDialog.assert.titleIsVisible();

  await mergeDialog.inputFileSelection.click();
  await mergeDialog.assert.inputFilePathIs(mergeDialog.scancodeFilePath);
  await mergeDialog.mergeButton.click();

  await mergeDialog.assert.titleIsHidden();
  await resourcesTree.assert.resourceIsVisible(resourceName);
  await resourcesTree.assert.resourceIsVisible('src');
});

test('merges OWASP file', async ({
  menuBar,
  mergeDialog,
  resourcesTree,
  window,
}) => {
  await stubOpenDialogSync(window.app, [mergeDialog.owaspFilePath]);

  await menuBar.mergeOwaspDependencyScanFile();
  await mergeDialog.assert.titleIsVisible();

  await mergeDialog.inputFileSelection.click();
  await mergeDialog.assert.inputFilePathIs(mergeDialog.owaspFilePath);
  await mergeDialog.mergeButton.click();

  await mergeDialog.assert.titleIsHidden();
  await resourcesTree.assert.resourceIsVisible(resourceName);
  await resourcesTree.assert.resourceIsVisible('contrib');
});

test('shows error when no file path is set', async ({
  menuBar,
  mergeDialog,
}) => {
  await menuBar.mergeLegacyOpossumFile();
  await mergeDialog.assert.titleIsVisible();

  await mergeDialog.mergeButton.click();

  await mergeDialog.assert.showsError();
});
