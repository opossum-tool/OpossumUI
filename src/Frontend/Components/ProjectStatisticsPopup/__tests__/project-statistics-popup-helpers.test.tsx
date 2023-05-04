// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  aggregateAttributionPropertiesFromAttributions,
  aggregateLicensesAndSourcesFromAttributions,
  ATTRIBUTION_TOTAL,
  getCriticalSignalsCount,
  getIncompleteAttributionsCount,
  getLicenseCriticality,
  getMostFrequentLicenses,
  getUniqueLicenseNameToAttribution,
} from '../project-statistics-popup-helpers';
import {
  Attributions,
  Criticality,
  ExternalAttributionSources,
  FollowUp,
} from '../../../../shared/shared-types';
import {
  LicenseCounts,
  LicenseNamesWithCriticality,
  PieChartData,
} from '../../../types/types';

const testAttributions_1: Attributions = {
  uuid1: {
    source: {
      name: 'SC',
      documentConfidence: 10,
    },
    criticality: Criticality.Medium,
    licenseName: 'Apache License Version 2.0',
    firstParty: true,
    needsReview: true,
  },
  uuid2: {
    source: {
      name: 'reuser',
      documentConfidence: 90,
    },
    criticality: Criticality.High,
    licenseName: 'Apache License Version 2.0',
  },
  uuid3: {
    source: {
      name: 'reuser',
      documentConfidence: 90,
    },
    licenseName: ' Apache license version-2.0 ',
    followUp: FollowUp,
    needsReview: true,
  },
  uuid4: {
    source: {
      name: 'reuser',
      documentConfidence: 90,
    },
    licenseName: ' The-MIT-License (MIT) ',
  },
  uuid5: {
    source: {
      name: 'SC',
      documentConfidence: 10,
    },
    licenseName: 'The MIT License (MIT)',
  },
  uuid6: {
    source: {
      name: 'SC',
      documentConfidence: 10,
    },
    licenseName: 'The MIT License (MIT)',
    firstParty: true,
  },
};

const testAttributions_2: Attributions = {
  uuid1: {
    source: {
      name: 'SC',
      documentConfidence: 10,
    },
    criticality: Criticality.Medium,
    licenseName: 'Apache License Version 2.0',
  },
  uuid2: {
    source: {
      name: 'reuser',
      documentConfidence: 90,
    },
    criticality: Criticality.Medium,
    licenseName: 'The MIT License (MIT)',
  },
  uuid3: {
    source: {
      name: 'HC',
      documentConfidence: 90,
    },
    licenseName: 'apache license version-2.0 ',
  },
  uuid4: {
    source: {
      name: 'reuser',
      documentConfidence: 90,
    },
    criticality: Criticality.Medium,
    licenseName: 'Apache License Version 2.0',
  },
  uuid5: {
    source: {
      name: 'SC',
      documentConfidence: 10,
    },
    licenseName: 'The MIT License (MIT)',
  },
};

const attributionSources: ExternalAttributionSources = {
  SC: {
    name: 'ScanCode',
    priority: 2,
  },
};

describe('aggregateLicensesAndSourcesFromAttributions', () => {
  it('counts sources for licenses, criticality', () => {
    const expectedAttributionCountPerSourcePerLicense = {
      'Apache License Version 2.0': { ScanCode: 1, reuser: 2 },
      'The MIT License (MIT)': { ScanCode: 2, reuser: 1 },
    };
    const expectedTotalAttributionsPerSource = {
      ScanCode: 3,
      reuser: 3,
    };
    const expectedTotalAttributionsPerLicense = {
      'Apache License Version 2.0': 3,
      'The MIT License (MIT)': 3,
    };
    const expectedLicenseNamesWithCriticality: LicenseNamesWithCriticality = {
      'Apache License Version 2.0': Criticality.High,
      'The MIT License (MIT)': undefined,
    };

    const strippedLicenseNameToAttribution =
      getUniqueLicenseNameToAttribution(testAttributions_1);
    const { licenseCounts, licenseNamesWithCriticality } =
      aggregateLicensesAndSourcesFromAttributions(
        testAttributions_1,
        strippedLicenseNameToAttribution,
        attributionSources
      );

    expect(licenseCounts.attributionCountPerSourcePerLicense).toEqual(
      expectedAttributionCountPerSourcePerLicense
    );
    expect(licenseCounts.totalAttributionsPerSource).toEqual(
      expectedTotalAttributionsPerSource
    );
    expect(licenseCounts.totalAttributionsPerLicense).toEqual(
      expectedTotalAttributionsPerLicense
    );
    expect(licenseNamesWithCriticality).toEqual(
      expectedLicenseNamesWithCriticality
    );
  });
});

