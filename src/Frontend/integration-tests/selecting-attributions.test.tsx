// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import userEvent from '@testing-library/user-event';
import { describe, it } from 'vitest';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import { text } from '../../shared/text';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';
import {
  clickPackageCard,
  clickPanelButton,
  clickPopupButton,
  clickSelectAllCheckbox,
  expectAttributionFormMatchesPackageInfo,
  expectPackageCardCheckbox,
  expectPackageCards,
  expectPopupHasText,
  expectPopupHidden,
  expectSelectedTabIs,
  gotoResource,
  selectTab,
} from './helpers/ui';

const ATTRIBUTIONS_PANEL = 'attributions-panel';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  packageName: 'a',
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  packageName: 'b',
});
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution({
  packageName: 'c',
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

describe('selecting attributions', () => {
  it('allows selecting and deselecting all attributions in the active tab', async () => {
    await renderApp({ data });
    await gotoResource(resourceName4);
    await expectSelectedTabIs(ATTRIBUTIONS_PANEL, 'resource');
    await expectPackageCardCheckbox(ATTRIBUTIONS_PANEL, packageInfo2, false);

    await clickSelectAllCheckbox(ATTRIBUTIONS_PANEL);
    await expectPackageCardCheckbox(ATTRIBUTIONS_PANEL, packageInfo2, true);

    await clickPanelButton(ATTRIBUTIONS_PANEL, text.packageLists.delete);
    await expectPopupHasText(
      'confirm delete popup',
      'the following attribution',
    );

    await clickPopupButton('confirm delete popup', text.buttons.cancel);
    await expectPopupHidden('confirm delete popup');
    await selectTab(ATTRIBUTIONS_PANEL, 'unrelated');
    await clickSelectAllCheckbox(ATTRIBUTIONS_PANEL);
    await expectPackageCardCheckbox(ATTRIBUTIONS_PANEL, packageInfo1, true);
    await expectPackageCardCheckbox(ATTRIBUTIONS_PANEL, packageInfo3, true);

    await clickPanelButton(ATTRIBUTIONS_PANEL, text.packageLists.delete);
    await expectPopupHasText(
      'confirm delete popup',
      'the following 2 attributions',
    );

    await clickPopupButton('confirm delete popup', text.buttons.cancel);
    await expectPopupHidden('confirm delete popup');
    await clickSelectAllCheckbox(ATTRIBUTIONS_PANEL);
    await expectPackageCardCheckbox(ATTRIBUTIONS_PANEL, packageInfo1, false);
    await expectPackageCardCheckbox(ATTRIBUTIONS_PANEL, packageInfo3, false);
  });

  it('allows navigating through the attributions list by keyboard', async () => {
    await renderApp({ data });
    await expectPackageCards(ATTRIBUTIONS_PANEL, [
      packageInfo1,
      packageInfo2,
      packageInfo3,
    ]);
    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo1);
    await expectAttributionFormMatchesPackageInfo(packageInfo1);

    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    await expectAttributionFormMatchesPackageInfo(packageInfo3);

    await userEvent.keyboard('{ArrowUp}');
    await userEvent.keyboard('{Enter}');
    await expectAttributionFormMatchesPackageInfo(packageInfo2);
  });
});
