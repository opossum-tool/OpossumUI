// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, stubOpenDialogSync, test } from '../utils';

test.use({
  data: {
    inputData: faker.opossum.inputData({}),
  },
});

test('disables menu bar when importing into the current project', async ({
  menuBar,
  importDialog,
}) => {
  await menuBar.assert.projectCommandsAreEnabled();

  await menuBar.importLegacyOpossumFile();
  await importDialog.assert.titleIsVisible();

  await menuBar.assert.projectCommandsAreDisabled();
  await menuBar.assert.referenceAvailableEntriesAreEnabled();
  await menuBar.assert.modalFocusSensitiveEntriesAreDisabled();

  await importDialog.cancelButton.click();
  await importDialog.assert.titleIsHidden();

  await menuBar.assert.projectCommandsAreEnabled();
});

test('disables menu bar when statistics dialog is opened', async ({
  menuBar,
  projectStatisticsPopup,
}) => {
  await menuBar.assert.projectCommandsAreEnabled();

  await menuBar.openProjectStatistics();
  await projectStatisticsPopup.assert.titleIsVisible();

  await menuBar.assert.projectCommandsAreDisabled();
  await menuBar.assert.referenceAvailableEntriesAreEnabled();

  await projectStatisticsPopup.closeButton.click();
  await projectStatisticsPopup.assert.titleIsHidden();

  await menuBar.assert.projectCommandsAreEnabled();
});

test('blocks project commands while project metadata is open', async ({
  menuBar,
  projectMetadataPopup,
}) => {
  await menuBar.openProjectMetadata();
  await projectMetadataPopup.assert.titleIsVisible();
  await menuBar.assert.projectCommandsAreDisabled();

  await projectMetadataPopup.closeButton.click();
  await projectMetadataPopup.assert.titleIsHidden();
  await menuBar.assert.projectCommandsAreEnabled();
});

test('blocks project commands while a reference is open', async ({
  menuBar,
  whatsNewPopup,
}) => {
  await menuBar.assert.projectCommandsAreEnabled();

  await menuBar.showWhatsNew();
  await whatsNewPopup.assert.isVisible();
  await menuBar.assert.projectCommandsAreDisabled();
  await menuBar.assert.referenceAvailableEntriesAreEnabled();
  await menuBar.assert.modalFocusSensitiveEntriesAreDisabled();

  await whatsNewPopup.closeButton.click();
  await whatsNewPopup.assert.isHidden();
  await menuBar.assert.projectCommandsAreEnabled();
});

test('opens notes and its screenshot viewer above Import and restores focus', async ({
  importDialog,
  menuBar,
  whatsNewPopup,
  window,
  filePaths,
}) => {
  await menuBar.importLegacyOpossumFile();
  await importDialog.assert.titleIsVisible();
  await stubOpenDialogSync(window.app, [filePaths!.json]);
  await importDialog.selectInputFile();
  await importDialog.assert.inputFilePathIs(filePaths!.json);

  await importDialog.focusImportButton();
  await menuBar.showWhatsNew();
  await whatsNewPopup.assert.isVisible();
  await menuBar.assert.projectCommandsAreDisabled();
  await menuBar.assert.referenceAvailableEntriesAreEnabled();
  await menuBar.assert.modalFocusSensitiveEntriesAreDisabled();

  await whatsNewPopup.screenshotViewer.open();
  await whatsNewPopup.screenshotViewer.close();
  await whatsNewPopup.assert.isVisible();
  await whatsNewPopup.screenshotViewer.assert.invokingButtonIsFocused();

  await whatsNewPopup.closeButton.click();
  await whatsNewPopup.assert.isHidden();
  await importDialog.assert.inputFilePathIs(filePaths!.json);
  await importDialog.assert.importButtonIsFocused();

  await importDialog.cancelButton.click();
  await importDialog.assert.titleIsHidden();
});
