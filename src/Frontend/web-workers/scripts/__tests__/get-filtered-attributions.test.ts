// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Attributions, Criticality } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { ROOT_PATH } from '../../../shared-constants';
import { computeChildrenWithAttributions } from '../../../state/helpers/save-action-helpers';
import {
  getFilteredAttributions,
  LOW_CONFIDENCE_THRESHOLD,
} from '../get-filtered-attributions';

describe('get-filtered-attributions', () => {
  it('returns filtered attributions without filter', () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      filters: [],
      sorting: text.sortings.name,
      selectedLicense: '',
      search: '',
      resourceId: '',
      data: faker.opossum.attributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, relation: 'resource' },
      [packageInfo2.id]: { ...packageInfo2, relation: 'resource' },
    });
  });

  it('returns attributions with relations and counts', () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const resourceId1 = `${faker.opossum.filePath(faker.opossum.resourceName())}/`;
    const resourceId2 = faker.opossum.filePath(
      resourceId1,
      faker.opossum.resourceName(),
    );
    const attributionsToResources = faker.opossum.attributionsToResources({
      [packageInfo1.id]: [resourceId1],
      [packageInfo2.id]: [resourceId2],
    });

    const attributions = getFilteredAttributions({
      filters: [],
      sorting: text.sortings.name,
      selectedLicense: '',
      search: '',
      resourceId: resourceId1,
      data: faker.opossum.attributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [resourceId1]: [packageInfo1.id],
          [resourceId2]: [packageInfo2.id],
        }),
        attributionsToResources,
        resourcesWithAttributedChildren: computeChildrenWithAttributions(
          attributionsToResources,
        ),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: {
        ...packageInfo1,
        relation: 'resource',
        count: undefined,
      },
      [packageInfo2.id]: { ...packageInfo2, relation: 'children', count: 1 },
    });
  });

  it('sorts attributions alphabetically', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      packageName: 'b',
    });
    const packageInfo2 = faker.opossum.packageInfo({
      packageName: 'a',
    });

    const attributions = getFilteredAttributions({
      filters: [],
      sorting: text.sortings.name,
      selectedLicense: '',
      search: '',
      resourceId: '',
      data: faker.opossum.attributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(Object.keys(attributions)).toEqual<Array<string>>([
      packageInfo2.id,
      packageInfo1.id,
    ]);
  });

  it('sorts attributions by criticality', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      criticality: Criticality.Medium,
    });
    const packageInfo2 = faker.opossum.packageInfo({
      criticality: Criticality.High,
    });

    const attributions = getFilteredAttributions({
      filters: [],
      sorting: text.sortings.criticality,
      selectedLicense: '',
      search: '',
      resourceId: '',
      data: faker.opossum.attributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(Object.keys(attributions)).toEqual<Array<string>>([
      packageInfo2.id,
      packageInfo1.id,
    ]);
  });

  it('sorts attributions by occurrence', () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const childPath1 = faker.system.filePath();
    const childPath2 = faker.system.filePath();

    const attributions = getFilteredAttributions({
      filters: [],
      sorting: text.sortings.occurrence,
      selectedLicense: '',
      search: '',
      resourceId: ROOT_PATH,
      data: faker.opossum.attributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [childPath1]: [packageInfo1.id, packageInfo2.id],
          [childPath2]: [packageInfo2.id],
        }),
        attributionsToResources: faker.opossum.attributionsToResources({
          [packageInfo1.id]: [childPath1],
        }),
        resourcesWithAttributedChildren:
          faker.opossum.resourcesWithAttributedChildren({
            attributedChildren: { '0': new Set([1, 2]) },
            paths: [ROOT_PATH, childPath1, childPath2],
            pathsToIndices: {
              [ROOT_PATH]: 0,
              [childPath1]: 1,
              [childPath2]: 2,
            },
          }),
      }),
    });

    expect(Object.keys(attributions)).toEqual<Array<string>>([
      packageInfo2.id,
      packageInfo1.id,
    ]);
  });

  it('returns filtered attributions based on search term', () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      filters: [],
      sorting: text.sortings.name,
      selectedLicense: '',
      search: packageInfo1.packageName!,
      resourceId: '',
      data: faker.opossum.attributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, relation: 'resource' },
    });
  });

  it('returns filtered attributions with needs-follow-up filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      followUp: true,
    });
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      filters: [text.filters.needsFollowUp],
      sorting: text.sortings.name,
      selectedLicense: '',
      search: '',
      resourceId: '',
      data: faker.opossum.attributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, relation: 'resource' },
    });
  });

  it('returns filtered attributions with pre-selected filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      preSelected: true,
    });
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      filters: [text.filters.preSelected],
      sorting: text.sortings.name,
      selectedLicense: '',
      search: '',
      resourceId: '',
      data: faker.opossum.attributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, relation: 'resource' },
    });
  });

  it('returns filtered attributions with excluded-from-notice filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      excludeFromNotice: true,
    });
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      filters: [text.filters.excludedFromNotice],
      sorting: text.sortings.name,
      selectedLicense: '',
      search: '',
      resourceId: '',
      data: faker.opossum.attributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, relation: 'resource' },
    });
  });

  it('returns filtered attributions with low-confidence filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      attributionConfidence: LOW_CONFIDENCE_THRESHOLD - 1,
    });
    const packageInfo2 = faker.opossum.packageInfo({
      attributionConfidence: LOW_CONFIDENCE_THRESHOLD,
    });

    const attributions = getFilteredAttributions({
      filters: [text.filters.lowConfidence],
      sorting: text.sortings.name,
      selectedLicense: '',
      search: '',
      resourceId: '',
      data: faker.opossum.attributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, relation: 'resource' },
    });
  });

  it('returns filtered attributions with first-party filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      firstParty: true,
    });
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      filters: [text.filters.firstParty],
      sorting: text.sortings.name,
      selectedLicense: '',
      search: '',
      resourceId: '',
      data: faker.opossum.attributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, relation: 'resource' },
    });
  });

  it('returns filtered attributions with third-party filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      firstParty: true,
    });
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      filters: [text.filters.thirdParty],
      sorting: text.sortings.name,
      selectedLicense: '',
      search: '',
      resourceId: '',
      data: faker.opossum.attributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo2.id]: { ...packageInfo2, relation: 'resource' },
    });
  });

  it('returns filtered attributions with needs-review-by-QA filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      needsReview: true,
    });
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      filters: [text.filters.needsReview],
      sorting: text.sortings.name,
      selectedLicense: '',
      search: '',
      resourceId: '',
      data: faker.opossum.attributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, relation: 'resource' },
    });
  });

  it('returns filtered attributions with currently-preferred filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      preferred: true,
    });
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      filters: [text.filters.currentlyPreferred],
      sorting: text.sortings.name,
      selectedLicense: '',
      search: '',
      resourceId: '',
      data: faker.opossum.attributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, relation: 'resource' },
    });
  });

  it('returns filtered attributions with previously-preferred filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      wasPreferred: true,
    });
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      filters: [text.filters.previouslyPreferred],
      sorting: text.sortings.name,
      selectedLicense: '',
      search: '',
      resourceId: '',
      data: faker.opossum.attributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, relation: 'resource' },
    });
  });

  it('returns filtered attributions with incomplete-coordinates filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      packageName: undefined,
    });
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      filters: [text.filters.incompleteCoordinates],
      sorting: text.sortings.name,
      selectedLicense: '',
      search: '',
      resourceId: '',
      data: faker.opossum.attributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, relation: 'resource' },
    });
  });

  it('returns filtered attributions with incomplete-legal filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      copyright: undefined,
    });
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      filters: [text.filters.incompleteLegal],
      sorting: text.sortings.name,
      selectedLicense: '',
      search: '',
      resourceId: '',
      data: faker.opossum.attributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, relation: 'resource' },
    });
  });

  it('returns filtered attributions with modified previously preferred filter', () => {
    const packageInfo1 = faker.opossum.packageInfo({ modifiedPreferred: true });
    const packageInfo2 = faker.opossum.packageInfo();

    const attributions = getFilteredAttributions({
      filters: [text.filters.modifiedPreviouslyPreferred],
      sorting: text.sortings.name,
      selectedLicense: '',
      search: '',
      resourceId: '',
      data: faker.opossum.attributionData({
        attributions: faker.opossum.attributions({
          [packageInfo1.id]: packageInfo1,
          [packageInfo2.id]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [packageInfo1.id, packageInfo2.id],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [packageInfo1.id]: { ...packageInfo1, relation: 'resource' },
    });
  });
});
