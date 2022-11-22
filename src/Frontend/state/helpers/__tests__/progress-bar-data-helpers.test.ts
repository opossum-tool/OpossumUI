// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  Attributions,
  DiscreteConfidence,
  PackageInfo,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import {
  getUpdatedProgressBarData,
  resourceHasOnlyPreSelectedAttributions,
} from '../progress-bar-data-helpers';

describe('The getUpdatedProgressBarData function', () => {
  it('gets updated progress data', () => {
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
    const testTemporaryPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'test Package',
      licenseText: ' test License text',
    };
    const secondTestTemporaryPackageInfo: PackageInfo = {
      packageVersion: '2.0',
      packageName: 'not assigned test Package',
      licenseText: ' test not assigned License text',
    };
    const testManualAttributions: Attributions = {
      [testManualAttributionUuid_1]: testTemporaryPackageInfo,
      [testManualAttributionUuid_2]: secondTestTemporaryPackageInfo,
    };

    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/root/src/something.js': [testManualAttributionUuid_1],
    };

    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/root/src/something.js': [
        'testExternalAttributionUuid_1',
        'resolved_id',
      ],
      '/thirdParty/package_1.tr.gz': ['testExternalAttributionUuid_1'],
      '/thirdParty/package_2.tr.gz': ['resolved_id'],
    };

    const progressBarData = getUpdatedProgressBarData({
      resources: testResources,
      resourceId: '/',
      manualAttributions: testManualAttributions,
      resourcesToManualAttributions: testResourcesToManualAttributions,
      resourcesToExternalAttributions: testResourcesToExternalAttributions,
      resolvedExternalAttributions: new Set<string>(),
      attributionBreakpoints: new Set<string>(),
      filesWithChildren: new Set<string>(),
    });
    expect(progressBarData.fileCount).toEqual(4);
    expect(progressBarData.filesWithManualAttributionCount).toEqual(1);
    expect(progressBarData.filesWithOnlyExternalAttributionCount).toEqual(2);
    expect(
      progressBarData.resourcesWithNonInheritedExternalAttributionOnly
    ).toEqual(['/thirdParty/package_1.tr.gz', '/thirdParty/package_2.tr.gz']);
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
    const testTemporaryPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'test Package',
      licenseText: ' test License text',
    };
    const secondTestTemporaryPackageInfo: PackageInfo = {
      packageVersion: '2.0',
      packageName: 'not assigned test Package',
      licenseText: ' test not assigned License text',
    };
    const testManualAttributions: Attributions = {
      [testManualAttributionUuid_1]: testTemporaryPackageInfo,
      [testManualAttributionUuid_2]: secondTestTemporaryPackageInfo,
    };

    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/root/src/something.js': [testManualAttributionUuid_1],
    };

    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/root/src/something.js': [
        'testExternalAttributionUuid_1',
        'resolved_id',
      ],
      '/thirdParty/package_1.tr.gz': ['testExternalAttributionUuid_1'],
      '/thirdParty/package_2.tr.gz': ['resolved_id'],
    };
    const testResolvedExternalAttributions: Set<string> = new Set<string>([
      'resolved_id',
    ]);

    const progressBarData = getUpdatedProgressBarData({
      resources: testResources,
      resourceId: '/',
      manualAttributions: testManualAttributions,
      resourcesToManualAttributions: testResourcesToManualAttributions,
      resourcesToExternalAttributions: testResourcesToExternalAttributions,
      resolvedExternalAttributions: testResolvedExternalAttributions,
      attributionBreakpoints: new Set<string>(),
      filesWithChildren: new Set<string>(),
    });
    expect(progressBarData.fileCount).toEqual(4);
    expect(progressBarData.filesWithManualAttributionCount).toEqual(1);
    expect(progressBarData.filesWithOnlyExternalAttributionCount).toEqual(1);
    expect(
      progressBarData.resourcesWithNonInheritedExternalAttributionOnly
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

    const testAttributionUuid1 = '00000000-0000-0000-0000-000000000001';
    const testAttributionUuid2 = '00000000-0000-0000-0000-000000000002';
    const testAttributionUuid3 = '00000000-0000-0000-0000-000000000003';
    const testAttributionUuid4 = '00000000-0000-0000-0000-000000000004';
    const testAttributionUuid5 = '00000000-0000-0000-0000-000000000005';
    const testAttributionUuid6 = '00000000-0000-0000-0000-000000000006';
    const testAttributionUuid7 = '00000000-0000-0000-0000-000000000007';
    const testPackageInfo1: PackageInfo = { packageName: 'package1' };
    const testPackageInfo2: PackageInfo = { packageName: 'package2' };
    const testPackageInfo3: PackageInfo = {
      packageName: 'package3',
      preSelected: true,
    };
    const testPackageInfo4: PackageInfo = { packageName: 'package4' };
    const testPackageInfo5: PackageInfo = { packageName: 'package5' };
    const testPackageInfo6: PackageInfo = {
      packageName: 'package6',
      preSelected: true,
    };
    const testPackageInfo7: PackageInfo = { packageName: 'package7' };
    const testManualAttributions: Attributions = {
      [testAttributionUuid1]: testPackageInfo1,
      [testAttributionUuid2]: testPackageInfo2,
      [testAttributionUuid3]: testPackageInfo3,
      [testAttributionUuid4]: testPackageInfo4,
      [testAttributionUuid5]: testPackageInfo5,
      [testAttributionUuid6]: testPackageInfo6,
      [testAttributionUuid7]: testPackageInfo7,
    };

    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/folder1/': [testAttributionUuid1],
      '/folder3/': [testAttributionUuid3], // preselected
      '/folder4/': [testAttributionUuid4],
      '/folder6/': [testAttributionUuid6], // preselected
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/folder2/': [testAttributionUuid2],
      '/folder3/': [testAttributionUuid3], // preselected
      '/folder5/': [testAttributionUuid5],
      '/folder6/': [testAttributionUuid6], // preselected
      '/folder1/breakpoint1/file1': [testAttributionUuid7],
      '/folder2/breakpoint2/file3': [testAttributionUuid7],
      '/folder3/breakpoint3/file5': [testAttributionUuid7],
      '/folder4/file7': [testAttributionUuid7],
      '/folder5/file9': [testAttributionUuid7],
      '/folder6/file11': [testAttributionUuid7],
    };
    const testResolvedExternalAttributions = new Set<string>();
    const testAttributionBreakpoints: Set<string> = new Set<string>([
      '/folder1/breakpoint1/',
      '/folder2/breakpoint2/',
      '/folder3/breakpoint3/',
    ]);

    const progressBarData = getUpdatedProgressBarData({
      resources: testResources,
      resourceId: '/',
      manualAttributions: testManualAttributions,
      resourcesToManualAttributions: testResourcesToManualAttributions,
      resourcesToExternalAttributions: testResourcesToExternalAttributions,
      resolvedExternalAttributions: testResolvedExternalAttributions,
      attributionBreakpoints: testAttributionBreakpoints,
      filesWithChildren: new Set<string>(),
    });
    expect(progressBarData.fileCount).toEqual(12);
    expect(progressBarData.filesWithManualAttributionCount).toEqual(2);
    expect(progressBarData.filesWithOnlyPreSelectedAttributionCount).toEqual(2);
    expect(progressBarData.filesWithOnlyExternalAttributionCount).toEqual(5);
    expect(
      progressBarData.resourcesWithNonInheritedExternalAttributionOnly
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

    const testAttributionUuid1 = '00000000-0000-0000-0000-000000000001';
    const testAttributionUuid2 = '00000000-0000-0000-0000-000000000002';

    const testPackageInfo1: PackageInfo = { packageName: 'package1' };
    const testPackageInfo2: PackageInfo = {
      packageName: 'package2',
      preSelected: true,
    };
    const testManualAttributions: Attributions = {
      [testAttributionUuid1]: testPackageInfo1,
      [testAttributionUuid2]: testPackageInfo2,
    };

    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/package.json/': [testAttributionUuid1],
      '/package.json/file1': [testAttributionUuid2], // preselected
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/package.json/file1': [testAttributionUuid2],
    };
    const testResolvedExternalAttributions = new Set<string>();
    const testFilesWithChildren: Set<string> = new Set<string>([
      '/package.json/',
    ]);

    const progressBarData = getUpdatedProgressBarData({
      resources: testResources,
      resourceId: '/',
      manualAttributions: testManualAttributions,
      resourcesToManualAttributions: testResourcesToManualAttributions,
      resourcesToExternalAttributions: testResourcesToExternalAttributions,
      resolvedExternalAttributions: testResolvedExternalAttributions,
      attributionBreakpoints: new Set<string>(),
      filesWithChildren: testFilesWithChildren,
    });
    expect(progressBarData.fileCount).toEqual(3);
    expect(progressBarData.filesWithManualAttributionCount).toEqual(2);
    expect(progressBarData.filesWithOnlyPreSelectedAttributionCount).toEqual(1);
    expect(progressBarData.filesWithOnlyExternalAttributionCount).toEqual(0);
    expect(
      progressBarData.resourcesWithNonInheritedExternalAttributionOnly
    ).toEqual([]);
  });

  it('gets updated progress data for current folder', () => {
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
    const testTemporaryPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageVersion: '1.0',
      packageName: 'test Package',
      licenseText: ' test License text',
    };
    const secondTestTemporaryPackageInfo: PackageInfo = {
      packageVersion: '2.0',
      packageName: 'not assigned test Package',
      licenseText: ' test not assigned License text',
    };
    const testManualAttributions: Attributions = {
      [testManualAttributionUuid_1]: testTemporaryPackageInfo,
      [testManualAttributionUuid_2]: secondTestTemporaryPackageInfo,
    };

    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/root/src/something.js': [testManualAttributionUuid_1],
    };

    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/root/src/something.js': [
        'testExternalAttributionUuid_1',
        'resolved_id',
      ],
      '/thirdParty/package_1.tr.gz': ['testExternalAttributionUuid_1'],
      '/thirdParty/package_2.tr.gz': ['resolved_id'],
    };

    const progressBarData = getUpdatedProgressBarData({
      resources: testResources,
      resourceId: '/root/',
      manualAttributions: testManualAttributions,
      resourcesToManualAttributions: testResourcesToManualAttributions,
      resourcesToExternalAttributions: testResourcesToExternalAttributions,
      resolvedExternalAttributions: new Set<string>(),
      attributionBreakpoints: new Set<string>(),
      filesWithChildren: new Set<string>(),
    });
    expect(progressBarData?.fileCount).toEqual(2);
    expect(progressBarData?.filesWithManualAttributionCount).toEqual(1);
    expect(progressBarData?.filesWithOnlyExternalAttributionCount).toEqual(0);
    expect(
      progressBarData?.resourcesWithNonInheritedExternalAttributionOnly
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
        testManualAttributions
      )
    ).toBeTruthy();
  });

  it('returns false on mixed attributions', () => {
    const { testResourcesToManualAttributions, testManualAttributions } =
      getTestObjectsForResourcesWithPreSelectedAttributions();
    expect(
      resourceHasOnlyPreSelectedAttributions(
        '/fileWithPreselectedAndManualAttributions',
        testResourcesToManualAttributions,
        testManualAttributions
      )
    ).toBeFalsy();
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
    uuid1: { packageName: 'React', preSelected: true },
    uuid2: { packageName: 'Vue', preSelected: true },
    uuid3: { packageName: 'Angular' },
  };
  return { testResourcesToManualAttributions, testManualAttributions };
}
