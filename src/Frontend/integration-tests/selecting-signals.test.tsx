// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import userEvent from '@testing-library/user-event';
import { describe, it } from 'vitest';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';
import {
  clickPackageCard,
  clickSelectAllCheckbox,
  expectAttributionFormMatchesPackageInfo,
  expectPackageCardCheckbox,
  expectPackageCards,
  expectSelectedTabIs,
} from './helpers/ui';

const SIGNALS_PANEL = 'signals-panel';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const signalSource = {
  name: 'selecting-test-source',
  documentConfidence: 0,
};
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  packageName: 'a',
  source: signalSource,
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  packageName: 'b',
  source: signalSource,
});
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution({
  packageName: 'c',
  source: signalSource,
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
  externalAttributions: deserializeAttributions({
    [attributionId1]: packageInfo1,
    [attributionId2]: packageInfo2,
    [attributionId3]: packageInfo3,
  }),
  resourcesToExternalAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(resourceName1, resourceName2, resourceName3)]: [
      attributionId1,
    ],
    [faker.opossum.filePath(resourceName4)]: [attributionId2],
    [faker.opossum.folderPath(resourceName1, resourceName2)]: [attributionId3],
  }),
});

describe('selecting signals', () => {
  it('allows selecting and deselecting all signals in the active tab', async () => {
    await renderApp({ data });
    await expectSelectedTabIs(SIGNALS_PANEL, 'children');
    await expectPackageCardCheckbox(SIGNALS_PANEL, packageInfo1, false);
    await expectPackageCardCheckbox(SIGNALS_PANEL, packageInfo2, false);
    await expectPackageCardCheckbox(SIGNALS_PANEL, packageInfo3, false);

    await clickSelectAllCheckbox(SIGNALS_PANEL);
    await expectPackageCardCheckbox(SIGNALS_PANEL, packageInfo1, true);
    await expectPackageCardCheckbox(SIGNALS_PANEL, packageInfo2, true);
    await expectPackageCardCheckbox(SIGNALS_PANEL, packageInfo3, true);

    await clickSelectAllCheckbox(SIGNALS_PANEL);
    await expectPackageCardCheckbox(SIGNALS_PANEL, packageInfo1, false);
    await expectPackageCardCheckbox(SIGNALS_PANEL, packageInfo2, false);
    await expectPackageCardCheckbox(SIGNALS_PANEL, packageInfo3, false);
  });

  it('allows navigating through the signals list by keyboard', async () => {
    await renderApp({ data });
    await expectSelectedTabIs(SIGNALS_PANEL, 'children');
    await expectPackageCards(SIGNALS_PANEL, [
      packageInfo1,
      packageInfo2,
      packageInfo3,
    ]);
    await clickPackageCard(SIGNALS_PANEL, packageInfo1);
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
