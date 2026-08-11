// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';

import type { Resources } from '../../shared/shared-types';
import { faker, test } from '../utils';

const resources: Resources = {
  'readonly-only': { 'hidden.ts': 1 },
  structural: { 'structural-editable': { 'mixed.ts': 1 } },
  editable: { 'manual.ts': 1, 'external.ts': 1 },
};

const [editableManualId, editableManual] = faker.opossum.rawAttribution({
  licenseName: 'Editable-Manual',
  packageName: 'editable-manual',
});
const [readonlyManualId, readonlyManual] = faker.opossum.rawAttribution({
  licenseName: 'Readonly-Manual',
  packageName: 'readonly-manual',
});
const [mixedManualId, mixedManual] = faker.opossum.rawAttribution({
  licenseName: 'Mixed-Manual',
  packageName: 'mixed-manual',
});
const [unlinkedManualId, unlinkedManual] = faker.opossum.rawAttribution({
  licenseName: 'Unlinked-Manual',
  packageName: 'unlinked-manual',
});
const [editableSignalId, editableSignal] = faker.opossum.rawAttribution({
  licenseName: 'Editable-Signal',
  packageName: 'editable-signal',
  criticality: 'high',
  classification: 1,
});
const [readonlySignalId, readonlySignal] = faker.opossum.rawAttribution({
  licenseName: 'Readonly-Signal',
  packageName: 'readonly-signal',
  criticality: 'medium',
  classification: 0,
});

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources(resources),
      config: { classifications: { 0: 'readonly', 1: 'editable' } },
      externalAttributions: faker.opossum.rawAttributions({
        [editableSignalId]: editableSignal,
        [readonlySignalId]: readonlySignal,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        '/editable/external.ts': [editableSignalId],
        '/readonly-only/hidden.ts': [readonlySignalId],
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [editableManualId]: editableManual,
        [readonlyManualId]: readonlyManual,
        [mixedManualId]: mixedManual,
        [unlinkedManualId]: unlinkedManual,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        '/editable/manual.ts': [editableManualId],
        '/readonly-only/hidden.ts': [readonlyManualId, mixedManualId],
        '/structural/structural-editable/mixed.ts': [mixedManualId],
      }),
    }),
    readonlyRules: [
      { path: '/', readonly: true },
      { path: '/editable', readonly: false },
      { path: '/structural/structural-editable', readonly: false },
    ],
  },
});

test('shows editable and readonly partitions with readonly indicators', async ({
  attributionsPanel,
  resourcesTree,
  signalsPanel,
}) => {
  await attributionsPanel.packageCard.assert.isEditable(editableManual);
  await attributionsPanel.packageCard.assert.isEditable(mixedManual);
  await attributionsPanel.packageCard.assert.isReadonly(readonlyManual);
  await attributionsPanel.packageCard.assert.isHidden(unlinkedManual);
  await signalsPanel.packageCard.assert.isEditable(editableSignal);
  await signalsPanel.packageCard.assert.isReadonly(readonlySignal);

  await resourcesTree.assert.resourceIsReadonly('readonly-only');
  await resourcesTree.assert.resourceIsVisible('structural');
  await resourcesTree.goto('structural');
  await resourcesTree.assert.resourceIsEditable('structural-editable');
  await resourcesTree.goto('structural-editable');
  await resourcesTree.assert.resourceIsEditable('mixed.ts');
});

test('shows readonly resource data and keeps mixed attributions editable', async ({
  attributionDetails,
  attributionsPanel,
  resourcesTree,
  signalsPanel,
}) => {
  await resourcesTree.goto('readonly-only', 'hidden.ts');

  await attributionsPanel.assert.selectedTabIs('onResource');
  await attributionsPanel.assert.tabIsHidden('unrelated');
  await attributionsPanel.packageCard.assert.isReadonly(readonlyManual);
  await attributionDetails.assert.saveButtonIsVisible();
  await attributionDetails.assert.deleteButtonIsVisible();
  await attributionDetails.assert.linkButtonIsHidden();

  await signalsPanel.packageCard.assert.isReadonly(readonlySignal);
});

