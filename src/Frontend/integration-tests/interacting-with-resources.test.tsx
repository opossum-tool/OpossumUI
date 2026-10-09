// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import { describe, it } from 'vitest';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import { text } from '../../shared/text';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';
import {
  clearTreeSearch,
  clickFilterMenuButton,
  clickPackageCard,
  clickPanelButton,
  clickPathBarBreadcrumb,
  clickPathBarHistoryButton,
  clickProgressBar,
  closeFilterMenu,
  expectPackageCards,
  expectPathBarCrumbs,
  expectPathBarHistoryButton,
  expectResourceVisibility,
  expectTreeSearchFocused,
  fillPanelSearch,
  focusResourceTreeItem,
  gotoResource,
  gotoResourceTreeRoot,
  pressGoBackShortcut,
  pressGoForwardShortcut,
  pressSearchShortcut,
  searchTree,
  selectFilterLicenseName,
} from './helpers/ui';

const SIGNALS_PANEL = 'signals-panel';
const SELECTED_LICENSE = 'MIT';
const [
  resourceWithExternalSelectedLicense,
  nestedResourceWithExternalSelectedLicense,
  leafResourceWithExternalSelectedLicense,
  resourceWithExternalDifferentLicense,
  nestedResourceWithExternalDifferentLicense,
  leafResourceWithExternalDifferentLicense,
  anotherResourceWithExternalDifferentLicense,
  resourceWithManualSelectedLicense,
] = faker.opossum.resourceNames({ count: 8 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  licenseName: SELECTED_LICENSE,
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  licenseName: 'Apache-2.0',
});
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution({
  licenseName: 'BSD-3-Clause',
});
const [attributionId4, packageInfo4] = faker.opossum.rawAttribution({
  licenseName: SELECTED_LICENSE,
});

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    [resourceWithExternalSelectedLicense]: {
      [nestedResourceWithExternalSelectedLicense]: {
        [leafResourceWithExternalSelectedLicense]: 1,
      },
    },
    [resourceWithExternalDifferentLicense]: {
      [nestedResourceWithExternalDifferentLicense]: {
        [leafResourceWithExternalDifferentLicense]: 1,
      },
    },
    [anotherResourceWithExternalDifferentLicense]: 1,
    [resourceWithManualSelectedLicense]: 1,
  }),
  externalAttributions: deserializeAttributions({
    [attributionId1]: packageInfo1,
    [attributionId2]: packageInfo2,
    [attributionId3]: packageInfo3,
  }),
  resourcesToExternalAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(
      resourceWithExternalSelectedLicense,
      nestedResourceWithExternalSelectedLicense,
      leafResourceWithExternalSelectedLicense,
    )]: [attributionId1],
    [faker.opossum.filePath(
      resourceWithExternalDifferentLicense,
      nestedResourceWithExternalDifferentLicense,
      leafResourceWithExternalDifferentLicense,
    )]: [attributionId2],
    [faker.opossum.filePath(anotherResourceWithExternalDifferentLicense)]: [
      attributionId3,
    ],
  }),
  manualAttributions: deserializeAttributions({
    [attributionId4]: packageInfo4,
  }),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(resourceWithManualSelectedLicense)]: [
      attributionId4,
    ],
  }),
});

