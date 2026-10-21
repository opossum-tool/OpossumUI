// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';

import { faker, test } from '../utils';

const [resourceName1, resourceName2] = faker.opossum.resourceNames({
  count: 2,
});
const [externalAttributionId, externalPackageInfo] =
  faker.opossum.rawAttribution();
const [manualAttributionId, manualPackageInfo] = faker.opossum.rawAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: 1,
        [resourceName2]: 1,
      }),
      externalAttributions: faker.opossum.rawAttributions({
        [externalAttributionId]: externalPackageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [externalAttributionId],
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [manualAttributionId]: manualPackageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [manualAttributionId],
      }),
    }),
  },
});

test('search menu items focus the respective panel search fields', async ({
  attributionsPanel,
  menuBar,
  resourcesTree,
  window,
}) => {
  const searchFieldOf = (headerTestId: string) =>
    window.getByTestId(headerTestId).getByRole('searchbox');

  await resourcesTree.goto(resourceName1);

  await menuBar.searchResources();
  await expect(searchFieldOf('resources-tree-header')).toBeFocused();

  await menuBar.searchAttributions();
  await expect(searchFieldOf('attributions-panel-header')).toBeFocused();

  await menuBar.searchSignals();
  await expect(searchFieldOf('signals-panel-header')).toBeFocused();

  // The linked resources panel only exists while an attribution is selected.
  await attributionsPanel.packageCard.click(manualPackageInfo);
  await menuBar.searchLinkedResources();
  await expect(searchFieldOf('linked-resources-tree-header')).toBeFocused();
});
