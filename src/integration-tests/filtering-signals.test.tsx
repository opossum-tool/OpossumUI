// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { deserializeAttributions } from '../ElectronBackend/input/parseInputData';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { faker } from '../testing/Faker';
import { renderApp, type RenderAppResult } from '../testing/render-app';
import {
  addLicenseSearchFilter,
  applyPanelFilter,
  clearAllLicenseFilters,
  clearPanelSearch,
  clickFilterMenuItem,
  clickLicenseEditorTab,
  clickLicenseTableCell,
  clickPackageCard,
  clickPanelFilterMenuButton,
  clickProjectStatisticsTab,
  closeFilterMenu,
  expectLicenseEditorTabVisible,
  expectLicenseFilterOption,
  expectLicenseFilterOptionSelected,
  expectPackageCards,
  expectSearchFocused,
  fillLicenseFilter,
  fillPanelSearch,
  gotoResource,
  openProjectStatisticsPopup,
  pressSearchShortcut,
  removeLicenseFilterOption,
  selectFilterLicenseName,
  SIGNALS_PANEL,
} from '../testing/ui';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  licenseName: 'MIT',
  followUp: 'FOLLOW_UP',
  wasPreferred: true,
  preSelected: true,
  packageVersion: undefined,
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  licenseName: 'Apache-2.0',
  preSelected: true,
  packageVersion: undefined,
});
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution({
  licenseName: 'BSD-3-Clause',
  firstParty: true,
  preSelected: true,
  packageVersion: undefined,
});

async function renderFixture(equivalent = false): Promise<RenderAppResult> {
  return renderApp({
    userSettings: {
      panelSizes: { signalsPanelHeight: 1200 },
    },
    data: getParsedInputFileEnrichedWithTestData({
      config: faker.opossum.inputData().config,
      resources: faker.opossum.resources({
        [resourceName1]: {
          [resourceName2]: { [resourceName3]: 1 },
        },
        [resourceName4]: 1,
      }),
      externalAttributions: deserializeAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: equivalent
          ? { ...packageInfo2, licenseName: 'M-IT' }
          : packageInfo2,
        [attributionId3]: packageInfo3,
      }),
      resourcesToExternalAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1, resourceName2, resourceName3)]: [
          attributionId1,
        ],
        [faker.opossum.filePath(resourceName4)]: [attributionId2],
        [faker.opossum.folderPath(resourceName1, resourceName2)]: [
          attributionId3,
        ],
      }),
    }),
  });
}

