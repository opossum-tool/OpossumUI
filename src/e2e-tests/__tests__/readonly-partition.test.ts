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

test('shows only the editable partition in audit lists and the resource tree', async ({
  attributionsPanel,
  resourcesTree,
  signalsPanel,
}) => {
  await attributionsPanel.packageCard.assert.isVisible(editableManual);
  await attributionsPanel.packageCard.assert.isVisible(mixedManual);
  await attributionsPanel.packageCard.assert.isHidden(readonlyManual);
  await attributionsPanel.packageCard.assert.isHidden(unlinkedManual);
  await signalsPanel.packageCard.assert.isVisible(editableSignal);
  await signalsPanel.packageCard.assert.isHidden(readonlySignal);

  await resourcesTree.assert.resourceIsHidden('readonly-only');
  await resourcesTree.assert.resourceIsVisible('structural');
  await resourcesTree.goto('structural');
  await resourcesTree.assert.resourceIsVisible('structural-editable');
  await resourcesTree.goto('structural-editable');
  await resourcesTree.assert.resourceIsVisible('mixed.ts');
});

test('scopes audit filters and report rows to the editable partition', async ({
  attributionsPanel,
  reportView,
  topBar,
  window,
}) => {
  await attributionsPanel.filterButton.click();
  await attributionsPanel.filters.license.fill(readonlyManual.licenseName!);
  await expect(
    window.getByRole('option', { name: readonlyManual.licenseName! }),
  ).toBeHidden();
  await attributionsPanel.filters.license.fill(editableManual.licenseName!);
  await expect(
    window.getByRole('option', { name: editableManual.licenseName! }),
  ).toBeVisible();

  await topBar.gotoReportView();
  await reportView.assert.attributionIsVisible(editableManualId);
  await reportView.assert.attributionIsVisible(mixedManualId);
  await reportView.assert.attributionIsVisible(editableSignalId);
  await reportView.assert.attributionIsHidden(readonlyManualId);
  await reportView.assert.attributionIsHidden(readonlySignalId);
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
  await topBar.progressBar.click();
  await signalsPanel.packageCard.assert.isVisible(editableSignal);
  await signalsPanel.packageCard.assert.isHidden(readonlySignal);

  await topBar.selectProgressBar('Criticalities');
  await topBar.progressBar.click();
  await signalsPanel.packageCard.assert.isVisible(editableSignal);

  await topBar.selectProgressBar('Classifications');
  await topBar.progressBar.click();
  await signalsPanel.packageCard.assert.isVisible(editableSignal);

  await menuBar.openProjectStatistics();
  await projectStatisticsPopup.openLicensesTab();
  await projectStatisticsPopup.assert.totalSignalCount(1);
  await expect(projectStatisticsPopup.mostFrequentLicensesChart).toContainText(
    editableSignal.licenseName!,
  );
  await expect(
    projectStatisticsPopup.mostFrequentLicensesChart,
  ).not.toContainText(readonlySignal.licenseName!);
});
