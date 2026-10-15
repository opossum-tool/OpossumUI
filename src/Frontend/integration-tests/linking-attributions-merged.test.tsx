// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { describe, it } from 'vitest';

import {
  deserializeAttributions,
  mergeAttributions,
} from '../../ElectronBackend/input/parseInputData';
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
  clickPanelButton,
  expectAttributionFormMatchesPackageInfo,
  expectPackageCards,
  expectSelectedTabIs,
  gotoResource,
  selectTab,
  SIGNALS_PANEL,
} from './helpers/ui';

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
const [attributionId4a, packageInfo4a] = faker.opossum.rawAttribution({
  comment: faker.lorem.sentence(),
});
const [attributionId4b, packageInfo4b] = faker.opossum.rawAttribution({
  ...packageInfo4a,
  comment: faker.lorem.sentence(),
});
const [attributionId5, packageInfo5] = faker.opossum.rawAttribution();
const mergedComment = `${packageInfo4a.comment}\n\n${packageInfo4b.comment}`;
// Real file loads merge signals that are equal apart from their comments
// via mergeAttributions (loadFile.ts); the parsed-input fixture must do the
// same before rendering.
const [externalAttributions, resourcesToExternalAttributions] =
  mergeAttributions({
    attributions: deserializeAttributions({
      [attributionId4a]: packageInfo4a,
      [attributionId4b]: packageInfo4b,
      [attributionId5]: packageInfo5,
    }),
    resourcesToAttributions: faker.opossum.resourcesToAttributions({
      [faker.opossum.filePath(resourceName4)]: [
        attributionId4a,
        attributionId4b,
      ],
      [faker.opossum.folderPath(resourceName5)]: [attributionId5],
    }),
    attributionsToResources: {
      [attributionId4a]: [faker.opossum.filePath(resourceName4)],
      [attributionId4b]: [faker.opossum.filePath(resourceName4)],
      [attributionId5]: [faker.opossum.folderPath(resourceName5)],
    },
  });

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    [resourceName1]: { [resourceName2]: 1 },
    [resourceName3]: 1,
    [resourceName4]: 1,
    [resourceName5]: { [resourceName6]: 1 },
  }),
  attributionBreakpoints: new Set([faker.opossum.folderPath(resourceName5)]),
  externalAttributions,
  resourcesToExternalAttributions,
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

describe('linking attributions merged', () => {
  it('links merged signal as attribution on resource', async () => {
    await renderApp({ data });
    await gotoResource(resourceName4);
    await expectSelectedTabIs(SIGNALS_PANEL, 'resource');

    await clickPackageCard(SIGNALS_PANEL, packageInfo4a);
    await expectAttributionFormMatchesPackageInfo({
      ...packageInfo4a,
      comment: mergedComment,
    });
    await expectPackageCards(ATTRIBUTIONS_PANEL, [], [packageInfo4a]);

    await clickAttributionColumnButton('link');
    await expectPackageCards(ATTRIBUTIONS_PANEL, [packageInfo4a]);
    await expectAttributionFormMatchesPackageInfo({
      ...packageInfo4a,
      comment: mergedComment,
    });
  });

  it('links multiple attributions on resource at once', async () => {
    await renderApp({ data });
    await gotoResource(resourceName4);
    await expectSelectedTabIs(ATTRIBUTIONS_PANEL, 'resource');
    await expectAttributionFormMatchesPackageInfo(packageInfo3);
    await expectPackageCards(
      ATTRIBUTIONS_PANEL,
      [packageInfo3],
      [packageInfo1, packageInfo2],
    );

    await selectTab(ATTRIBUTIONS_PANEL, 'unrelated');
    await expectPackageCards(ATTRIBUTIONS_PANEL, [packageInfo1, packageInfo2]);

    await clickPackageCardCheckbox(ATTRIBUTIONS_PANEL, packageInfo1);
    await clickPackageCardCheckbox(ATTRIBUTIONS_PANEL, packageInfo2);
    await clickEnabledPanelButton(
      ATTRIBUTIONS_PANEL,
      text.packageLists.linkAsAttribution,
    );
    await expectSelectedTabIs(ATTRIBUTIONS_PANEL, 'resource');
    await expectPackageCards(ATTRIBUTIONS_PANEL, [
      packageInfo3,
      packageInfo1,
      packageInfo2,
    ]);
    await expectAttributionFormMatchesPackageInfo(packageInfo3);
  });

  it('links multiple signals on resource at once', async () => {
    await renderApp({ data });
    await expectSelectedTabIs(ATTRIBUTIONS_PANEL, 'children');
    await expectSelectedTabIs(SIGNALS_PANEL, 'children');
    await expectPackageCards(SIGNALS_PANEL, [packageInfo4a, packageInfo5]);

    await clickPackageCardCheckbox(SIGNALS_PANEL, packageInfo4a);
    await clickPackageCardCheckbox(SIGNALS_PANEL, packageInfo5);
    await clickPanelButton(SIGNALS_PANEL, text.packageLists.linkAsAttribution);
    await expectSelectedTabIs(ATTRIBUTIONS_PANEL, 'resource');
    await expectPackageCards(ATTRIBUTIONS_PANEL, [packageInfo4a, packageInfo5]);
  });
});
