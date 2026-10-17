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
const [externalAttributionId, externalPackageInfo] =
  faker.opossum.rawAttribution({ licenseName: 'MIT' });
const [preselectedAttributionId, preselectedPackageInfo] =
  faker.opossum.rawAttribution({ licenseName: 'MIT', preSelected: true });
const [reviewedMitAttributionId, reviewedMitPackageInfo] =
  faker.opossum.rawAttribution({ licenseName: 'MIT' });
const [reviewedApacheAttributionId, reviewedApachePackageInfo] =
  faker.opossum.rawAttribution({ licenseName: 'Apache-2.0' });

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
