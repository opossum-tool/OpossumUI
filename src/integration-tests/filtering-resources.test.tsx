// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { describe, it } from 'vitest';

import { deserializeAttributions } from '../ElectronBackend/input/parseInputData';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { text } from '../shared/text';
import { faker } from '../testing/Faker';
import { renderApp } from './helpers/render-app';
import {
  clickFilterMenuItem,
  clickTreeFilterMenuButton,
  closeFilterMenu,
  expandTreeResourceAtPath,
  expectResourceAtPathVisibility,
  expectResourceVisibility,
  expectTreeResourceCountIs,
  searchTree,
  selectFilterLicenseName,
} from './helpers/ui';

const [
  externalResourceName,
  preselectedResourceName,
  reviewedMitResourceName,
  reviewedApacheResourceName,
  autoExpansionRootName,
  matchingDirectoryName,
  matchingLeafName,
  unrelatedDirectoryName,
  unrelatedLeafName,
] = faker.opossum.resourceNames({ count: 9 });
const [deferredResourceName, aiNotDeferredResourceName, plainResourceName] =
  faker.opossum.resourceNames({ count: 3 });
const [externalAttributionId, externalPackageInfo] =
  faker.opossum.rawAttribution({ licenseName: 'MIT' });
const [preselectedAttributionId, preselectedPackageInfo] =
  faker.opossum.rawAttribution({ licenseName: 'MIT', preSelected: true });
const [reviewedMitAttributionId, reviewedMitPackageInfo] =
  faker.opossum.rawAttribution({ licenseName: 'MIT' });
const [reviewedApacheAttributionId, reviewedApachePackageInfo] =
  faker.opossum.rawAttribution({ licenseName: 'Apache-2.0' });
const [deferredAttributionId, deferredPackageInfo] =
  faker.opossum.rawAttribution({
    aiAttributions: { deferredFields: { copyright: true } },
  });
const [aiNotDeferredAttributionId, aiNotDeferredPackageInfo] =
  faker.opossum.rawAttribution({ aiAttributions: { humanModified: false } });
const [plainAttributionId, plainPackageInfo] = faker.opossum.rawAttribution();

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    [externalResourceName]: 1,
    [preselectedResourceName]: 1,
    [reviewedMitResourceName]: 1,
    [reviewedApacheResourceName]: 1,
    [autoExpansionRootName]: {
      [matchingDirectoryName]: { [matchingLeafName]: 1 },
      [unrelatedDirectoryName]: { [unrelatedLeafName]: 1 },
    },
    [deferredResourceName]: 1,
    [aiNotDeferredResourceName]: 1,
    [plainResourceName]: 1,
  }),
  externalAttributions: deserializeAttributions({
    [externalAttributionId]: externalPackageInfo,
  }),
  resourcesToExternalAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(externalResourceName)]: [externalAttributionId],
  }),
  manualAttributions: deserializeAttributions({
    [preselectedAttributionId]: preselectedPackageInfo,
    [reviewedMitAttributionId]: reviewedMitPackageInfo,
    [reviewedApacheAttributionId]: reviewedApachePackageInfo,
    [deferredAttributionId]: deferredPackageInfo,
    [aiNotDeferredAttributionId]: aiNotDeferredPackageInfo,
    [plainAttributionId]: plainPackageInfo,
  }),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(preselectedResourceName)]: [
      preselectedAttributionId,
    ],
    [faker.opossum.filePath(reviewedMitResourceName)]: [
      reviewedMitAttributionId,
    ],
    [faker.opossum.filePath(reviewedApacheResourceName)]: [
      reviewedApacheAttributionId,
    ],
    [faker.opossum.filePath(deferredResourceName)]: [deferredAttributionId],
    [faker.opossum.filePath(aiNotDeferredResourceName)]: [
      aiNotDeferredAttributionId,
    ],
    [faker.opossum.filePath(plainResourceName)]: [plainAttributionId],
  }),
});

describe('filtering resources', () => {
  it('filters the resource tree to unreviewed files', async () => {
    await renderApp({ data });
    await clickTreeFilterMenuButton();
    await clickFilterMenuItem('Unreviewed');
    await closeFilterMenu();
    await expectResourceVisibility(
      [externalResourceName, preselectedResourceName],
      [reviewedMitResourceName, reviewedApacheResourceName],
    );
  });

  it('combines unreviewed and external attribution license filters in the resource tree', async () => {
    await renderApp({ data });
    await clickTreeFilterMenuButton();
    await clickFilterMenuItem('Unreviewed');
    await closeFilterMenu();
    await clickTreeFilterMenuButton();
    await selectFilterLicenseName(externalPackageInfo.licenseName ?? '');
    await closeFilterMenu();
    await expectResourceVisibility(
      [externalResourceName],
      [
        preselectedResourceName,
        reviewedMitResourceName,
        reviewedApacheResourceName,
      ],
    );
  });

  it('filters the resource tree to resources with AI-deferred attributions', async () => {
    await renderApp({ data });
    await clickTreeFilterMenuButton();
    await clickFilterMenuItem(text.filters.hasAiDeferredAttribution);
    await closeFilterMenu();
    await expectResourceVisibility(
      [deferredResourceName],
      [aiNotDeferredResourceName, plainResourceName],
    );

    await clickTreeFilterMenuButton();
    await clickFilterMenuItem(text.filters.hasAiDeferredAttribution);
    await closeFilterMenu();
    await expectResourceVisibility(
      [deferredResourceName, aiNotDeferredResourceName, plainResourceName],
      [],
    );
  });

  it('expands the complete visible chain after filtering', async () => {
    await renderApp({ data });
    await searchTree(matchingLeafName, 'resources-tree-header');
    await expectTreeResourceCountIs(1);

    await expandTreeResourceAtPath(`/${autoExpansionRootName}/`);

    await expectResourceAtPathVisibility([
      `/${autoExpansionRootName}/${matchingDirectoryName}/`,
      `/${autoExpansionRootName}/${matchingDirectoryName}/${matchingLeafName}`,
    ]);
  });
});
