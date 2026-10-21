// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type {
  RawAttributions,
  RawPackageInfo,
  Resources,
  ResourcesToAttributions,
} from '../shared/shared-types';
import { faker } from './Faker';

export interface FilterExcludedAttributionsFixture {
  resources: Resources;
  manualAttributions: RawAttributions;
  resourcesToAttributions: ResourcesToAttributions;
  resourceName1: string;
  resourceName2: string;
  resourceName3: string;
  resourceName4: string;
  attributionId1: string;
  attributionId2: string;
  attributionId3: string;
  packageInfo1: RawPackageInfo;
  packageInfo2: RawPackageInfo;
  packageInfo3: RawPackageInfo;
}

export function getFilterExcludedAttributionsFixture(): FilterExcludedAttributionsFixture {
  const [resourceName1, resourceName2, resourceName3, resourceName4] =
    faker.opossum.resourceNames({ count: 4 });
  const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
    followUp: 'FOLLOW_UP',
    licenseName: 'MIT',
    url: '',
    wasPreferred: true,
  });
  const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
    licenseName: 'Apache-2.0',
  });
  const [attributionId3, packageInfo3] = faker.opossum.rawAttribution({
    firstParty: true,
  });

  return {
    resources: faker.opossum.resources({
      [resourceName1]: {
        [resourceName2]: {
          [resourceName3]: 1,
        },
      },
      [resourceName4]: 1,
    }),
    manualAttributions: {
      [attributionId1]: packageInfo1,
      [attributionId2]: packageInfo2,
      [attributionId3]: packageInfo3,
    },
    resourcesToAttributions: faker.opossum.resourcesToAttributions({
      [faker.opossum.filePath(resourceName1, resourceName2, resourceName3)]: [
        attributionId1,
      ],
      [faker.opossum.filePath(resourceName4)]: [attributionId2],
      [faker.opossum.folderPath(resourceName1, resourceName2)]: [
        attributionId3,
      ],
    }),
    resourceName1,
    resourceName2,
    resourceName3,
    resourceName4,
    attributionId1,
    attributionId2,
    attributionId3,
    packageInfo1,
    packageInfo2,
    packageInfo3,
  };
}
