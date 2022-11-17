// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  aggregateAttributionPropertiesFromAttributions,
  aggregateLicensesAndSourcesFromAttributions,
  ATTRIBUTION_TOTAL,
  AttributionCountPerSourcePerLicense,
  getAttributionPropertyDisplayNameFromId,
  getColorsForPieChart,
  getCriticalSignalsCount,
  getIncompleteAttributionsCount,
  getLicenseCriticality,
  getMostFrequentLicenses,
  getUniqueLicenseNameToAttribution,
  LicenseNamesWithCriticality,
} from '../project-statistics-popup-helpers';
import {
  Attributions,
  Criticality,
  ExternalAttributionSources,
  FollowUp,
} from '../../../../shared/shared-types';
import { OpossumColors } from '../../../shared-styles';
import { ProjectStatisticsPopupTitle } from '../../../enums/enums';
import { PieChartData } from '../../PieChart/PieChart';

const testAttributions_1: Attributions = {
  uuid1: {
    source: {
      name: 'SC',
      documentConfidence: 10,
    },
    criticality: Criticality.Medium,
    licenseName: 'Apache License Version 2.0',
    firstParty: true,
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
    const expectedAttributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense =
      {
        'Apache License Version 2.0': { ScanCode: 1, reuser: 2, Total: 3 },
        'The MIT License (MIT)': { ScanCode: 2, reuser: 1, Total: 3 },
        Total: { ScanCode: 3, reuser: 3, Total: 6 },
      };
    const expectedLicenseNamesWithCriticality: LicenseNamesWithCriticality = {
      'Apache License Version 2.0': Criticality.High,
      'The MIT License (MIT)': undefined,
    };

    const strippedLicenseNameToAttribution =
      getUniqueLicenseNameToAttribution(testAttributions_1);
    const { attributionCountPerSourcePerLicense, licenseNamesWithCriticality } =
      aggregateLicensesAndSourcesFromAttributions(
        testAttributions_1,
        strippedLicenseNameToAttribution,
        attributionSources
      );

    expect(attributionCountPerSourcePerLicense).toEqual(
      expectedAttributionCountPerSourcePerLicense
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

describe('getAttributionPropertyDisplayNameFromId', () => {
  it('gets valid property display name from property id', () => {
    const expectedDisplayName = 'First party';
    const propertyID = 'firstParty';

    const attributionPropertyDisplayName =
      getAttributionPropertyDisplayNameFromId(propertyID);

    expect(attributionPropertyDisplayName).toEqual(expectedDisplayName);
  });

  it('gets invalid display name as it is', () => {
    const expectedDisplayName = 'random';
    const propertyID = 'random';

    const attributionPropertyDisplayName =
      getAttributionPropertyDisplayNameFromId(propertyID);

    expect(attributionPropertyDisplayName).toEqual(expectedDisplayName);
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
    const attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense =
      {
        'Apache License Version 2.0': {
          ScanCode: 1,
          HC: 1,
          reuser: 1,
          Total: 3,
        },
        'The MIT License (MIT)': { reuser: 1, ScanCode: 1, Total: 2 },
        Total: { ScanCode: 2, HC: 1, reuser: 2, Total: 5 },
      };

    const sortedMostFrequentLicenses = getMostFrequentLicenses(
      attributionCountPerSourcePerLicense
    );

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
    const attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense =
      {
        'Apache License Version 2.0': { ScanCode: 1, reuser: 2, Total: 3 },
        'The MIT License (MIT)': { reuser: 1, ScanCode: 1, Total: 2 },
        'Apache License Version 1.0': { ScanCode: 1, Total: 1 },
        'Apache License Version 1.0.1': { ScanCode: 1, Total: 1 },
        'Apache License Version 1.0.0.1': { ScanCode: 1, Total: 1 },
        'Apache License Version 1.0.0.0.1': { ScanCode: 1, Total: 1 },
        Total: { ScanCode: 6, reuser: 3, Total: 9 },
      };

    const sortedMostFrequentLicenses = getMostFrequentLicenses(
      attributionCountPerSourcePerLicense
    );

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
    const attributionCountPerSourcePerLicense: AttributionCountPerSourcePerLicense =
      {
        'Apache License Version 2.0': { ScanCode: 1, reuser: 2, Total: 3 },
        'The MIT License (MIT)': { reuser: 1, ScanCode: 1, Total: 2 },
        'Apache License Version 1.0': { ScanCode: 1, Total: 1 },
        'Apache License Version 1.0.1': { ScanCode: 1, Total: 1 },
        'Apache License Version 1.0.0.1': { ScanCode: 1, Total: 1 },
        'Apache License Version 1.0.0.0.1': { ScanCode: 1, Total: 1 },
        Total: { ScanCode: 6, reuser: 3, Total: 9 },
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
      attributionCountPerSourcePerLicense,
      licenseNamesWithCriticality
    );

    expect(criticalSignalsCount).toEqual(expectedCriticalSignalCount);
  });
});

describe('getColorsForPieChart', () => {
  it('obtains pie chart colors for critical signals pie chart', () => {
    const expectedPieChartColors = [
      OpossumColors.orange,
      OpossumColors.mediumOrange,
      OpossumColors.darkBlue,
    ];
    const criticalSignalsCount: Array<PieChartData> = [
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

    const pieChartColors = getColorsForPieChart(
      criticalSignalsCount,
      ProjectStatisticsPopupTitle.CriticalSignalsCountPieChart
    );

    expect(pieChartColors).toEqual(expectedPieChartColors);
  });

  it('obtains undefined pie chart colors for default case', () => {
    const expectedPieChartColors = undefined;
    const sortedMostFrequentLicenses: Array<PieChartData> = [
      {
        name: 'Apache License Version 2.0',
        count: 3,
      },
      {
        name: 'The MIT License (MIT)',
        count: 3,
      },
    ];

    const pieChartColors = getColorsForPieChart(
      sortedMostFrequentLicenses,
      ProjectStatisticsPopupTitle.MostFrequentLicenseCountPieChart
    );

    expect(pieChartColors).toEqual(expectedPieChartColors);
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
