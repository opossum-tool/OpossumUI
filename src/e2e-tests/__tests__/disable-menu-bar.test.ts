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
  await menuBar.assert.popupDisabledEntriesAreEnabled();

  await menuBar.importLegacyOpossumFileIntoCurrentProject();
  await importDialog.assert.titleIsVisible();

  await menuBar.assert.popupDisabledEntriesAreDisabled();

  await importDialog.cancelButton.click();
  await importDialog.assert.titleIsHidden();

  await menuBar.assert.popupDisabledEntriesAreEnabled();
});

test('disables menu bar when import dialog is opened', async ({
  menuBar,
  importDialog,
}) => {
  await menuBar.assert.popupDisabledEntriesAreEnabled();

  await menuBar.importLegacyOpossumFile();
  await importDialog.assert.titleIsVisible();

  await menuBar.assert.popupDisabledEntriesAreDisabled();

  await importDialog.cancelButton.click();
  await importDialog.assert.titleIsHidden();

  await menuBar.assert.popupDisabledEntriesAreEnabled();
});

test('disables menu bar when statistics dialog is opened', async ({
  menuBar,
  projectStatisticsPopup,
}) => {
  await menuBar.assert.popupDisabledEntriesAreEnabled();

  await menuBar.openProjectStatistics();
  await projectStatisticsPopup.assert.titleIsVisible();

  await menuBar.assert.popupDisabledEntriesAreDisabled();

  await projectStatisticsPopup.closeButton.click();
  await projectStatisticsPopup.assert.titleIsHidden();

  await menuBar.assert.popupDisabledEntriesAreEnabled();
});

test('does not enable menu bar after opening file if statistics popup is immediately opened', async ({
  menuBar,
  projectStatisticsPopup,
  filePaths,
  window,
}) => {
  await menuBar.assert.popupDisabledEntriesAreEnabled();
  await menuBar.openProjectStatistics();
  await projectStatisticsPopup.showOnStartupCheckbox.click();
  await projectStatisticsPopup.closeButton.click();

  await stubOpenDialogSync(window.app, [filePaths!.opossum]);
  await menuBar.openFile();

  await projectStatisticsPopup.assert.titleIsVisible();

  await menuBar.assert.popupDisabledEntriesAreDisabled();

  await projectStatisticsPopup.closeButton.click();
  await projectStatisticsPopup.assert.titleIsHidden();

  await menuBar.assert.popupDisabledEntriesAreEnabled();
});