describe('filtering signals', () => {
  it('combines exact and contains signal filters and keeps options available', async () => {
    await renderFixture();
    await clickPanelFilterMenuButton(SIGNALS_PANEL);
    await addLicenseSearchFilter('cLaUsE');
    await fillLicenseFilter('Apache-2.0');
    await expectLicenseFilterOption('Apache-2.0', true);
    await selectFilterLicenseName('Apache-2.0');
    await closeFilterMenu();
    await expectPackageCards(
      SIGNALS_PANEL,
      [packageInfo2, packageInfo3],
      [packageInfo1],
    );
  });

  it('reopens after selecting BSD and adds another license', async () => {
    await renderFixture();
    await clickPanelFilterMenuButton(SIGNALS_PANEL);
    await selectFilterLicenseName('BSD-3-Clause');
    await closeFilterMenu();
    await expectPackageCards(
      SIGNALS_PANEL,
      [packageInfo3],
      [packageInfo1, packageInfo2],
    );

    await clickPanelFilterMenuButton(SIGNALS_PANEL);
    await selectFilterLicenseName('Apache-2.0');
    await closeFilterMenu();
    await expectPackageCards(
      SIGNALS_PANEL,
      [packageInfo2, packageInfo3],
      [packageInfo1],
    );
  });

  it('keeps a selection with no resource matches removable without an availability warning', async () => {
    await renderFixture();
    await gotoResource(resourceName1, resourceName2, resourceName3);
    await clickPanelFilterMenuButton(SIGNALS_PANEL);
    await selectFilterLicenseName('MIT');
    await closeFilterMenu();
    await gotoResource(resourceName4);
    await expectPackageCards(
      SIGNALS_PANEL,
      [],
      [packageInfo1, packageInfo2, packageInfo3],
    );

    await clickPanelFilterMenuButton(SIGNALS_PANEL);
    await fillLicenseFilter('MIT');
    await expectLicenseFilterOptionSelected('MIT', true);
    await clickLicenseEditorTab('Selected (1)');
    await removeLicenseFilterOption('MIT');
    await closeFilterMenu();
    await expectPackageCards(
      SIGNALS_PANEL,
      [packageInfo2],
      [packageInfo1, packageInfo3],
    );
  });

  it('broadens signal license matches and preserves other filters on clear', async () => {
    await renderFixture();
    await clickPanelFilterMenuButton(SIGNALS_PANEL);
    await selectFilterLicenseName('MIT');
    await selectFilterLicenseName('Apache-2.0');
    await closeFilterMenu();
    await expectPackageCards(
      SIGNALS_PANEL,
      [packageInfo1, packageInfo2],
      [packageInfo3],
    );
    await applyPanelFilter(SIGNALS_PANEL, 'previouslyPreferred');
    await expectPackageCards(
      SIGNALS_PANEL,
      [packageInfo1],
      [packageInfo2, packageInfo3],
    );
    await clickPanelFilterMenuButton(SIGNALS_PANEL);
    await clearAllLicenseFilters();
    await closeFilterMenu();
    await expectPackageCards(
      SIGNALS_PANEL,
      [packageInfo1],
      [packageInfo2, packageInfo3],
    );
  });

  it('retains identity across resource spelling changes and statistics quicklinks', async () => {
    const { sendToChannel } = await renderFixture(true);
    await gotoResource(resourceName1, resourceName2, resourceName3);
    await clickPanelFilterMenuButton(SIGNALS_PANEL);
    await selectFilterLicenseName('MIT');
    await closeFilterMenu();
    await gotoResource(resourceName4);
    await expectPackageCards(
      SIGNALS_PANEL,
      [{ ...packageInfo2, licenseName: 'M-IT' }],
      [packageInfo1, packageInfo3],
    );
    await clickPanelFilterMenuButton(SIGNALS_PANEL);
    await clickFilterMenuItem('M-IT');
    await fillLicenseFilter('M-IT');
    await expectLicenseFilterOptionSelected('M-IT', true);
    await expectLicenseEditorTabVisible('Selected (1)', true);
    await closeFilterMenu();
    await openProjectStatisticsPopup(sendToChannel);
    await clickProjectStatisticsTab('details');
    await clickLicenseTableCell('MIT');
    await expectPackageCards(
      SIGNALS_PANEL,
      [packageInfo1, { ...packageInfo2, licenseName: 'M-IT' }],
      [packageInfo3],
    );
  });

  it('filters signals', async () => {
    await renderFixture();
    await expectPackageCards(
      SIGNALS_PANEL,
      [packageInfo1, packageInfo2, packageInfo3],
      [],
    );

    await applyPanelFilter(SIGNALS_PANEL, 'previouslyPreferred');
    await expectPackageCards(
      SIGNALS_PANEL,
      [packageInfo1],
      [packageInfo2, packageInfo3],
    );

    await applyPanelFilter(SIGNALS_PANEL, 'firstParty');
    await expectPackageCards(
      SIGNALS_PANEL,
      [],
      [packageInfo1, packageInfo2, packageInfo3],
    );
    await applyPanelFilter(SIGNALS_PANEL, 'previouslyPreferred');
    await expectPackageCards(
      SIGNALS_PANEL,
      [packageInfo3],
      [packageInfo1, packageInfo2],
    );

    await applyPanelFilter(SIGNALS_PANEL, 'firstParty');
    await expectPackageCards(
      SIGNALS_PANEL,
      [packageInfo1, packageInfo2, packageInfo3],
      [],
    );
  });

  it('only displays signals matching search term', async () => {
    await renderFixture();
    await expectPackageCards(
      SIGNALS_PANEL,
      [packageInfo1, packageInfo2, packageInfo3],
      [],
    );

    await fillPanelSearch('signals-panel-header', packageInfo1.packageName!);
    await expectPackageCards(
      SIGNALS_PANEL,
      [packageInfo1],
      [packageInfo2, packageInfo3],
    );

    await clearPanelSearch('signals-panel-header');
    await expectPackageCards(
      SIGNALS_PANEL,
      [packageInfo1, packageInfo2, packageInfo3],
      [],
    );
    await clickPackageCard(SIGNALS_PANEL, packageInfo1);
    await pressSearchShortcut();
    await expectSearchFocused('signals-panel-header');
    await fillPanelSearch('signals-panel-header', packageInfo1.packageName!);
    await expectPackageCards(
      SIGNALS_PANEL,
      [packageInfo1],
      [packageInfo2, packageInfo3],
    );
  });
});