describe('getLicenseCriticality', () => {
  it('obtains undefined criticality', () => {
    const expectedLicenseCriticality: Criticality | undefined = undefined;
    const licenseCriticalityCounts = { high: 0, medium: 0, none: 5 };

    const licenseCriticality = getLicenseCriticality(licenseCriticalityCounts);

    expect(licenseCriticality).toEqual(expectedLicenseCriticality);
  });

  it('obtains medium criticality', () => {
    const expectedLicenseCriticality: Criticality | undefined =
      Criticality.Medium;
    const licenseCriticalityCounts = { high: 0, medium: 3, none: 2 };

    const licenseCriticality = getLicenseCriticality(licenseCriticalityCounts);

    expect(licenseCriticality).toEqual(expectedLicenseCriticality);
  });

  it('obtains high criticality', () => {
    const expectedLicenseCriticality: Criticality | undefined =
      Criticality.High;
    const licenseCriticalityCounts = { high: 1, medium: 3, none: 1 };

    const licenseCriticality = getLicenseCriticality(licenseCriticalityCounts);

    expect(licenseCriticality).toEqual(expectedLicenseCriticality);
  });
});

describe('aggregateAttributionPropertiesFromAttributions', () => {
  it('counts attribution properties, ensures total attributions is the last element', () => {
    const expectedAttributionPropertyCounts: {
      [attributionPropertyOrTotal: string]: number;
    } = {
      needsReview: 2,
      followUp: 1,
      firstParty: 2,
      incomplete: 4,
      [ATTRIBUTION_TOTAL]: 6,
    };

    const attributionPropertyCountsObject =
      aggregateAttributionPropertiesFromAttributions(testAttributions_1);
    const attributionPropertyCountsArray: Array<Array<string | number>> =
      Object.entries(attributionPropertyCountsObject);

    expect(attributionPropertyCountsObject).toEqual(
      expectedAttributionPropertyCounts
    );
    expect(
      attributionPropertyCountsArray[
        attributionPropertyCountsArray.length - 1
      ][0]
    ).toEqual(ATTRIBUTION_TOTAL);
  });

  it('finds no follow up and first party attributions, ensures total attributions is the last element', () => {
    const expectedAttributionPropertyCounts: {
      [attributionPropertyOrTotal: string]: number;
    } = {
      needsReview: 0,
      followUp: 0,
      firstParty: 0,
      incomplete: 5,
      [ATTRIBUTION_TOTAL]: 5,
    };

    const attributionPropertyCountsObject =
      aggregateAttributionPropertiesFromAttributions(testAttributions_2);
    const attributionPropertyCountsArray: Array<Array<string | number>> =
      Object.entries(attributionPropertyCountsObject);

    expect(attributionPropertyCountsObject).toEqual(
      expectedAttributionPropertyCounts
    );
    expect(
      attributionPropertyCountsArray[
        attributionPropertyCountsArray.length - 1
      ][0]
    ).toEqual(ATTRIBUTION_TOTAL);
  });
});

