// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  Criticality,
  DiscreteConfidence,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import {
  getHighestCriticalityOfExternalAttributions,
  getUpdatedProgressBarData,
  resourceHasOnlyPreSelectedAttributions,
} from '../progress-bar-data-helpers';

describe('The getUpdatedProgressBarData function', () => {
  it('gets updated progress data', () => {
    const testResources: Resources = {
      thirdParty: {
        package: {
          contents: {
            'readme.txt': 1,
          },
        },
        'package_1.tr.gz': 1,
        'package_2.tr.gz': 1,
      },
      root: {
        src: {
          'something.js': 1,
        },
        'readme.md': 1,
      },
    };
    const testManualAttributionUuid_1 = '4d9f0b16-fbff-11ea-adc1-0242ac120002';
    const testManualAttributionUuid_2 = 'b5da73d4-f400-11ea-adc1-0242ac120002';
    const testTemporaryDisplayPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'test Package',
      licenseText: ' test License text',
      id: testManualAttributionUuid_1,
    };
    const secondTestTemporaryDisplayPackageInfo: PackageInfo = {
      packageVersion: '2.0',
      packageName: 'not assigned test Package',
      licenseText: ' test not assigned License text',
      id: testManualAttributionUuid_2,
    };
    const testManualAttributions: Attributions = {
      [testManualAttributionUuid_1]: testTemporaryDisplayPackageInfo,
      [testManualAttributionUuid_2]: secondTestTemporaryDisplayPackageInfo,
    };

    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/root/src/something.js': [testManualAttributionUuid_1],
    };

    const testHighlyCriticalExternalAttributionUuid =
      'fc1d0a3e-be99-4b61-b240-49a2cca3aa21';
    const testMediumCriticalExternalAttributionUuid =
      'd5f35f44-0659-4b8b-a4a0-5741c0c23200';
    const highlyCriticalExternalAttributionPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'highly critical Package',
      licenseText: ' test highly critical Package License text',
      criticality: Criticality.High,
      id: testHighlyCriticalExternalAttributionUuid,
    };
    const mediumCriticalExternalAttributionPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'medium critical Package',
      licenseText: ' test medium critical Package License text',
      criticality: Criticality.Medium,
      id: testMediumCriticalExternalAttributionUuid,
    };
    const testExternalAttributions: Attributions = {
      [testHighlyCriticalExternalAttributionUuid]:
        highlyCriticalExternalAttributionPackageInfo,
      [testMediumCriticalExternalAttributionUuid]:
        mediumCriticalExternalAttributionPackageInfo,
    };

    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/root/src/something.js': [
        testHighlyCriticalExternalAttributionUuid,
        testMediumCriticalExternalAttributionUuid,
      ],
      '/thirdParty/package_1.tr.gz': [
        testHighlyCriticalExternalAttributionUuid,
      ],
      '/thirdParty/package_2.tr.gz': [
        testMediumCriticalExternalAttributionUuid,
      ],
      '/thirdParty/package/': [testMediumCriticalExternalAttributionUuid],
    };

    const progressBarData = getUpdatedProgressBarData({
      resources: testResources,
      manualAttributions: testManualAttributions,
      externalAttributions: testExternalAttributions,
      resourcesToManualAttributions: testResourcesToManualAttributions,
      resourcesToExternalAttributions: testResourcesToExternalAttributions,
      resolvedExternalAttributions: new Set<string>(),
      attributionBreakpoints: new Set<string>(),
      filesWithChildren: new Set<string>(),
    });
    const expectedNumberOfFiles = 5;
    const expectedNumberOfFilesWithOnlyExternalAttribution = 3;
    expect(progressBarData.fileCount).toEqual(expectedNumberOfFiles);
    expect(progressBarData.filesWithManualAttributionCount).toBe(1);
    expect(progressBarData.filesWithOnlyExternalAttributionCount).toEqual(
      expectedNumberOfFilesWithOnlyExternalAttribution,
    );
    expect(
      progressBarData.resourcesWithNonInheritedExternalAttributionOnly,
    ).toEqual([
      '/thirdParty/package/',
      '/thirdParty/package_1.tr.gz',
      '/thirdParty/package_2.tr.gz',
    ]);
    expect(
      progressBarData.filesWithHighlyCriticalExternalAttributionsCount,
    ).toBe(1);
    expect(
      progressBarData.resourcesWithHighlyCriticalExternalAttributions,
    ).toEqual(['/thirdParty/package_1.tr.gz']);
    expect(
      progressBarData.filesWithMediumCriticalExternalAttributionsCount,
    ).toBe(1);
    expect(
      progressBarData.resourcesWithMediumCriticalExternalAttributions,
    ).toEqual(['/thirdParty/package/', '/thirdParty/package_2.tr.gz']);
  });

  it('gets updated progress data without resolved external attributions', () => {
    const testResources: Resources = {
      thirdParty: {
        'package_1.tr.gz': 1,
        'package_2.tr.gz': 1,
      },
      root: {
        src: {
          'something.js': 1,
        },
        'readme.md': 1,
      },
    };

    const testManualAttributionUuid_1 = '4d9f0b16-fbff-11ea-adc1-0242ac120002';
    const testManualAttributionUuid_2 = 'b5da73d4-f400-11ea-adc1-0242ac120002';
    const testTemporaryDisplayPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'test Package',
      licenseText: ' test License text',
      id: testManualAttributionUuid_1,
    };
    const secondTestTemporaryDisplayPackageInfo: PackageInfo = {
      packageVersion: '2.0',
      packageName: 'not assigned test Package',
      licenseText: ' test not assigned License text',
      id: testManualAttributionUuid_2,
    };
    const testManualAttributions: Attributions = {
      [testManualAttributionUuid_1]: testTemporaryDisplayPackageInfo,
      [testManualAttributionUuid_2]: secondTestTemporaryDisplayPackageInfo,
    };

    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/root/src/something.js': [testManualAttributionUuid_1],
    };

    const testHighlyCriticalExternalAttributionUuid =
      'fc1d0a3e-be99-4b61-b240-49a2cca3aa21';
    const testMediumCriticalExternalAttributionUuid =
      'd5f35f44-0659-4b8b-a4a0-5741c0c23200';
    const highlyCriticalExternalAttributionPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'highly critical Package',
      licenseText: ' test highly critical Package License text',
      criticality: Criticality.High,
      id: testHighlyCriticalExternalAttributionUuid,
    };
    const mediumCriticalExternalAttributionPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'medium critical Package',
      licenseText: ' test medium critical Package License text',
      criticality: Criticality.Medium,
      id: testMediumCriticalExternalAttributionUuid,
    };
    const testExternalAttributions: Attributions = {
      [testHighlyCriticalExternalAttributionUuid]:
        highlyCriticalExternalAttributionPackageInfo,
      [testMediumCriticalExternalAttributionUuid]:
        mediumCriticalExternalAttributionPackageInfo,
    };

    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/root/src/something.js': [
        testHighlyCriticalExternalAttributionUuid,
        testMediumCriticalExternalAttributionUuid,
      ],
      '/thirdParty/package_1.tr.gz': [
        testHighlyCriticalExternalAttributionUuid,
      ],
      '/thirdParty/package_2.tr.gz': [
        testMediumCriticalExternalAttributionUuid,
      ],
    };
    const testResolvedExternalAttributions: Set<string> = new Set<string>([
      testMediumCriticalExternalAttributionUuid,
    ]);

    const progressBarData = getUpdatedProgressBarData({
      resources: testResources,
      manualAttributions: testManualAttributions,
      externalAttributions: testExternalAttributions,
      resourcesToManualAttributions: testResourcesToManualAttributions,
      resourcesToExternalAttributions: testResourcesToExternalAttributions,
      resolvedExternalAttributions: testResolvedExternalAttributions,
      attributionBreakpoints: new Set<string>(),
      filesWithChildren: new Set<string>(),
    });
    const expectedNumberOfFiles = 4;
    expect(progressBarData.fileCount).toEqual(expectedNumberOfFiles);
    expect(progressBarData.filesWithManualAttributionCount).toBe(1);
    expect(progressBarData.filesWithOnlyExternalAttributionCount).toBe(1);
    expect(
      progressBarData.resourcesWithNonInheritedExternalAttributionOnly,
    ).toEqual(['/thirdParty/package_1.tr.gz']);
  });

  it('stops inferring attributions at breakpoints', () => {
    const testResources: Resources = {
      folder1: {
        breakpoint1: { file1: 1, file2: 1 },
      },
      folder2: {
        breakpoint2: { file3: 1, file4: 1 },
      },
      folder3: {
        breakpoint3: { file5: 1, file6: 1 },
      },
      folder4: { file7: 1, file8: 1 },
      folder5: { file9: 1, file10: 1 },
      folder6: { file11: 1, file12: 1 },
    };

    const testManualAttributionUuid1 = '00000000-0000-0000-0000-000000000001';
    const testPreselectedManualAttributionUuid2 =
      '00000000-0000-0000-0000-000000000002';
    const testManualAttributionUuid3 = '00000000-0000-0000-0000-000000000003';
    const testPreselectedManualAttributionUuid4 =
      '00000000-0000-0000-0000-000000000004';

    const testExternalAttributionUuid1 = '00000000-0000-0000-0001-000000000001';
    const testPreselectedExternalAttributionUuid2 =
      '00000000-0000-0000-0001-000000000002';
    const testExternalAttributionUuid3 = '00000000-0000-0000-0001-000000000003';
    const testPreselectedExternalAttributionUuid4 =
      '00000000-0000-0000-0001-000000000004';
    const testExternalAttributionUuid5 = '00000000-0000-0000-0001-000000000005';

    const testPackageInfo1: PackageInfo = {
      packageName: 'package1',
      id: testManualAttributionUuid1,
    };
    const testPackageInfo2: PackageInfo = {
      packageName: 'package2',
      id: testExternalAttributionUuid1,
    };
    const testPreselectedPackageInfo3: PackageInfo = {
      packageName: 'package3',
      preSelected: true,
      id: testPreselectedManualAttributionUuid2,
    };
    const testPackageInfo4: PackageInfo = {
      packageName: 'package4',
      id: testManualAttributionUuid3,
    };
    const testPackageInfo5: PackageInfo = {
      packageName: 'package5',
      id: testExternalAttributionUuid3,
    };
    const testPreselectedPackageInfo6: PackageInfo = {
      packageName: 'package6',
      preSelected: true,
      id: testPreselectedExternalAttributionUuid4,
    };
    const testPackageInfo7: PackageInfo = {
      packageName: 'package7',
      id: testExternalAttributionUuid5,
    };
    const testManualAttributions: Attributions = {
      [testManualAttributionUuid1]: testPackageInfo1,
      [testPreselectedManualAttributionUuid2]: testPreselectedPackageInfo3,
      [testManualAttributionUuid3]: testPackageInfo4,
      [testPreselectedManualAttributionUuid4]: testPreselectedPackageInfo6,
    };
    const testExternalAttributions: Attributions = {
      [testExternalAttributionUuid1]: testPackageInfo2,
      [testPreselectedExternalAttributionUuid2]: testPreselectedPackageInfo3,
      [testExternalAttributionUuid3]: testPackageInfo5,
      [testPreselectedExternalAttributionUuid4]: testPreselectedPackageInfo6,
      [testExternalAttributionUuid5]: testPackageInfo7,
    };

    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/folder1/': [testManualAttributionUuid1],
      '/folder3/': [testPreselectedManualAttributionUuid2], // preselected from testAttributionUuid3
      '/folder4/': [testManualAttributionUuid3],
      '/folder6/': [testPreselectedManualAttributionUuid4], // preselected from testAttributionUuid6
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/folder2/': [testExternalAttributionUuid1],
      '/folder3/': [testPreselectedExternalAttributionUuid2], // preselected
      '/folder5/': [testExternalAttributionUuid3],
      '/folder6/': [testPreselectedExternalAttributionUuid4], // preselected
      '/folder1/breakpoint1/file1': [testExternalAttributionUuid5],
      '/folder2/breakpoint2/file3': [testExternalAttributionUuid5],
      '/folder3/breakpoint3/file5': [testExternalAttributionUuid5],
      '/folder4/file7': [testExternalAttributionUuid5],
      '/folder5/file9': [testExternalAttributionUuid5],
      '/folder6/file11': [testExternalAttributionUuid5],
    };
    const testResolvedExternalAttributions = new Set<string>();
    const testAttributionBreakpoints: Set<string> = new Set<string>([
      '/folder1/breakpoint1/',
      '/folder2/breakpoint2/',
      '/folder3/breakpoint3/',
    ]);

    const progressBarData = getUpdatedProgressBarData({
      resources: testResources,
      manualAttributions: testManualAttributions,
      externalAttributions: testExternalAttributions,
      resourcesToManualAttributions: testResourcesToManualAttributions,
      resourcesToExternalAttributions: testResourcesToExternalAttributions,
      resolvedExternalAttributions: testResolvedExternalAttributions,
      attributionBreakpoints: testAttributionBreakpoints,
      filesWithChildren: new Set<string>(),
    });
    const expectedNumberOfFiles = 12;
    expect(progressBarData.fileCount).toEqual(expectedNumberOfFiles);
    expect(progressBarData.filesWithManualAttributionCount).toBe(2);
    expect(progressBarData.filesWithOnlyPreSelectedAttributionCount).toBe(2);
    expect(progressBarData.filesWithOnlyExternalAttributionCount).toBe(5);
    expect(
      progressBarData.resourcesWithNonInheritedExternalAttributionOnly,
    ).toEqual([
      '/folder1/breakpoint1/file1',
      '/folder2/',
      '/folder2/breakpoint2/file3',
      '/folder3/breakpoint3/file5',
      '/folder5/',
      '/folder5/file9',
    ]);
  });

  it('infers filesWithChildren correctly', () => {
    const testResources: Resources = {
      'package.json': {
        file1: 1,
        file2: 1,
      },
    };

    const testManualAttributionUuid1 = '00000000-0000-0000-0000-000000000001';
    const testPreselectedManualAttributionUuid2 =
      '00000000-0000-0000-0000-000000000002';

    const testPreselectedExternalAttributionUuid1 =
      '00000000-0000-0000-0001-000000000001';

    const testPackageInfo1: PackageInfo = {
      packageName: 'package1',
      id: testManualAttributionUuid1,
    };
    const testPreselectedPackageInfo2: PackageInfo = {
      packageName: 'package2',
      preSelected: true,
      id: testPreselectedManualAttributionUuid2,
    };
    const testManualAttributions: Attributions = {
      [testManualAttributionUuid1]: testPackageInfo1,
      [testPreselectedManualAttributionUuid2]: testPreselectedPackageInfo2,
    };
    const testExternalAttributions: Attributions = {
      [testPreselectedExternalAttributionUuid1]: testPreselectedPackageInfo2,
    };

    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/package.json/': [testManualAttributionUuid1],
      '/package.json/file1': [testPreselectedManualAttributionUuid2], // preselected
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/package.json/file1': [testPreselectedExternalAttributionUuid1],
    };
    const testResolvedExternalAttributions = new Set<string>();
    const testFilesWithChildren: Set<string> = new Set<string>([
      '/package.json/',
    ]);

    const progressBarData = getUpdatedProgressBarData({
      resources: testResources,
      manualAttributions: testManualAttributions,
      externalAttributions: testExternalAttributions,
      resourcesToManualAttributions: testResourcesToManualAttributions,
      resourcesToExternalAttributions: testResourcesToExternalAttributions,
      resolvedExternalAttributions: testResolvedExternalAttributions,
      attributionBreakpoints: new Set<string>(),
      filesWithChildren: testFilesWithChildren,
    });
    const expectedNumberOfFiles = 3;
    expect(progressBarData.fileCount).toEqual(expectedNumberOfFiles);
    expect(progressBarData.filesWithManualAttributionCount).toBe(2);
    expect(progressBarData.filesWithOnlyPreSelectedAttributionCount).toBe(1);
    expect(progressBarData.filesWithOnlyExternalAttributionCount).toBe(0);
    expect(
      progressBarData.resourcesWithNonInheritedExternalAttributionOnly,
    ).toEqual([]);
  });
});

