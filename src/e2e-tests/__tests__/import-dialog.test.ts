// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { stubDialog } from 'electron-playwright-helpers';

import { getDotOpossumFilePath } from '../../shared/write-file';
import { faker, test } from '../utils';

const [resourceName] = faker.opossum.resourceName();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName]: 1,
      }),
      metadata: faker.opossum.metadata({
        projectId: 'test_project',
      }),
    }),
    outputData: faker.opossum.outputData({}),
    provideImportFiles: true,
  },
  isImportFileTest: true,
});

test('opens, displays and closes import dialog', async ({
  menuBar,
  importDialog,
}) => {
  await menuBar.openImportLegacyOpossumFile();
  await importDialog.assert.titleIsVisible();

  await importDialog.cancelButton.click();

  await importDialog.assert.titleIsHidden();
});

test('imports legacy opossum file and checks for unsaved changes', async ({
  menuBar,
  importDialog,
  resourcesTree,
  window,
  attributionDetails,
  notSavedPopup,
}) => {
  await stubDialog(window.app, 'showOpenDialogSync', [
    importDialog.legacyFilePath,
  ]);
  await stubDialog(
    window.app,
    'showSaveDialogSync',
    getDotOpossumFilePath(importDialog.legacyFilePath, ['json', 'json.gz']),
  );

  await menuBar.openImportLegacyOpossumFile();
  await importDialog.assert.titleIsVisible();

  await importDialog.inputFileSelection.click();
  await importDialog.opossumFileSelection.click();
  await importDialog.importButton.click();

  await importDialog.assert.titleIsHidden();
  await resourcesTree.assert.resourceIsVisible(resourceName);

  const comment = faker.lorem.sentences();
  await resourcesTree.goto(resourceName);
  await attributionDetails.attributionForm.comment.fill(comment);

  await menuBar.openImportLegacyOpossumFile();
  await notSavedPopup.assert.isVisible();
  await notSavedPopup.discardButton.click();
  await importDialog.assert.titleIsVisible();
});

test('imports scancode file', async ({
  menuBar,
  importDialog,
  resourcesTree,
  window,
}) => {
  await stubDialog(window.app, 'showOpenDialogSync', [
    importDialog.scancodeFilePath,
  ]);
  await stubDialog(
    window.app,
    'showSaveDialogSync',
    getDotOpossumFilePath(importDialog.scancodeFilePath, ['json']),
  );

  await menuBar.openImportScanCodeFile();
  await importDialog.assert.titleIsVisible();

  await importDialog.inputFileSelection.click();
  await importDialog.opossumFileSelection.click();
  await importDialog.importButton.click();

  await importDialog.assert.titleIsHidden();
  await resourcesTree.assert.resourceIsVisible('src');
});

test('shows error when no file path is set', async ({
  menuBar,
  importDialog,
}) => {
  await menuBar.openImportLegacyOpossumFile();
  await importDialog.assert.titleIsVisible();

  await importDialog.importButton.click();

  await importDialog.assert.showsError();
});