test('shows readonly descendants and blocks resource operations', async ({
  attributionsPanel,
  menuBar,
  resourcesTree,
  splitDialog,
}) => {
  await resourcesTree.goto('readonly-only');
  await attributionsPanel.assert.selectedTabIs('onChildren');
  await attributionsPanel.packageCard.assert.isReadonly(readonlyManual);

  await resourcesTree.assert.splitHereIsDisabled('readonly-only');

  await menuBar.createSplit();
  await splitDialog.assert.resourceIsReadonly('readonly-only');
  await splitDialog.cancelButton.click();
});

test('keeps locked mixed attributions unchanged after a writable local edit', async ({
  attributionDetails,
  attributionsPanel,
  confirmSavePopup,
  resourcesTree,
}) => {
  const updatedName = 'mixed-edit';

  await resourcesTree.goto('structural', 'structural-editable', 'mixed.ts');
  await attributionsPanel.packageCard.click(mixedManual);
  await attributionDetails.attributionForm.name.fill(updatedName);
  await attributionDetails.saveButton.click();
  await confirmSavePopup.assert.isVisible();
  await confirmSavePopup.assert.hasText('on 1 resource');
  await expect(confirmSavePopup.saveLocallyButton).toBeHidden();
  await confirmSavePopup.saveButton.click();
  await confirmSavePopup.assert.isHidden();
  await attributionDetails.attributionForm.assert.nameIs(updatedName);

  await resourcesTree.gotoRoot();
  await resourcesTree.goto('readonly-only', 'hidden.ts');
  await attributionsPanel.packageCard.click(mixedManual);
  await attributionDetails.attributionForm.assert.nameIs(
    mixedManual.packageName!,
  );
});

test('scopes audit filters and report rows to the editable partition', async ({
  attributionsPanel,
  reportView,
  resourcesTree,
  topBar,
  window,
}) => {
  await resourcesTree.goto('editable');
  await attributionsPanel.assert.tabIsVisible('unrelated');
  await attributionsPanel.filterButton.click();
  await attributionsPanel.filters.license.fill(readonlyManual.licenseName!);
  await expect(
    window.getByRole('option', { name: readonlyManual.licenseName! }),
  ).toBeHidden();
  await attributionsPanel.filters.license.fill(editableManual.licenseName!);
  await expect(
    window.getByRole('option', { name: editableManual.licenseName! }),
  ).toBeVisible();
  await attributionsPanel.closeFilterMenu();

  await topBar.gotoReportView();
  await reportView.assert.attributionIsEditable(editableManualId);
  await reportView.assert.attributionIsEditable(mixedManualId);
  await reportView.assert.attributionIsReadonly(readonlyManualId);
  await reportView.assert.attributionIsHidden(unlinkedManualId);
});

test('uses only editable data for statistics and progress navigation', async ({
  menuBar,
  projectStatisticsPopup,
  signalsPanel,
  topBar,
}) => {
  await topBar.assert.progressBarTooltipShowsValues({
    filesWithAttributions: 2,
    filesWithOnlySignals: 1,
  });
  await topBar.node.hover();
  await topBar.clickProgressBar();
  await signalsPanel.packageCard.assert.isEditable(editableSignal);
  await signalsPanel.packageCard.assert.isHidden(readonlySignal);

  await topBar.selectProgressBar('Criticalities');
  await topBar.clickProgressBar();
  await signalsPanel.packageCard.assert.isEditable(editableSignal);

  await topBar.selectProgressBar('Classifications');
  await topBar.clickProgressBar();
  await signalsPanel.packageCard.assert.isEditable(editableSignal);

  await menuBar.openProjectStatistics();
  await expect(projectStatisticsPopup.mostFrequentLicensesChart).toContainText(
    editableSignal.licenseName!,
  );
  await expect(
    projectStatisticsPopup.mostFrequentLicensesChart,
  ).not.toContainText(readonlySignal.licenseName!);
  await projectStatisticsPopup.openLicensesTab();
  await projectStatisticsPopup.assert.totalSignalCount(1);
});
