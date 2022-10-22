// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  aggregateAttributionPropertiesFromAttributions,
  aggregateLicensesAndSourcesFromAttributions,
  getCriticalSignalsCount,
  getIncompleteAttributions,
  getMostFrequentLicenses,
  getUniqueLicenseNameToAttribution,
} from '../project-statistics-popup-helpers';
import {
  Attributions,
  Criticality,
  FollowUp,
} from '../../../../shared/shared-types';

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
    firstParty: true,
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

const testAttributions_3: Attributions = {
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
    criticality: Criticality.Medium,
    licenseName: 'Apache License Version 1.0',
    firstParty: true,
  },
  uuid7: {
    source: {
      name: 'SC',
      documentConfidence: 10,
    },
    criticality: Criticality.Medium,
    licenseName: 'Apache License Version 1.0.1',
    firstParty: true,
  },
  uuid8: {
    source: {
      name: 'SC',
      documentConfidence: 10,
    },
    criticality: Criticality.Medium,
    licenseName: 'Apache License Version 1.0.0.1',
    firstParty: true,
  },
  uuid9: {
    source: {
      name: 'SC',
      documentConfidence: 10,
    },
    criticality: Criticality.Medium,
    licenseName: 'Apache License Version 1.0.0.0.1',
    firstParty: true,
  },
};

const attributionSources = {
  SC: {
    name: 'ScanCode',
    priority: 2,
  },
};

