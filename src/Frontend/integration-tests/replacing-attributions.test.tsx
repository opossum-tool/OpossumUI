// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { describe, it } from 'vitest';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import { DiscreteConfidence } from '../../shared/shared-types';
import { text } from '../../shared/text';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';
import {
  ATTRIBUTIONS_PANEL,
  clickAttributionColumnButton,
  clickPackageCard,
  clickPackageCardCheckbox,
  clickPanelButton,
  clickPopupButton,
  expectAttributionColumnButtonVisibility,
  expectAttributionFormMatchesPackageInfo,
  expectPackageCardPickerSource,
  expectPackageCards,
  expectPanelReplacementDimmed,
  expectPopupHasText,
  expectResourceVisibility,
  LINKED_RESOURCES_TREE,
  SIGNALS_PANEL,
} from './helpers/ui';

const [
  resourceName1,
  resourceName2,
  resourceName3,
  resourceName4,
  resourceName5,
] = faker.opossum.resourceNames({ count: 5 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution();
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  attributionConfidence: DiscreteConfidence.High,
});
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution({
  preSelected: true,
});
const [attributionId4, packageInfo4] = faker.opossum.rawAttribution();

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    [resourceName1]: {
      [resourceName2]: { [resourceName3]: 1, [resourceName4]: 1 },
    },
    [resourceName5]: 1,
  }),
  externalAttributions: deserializeAttributions({
    [attributionId4]: packageInfo4,
  }),
  resourcesToExternalAttributions: {
    [faker.opossum.filePath(resourceName1, resourceName2, resourceName3)]: [
      attributionId4,
    ],
  },
  manualAttributions: deserializeAttributions({
    [attributionId1]: packageInfo1,
    [attributionId2]: packageInfo2,
    [attributionId3]: packageInfo3,
  }),
  resourcesToManualAttributions: {
    [faker.opossum.filePath(resourceName1, resourceName2, resourceName3)]: [
      attributionId1,
    ],
    [faker.opossum.filePath(resourceName1, resourceName2, resourceName4)]: [
      attributionId2,
      attributionId3,
    ],
  },
});

describe('replacing attributions', () => {
  it('replaces an attribution with another', async () => {
    await renderApp({ data });
    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo1);
    await expectAttributionFormMatchesPackageInfo(packageInfo1);
    await expectResourceVisibility(
      [resourceName3],
      [resourceName4],
      LINKED_RESOURCES_TREE,
    );

    await clickPanelButton(ATTRIBUTIONS_PANEL, text.packageLists.replace);
    await expectAttributionColumnButtonVisibility('save', false);
    await expectAttributionColumnButtonVisibility('replace', false);
    await expectPackageCardPickerSource(ATTRIBUTIONS_PANEL, packageInfo1, true);

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo2);
    await expectResourceVisibility(
      [resourceName4],
      [resourceName3],
      LINKED_RESOURCES_TREE,
    );
    await expectAttributionColumnButtonVisibility('replace', true);

    await clickAttributionColumnButton('replace');
    await clickPopupButton(
      'confirm replace popup',
      text.replaceAttributionsPopup.replace,
    );
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo2],
      [packageInfo1],
    );

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo2);
    await expectAttributionFormMatchesPackageInfo(packageInfo2);
    await expectResourceVisibility(
      [resourceName3, resourceName4],
      [],
      LINKED_RESOURCES_TREE,
    );
  });

  it('replaces multiple attributions with another', async () => {
    await renderApp({ data });
    await clickPackageCardCheckbox(ATTRIBUTIONS_PANEL, packageInfo2);
    await clickPackageCardCheckbox(ATTRIBUTIONS_PANEL, packageInfo3);

    await clickPanelButton(ATTRIBUTIONS_PANEL, text.packageLists.replace);
    await expectPackageCardPickerSource(ATTRIBUTIONS_PANEL, packageInfo2, true);
    await expectPackageCardPickerSource(ATTRIBUTIONS_PANEL, packageInfo3, true);
    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo1);
    await expectAttributionColumnButtonVisibility('replace', true);

    await clickAttributionColumnButton('replace');
    await expectPopupHasText('confirm replace popup', '2 attributions');

    await clickPopupButton(
      'confirm replace popup',
      text.replaceAttributionsPopup.replace,
    );
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1],
      [packageInfo2, packageInfo3],
    );

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo1);
    await expectResourceVisibility(
      [resourceName3, resourceName4],
      [],
      LINKED_RESOURCES_TREE,
    );
  });

  it('shows the cancel button immediately upon entering replacement mode', async () => {
    await renderApp({ data });
    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo1);
    await clickPanelButton(ATTRIBUTIONS_PANEL, text.packageLists.replace);

    // The cancel button is available right away, without first having to
    // select a replacement target.
    await expectAttributionColumnButtonVisibility('cancel', true);

    await clickAttributionColumnButton('cancel');

    await expectAttributionColumnButtonVisibility('save', true);
  });

  it('cancels replacement mode via the cancel button', async () => {
    await renderApp({ data });
    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo1);
    await clickPanelButton(ATTRIBUTIONS_PANEL, text.packageLists.replace);

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo2);
    await expectAttributionColumnButtonVisibility('replace', true);

    await clickAttributionColumnButton('cancel');

    await expectAttributionColumnButtonVisibility('replace', false);
    await expectAttributionColumnButtonVisibility('save', true);
  });

  it('disables the signals panel while in replacement mode, since signals are not valid replacement targets', async () => {
    await renderApp({ data });
    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo1);
    await expectPanelReplacementDimmed(SIGNALS_PANEL, false);

    await clickPanelButton(ATTRIBUTIONS_PANEL, text.packageLists.replace);
    await expectAttributionColumnButtonVisibility('save', false);
    await expectAttributionColumnButtonVisibility('replace', false);
    await expectPanelReplacementDimmed(SIGNALS_PANEL, true);

    await clickPackageCard(SIGNALS_PANEL, packageInfo4);
    await expectAttributionColumnButtonVisibility('replace', false);
    await expectAttributionColumnButtonVisibility('link', false);

    await clickAttributionColumnButton('cancel');
    await expectPanelReplacementDimmed(SIGNALS_PANEL, false);
  });
});
