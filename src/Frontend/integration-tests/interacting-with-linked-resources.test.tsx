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
  clearTreeSearch,
  clickPackageCard,
  expectLinkedResourcesTreeVisibility,
  expectPackageCards,
  expectPathBarCrumbs,
  expectResourceVisibility,
  expectSelectedTabIs,
  expectTreeItemHighlight,
  expectTreeSearchFocused,
  fillPanelSearch,
  gotoResource,
  gotoResourceInOtherTree,
  gotoResourceTreeRoot,
  pressSearchShortcut,
  searchTree,
} from './helpers/ui';

const LINKED_TREE = 'linked-resources-tree';
const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [externalAttributionId, externalPackageInfo] =
  faker.opossum.rawAttribution();
const [manualAttributionId1, manualPackageInfo1] =
  faker.opossum.rawAttribution();
const [manualAttributionId2, manualPackageInfo2] =
  faker.opossum.rawAttribution();

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    [resourceName1]: {
      [resourceName2]: 1,
    },
    [resourceName3]: 1,
    [resourceName4]: 1,
  }),
  externalAttributions: deserializeAttributions({
    [externalAttributionId]: externalPackageInfo,
  }),
  resourcesToExternalAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.folderPath(resourceName1)]: [externalAttributionId],
  }),
  manualAttributions: deserializeAttributions({
    [manualAttributionId1]: manualPackageInfo1,
    [manualAttributionId2]: manualPackageInfo2,
  }),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.folderPath(resourceName1)]: [manualAttributionId1],
    [faker.opossum.filePath(resourceName3)]: [manualAttributionId2],
    [faker.opossum.filePath(resourceName4)]: [manualAttributionId1],
  }),
});

describe('interacting with linked resources', () => {
  it('shows resources linked to an attribution', async () => {
    await renderApp({ data });
    await gotoResourceTreeRoot();
    await expectSelectedTabIs('signals-panel', 'children');
    await expectPackageCards('signals-panel', [externalPackageInfo], []);
    await expectLinkedResourcesTreeVisibility(false);

    await clickPackageCard('signals-panel', externalPackageInfo);
    await expectLinkedResourcesTreeVisibility(true);
    await expectResourceVisibility([resourceName1], [], LINKED_TREE);

    await gotoResourceInOtherTree(LINKED_TREE, resourceName1);
    await expectPathBarCrumbs([resourceName1]);
    await expectSelectedTabIs('signals-panel', 'resource');
    await expectPackageCards('signals-panel', [externalPackageInfo], []);
  });

  it('shows only linked resources matching search', async () => {
    await renderApp({ data });
    await gotoResource(resourceName1);
    await expectLinkedResourcesTreeVisibility(true);
    await expectResourceVisibility(
      [resourceName1, resourceName4],
      [],
      LINKED_TREE,
    );

    await searchTree(resourceName4, 'linked-resources-tree-header');
    await expectResourceVisibility([], [resourceName1], LINKED_TREE);
    await expectResourceVisibility([resourceName4], [], LINKED_TREE);
    await expectTreeItemHighlight(LINKED_TREE, resourceName4, true);

    await clearTreeSearch('linked-resources-tree-header');
    await expectResourceVisibility(
      [resourceName1, resourceName4],
      [],
      LINKED_TREE,
    );
    await expectTreeItemHighlight(LINKED_TREE, resourceName1, false);
    await expectTreeItemHighlight(LINKED_TREE, resourceName4, false);

    await gotoResourceInOtherTree(LINKED_TREE, resourceName1);
    await pressSearchShortcut();
    await expectTreeSearchFocused('linked-resources-tree-header');
    await fillPanelSearch('linked-resources-tree-header', resourceName4);
    await expectResourceVisibility([], [resourceName1], LINKED_TREE);
    await expectResourceVisibility([resourceName4], [], LINKED_TREE);
    await expectTreeItemHighlight(LINKED_TREE, resourceName4, true);
  });
});