describe('The ProjectStatisticsPopup helper', () => {
  it('counts most frequent licenses - testAttributions_1', () => {
    const expectedSortedMostFrequentLicenses = [
      {
        name: 'Apache License Version 2.0',
        count: 3,
      },
      {
        name: 'The MIT License (MIT)',
        count: 3,
      },
    ];

    const strippedLicenseNameToAttribution =
      getUniqueLicenseNameToAttribution(testAttributions_1);
    const { attributionCountPerSourcePerLicense } =
      aggregateLicensesAndSourcesFromAttributions(
        testAttributions_1,
        strippedLicenseNameToAttribution,
        attributionSources
      );
    const sortedMostFrequentLicenses = getMostFrequentLicenses(
      attributionCountPerSourcePerLicense
    );

    expect(sortedMostFrequentLicenses).toEqual(
      expectedSortedMostFrequentLicenses
    );
  });

  it('counts most frequent licenses - testAttributions_2', () => {
    const expectedSortedMostFrequentLicenses = [
      {
        name: 'Apache License Version 2.0',
        count: 3,
      },
      {
        name: 'The MIT License (MIT)',
        count: 2,
      },
    ];

    const strippedLicenseNameToAttribution =
      getUniqueLicenseNameToAttribution(testAttributions_2);
    const { attributionCountPerSourcePerLicense } =
      aggregateLicensesAndSourcesFromAttributions(
        testAttributions_2,
        strippedLicenseNameToAttribution,
        attributionSources
      );
    const sortedMostFrequentLicenses = getMostFrequentLicenses(
      attributionCountPerSourcePerLicense
    );

    expect(sortedMostFrequentLicenses).toEqual(
      expectedSortedMostFrequentLicenses
    );
  });

  it('counts most frequent licenses - testAttributions_3', () => {
    const expectedSortedMostFrequentLicenses = [
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

    const strippedLicenseNameToAttribution =
      getUniqueLicenseNameToAttribution(testAttributions_3);
    const { attributionCountPerSourcePerLicense } =
      aggregateLicensesAndSourcesFromAttributions(
        testAttributions_3,
        strippedLicenseNameToAttribution,
        attributionSources
      );
    const sortedMostFrequentLicenses = getMostFrequentLicenses(
      attributionCountPerSourcePerLicense
    );

    expect(sortedMostFrequentLicenses).toEqual(
      expectedSortedMostFrequentLicenses
    );
  });

  it('aggregates attributions by stripped license names - testAttributions_1', () => {
    const expectedStrippedLicenseNameToAttribution = {
      'apachelicenseversion2.0': ['uuid1', 'uuid2', 'uuid3'],
      'themitlicense(mit)': ['uuid4', 'uuid5', 'uuid6'],
    };

    const strippedLicenseNameToAttribution =
      getUniqueLicenseNameToAttribution(testAttributions_1);

    expect(strippedLicenseNameToAttribution).toEqual(
      expectedStrippedLicenseNameToAttribution
    );
  });

  it('aggregates attributions by stripped license names - testAttributions_2', () => {
    const expectedStrippedLicenseNameToAttribution = {
      'apachelicenseversion2.0': ['uuid1', 'uuid3', 'uuid4'],
      'themitlicense(mit)': ['uuid2', 'uuid5'],
    };

    const strippedLicenseNameToAttribution =
      getUniqueLicenseNameToAttribution(testAttributions_2);

    expect(strippedLicenseNameToAttribution).toEqual(
      expectedStrippedLicenseNameToAttribution
    );
  });

  it('counts sources for licenses, criticality - testAttributions_1', () => {
    const expectedAttributionCountPerSourcePerLicense = {
      'Apache License Version 2.0': { ScanCode: 1, reuser: 2, Total: 3 },
      'The MIT License (MIT)': { ScanCode: 2, reuser: 1, Total: 3 },
      Total: { ScanCode: 3, reuser: 3, Total: 6 },
    };
    const expectedLicenseNamesWithCriticality = {
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

  it('counts sources for licenses, criticality - testAttributions_2', () => {
    const expectedAttributionCountPerSourcePerLicense = {
      'Apache License Version 2.0': { ScanCode: 1, reuser: 1, HC: 1, Total: 3 },
      'The MIT License (MIT)': { ScanCode: 1, reuser: 1, Total: 2 },
      Total: { ScanCode: 2, reuser: 2, HC: 1, Total: 5 },
    };
    const expectedLicenseNamesWithCriticality = {
      'Apache License Version 2.0': Criticality.Medium,
      'The MIT License (MIT)': undefined,
    };

    const strippedLicenseNameToAttribution =
      getUniqueLicenseNameToAttribution(testAttributions_2);
    const { attributionCountPerSourcePerLicense, licenseNamesWithCriticality } =
      aggregateLicensesAndSourcesFromAttributions(
        testAttributions_2,
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

  it('counts sources for licenses, criticalities - testAttributions_1', () => {
    const expectedSortedMostFrequentLicenses = [
      {
        name: 'Apache License Version 2.0',
        count: 3,
      },
      {
        name: 'The MIT License (MIT)',
        count: 3,
      },
    ];

    const strippedLicenseNameToAttribution =
      getUniqueLicenseNameToAttribution(testAttributions_1);
    const { attributionCountPerSourcePerLicense } =
      aggregateLicensesAndSourcesFromAttributions(
        testAttributions_1,
        strippedLicenseNameToAttribution,
        attributionSources
      );
    const sortedMostFrequentLicenses = getMostFrequentLicenses(
      attributionCountPerSourcePerLicense
    );
    expect(sortedMostFrequentLicenses).toEqual(
      expectedSortedMostFrequentLicenses
    );
  });

  it('counts sources for licenses, criticalities - testAttributions_1', () => {
    const expectedSortedMostFrequentLicenses = [
      {
        name: 'Apache License Version 2.0',
        count: 3,
      },
      {
        name: 'The MIT License (MIT)',
        count: 3,
      },
    ];

    const strippedLicenseNameToAttribution =
      getUniqueLicenseNameToAttribution(testAttributions_1);
    const { attributionCountPerSourcePerLicense } =
      aggregateLicensesAndSourcesFromAttributions(
        testAttributions_1,
        strippedLicenseNameToAttribution,
        attributionSources
      );
    const sortedMostFrequentLicenses = getMostFrequentLicenses(
      attributionCountPerSourcePerLicense
    );
    expect(sortedMostFrequentLicenses).toEqual(
      expectedSortedMostFrequentLicenses
    );
  });

  it('counts number of critical signals across all licenses - testAttributions_3', () => {
    const expectedCriticalSignalCount = [
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

    const strippedLicenseNameToAttribution =
      getUniqueLicenseNameToAttribution(testAttributions_3);
    const { attributionCountPerSourcePerLicense, licenseNamesWithCriticality } =
      aggregateLicensesAndSourcesFromAttributions(
        testAttributions_3,
        strippedLicenseNameToAttribution,
        attributionSources
      );
    const criticalSignalsCount = getCriticalSignalsCount(
      attributionCountPerSourcePerLicense,
      licenseNamesWithCriticality
    );
    expect(criticalSignalsCount).toEqual(expectedCriticalSignalCount);
  });

  it('counts complete and incomplete attributions', () => {
    const expectedIncompleteAttributionCount = [
      {
        name: 'Complete attributions',
        count: 2,
      },
      {
        name: 'Incomplete attributions',
        count: 3,
      },
    ];

    const incompleteAttributionCount = getIncompleteAttributions(5, 3);
    expect(incompleteAttributionCount).toEqual(
      expectedIncompleteAttributionCount
    );
  });

  it('counts only incomplete attributions', () => {
    const expectedIncompleteAttributionCount = [
      {
        name: 'Incomplete attributions',
        count: 3,
      },
    ];

    const incompleteAttributionCount = getIncompleteAttributions(3, 3);
    expect(incompleteAttributionCount).toEqual(
      expectedIncompleteAttributionCount
    );
  });

  it('counts attribution properties - testAttributions_1', () => {
    const expectedAttributionPropertyCounts = {
      followUp: 1,
      firstParty: 2,
      'Total Attributions': 6,
    };

    const attributionPropertyCounts =
      aggregateAttributionPropertiesFromAttributions(
        Object.values(testAttributions_1)
      );

    expect(attributionPropertyCounts).toEqual(
      expectedAttributionPropertyCounts
    );
  });

  it('counts attribution properties - testAttributions_2', () => {
    const expectedAttributionPropertyCounts = {
      followUp: 0,
      firstParty: 1,
      'Total Attributions': 5,
    };

    const attributionPropertyCounts =
      aggregateAttributionPropertiesFromAttributions(
        Object.values(testAttributions_2)
      );

    expect(attributionPropertyCounts).toEqual(
      expectedAttributionPropertyCounts
    );
  });
});