describe('getMostFrequentLicenses', () => {
  it('obtains most frequent licenses without other accumulation', () => {
    const expectedSortedMostFrequentLicenses: Array<PieChartData> = [
      {
        name: 'Apache License Version 2.0',
        count: 3,
      },
      {
        name: 'The MIT License (MIT)',
        count: 2,
      },
    ];
    const licenseCounts: LicenseCounts = {
      totalAttributionsPerLicense: {
        'Apache License Version 2.0': 3,
        'The MIT License (MIT)': 2,
      },
      totalAttributionsPerSource: { ScanCode: 2, HC: 1, reuser: 2 },
      attributionCountPerSourcePerLicense: {
        'Apache License Version 2.0': {
          ScanCode: 1,
          HC: 1,
          reuser: 1,
        },
        'The MIT License (MIT)': { reuser: 1, ScanCode: 1 },
      },
    };

    const sortedMostFrequentLicenses = getMostFrequentLicenses(licenseCounts);

    expect(sortedMostFrequentLicenses).toEqual(
      expectedSortedMostFrequentLicenses
    );
  });

  it('obtains most frequent licenses with other accumulation', () => {
    const expectedSortedMostFrequentLicenses: Array<PieChartData> = [
      {
        name: 'Apache License Version 2.0',
        count: 3,
      },
      {
        name: 'The MIT License (MIT)',
        count: 2,
      },
      {
        name: 'Apache License Version 1.0',
        count: 1,
      },
      {
        name: 'Apache License Version 1.0.1',
        count: 1,
      },
      {
        name: 'Apache License Version 1.0.0.1',
        count: 1,
      },
      {
        name: 'Other',
        count: 1,
      },
    ];
    const licenseCounts: LicenseCounts = {
      totalAttributionsPerLicense: {
        'Apache License Version 2.0': 3,
        'The MIT License (MIT)': 2,
        'Apache License Version 1.0': 1,
        'Apache License Version 1.0.1': 1,
        'Apache License Version 1.0.0.1': 1,
        'Apache License Version 1.0.0.0.1': 1,
      },
      totalAttributionsPerSource: { ScanCode: 6, reuser: 3 },
      attributionCountPerSourcePerLicense: {
        'Apache License Version 2.0': { ScanCode: 1, reuser: 2 },
        'The MIT License (MIT)': { reuser: 1, ScanCode: 1 },
        'Apache License Version 1.0': { ScanCode: 1 },
        'Apache License Version 1.0.1': { ScanCode: 1 },
        'Apache License Version 1.0.0.1': { ScanCode: 1 },
        'Apache License Version 1.0.0.0.1': { ScanCode: 1 },
      },
    };

    const sortedMostFrequentLicenses = getMostFrequentLicenses(licenseCounts);

    expect(sortedMostFrequentLicenses).toEqual(
      expectedSortedMostFrequentLicenses
    );
  });
});

describe('getCriticalSignalsCount', () => {
  it('counts number of critical signals across all licenses', () => {
    const expectedCriticalSignalCount: Array<PieChartData> = [
      {
        name: 'High',
        count: 3,
      },
      {
        name: 'Medium',
        count: 4,
      },
      {
        name: 'Not critical',
        count: 2,
      },
    ];
    const licenseCounts: LicenseCounts = {
      totalAttributionsPerLicense: {
        'Apache License Version 2.0': 3,
        'The MIT License (MIT)': 2,
        'Apache License Version 1.0': 1,
        'Apache License Version 1.0.1': 1,
        'Apache License Version 1.0.0.1': 1,
        'Apache License Version 1.0.0.0.1': 1,
      },
      totalAttributionsPerSource: { ScanCode: 6, reuser: 3 },
      attributionCountPerSourcePerLicense: {
        'Apache License Version 2.0': { ScanCode: 1, reuser: 2 },
        'The MIT License (MIT)': { reuser: 1, ScanCode: 1 },
        'Apache License Version 1.0': { ScanCode: 1 },
        'Apache License Version 1.0.1': { ScanCode: 1 },
        'Apache License Version 1.0.0.1': { ScanCode: 1 },
        'Apache License Version 1.0.0.0.1': { ScanCode: 1 },
      },
    };
    const licenseNamesWithCriticality: LicenseNamesWithCriticality = {
      'Apache License Version 2.0': Criticality.High,
      'The MIT License (MIT)': undefined,
      'Apache License Version 1.0': Criticality.Medium,
      'Apache License Version 1.0.1': Criticality.Medium,
      'Apache License Version 1.0.0.1': Criticality.Medium,
      'Apache License Version 1.0.0.0.1': Criticality.Medium,
    };

    const criticalSignalsCount = getCriticalSignalsCount(
      licenseCounts,
      licenseNamesWithCriticality
    );

    expect(criticalSignalsCount).toEqual(expectedCriticalSignalCount);
  });
});

describe('getIncompleteAttributionsCount', () => {
  it('counts complete and incomplete attributions', () => {
    const expectedIncompleteAttributionCount: Array<PieChartData> = [
      {
        name: 'Complete attributions',
        count: 2,
      },
      {
        name: 'Incomplete attributions',
        count: 4,
      },
    ];

    const incompleteAttributionCount =
      getIncompleteAttributionsCount(testAttributions_1);

    expect(incompleteAttributionCount).toEqual(
      expectedIncompleteAttributionCount
    );
  });

  it('counts only incomplete attributions', () => {
    const expectedIncompleteAttributionCount: Array<PieChartData> = [
      {
        name: 'Incomplete attributions',
        count: 5,
      },
    ];

    const incompleteAttributionCount =
      getIncompleteAttributionsCount(testAttributions_2);

    expect(incompleteAttributionCount).toEqual(
      expectedIncompleteAttributionCount
    );
  });
});
