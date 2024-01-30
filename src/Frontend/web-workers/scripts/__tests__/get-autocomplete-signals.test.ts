// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PackageInfo } from '../../../../shared/shared-types';
import { faker } from '../../../../testing/Faker';
import { getAutocompleteSignals } from '../get-autocomplete-signals';

describe('getAutocompleteSignals', () => {
  it('deduplicates data and ignores data with invalid PURL', () => {
    const [resourceName1, resourceName2, resourceName3, resourceName4] =
      faker.opossum.resourceNames({
        count: 4,
      });
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo({
      packageType: undefined,
    });
    const packageInfo3 = faker.opossum.packageInfo();

    const signals = getAutocompleteSignals({
      externalData: faker.opossum.externalAttributionData({
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.folderPath(resourceName1)]: [packageInfo1.id],
          [faker.opossum.filePath(resourceName1, resourceName2)]: [
            packageInfo1.id,
          ],
          [faker.opossum.filePath(resourceName1, resourceName3)]: [
            packageInfo2.id,
          ],
          [faker.opossum.folderPath(resourceName4)]: [packageInfo3.id],
        }),
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
          [packageInfo3.id]: packageInfo3,
        }),
        resourcesWithAttributedChildren:
          faker.opossum.resourcesWithAttributedChildren({
            attributedChildren: {
              '0': new Set([1, 2]),
            },
            pathsToIndices: {
              [faker.opossum.folderPath(resourceName1)]: 0,
              [faker.opossum.filePath(resourceName1, resourceName2)]: 1,
              [faker.opossum.filePath(resourceName1, resourceName3)]: 2,
            },
            paths: [
              faker.opossum.folderPath(resourceName1),
              faker.opossum.filePath(resourceName1, resourceName2),
              faker.opossum.filePath(resourceName1, resourceName3),
            ],
          }),
      }),
      manualData: faker.opossum.manualAttributionData(),
      resolvedExternalAttributions: new Set(),
      resourceId: faker.opossum.folderPath(resourceName1),
      sources: faker.opossum.externalAttributionSources(),
    });

    expect(signals).toHaveLength(1);
    expect(signals).toEqual<Array<PackageInfo>>([
      { ...packageInfo1, count: 2 },
    ]);
  });

  it('does not offer preferred attributions as suggestions', () => {
    const [resourceName1, resourceName2] = faker.opossum.resourceNames({
      count: 2,
    });
    const packageInfo1 = faker.opossum.packageInfo({
      preferred: true,
    });

    const signals = getAutocompleteSignals({
      externalData: faker.opossum.externalAttributionData({
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.folderPath(resourceName1)]: [packageInfo1.id],
          [faker.opossum.filePath(resourceName1, resourceName2)]: [
            packageInfo1.id,
          ],
        }),
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
        }),
        resourcesWithAttributedChildren:
          faker.opossum.resourcesWithAttributedChildren({
            attributedChildren: {
              '0': new Set([1]),
            },
            pathsToIndices: {
              [faker.opossum.folderPath(resourceName1)]: 0,
              [faker.opossum.filePath(resourceName1, resourceName2)]: 1,
            },
            paths: [
              faker.opossum.folderPath(resourceName1),
              faker.opossum.filePath(resourceName1, resourceName2),
            ],
          }),
      }),
      manualData: faker.opossum.manualAttributionData(),
      resolvedExternalAttributions: new Set(),
      resourceId: faker.opossum.folderPath(resourceName1),
      sources: faker.opossum.externalAttributionSources(),
    });

    expect(signals).toHaveLength(0);
  });

  it('ranks data by count', () => {
    const [resourceName1, resourceName2, resourceName3] =
      faker.opossum.resourceNames({
        count: 3,
      });
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();

    const signals = getAutocompleteSignals({
      externalData: faker.opossum.externalAttributionData({
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.folderPath(resourceName1)]: [packageInfo1.id],
          [faker.opossum.filePath(resourceName1, resourceName2)]: [
            packageInfo1.id,
          ],
          [faker.opossum.filePath(resourceName1, resourceName3)]: [
            packageInfo2.id,
          ],
        }),
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesWithAttributedChildren:
          faker.opossum.resourcesWithAttributedChildren({
            attributedChildren: {
              '0': new Set([1, 2]),
            },
            pathsToIndices: {
              [faker.opossum.folderPath(resourceName1)]: 0,
              [faker.opossum.filePath(resourceName1, resourceName2)]: 1,
              [faker.opossum.filePath(resourceName1, resourceName3)]: 2,
            },
            paths: [
              faker.opossum.folderPath(resourceName1),
              faker.opossum.filePath(resourceName1, resourceName2),
              faker.opossum.filePath(resourceName1, resourceName3),
            ],
          }),
      }),
      manualData: faker.opossum.manualAttributionData(),
      resolvedExternalAttributions: new Set(),
      resourceId: faker.opossum.folderPath(resourceName1),
      sources: faker.opossum.externalAttributionSources(),
    });

    expect(signals).toHaveLength(2);
    expect(signals).toEqual<Array<PackageInfo>>([
      { ...packageInfo1, count: 2 },
      { ...packageInfo2, count: 1 },
    ]);
  });

  it('ranks data by was-preferred', () => {
    const [resourceName1, resourceName2] = faker.opossum.resourceNames({
      count: 2,
    });
    const packageInfo1 = faker.opossum.packageInfo({
      wasPreferred: false,
    });
    const packageInfo2 = faker.opossum.packageInfo({
      wasPreferred: true,
    });

    const signals = getAutocompleteSignals({
      externalData: faker.opossum.externalAttributionData({
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.folderPath(resourceName1)]: [packageInfo1.id],
          [faker.opossum.filePath(resourceName1, resourceName2)]: [
            packageInfo2.id,
          ],
        }),
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesWithAttributedChildren:
          faker.opossum.resourcesWithAttributedChildren({
            attributedChildren: {
              '0': new Set([1]),
            },
            pathsToIndices: {
              [faker.opossum.folderPath(resourceName1)]: 0,
              [faker.opossum.filePath(resourceName1, resourceName2)]: 1,
            },
            paths: [
              faker.opossum.folderPath(resourceName1),
              faker.opossum.filePath(resourceName1, resourceName2),
            ],
          }),
      }),
      manualData: faker.opossum.manualAttributionData(),
      resolvedExternalAttributions: new Set(),
      resourceId: faker.opossum.folderPath(resourceName1),
      sources: faker.opossum.externalAttributionSources(),
    });

    expect(signals).toHaveLength(2);
    expect(signals).toEqual<Array<PackageInfo>>([
      { ...packageInfo2, count: 1 },
      { ...packageInfo1, count: 1 },
    ]);
  });

  it('ranks data by source', () => {
    const source1 = faker.opossum.externalAttributionSource({ priority: 1 });
    const source2 = faker.opossum.externalAttributionSource({ priority: 2 });
    const [resourceName1, resourceName2] = faker.opossum.resourceNames({
      count: 2,
    });
    const packageInfo1 = faker.opossum.packageInfo({
      source: faker.opossum.source({ name: source1.name }),
    });
    const packageInfo2 = faker.opossum.packageInfo({
      source: faker.opossum.source({ name: source2.name }),
    });

    const signals = getAutocompleteSignals({
      externalData: faker.opossum.externalAttributionData({
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.folderPath(resourceName1)]: [packageInfo1.id],
          [faker.opossum.filePath(resourceName1, resourceName2)]: [
            packageInfo2.id,
          ],
        }),
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesWithAttributedChildren:
          faker.opossum.resourcesWithAttributedChildren({
            attributedChildren: {
              '0': new Set([1]),
            },
            pathsToIndices: {
              [faker.opossum.folderPath(resourceName1)]: 0,
              [faker.opossum.filePath(resourceName1, resourceName2)]: 1,
            },
            paths: [
              faker.opossum.folderPath(resourceName1),
              faker.opossum.filePath(resourceName1, resourceName2),
            ],
          }),
      }),
      manualData: faker.opossum.manualAttributionData(),
      resolvedExternalAttributions: new Set(),
      resourceId: faker.opossum.folderPath(resourceName1),
      sources: faker.opossum.externalAttributionSources({
        [source1.name]: source1,
        [source2.name]: source2,
      }),
    });

    expect(signals).toHaveLength(2);
    expect(signals).toEqual<Array<PackageInfo>>([
      { ...packageInfo2, count: 1 },
      { ...packageInfo1, count: 1 },
    ]);
  });
});
