// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  Criticality,
  ExternalAttributionSources,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import {
  ChartDataItem,
  LicenseCounts,
  LicenseNamesWithCriticality,
} from '../../../types/types';
import {
  aggregateAttributionPropertiesFromAttributions,
  aggregateLicensesAndSourcesFromAttributions,
  CRITICALITY_LABEL,
  getCriticalSignalsCount,
  getIncompleteAttributionsCount,
  getMostFrequentLicenses,
  getStrippedLicenseName,
} from '../ProjectStatisticsPopup.util';

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
    id: 'uuid1',
  },
  uuid2: {
    source: {
      name: 'reuser',
      documentConfidence: 90,
    },
    criticality: Criticality.High,
    licenseName: 'Apache License Version 2.0',
    id: 'uuid2',
  },
  uuid3: {
    source: {
      name: 'reuser',
      documentConfidence: 90,
    },
    criticality: Criticality.None,
    licenseName: ' Apache license version-2.0 ',
    followUp: true,
    needsReview: true,
    id: 'uuid3',
  },
  uuid4: {
    source: {
      name: 'reuser',
      documentConfidence: 90,
    },
    criticality: Criticality.None,
    licenseName: ' The-MIT-License (MIT) ',
    id: 'uuid4',
  },
  uuid5: {
    source: {
      name: 'SC',
      documentConfidence: 10,
    },
    criticality: Criticality.None,
    licenseName: 'The MIT License (MIT)',
    id: 'uuid5',
  },
  uuid6: {
    source: {
      name: 'SC',
      documentConfidence: 10,
    },
    criticality: Criticality.None,
    licenseName: 'The MIT License (MIT)',
    firstParty: true,
    id: 'uuid6',
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
    id: 'uuid1',
  },
  uuid2: {
    source: {
      name: 'reuser',
      documentConfidence: 90,
    },
    criticality: Criticality.Medium,
    licenseName: 'The MIT License (MIT)',
    id: 'uuid2',
  },
  uuid3: {
    source: {
      name: 'HC',
      documentConfidence: 90,
    },
    criticality: Criticality.None,
    licenseName: 'apache license version-2.0 ',
    id: 'uuid3',
  },
  uuid4: {
    source: {
      name: 'reuser',
      documentConfidence: 90,
    },
    criticality: Criticality.Medium,
    licenseName: 'Apache License Version 2.0',
    id: 'uuid4',
  },
  uuid5: {
    source: {
      name: 'SC',
      documentConfidence: 10,
    },
    criticality: Criticality.None,
    licenseName: 'The MIT License (MIT)',
    id: 'uuid5',
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
      'The MIT License (MIT)': Criticality.None,
    };

    const { licenseCounts, licenseNamesWithCriticality } =
      aggregateLicensesAndSourcesFromAttributions(
        testAttributions_1,
        attributionSources,
      );

    expect(licenseCounts.attributionCountPerSourcePerLicense).toEqual(
      expectedAttributionCountPerSourcePerLicense,
    );
    expect(licenseCounts.totalAttributionsPerSource).toEqual(
      expectedTotalAttributionsPerSource,
    );
    expect(licenseCounts.totalAttributionsPerLicense).toEqual(
      expectedTotalAttributionsPerLicense,
    );
    expect(licenseNamesWithCriticality).toEqual(
      expectedLicenseNamesWithCriticality,
    );
  });
});

describe('getStrippedLicenseName', () => {
  it.each`
    licenseName
    ${'apache2.0'}
    ${'apache 2.0'}
    ${'Apache 2.0'}
    ${'Apache\t2.0'}
    ${'Apache\n2.0'}
    ${'Apache-2.0'}
    ${'Apache - 2.0'}
  `('converts $licenseName to apache2.0', ({ licenseName }) => {
    expect(getStrippedLicenseName(licenseName)).toBe('apache2.0');
  });

  it.each`
    licenseName
    ${'Apache_2.0'}
    ${'apache2'}
    ${'Apache 2'}
    ${'Apache 2.0.0'}
    ${'Apache License Version 2.0'}
  `('does not convert $licenseName to apache2.0', ({ licenseName }) => {
    expect(getStrippedLicenseName(licenseName)).not.toBe('apache2.0');
  });
});

