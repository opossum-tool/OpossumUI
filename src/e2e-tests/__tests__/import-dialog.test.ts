// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, stubOpenDialogSync, stubSaveDialogSync, test } from '../utils';

const [resourceName] = faker.opossum.resourceName();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({ [resourceName]: 1 }),
      metadata: faker.opossum.metadata({ projectId: 'test_project' }),
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
  await stubOpenDialogSync(window.app, [filePaths!.json]);
  await stubSaveDialogSync(window.app, testInfo.outputPath('report.opossum'));

  await menuBar.importLegacyOpossumFile();
  await importDialog.assert.titleIsVisible();

  await importDialog.inputFileSelection.click();
  await importDialog.assert.inputFilePathIs(filePaths!.json);
  await importDialog.opossumFileSelection.click();
  await importDialog.assert.opossumFilePathIs(
    testInfo.outputPath('report.opossum'),
  );
  await importDialog.importButton.click();

  await importDialog.assert.titleIsHidden();
  await resourcesTree.assert.resourceIsVisible(resourceName);
  await menuBar.assert.initiallyDisabledEntriesAreEnabled();
});

test('imports scancode file', async ({
  menuBar,
  importDialog,
  resourcesTree,
  window,
}, testInfo) => {
  await stubOpenDialogSync(window.app, [importDialog.scancodeFilePath]);
  await stubSaveDialogSync(
    window.app,
    testInfo.outputPath('scancode-report.opossum'),
  );

  await menuBar.importScanCodeFile();
  await importDialog.assert.titleIsVisible();

  await importDialog.inputFileSelection.click();
  await importDialog.assert.inputFilePathIs(importDialog.scancodeFilePath);
  await importDialog.opossumFileSelection.click();
  await importDialog.assert.opossumFilePathIs(
    testInfo.outputPath('scancode-report.opossum'),
  );
  await importDialog.importButton.click();

  await importDialog.assert.titleIsHidden();
  await resourcesTree.assert.resourceIsVisible('src');
  await menuBar.assert.initiallyDisabledEntriesAreEnabled();
});

test('imports OWASP file', async ({
  menuBar,
  importDialog,
  resourcesTree,
  window,
}, testInfo) => {
  await stubOpenDialogSync(window.app, [importDialog.owaspFilePath]);
  await stubSaveDialogSync(
    window.app,
    testInfo.outputPath('owasp-dependency-check-report.opossum'),
  );

  await menuBar.importOwaspDependencyScanFile();
  await importDialog.assert.titleIsVisible();

  await importDialog.inputFileSelection.click();
  await importDialog.assert.inputFilePathIs(importDialog.owaspFilePath);
  await importDialog.opossumFileSelection.click();
  await importDialog.assert.opossumFilePathIs(
    testInfo.outputPath('owasp-dependency-check-report.opossum'),
  );
  await importDialog.importButton.click();

  await importDialog.assert.titleIsHidden();
  await resourcesTree.assert.resourceIsVisible('contrib');
  await menuBar.assert.initiallyDisabledEntriesAreEnabled();
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
