// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { stubDialog } from 'electron-playwright-helpers';

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
  },
  openFromCLI: false,
});

test('opens, displays and closes import dialog', async ({
  menuBar,
  importDialog,
}) => {
  await menuBar.importLegacyOpossumFile();
  await importDialog.assert.titleIsVisible();

  await importDialog.cancelButton.click();

  await importDialog.assert.titleIsHidden();
});

test('imports legacy opossum file', async ({
  menuBar,
  importDialog,
  resourcesTree,
  window,
  filePaths,
}, testInfo) => {
  await stubDialog(window.app, 'showOpenDialogSync', [filePaths!.json]);
  await stubDialog(
    window.app,
    'showSaveDialogSync',
    testInfo.outputPath('report.opossum'),
  );

  await menuBar.importLegacyOpossumFile();
  await importDialog.assert.titleIsVisible();

  await importDialog.inputFileSelection.click();
  await importDialog.opossumFileSelection.click();
  await importDialog.importButton.click();

  await importDialog.assert.titleIsHidden();
  await resourcesTree.assert.resourceIsVisible(resourceName);
});

test('imports scancode file', async ({
  menuBar,
  importDialog,
  resourcesTree,
  window,
}, testInfo) => {
  await stubDialog(window.app, 'showOpenDialogSync', [
    importDialog.scancodeFilePath,
  ]);
  await stubDialog(
    window.app,
    'showSaveDialogSync',
    testInfo.outputPath('scancode-report.opossum'),
  );

  await menuBar.importScanCodeFile();
  await importDialog.assert.titleIsVisible();

  await importDialog.inputFileSelection.click();
  await importDialog.opossumFileSelection.click();
  await importDialog.importButton.click();

  await importDialog.assert.titleIsHidden();
  await resourcesTree.assert.resourceIsVisible('src');
});

test('imports OWASP file', async ({
  menuBar,
  importDialog,
  resourcesTree,
  window,
}, testInfo) => {
  await stubDialog(window.app, 'showOpenDialogSync', [
    importDialog.owaspFilePath,
  ]);
  await stubDialog(
    window.app,
    'showSaveDialogSync',
    testInfo.outputPath('owasp-dependency-check-report.opossum'),
  );

  await menuBar.importOwaspDependencyScanFile();
  await importDialog.assert.titleIsVisible();

  await importDialog.inputFileSelection.click();
  await importDialog.opossumFileSelection.click();
  await importDialog.importButton.click();

  await importDialog.assert.titleIsHidden();
  await resourcesTree.assert.resourceIsVisible('contrib');
});

test('shows error when no file path is set', async ({
  menuBar,
  importDialog,
}) => {
  await menuBar.importLegacyOpossumFile();
  await importDialog.assert.titleIsVisible();

  await importDialog.importButton.click();

  await importDialog.assert.showsError();
});
