// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';

import { deserializeAttributions } from '../ElectronBackend/input/parseInputData';
import { MANUAL_ATTRIBUTION_FILTERS_AUDIT } from '../Frontend/state/variables/use-filters';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { text } from '../shared/text';
import { faker } from '../testing/Faker';
import { getFilterExcludedAttributionsFixture } from '../testing/filter-excluded-attributions';
import { renderApp } from '../testing/render-app';
import {
  addLicenseSearchFilter,
  applyPanelFilter,
  ATTRIBUTIONS_PANEL,
  clearFilterMenuFilterChip,
  clearPanelSearch,
  clickClearFiltersMenuItem,
  clickFilterMenuButton,
  clickFilterMenuItem,
  clickPackageCard,
  clickPanelFilterMenuButton,
  clickPopupButton,
  closeFilterMenu,
  closeLicenseEditorDialog,
  expectFilterMenuDropdownValue,
  expectFilterMenuIconVisible,
  expectFilterMenuItemCount,
  expectFormFieldValues,
  expectLicenseFilterOption,
  expectPackageCards,
  expectPopupHasText,
  expectPopupHidden,
  expectReportAttributionVisibility,
  expectSearchFocused,
  expectSearchValue,
  fillFormField,
  fillLicenseFilter,
  fillPanelSearch,
  getReportView,
  gotoReportView,
  gotoResource,
  pressSearchShortcut,
  selectFilterLicenseName,
  selectFilterMenuDropdown,
} from '../testing/ui';

const ATTRIBUTIONS_HEADER = 'attributions-panel-header';

const {
  attributionId1,
  attributionId2,
  attributionId3,
  packageInfo1,
  packageInfo2,
  packageInfo3,
  resourceName4,
  resources,
  manualAttributions,
  resourcesToAttributions,
} = getFilterExcludedAttributionsFixture();

const data = getParsedInputFileEnrichedWithTestData({
  resources,
  manualAttributions: deserializeAttributions(manualAttributions),
  resourcesToManualAttributions: resourcesToAttributions,
});