describe('The resourceHasOnlyPreSelectedAttributions function', () => {
  it('returns true on only preselected attributions', () => {
    const { testResourcesToManualAttributions, testManualAttributions } =
      getTestObjectsForResourcesWithPreSelectedAttributions();
    expect(
      resourceHasOnlyPreSelectedAttributions(
        '/fileWithOnlyPreSelectedAttributions',
        testResourcesToManualAttributions,
        testManualAttributions,
      ),
    ).toBeTruthy();
  });

  it('returns false on mixed attributions', () => {
    const { testResourcesToManualAttributions, testManualAttributions } =
      getTestObjectsForResourcesWithPreSelectedAttributions();
    expect(
      resourceHasOnlyPreSelectedAttributions(
        '/fileWithPreselectedAndManualAttributions',
        testResourcesToManualAttributions,
        testManualAttributions,
      ),
    ).toBeFalsy();
  });
});

describe('The getHighestCriticalityOfExternalAttributions function', () => {
  it('returns high criticality incase of external Signals with high criticality', () => {
    const testHighlyCriticalExternalAttributionUuid =
      'fc1d0a3e-be99-4b61-b240-49a2cca3aa21';
    const testMediumCriticalExternalAttributionUuid =
      'd5f35f44-0659-4b8b-a4a0-5741c0c23200';
    const testNonCriticalExternalAttributionUuid =
      '678b4900-48a8-4dd5-9c24-ec44c0d13c31';

    const highlyCriticalExternalAttributionPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'highly critical Package',
      licenseText: ' test highly critical Package License text',
      criticality: Criticality.High,
      id: testHighlyCriticalExternalAttributionUuid,
    };
    const mediumCriticalExternalAttributionPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '2.0',
      packageName: 'medium critical Package',
      licenseText: ' test medium critical Package License text',
      criticality: Criticality.Medium,
      id: testMediumCriticalExternalAttributionUuid,
    };
    const nonCriticalExternalAttributionPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '3.0',
      packageName: 'non-critical Package',
      licenseText: ' test non-critical Package License text',
      id: testNonCriticalExternalAttributionUuid,
    };
    const testExternalAttributions: Attributions = {
      [testHighlyCriticalExternalAttributionUuid]:
        highlyCriticalExternalAttributionPackageInfo,
      [testMediumCriticalExternalAttributionUuid]:
        mediumCriticalExternalAttributionPackageInfo,
      [testNonCriticalExternalAttributionUuid]:
        nonCriticalExternalAttributionPackageInfo,
    };

    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/folder1/file1': [
        testHighlyCriticalExternalAttributionUuid,
        testMediumCriticalExternalAttributionUuid,
        testNonCriticalExternalAttributionUuid,
      ],
    };
    const criticality = getHighestCriticalityOfExternalAttributions(
      '/folder1/file1',
      testResourcesToExternalAttributions,
      testExternalAttributions,
    );

    expect(criticality).toEqual(Criticality.High);
  });

  it('returns medium criticality incase of an external Signals with only medium criticality', () => {
    const testMediumCriticalExternalAttributionUuid =
      'd5f35f44-0659-4b8b-a4a0-5741c0c23200';
    const testNonCriticalExternalAttributionUuid =
      '678b4900-48a8-4dd5-9c24-ec44c0d13c31';

    const mediumCriticalExternalAttributionPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '2.0',
      packageName: 'medium critical Package',
      licenseText: ' test medium critical Package License text',
      criticality: Criticality.Medium,
      id: testMediumCriticalExternalAttributionUuid,
    };
    const nonCriticalExternalAttributionPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '3.0',
      packageName: 'non-critical Package',
      licenseText: ' test non-critical Package License text',
      id: testNonCriticalExternalAttributionUuid,
    };

    const testExternalAttributions: Attributions = {
      [testMediumCriticalExternalAttributionUuid]:
        mediumCriticalExternalAttributionPackageInfo,
      [testNonCriticalExternalAttributionUuid]:
        nonCriticalExternalAttributionPackageInfo,
    };

    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/folder1/file1': [
        testMediumCriticalExternalAttributionUuid,
        testNonCriticalExternalAttributionUuid,
      ],
    };
    const criticality = getHighestCriticalityOfExternalAttributions(
      '/folder1/file1',
      testResourcesToExternalAttributions,
      testExternalAttributions,
    );

    expect(criticality).toEqual(Criticality.Medium);
  });

  it('returns null incase of external Signal without any criticality', () => {
    const testNonCriticalExternalAttributionUuid =
      '678b4900-48a8-4dd5-9c24-ec44c0d13c31';

    const nonCriticalExternalAttributionPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '3.0',
      packageName: 'non-critical Package',
      licenseText: ' test non-critical Package License text',
      id: testNonCriticalExternalAttributionUuid,
    };
    const testExternalAttributions: Attributions = {
      [testNonCriticalExternalAttributionUuid]:
        nonCriticalExternalAttributionPackageInfo,
    };

    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/folder1/file1': [testNonCriticalExternalAttributionUuid],
    };
    const criticality = getHighestCriticalityOfExternalAttributions(
      '/folder1/file1',
      testResourcesToExternalAttributions,
      testExternalAttributions,
    );

    expect(criticality).toBeNull();
  });
});

function getTestObjectsForResourcesWithPreSelectedAttributions(): {
  testResourcesToManualAttributions: ResourcesToAttributions;
  testManualAttributions: Attributions;
} {
  const testResourcesToManualAttributions: ResourcesToAttributions = {
    '/fileWithOnlyPreSelectedAttributions': ['uuid1', 'uuid2'],
    '/fileWithPreselectedAndManualAttributions': ['uuid1', 'uuid3'],
  };
  const testManualAttributions: Attributions = {
    uuid1: { packageName: 'React', preSelected: true, id: 'uuid1' },
    uuid2: { packageName: 'Vue', preSelected: true, id: 'uuid2' },
    uuid3: { packageName: 'Angular', id: 'uuid3' },
  };
  return { testResourcesToManualAttributions, testManualAttributions };
}