describe('interacting with resources', () => {
  it('shows expected resources as user browses through resources', async () => {
    await renderApp({ data });
    await expectResourceVisibility(
      [
        resourceWithExternalSelectedLicense,
        resourceWithExternalDifferentLicense,
        anotherResourceWithExternalDifferentLicense,
        resourceWithManualSelectedLicense,
      ],
      [
        nestedResourceWithExternalSelectedLicense,
        leafResourceWithExternalSelectedLicense,
        nestedResourceWithExternalDifferentLicense,
        leafResourceWithExternalDifferentLicense,
      ],
    );

    await gotoResource(resourceWithExternalDifferentLicense);
    await expectResourceVisibility(
      [
        nestedResourceWithExternalDifferentLicense,
        leafResourceWithExternalDifferentLicense,
      ],
      [
        nestedResourceWithExternalSelectedLicense,
        leafResourceWithExternalSelectedLicense,
      ],
    );
  });

  it('cycles through resources as user clicks on progress bar', async () => {
    await renderApp({ data });
    await clickProgressBar();
    await expectPackageCards(SIGNALS_PANEL, [packageInfo1], []);
    await clickPackageCard(SIGNALS_PANEL, packageInfo1);

    await clickProgressBar();
    await expectPackageCards(SIGNALS_PANEL, [packageInfo2], []);
    await clickPackageCard(SIGNALS_PANEL, packageInfo2);

    await clickProgressBar();
    await expectPackageCards(SIGNALS_PANEL, [packageInfo3], []);
    await clickPackageCard(SIGNALS_PANEL, packageInfo3);

    await clickPanelButton(SIGNALS_PANEL, text.packageLists.linkAsAttribution);
    await clickProgressBar();
    await expectPackageCards(SIGNALS_PANEL, [packageInfo1], []);
    await clickPackageCard(SIGNALS_PANEL, packageInfo1);

    await clickProgressBar();
    await expectPackageCards(SIGNALS_PANEL, [packageInfo2], []);
    await clickPackageCard(SIGNALS_PANEL, packageInfo2);

    await clickProgressBar();
    await expectPackageCards(SIGNALS_PANEL, [packageInfo1], []);
  });

  it('shows expected breadcrumbs as user navigates through browser history', async () => {
    await renderApp({ data });
    await gotoResourceTreeRoot();
    await expectPathBarHistoryButton('go back', false);
    await expectPathBarHistoryButton('go forward', false);

    await gotoResource(
      resourceWithExternalSelectedLicense,
      nestedResourceWithExternalSelectedLicense,
      leafResourceWithExternalSelectedLicense,
    );
    await expectPathBarHistoryButton('go back', true);
    await expectPathBarHistoryButton('go forward', false);
    await expectPathBarCrumbs([
      resourceWithExternalSelectedLicense,
      nestedResourceWithExternalSelectedLicense,
      leafResourceWithExternalSelectedLicense,
    ]);

    await clickPathBarHistoryButton('go back');
    await expectPathBarHistoryButton('go forward', true);
    await expectPathBarCrumbs(
      [
        resourceWithExternalSelectedLicense,
        nestedResourceWithExternalSelectedLicense,
      ],
      [leafResourceWithExternalSelectedLicense],
    );

    await clickPathBarHistoryButton('go forward');
    await expectPathBarCrumbs([
      resourceWithExternalSelectedLicense,
      nestedResourceWithExternalSelectedLicense,
      leafResourceWithExternalSelectedLicense,
    ]);

    await clickPathBarBreadcrumb(resourceWithExternalSelectedLicense);
    await expectPathBarCrumbs(
      [resourceWithExternalSelectedLicense],
      [
        nestedResourceWithExternalSelectedLicense,
        leafResourceWithExternalSelectedLicense,
      ],
    );

    await pressGoBackShortcut();
    await expectPathBarCrumbs([
      resourceWithExternalSelectedLicense,
      nestedResourceWithExternalSelectedLicense,
      leafResourceWithExternalSelectedLicense,
    ]);

    await pressGoForwardShortcut();
    await expectPathBarCrumbs(
      [resourceWithExternalSelectedLicense],
      [
        nestedResourceWithExternalSelectedLicense,
        leafResourceWithExternalSelectedLicense,
      ],
    );
  });

  it('shows only resources matching search', async () => {
    await renderApp({ data });
    await expectResourceVisibility([
      resourceWithExternalSelectedLicense,
      resourceWithExternalDifferentLicense,
    ]);

    await searchTree(
      resourceWithExternalDifferentLicense,
      'resources-tree-header',
    );
    await expectResourceVisibility(
      [resourceWithExternalDifferentLicense],
      [resourceWithExternalSelectedLicense],
    );

    await clearTreeSearch('resources-tree-header');
    await expectResourceVisibility([
      resourceWithExternalSelectedLicense,
      resourceWithExternalDifferentLicense,
    ]);

    await gotoResourceTreeRoot();
    focusResourceTreeItem(resourceWithExternalSelectedLicense);
    await pressSearchShortcut();
    await expectTreeSearchFocused('resources-tree-header');
    await fillPanelSearch(
      'resources-tree-header',
      resourceWithExternalDifferentLicense,
    );
    await expectResourceVisibility(
      [resourceWithExternalDifferentLicense],
      [resourceWithExternalSelectedLicense],
    );
  });

  it('shows only resources matching selected external attribution license', async () => {
    await renderApp({ data });
    await gotoResourceTreeRoot();
    await clickFilterMenuButton(screen.getByTestId('resources-tree-header'));
    await selectFilterLicenseName(SELECTED_LICENSE);
    await closeFilterMenu();
    await closeFilterMenu();
    await expectResourceVisibility(
      [resourceWithExternalSelectedLicense],
      [
        resourceWithManualSelectedLicense,
        resourceWithExternalDifferentLicense,
        anotherResourceWithExternalDifferentLicense,
      ],
    );
  });
});
