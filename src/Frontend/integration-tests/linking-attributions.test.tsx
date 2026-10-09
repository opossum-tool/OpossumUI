// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { describe, it } from 'vitest';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';
import {
  clickAttributionColumnButton,
  clickPackageCard,
  clickPanelButton,
  expectAttributionColumnButtonVisibility,
  expectAttributionFormMatchesPackageInfo,
  expectPackageCards,
  expectPanelButtonEnabled,
  expectSelectedTabIs,
  expectTabVisibility,
  gotoResource,
  gotoResourceTreeRoot,
  selectTab,
} from './helpers/ui';

const ATTRIBUTIONS_PANEL = 'attributions-panel';
const SIGNALS_PANEL = 'signals-panel';

const [
  resourceName1,
  resourceName2,
  resourceName3,
  resourceName4,
  resourceName5,
  resourceName6,
] = faker.opossum.resourceNames({ count: 6 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution();
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution();
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution();
const [attributionId5, packageInfo5] = faker.opossum.rawAttribution();

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    [resourceName1]: { [resourceName2]: 1 },
    [resourceName3]: 1,
    [resourceName4]: 1,
    [resourceName5]: { [resourceName6]: 1 },
  }),
  attributionBreakpoints: new Set([faker.opossum.folderPath(resourceName5)]),
  externalAttributions: deserializeAttributions({
    [attributionId5]: packageInfo5,
  }),
  resourcesToExternalAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.folderPath(resourceName5)]: [attributionId5],
  }),
  manualAttributions: deserializeAttributions({
    [attributionId1]: packageInfo1,
    [attributionId2]: packageInfo2,
    [attributionId3]: packageInfo3,
  }),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.folderPath(resourceName1)]: [attributionId1],
    [faker.opossum.filePath(resourceName3)]: [attributionId2],
    [faker.opossum.filePath(resourceName4)]: [attributionId3],
  }),
});

describe('linking attributions', () => {
  it('links unrelated attribution on resource and displays it as parent on child', async () => {
    await renderApp({ data });
    await gotoResourceTreeRoot();
    await expectSelectedTabIs(ATTRIBUTIONS_PANEL, 'children');
    await expectSelectedTabIs(SIGNALS_PANEL, 'children');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1, packageInfo2, packageInfo3],
      [],
    );
    await expectPackageCards(SIGNALS_PANEL, [packageInfo5], []);

    await gotoResource(resourceName1);
    await expectSelectedTabIs(ATTRIBUTIONS_PANEL, 'resource');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1],
      [packageInfo2],
    );

    await selectTab(ATTRIBUTIONS_PANEL, 'unrelated');
    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo2);
    await expectAttributionColumnButtonVisibility('link', true);
    await clickAttributionColumnButton('link');
    await expectSelectedTabIs(ATTRIBUTIONS_PANEL, 'resource');
    await expectPackageCards(ATTRIBUTIONS_PANEL, [packageInfo2], []);

    await gotoResource(resourceName2);
    await expectSelectedTabIs(ATTRIBUTIONS_PANEL, 'parents');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo1, packageInfo2],
      [],
    );
  });

  it('allows user to override parent attributions', async () => {
    await renderApp({ data });
    await gotoResource(resourceName1);
    await expectTabVisibility(ATTRIBUTIONS_PANEL, [], ['parents']);

    await gotoResource(resourceName2);
    await expectTabVisibility(ATTRIBUTIONS_PANEL, ['parents']);
    await expectPackageCards(ATTRIBUTIONS_PANEL, [packageInfo1], []);
    await expectAttributionFormMatchesPackageInfo(packageInfo1);

    await selectTab(ATTRIBUTIONS_PANEL, 'unrelated');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo2, packageInfo3],
      [packageInfo1],
    );

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo2);
    await expectAttributionFormMatchesPackageInfo(packageInfo2);

    await clickPanelButton(
      ATTRIBUTIONS_PANEL,
      'Link as attribution on selected resource',
    );
    await expectTabVisibility(ATTRIBUTIONS_PANEL, [], ['parents']);
    await expectSelectedTabIs(ATTRIBUTIONS_PANEL, 'resource');
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo2],
      [packageInfo1, packageInfo3],
    );
    await expectAttributionFormMatchesPackageInfo(packageInfo2);
  });

  it('disables resp. hides options to create or link attributions to breakpoints', async () => {
    await renderApp({ data });
    await gotoResource(resourceName5);
    await expectTabVisibility(ATTRIBUTIONS_PANEL, ['unrelated']);

    await clickPackageCard(ATTRIBUTIONS_PANEL, packageInfo1);
    await expectAttributionFormMatchesPackageInfo(packageInfo1);
    await expectPanelButtonEnabled(
      ATTRIBUTIONS_PANEL,
      'Create new attribution',
      false,
    );
    await expectPanelButtonEnabled(
      ATTRIBUTIONS_PANEL,
      'Link as attribution on selected resource',
      false,
    );
    await expectAttributionColumnButtonVisibility('link', false);
  });
});
