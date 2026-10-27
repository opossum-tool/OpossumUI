// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { deserializeAttributions } from '../ElectronBackend/input/parseInputData';
import { MANUAL_ATTRIBUTION_FILTERS_AUDIT } from '../Frontend/state/variables/use-filters';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { text } from '../shared/text';
import { faker } from '../testing/Faker';
import { getFilterExcludedAttributionsFixture } from '../testing/filter-excluded-attributions';
import { renderApp } from './helpers/render-app';
import {
  applyPanelFilter,
  ATTRIBUTIONS_PANEL,
  clearPanelSearch,
  clickClearFiltersMenuItem,
  clickFilterMenuButton,
  clickFilterMenuItem,
  clickPackageCard,
  clickPopupButton,
  closeFilterMenu,
  expectFormFieldValues,
  expectPackageCards,
  expectPopupHasText,
  expectPopupHidden,
  expectReportAttributionVisibility,
  fillFormField,
  fillPanelSearch,
  getReportView,
  gotoReportView,
  gotoResource,
  pressSearchShortcut,
  selectFilterLicenseName,
} from './helpers/ui';

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
    await clickFilterMenuButton(screen.getByTestId(ATTRIBUTIONS_PANEL));
    await userEvent.click(await screen.findByLabelText('classification'));
    const options = await screen.findAllByRole('option', {
      name: 'Same description',
    });
    await userEvent.click(options[1]);

    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo2],
      [packageInfo1, packageInfo3],
    );
    expect(screen.getByLabelText('classification')).toHaveValue(
      'Same description',
    );

    await userEvent.click(
      within(screen.getByRole('menu')).getByRole('button', {
        name: 'clear button',
      }),
    );
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
    await clickFilterMenuButton(screen.getByTestId(ATTRIBUTIONS_PANEL));

    await userEvent.click(await screen.findByLabelText('classification'));
    await userEvent.click(await screen.findByRole('option', { name: 'Zero' }));
    expect(
      within(screen.getByRole('menu')).getByLabelText('Classification icon'),
    ).toBeVisible();
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

    await userEvent.click(await screen.findByLabelText('criticality'));
    await userEvent.click(await screen.findByRole('option', { name: 'None' }));
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

    await clickFilterMenuButton(screen.getByTestId(ATTRIBUTIONS_PANEL));
    await selectFilterLicenseName(packageInfo1.licenseName ?? '');
    await closeFilterMenu();
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1],
      [packageInfo2, packageInfo3],
    );
  });

  it('combines and clears value filters in audit view', async () => {
    await renderApp({ data });
    await clickFilterMenuButton(screen.getByTestId(ATTRIBUTIONS_PANEL));
    await selectFilterLicenseName(packageInfo1.licenseName ?? '');
    await userEvent.click(
      await screen.findByLabelText('incomplete component coordinates'),
    );
    await userEvent.click(
      await screen.findByRole('option', { name: text.filters.any }),
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

    await clickFilterMenuButton(screen.getByTestId(ATTRIBUTIONS_PANEL));
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
    await clickFilterMenuButton(screen.getByTestId(ATTRIBUTIONS_PANEL));
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
    await clickFilterMenuButton(screen.getByTestId(ATTRIBUTIONS_PANEL));
    await userEvent.click(await screen.findByLabelText('criticality'));
    await userEvent.click(await screen.findByRole('option', { name: 'None' }));
    await clickClearFiltersMenuItem();
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1, packageInfo2, packageInfo3],
      [],
    );

    await closeFilterMenu();
    await gotoReportView();
    await clickFilterMenuButton(getReportView());
    await userEvent.click(await screen.findByLabelText('criticality'));
    await userEvent.click(await screen.findByRole('option', { name: 'None' }));
    await clickFilterMenuButton(getReportView());
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
    await closeFilterMenu();
    await expectReportAttributionVisibility(
      [attributionId1],
      [attributionId2, attributionId3],
    );
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
    const searchBox = () =>
      within(screen.getByTestId(ATTRIBUTIONS_HEADER)).getByRole('searchbox');
    await waitFor(() => {
      expect(searchBox()).toHaveFocus();
    });
    await userEvent.type(searchBox(), packageInfo1.packageName ?? '');
    expect(searchBox()).toHaveValue(packageInfo1.packageName);
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1],
      [packageInfo2, packageInfo3],
    );
  });
});
