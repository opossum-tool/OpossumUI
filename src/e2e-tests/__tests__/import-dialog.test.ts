// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';

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

test('opens .json file', async ({ menuBar, importDialog, resourcesTree }) => {
  await menuBar.openImportDialog();
  await importDialog.assert.titleIsVisible();

  await importDialog.inputFilePathTextField.fill(importDialog.inputFilePath);
  await importDialog.importButton.click();

  await resourcesTree.assert.resourceIsVisible(resourceName);
});

test('blocks and shows error when no file path is set', async ({
  menuBar,
  importDialog,
}) => {
  await menuBar.openImportDialog();
  await importDialog.assert.titleIsVisible();

  await importDialog.importButton.click();

  await expect(importDialog.inputFilePathErrorMessage).toHaveText(
    'No file selected',
  );
  await expect(importDialog.opossumFilePathErrorMessage).toHaveText(
    'No save location selected',
  );
});
