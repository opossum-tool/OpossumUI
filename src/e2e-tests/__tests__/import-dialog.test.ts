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
    decompress: true,
  },
  openFileManually: true,
});

test('opens, displays and closes import dialog', async ({
  menuBar,
  importDialog,
}) => {
  await menuBar.openImportDialog();
  await importDialog.assert.titleIsVisible();

  await importDialog.cancelButton.click();

  await importDialog.assert.titleIsHidden();
});

test('opens .json file', async ({
  menuBar,
  importDialog,
  resourcesTree,
  window,
}) => {
  await stubDialog(window.app, 'showOpenDialogSync', [
    importDialog.inputFilePath,
  ]);
  await stubDialog(
    window.app,
    'showSaveDialogSync',
    getDotOpossumFilePath(importDialog.inputFilePath, ['json', 'json.gz']),
  );

  await menuBar.openImportDialog();
  await importDialog.assert.titleIsVisible();

  await importDialog.openFileDialogButton.click();
  await importDialog.saveFileDialogButton.click();
  await importDialog.importButton.click();

  await importDialog.assert.titleIsHidden();
  await resourcesTree.assert.resourceIsVisible(resourceName);
});

test('shows error when no file path is set', async ({
  menuBar,
  importDialog,
}) => {
  await menuBar.openImportDialog();
  await importDialog.assert.titleIsVisible();

  await importDialog.importButton.click();

  await importDialog.assert.showsError();
});
