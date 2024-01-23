// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { DisplayPackageInfos } from '../../../types/types';
import { convertPackageInfoToDisplayPackageInfo } from '../../../util/convert-package-info';
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
      sorting: text.sortings.name,
      search: '',
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

    expect(attributions).toEqual<DisplayPackageInfos>({
      [attributionId1]: convertPackageInfoToDisplayPackageInfo(
        packageInfo1,
        [attributionId1],
        0,
      ),
      [attributionId2]: convertPackageInfoToDisplayPackageInfo(
        packageInfo2,
        [attributionId2],
        0,
      ),
    });
  });

  it('returns attributions with count', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: [],
      sorting: text.sortings.name,
      search: '',
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.manualAttributions({
          [attributionId1]: packageInfo1,
          [attributionId2]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [attributionId1, attributionId2],
        }),
        attributionsToResources: faker.opossum.attributionsToResources({
          [attributionId1]: [
            faker.opossum.filePath(),
            faker.opossum.filePath(),
          ],
        }),
      }),
    });

    expect(attributions).toEqual<DisplayPackageInfos>({
      [attributionId1]: convertPackageInfoToDisplayPackageInfo(
        packageInfo1,
        [attributionId1],
        2,
      ),
      [attributionId2]: convertPackageInfoToDisplayPackageInfo(
        packageInfo2,
        [attributionId2],
        0,
      ),
    });
  });

  it('sorts attributions alphabetically', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      packageName: 'b',
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
      packageName: 'a',
    });

    const attributions = getFilteredAttributions({
      selectedFilters: [],
      sorting: text.sortings.name,
      search: '',
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

    expect(Object.keys(attributions)).toEqual<Array<string>>([
      attributionId2,
      attributionId1,
    ]);
  });

  it('sorts attributions by criticality', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      criticality: Criticality.Medium,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
      criticality: Criticality.High,
    });

    const attributions = getFilteredAttributions({
      selectedFilters: [],
      sorting: text.sortings.criticality,
      search: '',
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

    expect(Object.keys(attributions)).toEqual<Array<string>>([
      attributionId2,
      attributionId1,
    ]);
  });

  it('sorts attributions by frequency', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: [],
      sorting: text.sortings.occurrence,
      search: '',
      manualData: faker.opossum.manualAttributionData({
        attributions: faker.opossum.manualAttributions({
          [attributionId1]: packageInfo1,
          [attributionId2]: packageInfo2,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [faker.opossum.filePath()]: [attributionId1, attributionId2],
        }),
        attributionsToResources: faker.opossum.attributionsToResources({
          [attributionId2]: [
            faker.opossum.filePath(),
            faker.opossum.filePath(),
          ],
        }),
      }),
    });

    expect(Object.keys(attributions)).toEqual<Array<string>>([
      attributionId2,
      attributionId1,
    ]);
  });

  it('returns filtered attributions based on search term', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: [],
      sorting: text.sortings.name,
      search: packageInfo1.packageName!,
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

    expect(attributions).toEqual<DisplayPackageInfos>({
      [attributionId1]: convertPackageInfoToDisplayPackageInfo(
        packageInfo1,
        [attributionId1],
        0,
      ),
    });
  });

  it('returns filtered attributions with needs-follow-up filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      followUp: 'FOLLOW_UP',
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: [text.filters.needsFollowUp],
      sorting: text.sortings.name,
      search: '',
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

    expect(attributions).toEqual<DisplayPackageInfos>({
      [attributionId1]: convertPackageInfoToDisplayPackageInfo(
        packageInfo1,
        [attributionId1],
        0,
      ),
    });
  });

  it('returns filtered attributions with pre-selected filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      preSelected: true,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: [text.filters.preSelected],
      sorting: text.sortings.name,
      search: '',
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

    expect(attributions).toEqual<DisplayPackageInfos>({
      [attributionId1]: convertPackageInfoToDisplayPackageInfo(
        packageInfo1,
        [attributionId1],
        0,
      ),
    });
  });

  it('returns filtered attributions with excluded-from-notice filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      excludeFromNotice: true,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: [text.filters.excludedFromNotice],
      sorting: text.sortings.name,
      search: '',
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

    expect(attributions).toEqual<DisplayPackageInfos>({
      [attributionId1]: convertPackageInfoToDisplayPackageInfo(
        packageInfo1,
        [attributionId1],
        0,
      ),
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
      selectedFilters: [text.filters.lowConfidence],
      sorting: text.sortings.name,
      search: '',
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

    expect(attributions).toEqual<DisplayPackageInfos>({
      [attributionId1]: convertPackageInfoToDisplayPackageInfo(
        packageInfo1,
        [attributionId1],
        0,
      ),
    });
  });

  it('returns filtered attributions with first-party filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      firstParty: true,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: [text.filters.firstParty],
      sorting: text.sortings.name,
      search: '',
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

    expect(attributions).toEqual<DisplayPackageInfos>({
      [attributionId1]: convertPackageInfoToDisplayPackageInfo(
        packageInfo1,
        [attributionId1],
        0,
      ),
    });
  });

  it('returns filtered attributions with third-party filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      firstParty: true,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: [text.filters.thirdParty],
      sorting: text.sortings.name,
      search: '',
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

    expect(attributions).toEqual<DisplayPackageInfos>({
      [attributionId2]: convertPackageInfoToDisplayPackageInfo(
        packageInfo2,
        [attributionId2],
        0,
      ),
    });
  });

  it('returns filtered attributions with needs-review-by-QA filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      needsReview: true,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: [text.filters.needsReview],
      sorting: text.sortings.name,
      search: '',
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

    expect(attributions).toEqual<DisplayPackageInfos>({
      [attributionId1]: convertPackageInfoToDisplayPackageInfo(
        packageInfo1,
        [attributionId1],
        0,
      ),
    });
  });

  it('returns filtered attributions with currently-preferred filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      preferred: true,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: [text.filters.currentlyPreferred],
      sorting: text.sortings.name,
      search: '',
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

    expect(attributions).toEqual<DisplayPackageInfos>({
      [attributionId1]: convertPackageInfoToDisplayPackageInfo(
        packageInfo1,
        [attributionId1],
        0,
      ),
    });
  });

  it('returns filtered attributions with previously-preferred filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      wasPreferred: true,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: [text.filters.previouslyPreferred],
      sorting: text.sortings.name,
      search: '',
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

    expect(attributions).toEqual<DisplayPackageInfos>({
      [attributionId1]: convertPackageInfoToDisplayPackageInfo(
        packageInfo1,
        [attributionId1],
        0,
      ),
    });
  });

  it('returns filtered attributions with incomplete-attribution filter', () => {
    const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
      packageName: undefined,
    });
    const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();

    const attributions = getFilteredAttributions({
      selectedFilters: [text.filters.incomplete],
      sorting: text.sortings.name,
      search: '',
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

    expect(attributions).toEqual<DisplayPackageInfos>({
      [attributionId1]: convertPackageInfoToDisplayPackageInfo(
        packageInfo1,
        [attributionId1],
        0,
      ),
    });
  });
});