describe('filtering attributions', () => {
  it('keeps classification IDs distinct when descriptions are duplicated', async () => {
    await renderApp({
      data: {
        ...data,
        config: {
          classifications: { 1: 'Same description', 2: 'Same description' },
        },
        manualAttributions: {
          ...data.manualAttributions,
          attributions: deserializeAttributions({
            [attributionId1]: { ...packageInfo1, classification: 1 },
            [attributionId2]: { ...packageInfo2, classification: 2 },
            [attributionId3]: { ...packageInfo3, classification: 1 },
          }),
        },
      },
      userSettings: { showClassifications: true },
    });
    await clickPanelFilterMenuButton(ATTRIBUTIONS_PANEL);
    await selectFilterMenuDropdown('classification', 'Same description', 1);

    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo2],
      [packageInfo1, packageInfo3],
    );
    await expectFilterMenuDropdownValue('classification', 'Same description');

    await clearFilterMenuFilterChip();
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1, packageInfo2, packageInfo3],
      [],
    );
  });

  it('selects and clears classification zero and criticality None', async () => {
    const { store } = await renderApp({
      data: {
        ...data,
        config: { classifications: { 0: 'Zero', 1: 'One' } },
      },
      userSettings: { showClassifications: true, showCriticality: true },
    });
    await clickPanelFilterMenuButton(ATTRIBUTIONS_PANEL);

    await selectFilterMenuDropdown('classification', 'Zero');
    await expectFilterMenuIconVisible('Classification icon', true);
    expect(
      (
        store.getState() as {
          variablesState: Record<
            string,
            { valueFilters: { classification?: number } }
          >;
        }
      ).variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT]?.valueFilters
        .classification,
    ).toBe(0);

    await selectFilterMenuDropdown('criticality', 'None');
    expect(
      (
        store.getState() as {
          variablesState: Record<
            string,
            { valueFilters: { criticality?: number } }
          >;
        }
      ).variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT]?.valueFilters
        .criticality,
    ).toBe(0);

    await clickClearFiltersMenuItem();
    expect(
      (
        store.getState() as {
          variablesState: Record<
            string,
            { valueFilters: { classification?: number; criticality?: number } }
          >;
        }
      ).variablesState[MANUAL_ATTRIBUTION_FILTERS_AUDIT]?.valueFilters,
    ).toEqual({});
  });

  it('filters attributions in audit view', async () => {
    await renderApp({ data });
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1, packageInfo2, packageInfo3],
      [],
    );

    await applyPanelFilter(ATTRIBUTIONS_PANEL, 'needsFollowUp');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1],
      [packageInfo2, packageInfo3],
    );

    await applyPanelFilter(ATTRIBUTIONS_PANEL, 'firstParty');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [],
      [packageInfo1, packageInfo2, packageInfo3],
    );

    await applyPanelFilter(ATTRIBUTIONS_PANEL, 'needsFollowUp');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo3],
      [packageInfo1, packageInfo2],
    );

    await applyPanelFilter(ATTRIBUTIONS_PANEL, 'firstParty');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1, packageInfo2, packageInfo3],
      [],
    );

    await clickPanelFilterMenuButton(ATTRIBUTIONS_PANEL);
    await selectFilterLicenseName(packageInfo1.licenseName ?? '');
    await closeLicenseEditorDialog();
    await closeFilterMenu();
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1],
      [packageInfo2, packageInfo3],
    );
  });

  it('applies contains conditions in audit and report while keeping picker options available', async () => {
    await renderApp({ data });
    await clickPanelFilterMenuButton(ATTRIBUTIONS_PANEL);
    await addLicenseSearchFilter('mIt');
    await fillLicenseFilter('Apache-2.0');
    await expectLicenseFilterOption('Apache-2.0', true);
    await closeFilterMenu();
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1],
      [packageInfo2, packageInfo3],
    );
    await gotoReportView();
    await clickFilterMenuButton(getReportView());
    await addLicenseSearchFilter('pAcHe');
    await closeFilterMenu();
    await expectReportAttributionVisibility(
      [attributionId2],
      [attributionId1, attributionId3],
    );
  });

  it('broadens license matches and keeps audit and report selections independent', async () => {
    await renderApp({ data });
    await clickPanelFilterMenuButton(ATTRIBUTIONS_PANEL);
    await selectFilterLicenseName('MIT');
    await selectFilterLicenseName('Apache-2.0');
    await closeFilterMenu();
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1, packageInfo2],
      [packageInfo3],
    );

    await gotoReportView();
    await expectReportAttributionVisibility(
      [attributionId1, attributionId2, attributionId3],
      [],
    );
    await clickFilterMenuButton(getReportView());
    await selectFilterLicenseName('MIT');
    await selectFilterLicenseName('Apache-2.0');
    await closeFilterMenu();
    await expectReportAttributionVisibility(
      [attributionId1, attributionId2],
      [attributionId3],
    );
    await clickFilterMenuButton(getReportView());
    await clickClearFiltersMenuItem();
    await closeFilterMenu();
    await expectReportAttributionVisibility(
      [attributionId1, attributionId2, attributionId3],
      [],
    );
  });

  it('combines and clears value filters in audit view', async () => {
    await renderApp({ data });
    await clickPanelFilterMenuButton(ATTRIBUTIONS_PANEL);
    await selectFilterLicenseName(packageInfo1.licenseName ?? '');
    await closeLicenseEditorDialog();
    await selectFilterMenuDropdown(
      'incomplete component coordinates',
      text.filters.any,
    );

    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1],
      [packageInfo2, packageInfo3],
    );

    await clickClearFiltersMenuItem();
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1, packageInfo2, packageInfo3],
      [],
    );
  });

  it('applies a filter after discarding unsaved attribution changes', async () => {
    await renderApp({ data });
    const comment = faker.lorem.sentences();
    await gotoResource(resourceName4);
    fillFormField('comment', comment);

    await clickPanelFilterMenuButton(ATTRIBUTIONS_PANEL);
    await clickFilterMenuItem(text.filters.needsFollowUp);
    await expectPopupHasText(
      'unsaved changes popup',
      'You have unsaved changes. What would you like to do?',
    );

    await clickPopupButton('unsaved changes popup', 'Cancel');
    await expectPopupHidden('unsaved changes popup');
    await expectFormFieldValues({ comment });
    await expectPackageCards(ATTRIBUTIONS_PANEL, [packageInfo2], []);

    await closeFilterMenu();
    await clickPanelFilterMenuButton(ATTRIBUTIONS_PANEL);
    await clickFilterMenuItem(text.filters.needsFollowUp);
    await clickPopupButton('unsaved changes popup', 'Discard and Proceed');
    await expectPopupHidden('unsaved changes popup');

    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1],
      [packageInfo2],
    );
    await expectFormFieldValues({
      name: packageInfo1.packageName ?? null,
    });
  });

  it('keeps a zero criticality filter clearable in audit and report views', async () => {
    await renderApp({ data });
    await clickPanelFilterMenuButton(ATTRIBUTIONS_PANEL);
    await selectFilterMenuDropdown('criticality', 'None');
    await clickClearFiltersMenuItem();
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1, packageInfo2, packageInfo3],
      [],
    );

    await closeFilterMenu();
    await gotoReportView();
    await clickFilterMenuButton(getReportView());
    await selectFilterMenuDropdown('criticality', 'None');
    await clickClearFiltersMenuItem();
    await expectReportAttributionVisibility(
      [attributionId1, attributionId2, attributionId3],
      [],
    );
  });

  it('filters attributions in report view', async () => {
    await renderApp({ data });
    await gotoReportView();
    await expectReportAttributionVisibility(
      [attributionId1, attributionId2, attributionId3],
      [],
    );

    await clickFilterMenuButton(getReportView());
    await clickFilterMenuItem(text.filters.needsFollowUp);
    await closeFilterMenu();
    await expectReportAttributionVisibility(
      [attributionId1],
      [attributionId2, attributionId3],
    );

    await clickFilterMenuButton(getReportView());
    await clickFilterMenuItem(text.filters.firstParty);
    await closeFilterMenu();
    await expectReportAttributionVisibility(
      [],
      [attributionId1, attributionId2, attributionId3],
    );

    await clickFilterMenuButton(getReportView());
    await clickFilterMenuItem(text.filters.needsFollowUp);
    await closeFilterMenu();
    await expectReportAttributionVisibility(
      [attributionId3],
      [attributionId1, attributionId2],
    );

    await clickFilterMenuButton(getReportView());
    await clickFilterMenuItem(text.filters.firstParty);
    await closeFilterMenu();
    await expectReportAttributionVisibility(
      [attributionId1, attributionId2, attributionId3],
      [],
    );

    await clickFilterMenuButton(getReportView());
    await selectFilterLicenseName(packageInfo1.licenseName ?? '');
    await closeLicenseEditorDialog();
    await closeFilterMenu();
    await expectReportAttributionVisibility(
      [attributionId1],
      [attributionId2, attributionId3],
    );
  });

  it('filters AI-deferred attributions in audit view', async () => {
    const [deferredId, deferredAttribution] = faker.opossum.rawAttribution({
      aiAttributions: { deferredFields: { copyright: true } },
    });
    const [otherId, otherAttribution] = faker.opossum.rawAttribution();
    const resourceName = faker.opossum.resourceNames({ count: 1 })[0];
    const filePath = faker.opossum.filePath(resourceName);

    await renderApp({
      data: getParsedInputFileEnrichedWithTestData({
        resources: faker.opossum.resources({ [resourceName]: 1 }),
        manualAttributions: deserializeAttributions({
          [deferredId]: deferredAttribution,
          [otherId]: otherAttribution,
        }),
        resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
          [filePath]: [deferredId, otherId],
        }),
      }),
    });

    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [deferredAttribution, otherAttribution],
      [],
    );

    await applyPanelFilter(ATTRIBUTIONS_PANEL, 'aiDeferred');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [deferredAttribution],
      [otherAttribution],
    );

    await clickPanelFilterMenuButton(ATTRIBUTIONS_PANEL);
    await clickClearFiltersMenuItem();
    await closeFilterMenu();
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [deferredAttribution, otherAttribution],
      [],
    );
  });

  it('scopes filter counts to the attributions displayed for the selected resource', async () => {
    const [deferredId, deferredAttribution] = faker.opossum.rawAttribution({
      aiAttributions: { deferredFields: { copyright: true } },
    });
    const [plainId, plainAttribution] = faker.opossum.rawAttribution();
    const [aiId, aiAttribution] = faker.opossum.rawAttribution({
      aiAttributions: { humanModified: false },
    });
    const [deferredFileName, plainFileName] = faker.opossum.resourceNames({
      count: 2,
    });

    await renderApp({
      data: getParsedInputFileEnrichedWithTestData({
        resources: faker.opossum.resources({
          [deferredFileName]: 1,
          [plainFileName]: 1,
        }),
        manualAttributions: deserializeAttributions({
          [deferredId]: deferredAttribution,
          [plainId]: plainAttribution,
          [aiId]: aiAttribution,
        }),
        resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath(deferredFileName)]: [deferredId],
          [faker.opossum.filePath(plainFileName)]: [plainId, aiId],
        }),
      }),
    });

    async function expectAiDeferredMenuCount(expected: string): Promise<void> {
      await clickPanelFilterMenuButton(ATTRIBUTIONS_PANEL);
      await expectFilterMenuItemCount(text.filters.aiDeferred, expected);
      await closeFilterMenu();
    }

    await gotoResource(deferredFileName);
    await expectAiDeferredMenuCount('1');

    await gotoResource(plainFileName);
    await expectAiDeferredMenuCount('0');
  });

  it('only displays attributions matching search term', async () => {
    await renderApp({ data });
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1, packageInfo2, packageInfo3],
      [],
    );

    await fillPanelSearch(ATTRIBUTIONS_HEADER, packageInfo1.packageName ?? '');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1],
      [packageInfo2, packageInfo3],
    );

    await clearPanelSearch(ATTRIBUTIONS_HEADER);
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1, packageInfo2, packageInfo3],
      [],
    );

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo1);
    await pressSearchShortcut();
    await expectSearchFocused(ATTRIBUTIONS_HEADER);
    await fillPanelSearch(ATTRIBUTIONS_HEADER, packageInfo1.packageName ?? '');
    await expectSearchValue(
      ATTRIBUTIONS_HEADER,
      packageInfo1.packageName ?? '',
    );
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1],
      [packageInfo2, packageInfo3],
    );
  });
});
