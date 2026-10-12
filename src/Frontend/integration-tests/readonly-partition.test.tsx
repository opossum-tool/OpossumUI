// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import { describe, it } from 'vitest';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import type { Resources } from '../../shared/shared-types';
import { text } from '../../shared/text';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';
import {
  cancelSplitDialog,
  clickAttributionColumnButton,
  clickFilterMenuButton,
  clickPackageCard,
  clickPopupButton,
  clickProgressBar,
  clickProjectStatisticsTab,
  closeFilterMenu,
  expectAttributionColumnButtonVisibility,
  expectConfirmSavePopupIsVisible,
  expectConfirmSavePopupSaveOnlyOnSelectedIsHidden,
  expectFormFieldValues,
  expectLicenseFilterOption,
  expectLicenseTableTotalSignalCountIs,
  expectPackageCardPartition,
  expectPackageCards,
  expectPopupHasText,
  expectPopupHidden,
  expectProgressBarTooltipShowsValues,
  expectProjectStatisticsLicenseTableIsVisible,
  expectReportAttributionVisibility,
  expectResourceVisibility,
  expectSelectedTabIs,
  expectSplitDialogResourceIsReadonly,
  expectSplitDialogVisibility,
  expectSplitHereDisabled,
  expectStatisticsChartContainsText,
  expectStatisticsChartNotContainsText,
  expectTabVisibility,
  expectTreeItemPartition,
  fillFormField,
  fillLicenseFilter,
  gotoReportView,
  gotoResource,
  gotoResourceTreeRoot,
  openProjectStatisticsPopup,
  openSplitDialogFromMenu,
  selectProgressBar,
} from './helpers/ui';

const ATTRIBUTIONS_PANEL = 'attributions-panel';
const SIGNALS_PANEL = 'signals-panel';

const RESOURCES: Resources = {
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

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources(RESOURCES),
  config: { classifications: { 0: 'readonly', 1: 'editable' } },
  externalAttributions: deserializeAttributions({
    [editableSignalId]: editableSignal,
    [readonlySignalId]: readonlySignal,
  }),
  resourcesToExternalAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath('editable', 'external.ts')]: [editableSignalId],
    [faker.opossum.filePath('readonly-only', 'hidden.ts')]: [readonlySignalId],
  }),
  manualAttributions: deserializeAttributions({
    [editableManualId]: editableManual,
    [readonlyManualId]: readonlyManual,
    [mixedManualId]: mixedManual,
    [unlinkedManualId]: unlinkedManual,
  }),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath('editable', 'manual.ts')]: [editableManualId],
    [faker.opossum.filePath('readonly-only', 'hidden.ts')]: [
      readonlyManualId,
      mixedManualId,
    ],
    [faker.opossum.filePath('structural', 'structural-editable', 'mixed.ts')]: [
      mixedManualId,
    ],
  }),
  readonlyRules: [
    { path: '/', readonly: true },
    { path: '/editable', readonly: false },
    { path: '/structural/structural-editable', readonly: false },
  ],
});

