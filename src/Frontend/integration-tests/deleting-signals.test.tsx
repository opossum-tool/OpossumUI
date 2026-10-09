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
  clickAttributionColumnButton,
  clickPackageCard,
  clickPackageCardCheckbox,
  clickPanelButton,
  expectPackageCards,
  expectSelectedTabIs,
  gotoResource,
} from './helpers/ui';

const SIGNALS_PANEL = 'signals-panel';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution();
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution();
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution();

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    [resourceName1]: { [resourceName2]: 1 },
    [resourceName3]: 1,
    [resourceName4]: 1,
  }),
  externalAttributions: deserializeAttributions({
    [attributionId1]: packageInfo1,
    [attributionId2]: packageInfo2,
    [attributionId3]: packageInfo3,
  }),
  resourcesToExternalAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(resourceName1, resourceName2)]: [
      attributionId1,
      attributionId3,
    ],
    [faker.opossum.filePath(resourceName3)]: [attributionId2],
    [faker.opossum.filePath(resourceName4)]: [attributionId1, attributionId2],
  }),
  resolvedExternalAttributions: new Set([attributionId1]),
});

describe('deleting signals', () => {
  it('deletes and restores signals', async () => {
    await renderApp({ data });
    await gotoResource(resourceName1);
    await expectSelectedTabIs(SIGNALS_PANEL, 'children');
    await expectPackageCards(SIGNALS_PANEL, [packageInfo3], [packageInfo1]);

    await clickPackageCard(SIGNALS_PANEL, packageInfo3);
    await clickAttributionColumnButton('delete');
    await expectPackageCards(SIGNALS_PANEL, [], [packageInfo3]);

    await gotoResource(resourceName4);
    await expectSelectedTabIs(SIGNALS_PANEL, 'resource');
    await expectPackageCards(SIGNALS_PANEL, [packageInfo2], [packageInfo1]);

    await clickPanelButton(SIGNALS_PANEL, text.packageLists.showDeleted);
    await expectPackageCards(SIGNALS_PANEL, [packageInfo1, packageInfo2]);

    await clickPackageCard(SIGNALS_PANEL, packageInfo1);
    await clickAttributionColumnButton('restore');
    await clickPanelButton(SIGNALS_PANEL, text.packageLists.hideDeleted);
    await expectPackageCards(SIGNALS_PANEL, [packageInfo1, packageInfo2]);
  });

  it('deletes and restores multiple signals at once', async () => {
    await renderApp({ data });
    await expectSelectedTabIs(SIGNALS_PANEL, 'children');
    await expectPackageCards(SIGNALS_PANEL, [packageInfo2, packageInfo3]);

    await clickPackageCardCheckbox(SIGNALS_PANEL, packageInfo2);
    await clickPackageCardCheckbox(SIGNALS_PANEL, packageInfo3);
    await clickPanelButton(SIGNALS_PANEL, text.packageLists.delete);
    await expectPackageCards(SIGNALS_PANEL, [], [packageInfo2, packageInfo3]);

    await gotoResource(resourceName4);
    await clickPanelButton(SIGNALS_PANEL, text.packageLists.showDeleted);
    await expectPackageCards(SIGNALS_PANEL, [packageInfo1, packageInfo2]);

    await clickPackageCardCheckbox(SIGNALS_PANEL, packageInfo1);
    await clickPackageCardCheckbox(SIGNALS_PANEL, packageInfo2);
    await clickPanelButton(SIGNALS_PANEL, text.packageLists.restore);
    await clickPanelButton(SIGNALS_PANEL, text.packageLists.hideDeleted);
    await expectPackageCards(SIGNALS_PANEL, [packageInfo1, packageInfo2]);
  });
});
