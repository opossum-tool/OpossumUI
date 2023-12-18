// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker } from '../../../../shared/Faker';
import { AutocompleteSignal } from '../../../../shared/shared-types';
import { getAutocompleteSignals } from '../get-autocomplete-signals';

describe('getAutocompleteSignals', () => {
  it('deduplicates data and ignores data with invalid PURL', () => {
    const [resourceName1, resourceName2, resourceName3, resourceName4] =
      faker.opossum.resourceNames({
        count: 4,
      });
    const [attributionId1, attribution1] = faker.opossum.externalAttribution();
    const [attributionId2, attribution2] = faker.opossum.externalAttribution({
      packageType: undefined,
    });
    const [attributionId3, attribution3] = faker.opossum.externalAttribution();

    const signals = getAutocompleteSignals({
      externalData: faker.opossum.externalAttributionData({
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.folderPath(resourceName1)]: [attributionId1],
          [faker.opossum.filePath(resourceName1, resourceName2)]: [
            attributionId1,
          ],
          [faker.opossum.filePath(resourceName1, resourceName3)]: [
            attributionId2,
          ],
          [faker.opossum.folderPath(resourceName4)]: [attributionId3],
        }),
        attributions: faker.opossum.externalAttributions({
          [attributionId1]: attribution1,
          [attributionId2]: attribution2,
          [attributionId3]: attribution3,
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
    expect(signals).toEqual<Array<AutocompleteSignal>>([
      { ...attribution1, count: 2 },
    ]);
  });

  it('does not offer preferred attributions as suggestions', () => {
    const [resourceName1, resourceName2] = faker.opossum.resourceNames({
      count: 2,
    });
    const [attributionId1, attribution1] = faker.opossum.externalAttribution({
      preferred: true,
    });

    const signals = getAutocompleteSignals({
      externalData: faker.opossum.externalAttributionData({
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.folderPath(resourceName1)]: [attributionId1],
          [faker.opossum.filePath(resourceName1, resourceName2)]: [
            attributionId1,
          ],
        }),
        attributions: faker.opossum.externalAttributions({
          [attributionId1]: attribution1,
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
    const [attributionId1, attribution1] = faker.opossum.externalAttribution();
    const [attributionId2, attribution2] = faker.opossum.externalAttribution();

    const signals = getAutocompleteSignals({
      externalData: faker.opossum.externalAttributionData({
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.folderPath(resourceName1)]: [attributionId1],
          [faker.opossum.filePath(resourceName1, resourceName2)]: [
            attributionId1,
          ],
          [faker.opossum.filePath(resourceName1, resourceName3)]: [
            attributionId2,
          ],
        }),
        attributions: faker.opossum.externalAttributions({
          [attributionId1]: attribution1,
          [attributionId2]: attribution2,
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
    expect(signals).toEqual<Array<AutocompleteSignal>>([
      { ...attribution1, count: 2 },
      { ...attribution2, count: 1 },
    ]);
  });

  it('ranks data by was-preferred', () => {
    const [resourceName1, resourceName2] = faker.opossum.resourceNames({
      count: 2,
    });
    const [attributionId1, attribution1] = faker.opossum.externalAttribution({
      wasPreferred: false,
    });
    const [attributionId2, attribution2] = faker.opossum.externalAttribution({
      wasPreferred: true,
    });

    const signals = getAutocompleteSignals({
      externalData: faker.opossum.externalAttributionData({
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.folderPath(resourceName1)]: [attributionId1],
          [faker.opossum.filePath(resourceName1, resourceName2)]: [
            attributionId2,
          ],
        }),
        attributions: faker.opossum.externalAttributions({
          [attributionId1]: attribution1,
          [attributionId2]: attribution2,
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
    expect(signals).toEqual<Array<AutocompleteSignal>>([
      { ...attribution2, count: 1 },
      { ...attribution1, count: 1 },
    ]);
  });

  it('ranks data by source', () => {
    const source1 = faker.opossum.externalAttributionSource({ priority: 1 });
    const source2 = faker.opossum.externalAttributionSource({ priority: 2 });
    const [resourceName1, resourceName2] = faker.opossum.resourceNames({
      count: 2,
    });
    const [attributionId1, attribution1] = faker.opossum.externalAttribution({
      source: faker.opossum.source({ name: source1.name }),
    });
    const [attributionId2, attribution2] = faker.opossum.externalAttribution({
      source: faker.opossum.source({ name: source2.name }),
    });

    const signals = getAutocompleteSignals({
      externalData: faker.opossum.externalAttributionData({
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.folderPath(resourceName1)]: [attributionId1],
          [faker.opossum.filePath(resourceName1, resourceName2)]: [
            attributionId2,
          ],
        }),
        attributions: faker.opossum.externalAttributions({
          [attributionId1]: attribution1,
          [attributionId2]: attribution2,
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
    expect(signals).toEqual<Array<AutocompleteSignal>>([
      { ...attribution2, count: 1 },
      { ...attribution1, count: 1 },
    ]);
  });
});
