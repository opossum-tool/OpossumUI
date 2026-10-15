// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { describe, it } from 'vitest';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import { text } from '../../shared/text';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';
import {
  ATTRIBUTIONS_PANEL,
  clickAttributionColumnButton,
  clickEnabledPanelButton,
  clickPackageCard,
  clickPackageCardCheckbox,
  clickPopupButton,
  expectAttributionColumnButtonVisibility,
  expectAttributionFormMatchesPackageInfo,
  expectAuditingOptionChip,
  expectPopupHasText,
  expectPopupHidden,
  expectProgressBarTooltipShowsValues,
  expectResourceVisibility,
  gotoResource,
  gotoResourceTreeRoot,
  LINKED_RESOURCES_TREE,
} from './helpers/ui';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  preSelected: true,
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  preSelected: true,
});

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    [resourceName1]: 1,
    [resourceName2]: 1,
    [resourceName3]: 1,
    [resourceName4]: 1,
  }),
  manualAttributions: deserializeAttributions({
    [attributionId1]: packageInfo1,
    [attributionId2]: packageInfo2,
  }),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(resourceName1)]: [attributionId1],
    [faker.opossum.filePath(resourceName2)]: [attributionId1],
    [faker.opossum.filePath(resourceName3)]: [attributionId1],
    [faker.opossum.filePath(resourceName4)]: [attributionId2],
  }),
});

describe('confirming pre-selected attributions', () => {
  it('updates progress bar when user confirms pre-selected attributions', async () => {
    await renderApp({ data });
    await gotoResource(resourceName1);
    await expectAttributionFormMatchesPackageInfo(packageInfo1);
    await expectProgressBarTooltipShowsValues({
      filesWithOnlyPreSelectedAttributions: 4,
    });
    await expectAttributionColumnButtonVisibility('confirm', true);
    await expectAuditingOptionChip('pre-selected', true);

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo1);
    await expectResourceVisibility(
      [resourceName1, resourceName2, resourceName3],
      [],
      LINKED_RESOURCES_TREE,
    );

    await clickAttributionColumnButton('confirm');
    await clickPopupButton(
      text.saveAttributionsPopup.ariaLabel,
      text.saveAttributionsPopup.confirmLocally,
    );
    await expectPopupHidden(text.saveAttributionsPopup.ariaLabel);
    await expectResourceVisibility(
      [resourceName1],
      [resourceName2, resourceName3],
      LINKED_RESOURCES_TREE,
    );
    await expectProgressBarTooltipShowsValues({
      filesWithAttributions: 1,
      filesWithOnlyPreSelectedAttributions: 3,
    });
    await expectAttributionColumnButtonVisibility('confirm', false);
    await expectAuditingOptionChip('pre-selected', false);

    await gotoResource(resourceName2);
    await expectAttributionFormMatchesPackageInfo(packageInfo1);
    await expectResourceVisibility(
      [resourceName2, resourceName3],
      [resourceName1],
      LINKED_RESOURCES_TREE,
    );

    await clickAttributionColumnButton('confirm');
    await clickPopupButton(
      text.saveAttributionsPopup.ariaLabel,
      text.saveAttributionsPopup.confirmGlobally,
    );
    await expectPopupHidden(text.saveAttributionsPopup.ariaLabel);
    await expectResourceVisibility(
      [resourceName1, resourceName2, resourceName3],
      [],
      LINKED_RESOURCES_TREE,
    );
    await expectProgressBarTooltipShowsValues({
      filesWithAttributions: 3,
      filesWithOnlyPreSelectedAttributions: 1,
    });

    await gotoResource(resourceName3);
    await expectAttributionColumnButtonVisibility('confirm', false);
  });

  it('confirms multiple pre-selected attributions', async () => {
    await renderApp({ data });
    await gotoResourceTreeRoot();
    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo1);
    await expectAttributionColumnButtonVisibility('confirm', true);
    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo2);
    await expectAttributionColumnButtonVisibility('confirm', true);

    await clickPackageCardCheckbox(ATTRIBUTIONS_PANEL, packageInfo1);
    await clickPackageCardCheckbox(ATTRIBUTIONS_PANEL, packageInfo2);
    await clickEnabledPanelButton(
      ATTRIBUTIONS_PANEL,
      text.packageLists.confirm,
    );
    await expectPopupHasText('confirm save popup', '2 attributions');

    await clickPopupButton(
      text.saveAttributionsPopup.ariaLabel,
      text.saveAttributionsPopup.confirmGlobally,
    );
    await expectPopupHidden(text.saveAttributionsPopup.ariaLabel);

    await gotoResource(resourceName1);
    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo1);
    await expectAttributionColumnButtonVisibility('confirm', false);
    await gotoResource(resourceName4);
    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo2);
    await expectAttributionColumnButtonVisibility('confirm', false);
  });
});
