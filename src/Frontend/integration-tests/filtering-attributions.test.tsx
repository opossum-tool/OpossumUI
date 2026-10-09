// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import { text } from '../../shared/text';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';
import {
  applyPanelFilter,
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

const ATTRIBUTIONS_PANEL = 'attributions-panel';
const ATTRIBUTIONS_HEADER = 'attributions-panel-header';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  followUp: 'FOLLOW_UP',
  licenseName: 'MIT',
  url: '',
  wasPreferred: true,
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  licenseName: 'Apache-2.0',
});
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution({
  firstParty: true,
});

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    [resourceName1]: {
      [resourceName2]: {
        [resourceName3]: 1,
      },
    },
    [resourceName4]: 1,
  }),
  manualAttributions: deserializeAttributions({
    [attributionId1]: packageInfo1,
    [attributionId2]: packageInfo2,
    [attributionId3]: packageInfo3,
  }),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(resourceName1, resourceName2, resourceName3)]: [
      attributionId1,
    ],
    [faker.opossum.filePath(resourceName4)]: [attributionId2],
    [faker.opossum.folderPath(resourceName1, resourceName2)]: [attributionId3],
  }),
});

describe('filtering attributions', () => {
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
    await userEvent.type(searchBox(), packageInfo1.packageName ?? '');
    expect(searchBox()).toHaveValue(packageInfo1.packageName);
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1],
      [packageInfo2, packageInfo3],
    );
  });
});