describe('readonly partition', () => {
  it('shows editable and readonly partitions with readonly indicators', async () => {
    await renderApp({ data });
    await expectPackageCardPartition(ATTRIBUTIONS_PANEL, editableManual, false);
    await expectPackageCardPartition(ATTRIBUTIONS_PANEL, mixedManual, false);
    await expectPackageCardPartition(ATTRIBUTIONS_PANEL, readonlyManual, true);
    await expectPackageCards(ATTRIBUTIONS_PANEL, [], [unlinkedManual]);
    await expectPackageCardPartition(SIGNALS_PANEL, editableSignal, false);
    await expectPackageCardPartition(SIGNALS_PANEL, readonlySignal, true);

    await expectTreeItemPartition('readonly-only', true);
    await expectResourceVisibility(['structural']);
    await gotoResource('structural');
    await expectTreeItemPartition('structural-editable', false);
    await gotoResource('structural-editable');
    await expectTreeItemPartition('mixed.ts', false);
  });

  it('shows readonly resource data and keeps mixed attributions editable', async () => {
    await renderApp({ data });
    await gotoResource('readonly-only', 'hidden.ts');

    await expectSelectedTabIs(ATTRIBUTIONS_PANEL, 'resource');
    await expectTabVisibility(ATTRIBUTIONS_PANEL, [], ['unrelated']);
    await expectPackageCardPartition(ATTRIBUTIONS_PANEL, readonlyManual, true);
    await expectAttributionColumnButtonVisibility('save', true);
    await expectAttributionColumnButtonVisibility('delete', true);
    await expectAttributionColumnButtonVisibility('link', false);

    await expectPackageCardPartition(SIGNALS_PANEL, readonlySignal, true);
  });

  it('shows readonly descendants and blocks resource operations', async () => {
    const { sendToChannel } = await renderApp({ data });
    await gotoResource('readonly-only');
    await expectSelectedTabIs(ATTRIBUTIONS_PANEL, 'children');
    await expectPackageCardPartition(ATTRIBUTIONS_PANEL, readonlyManual, true);

    await expectSplitHereDisabled('readonly-only');
    await closeFilterMenu();

    openSplitDialogFromMenu(sendToChannel);
    await expectSplitDialogVisibility(true);
    await expectSplitDialogResourceIsReadonly('readonly-only');
    await cancelSplitDialog();
  });

  it('keeps locked mixed attributions unchanged after a writable local edit', async () => {
    const updatedName = 'mixed-edit';

    await renderApp({ data });
    await gotoResource('structural', 'structural-editable', 'mixed.ts');
    await clickPackageCard(ATTRIBUTIONS_PANEL, mixedManual);
    fillFormField('name', updatedName);
    await clickAttributionColumnButton('save');
    await expectConfirmSavePopupIsVisible();
    await expectPopupHasText('confirm save popup', 'on 1 resource');
    await expectConfirmSavePopupSaveOnlyOnSelectedIsHidden();
    await clickPopupButton(
      text.saveAttributionsPopup.ariaLabel,
      text.saveAttributionsPopup.save,
    );
    await expectPopupHidden(text.saveAttributionsPopup.ariaLabel);
    await expectFormFieldValues({ name: updatedName });

    await gotoResourceTreeRoot();
    await gotoResource('readonly-only', 'hidden.ts');
    await clickPackageCard(ATTRIBUTIONS_PANEL, mixedManual);
    await expectFormFieldValues({ name: mixedManual.packageName! });
  });

  it('scopes audit filters and report rows to the editable partition', async () => {
    await renderApp({ data });
    await gotoResource('editable');
    await expectTabVisibility(ATTRIBUTIONS_PANEL, ['unrelated'], []);
    await clickFilterMenuButton(screen.getByTestId(ATTRIBUTIONS_PANEL));
    await fillLicenseFilter(readonlyManual.licenseName!);
    await expectLicenseFilterOption(readonlyManual.licenseName!, false);
    await fillLicenseFilter(editableManual.licenseName!);
    await expectLicenseFilterOption(editableManual.licenseName!, true);
    await closeFilterMenu();

    await gotoReportView();
    await expectReportAttributionVisibility(
      [editableManualId, mixedManualId],
      [readonlyManualId, unlinkedManualId],
    );
  });

  it('uses only editable data for statistics and progress navigation', async () => {
    const { sendToChannel } = await renderApp({ data });
    await expectProgressBarTooltipShowsValues({
      filesWithAttributions: 2,
      filesWithOnlySignals: 1,
    });
    await clickProgressBar();
    await expectPackageCardPartition(SIGNALS_PANEL, editableSignal, false);
    await expectPackageCards(SIGNALS_PANEL, [], [readonlySignal]);

    await selectProgressBar('Criticalities');
    await clickProgressBar();
    await expectPackageCardPartition(SIGNALS_PANEL, editableSignal, false);

    await selectProgressBar('Classifications');
    await clickProgressBar();
    await expectPackageCardPartition(SIGNALS_PANEL, editableSignal, false);

    await openProjectStatisticsPopup(sendToChannel);
    await expectStatisticsChartContainsText(
      'mostFrequentLicenseCountPieChart',
      editableSignal.licenseName!,
    );
    await expectStatisticsChartNotContainsText(
      'mostFrequentLicenseCountPieChart',
      readonlySignal.licenseName!,
    );
    await clickProjectStatisticsTab('details');
    await expectProjectStatisticsLicenseTableIsVisible();
    await expectLicenseTableTotalSignalCountIs(1);
  });
});