describe('aggregateAttributionPropertiesFromAttributions', () => {
  it('counts attribution properties', () => {
    const attributionPropertiesText =
      text.projectStatisticsPopup.charts.attributionProperties;

    const expectedAttributionPropertyCounts = [
      {
        name: attributionPropertiesText.needsReview,
        count: 2,
      },
      {
        name: attributionPropertiesText.followUp,
        count: 1,
      },
      {
        name: attributionPropertiesText.firstParty,
        count: 2,
      },
      {
        name: attributionPropertiesText.incomplete,
        count: 4,
      },
      {
        name: attributionPropertiesText.total,
        count: 6,
      },
    ];

    const attributionPropertyCounts =
      aggregateAttributionPropertiesFromAttributions(testAttributions_1);

    expect(attributionPropertyCounts).toEqual(
      expectedAttributionPropertyCounts,
    );
  });

  it('finds no follow up and first party attributions', () => {
    const attributionPropertiesText =
      text.projectStatisticsPopup.charts.attributionProperties;

    const expectedAttributionPropertyCounts = [
      {
        name: attributionPropertiesText.needsReview,
        count: 0,
      },
      {
        name: attributionPropertiesText.followUp,
        count: 0,
      },
      {
        name: attributionPropertiesText.firstParty,
        count: 0,
      },
      {
        name: attributionPropertiesText.incomplete,
        count: 5,
      },
      {
        name: attributionPropertiesText.total,
        count: 5,
      },
    ];

    const attributionPropertyCounts =
      aggregateAttributionPropertiesFromAttributions(testAttributions_2);

    expect(attributionPropertyCounts).toEqual(
      expectedAttributionPropertyCounts,
    );
  });
});

describe('getMostFrequentLicenses', () => {
  it('obtains most frequent licenses without other accumulation', () => {
    const expectedSortedMostFrequentLicenses: Array<ChartDataItem> = [
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
      expectedSortedMostFrequentLicenses,
    );
  });

  it('obtains most frequent licenses with other accumulation', () => {
    const expectedSortedMostFrequentLicenses: Array<ChartDataItem> = [
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
      expectedSortedMostFrequentLicenses,
    );
  });
});

describe('getCriticalSignalsCount', () => {
  it('counts number of critical signals across all licenses', () => {
    const expectedCriticalSignalCount = [
      {
        name: CRITICALITY_LABEL[Criticality.High],
        count: 3,
      },
      {
        name: CRITICALITY_LABEL[Criticality.Medium],
        count: 4,
      },
      {
        name: CRITICALITY_LABEL[Criticality.None],
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
      'The MIT License (MIT)': Criticality.None,
      'Apache License Version 1.0': Criticality.Medium,
      'Apache License Version 1.0.1': Criticality.Medium,
      'Apache License Version 1.0.0.1': Criticality.Medium,
      'Apache License Version 1.0.0.0.1': Criticality.Medium,
    };

    const criticalSignalsCount = getCriticalSignalsCount(
      licenseCounts,
      licenseNamesWithCriticality,
    );

    expect(criticalSignalsCount).toEqual(expectedCriticalSignalCount);
  });
});

describe('getIncompleteAttributionsCount', () => {
  it('counts complete and incomplete attributions', () => {
    const expectedIncompleteAttributionCount: Array<ChartDataItem> = [
      {
        name: text.projectStatisticsPopup.charts.incompleteAttributionsPieChart
          .completeAttributions,
        count: 2,
      },
      {
        name: text.projectStatisticsPopup.charts.incompleteAttributionsPieChart
          .incompleteAttributions,
        count: 4,
      },
    ];

    const incompleteAttributionCount =
      getIncompleteAttributionsCount(testAttributions_1);

    expect(incompleteAttributionCount).toEqual(
      expectedIncompleteAttributionCount,
    );
  });

  it('counts only incomplete attributions', () => {
    const expectedIncompleteAttributionCount: Array<ChartDataItem> = [
      {
        name: text.projectStatisticsPopup.charts.incompleteAttributionsPieChart
          .incompleteAttributions,
        count: 5,
      },
    ];

    const incompleteAttributionCount =
      getIncompleteAttributionsCount(testAttributions_2);

    expect(incompleteAttributionCount).toEqual(
      expectedIncompleteAttributionCount,
    );
  });
});
