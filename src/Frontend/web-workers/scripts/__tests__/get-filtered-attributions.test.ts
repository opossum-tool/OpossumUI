// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Attributions } from '../../../../shared/shared-types';
import { faker } from '../../../../testing/Faker';
import {
  getFilteredAttributions,
  LOW_CONFIDENCE_THRESHOLD,
} from '../get-filtered-attributions';

describe('get-filtered-attributions', () => {
  it('returns filtered attributions without filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: [],
      externalData: faker.opossum.externalAttributionData(),
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.manualAttributions({
          [attributionId1]: packageInfo1,
          [attributionId2]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [attributionId1, attributionId2],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [attributionId1]: packageInfo1,
      [attributionId2]: packageInfo2,
    });
  });

  it('returns filtered attributions with needs-follow-up filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      followUp: 'FOLLOW_UP',
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: ['Needs Follow-Up'],
      externalData: faker.opossum.externalAttributionData(),
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.manualAttributions({
          [attributionId1]: packageInfo1,
          [attributionId2]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [attributionId1, attributionId2],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [attributionId1]: packageInfo1,
    });
  });

  it('returns filtered attributions with pre-selected filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      preSelected: true,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: ['Pre-selected'],
      externalData: faker.opossum.externalAttributionData(),
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.manualAttributions({
          [attributionId1]: packageInfo1,
          [attributionId2]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [attributionId1, attributionId2],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [attributionId1]: packageInfo1,
    });
  });

  it('returns filtered attributions with excluded-from-notice filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      excludeFromNotice: true,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: ['Excluded from Notice'],
      externalData: faker.opossum.externalAttributionData(),
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.manualAttributions({
          [attributionId1]: packageInfo1,
          [attributionId2]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [attributionId1, attributionId2],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [attributionId1]: packageInfo1,
    });
  });

  it('returns filtered attributions with low-confidence filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      attributionConfidence: LOW_CONFIDENCE_THRESHOLD,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
      attributionConfidence: LOW_CONFIDENCE_THRESHOLD + 1,
    });

    const attributions = getFilteredAttributions({
      selectedFilters: ['Low Confidence'],
      externalData: faker.opossum.externalAttributionData(),
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.manualAttributions({
          [attributionId1]: packageInfo1,
          [attributionId2]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [attributionId1, attributionId2],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [attributionId1]: packageInfo1,
    });
  });

  it('returns filtered attributions with first-party filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      firstParty: true,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: ['First Party'],
      externalData: faker.opossum.externalAttributionData(),
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.manualAttributions({
          [attributionId1]: packageInfo1,
          [attributionId2]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [attributionId1, attributionId2],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [attributionId1]: packageInfo1,
    });
  });

  it('returns filtered attributions with third-party filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      firstParty: true,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: ['Third Party'],
      externalData: faker.opossum.externalAttributionData(),
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.manualAttributions({
          [attributionId1]: packageInfo1,
          [attributionId2]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [attributionId1, attributionId2],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [attributionId2]: packageInfo2,
    });
  });

  it('returns filtered attributions with needs-review-by-QA filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      needsReview: true,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: ['Needs Review by QA'],
      externalData: faker.opossum.externalAttributionData(),
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.manualAttributions({
          [attributionId1]: packageInfo1,
          [attributionId2]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [attributionId1, attributionId2],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [attributionId1]: packageInfo1,
    });
  });

  it('returns filtered attributions with currently-preferred filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      preferred: true,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: ['Currently Preferred'],
      externalData: faker.opossum.externalAttributionData(),
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.manualAttributions({
          [attributionId1]: packageInfo1,
          [attributionId2]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [attributionId1, attributionId2],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [attributionId1]: packageInfo1,
    });
  });

  it('returns filtered attributions with previously-preferred filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      wasPreferred: true,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: ['Previously Preferred'],
      externalData: faker.opossum.externalAttributionData(),
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.manualAttributions({
          [attributionId1]: packageInfo1,
          [attributionId2]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [attributionId1, attributionId2],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [attributionId1]: packageInfo1,
    });
  });

  it('returns filtered attributions with incomplete-attribution filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      packageName: undefined,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: ['Incomplete'],
      externalData: faker.opossum.externalAttributionData(),
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.manualAttributions({
          [attributionId1]: packageInfo1,
          [attributionId2]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [attributionId1, attributionId2],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [attributionId1]: packageInfo1,
    });
  });

  it('returns filtered attributions with modified-preferred filter', () => {
    const originId1 = faker.string.uuid();
    const originId2 = faker.string.uuid();
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      originIds: [originId1],
      wasPreferred: false,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
      originIds: [originId2],
      wasPreferred: false,
    });
    const [attributionId3, packageInfo3] = faker.opossum.externalAttribution({
      originIds: [originId1],
      wasPreferred: true,
    });
    const [attributionId4, packageInfo4] = faker.opossum.externalAttribution({
      originIds: [originId2],
      wasPreferred: false,
    });

    const attributions = getFilteredAttributions({
      selectedFilters: ['Modified Previously Preferred'],
      externalData: faker.opossum.externalAttributionData({
        attributions: faker.opossum.externalAttributions({
          [attributionId3]: packageInfo3,
          [attributionId4]: packageInfo4,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [attributionId3, attributionId4],
        }),
      }),
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.manualAttributions({
          [attributionId1]: packageInfo1,
          [attributionId2]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [attributionId1, attributionId2],
        }),
      }),
    });

    expect(attributions).toEqual<Attributions>({
      [attributionId1]: packageInfo1,
    });
  });
});
