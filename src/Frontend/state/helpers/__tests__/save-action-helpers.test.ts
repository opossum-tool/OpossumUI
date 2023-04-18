// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { isEmpty } from 'lodash';
import { NIL as uuidNil } from 'uuid';
import {
  AttributionData,
  AttributionsToResources,
  PackageInfo,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { EMPTY_ATTRIBUTION_DATA } from '../../../shared-constants';
import {
  _getIdsOfResourcesThatMightHaveChildrenWithTheSameAttributions,
  _removeAttributionsFromChildrenAndParents,
  _removeManualAttributionFromChildrenIfAllAreIdentical,
  createManualAttribution,
  deleteManualAttribution,
  updateManualAttribution,
} from '../save-action-helpers';

const testUuid: string = uuidNil;

describe('The createManualAttribution function', () => {
  it('adds a new manual attribution', () => {
    const testManualData: AttributionData = EMPTY_ATTRIBUTION_DATA;
    const testSelectedResourceId = '/something.js';
    const testTemporaryPackageInfo: PackageInfo = { packageName: 'React' };

    const { newManualData, newAttributionId } = createManualAttribution(
      testManualData,
      testSelectedResourceId,
      testTemporaryPackageInfo
    );
    expect(newManualData.attributions[newAttributionId]).toEqual(
      testTemporaryPackageInfo
    );
    expect(newManualData.attributionsToResources[newAttributionId]).toEqual([
      '/something.js',
    ]);
  });
});

describe('The deleteManualAttribution function', () => {
  it('deletes an empty manual attribution', () => {
    const testManualData: AttributionData = {
      attributions: {
        [testUuid]: {
          packageName: 'testpackage',
          packageVersion: '2.0',
          licenseText: 'Permission is hereby granted',
        },
      },
      resourcesToAttributions: {
        '/first/': [testUuid],
      },
      attributionsToResources: {
        [testUuid]: ['/first/'],
      },
      resourcesWithAttributedChildren: {
        attributedChildren: {
          '0': new Set<number>().add(1),
        },
        pathsToIndices: {
          '/': 0,
          '/first/': 1,
        },
        paths: ['/', '/first/'],
      },
    };
    const newManualData: AttributionData = deleteManualAttribution(
      testManualData,
      testUuid,
      () => false
    );
    expect(isEmpty(newManualData.attributions)).toBe(true);
    expect(isEmpty(newManualData.resourcesToAttributions)).toBe(true);
    expect(isEmpty(newManualData.attributionsToResources)).toBe(true);
    expect(newManualData.resourcesWithAttributedChildren).toEqual({
      attributedChildren: {},
      pathsToIndices: {
        '/': 0,
        '/first/': 1,
      },
      paths: ['/', '/first/'],
    });
  });

  it('correctly maintains childrenFromAttributedResources', () => {
    const testAnotherUuid = '000';
    const testManualData: AttributionData = {
      attributions: {
        [testAnotherUuid]: {
          packageName: 'another testpackage',
        },
        [testUuid]: {
          packageName: 'testpackage',
          packageVersion: '2.0',
          licenseText: 'Permission is hereby granted',
        },
      },
      resourcesToAttributions: {
        '/first/': [testUuid, testAnotherUuid],
      },
      attributionsToResources: {
        [testUuid]: ['/first/'],
        [testAnotherUuid]: ['/first/'],
      },
      resourcesWithAttributedChildren: {
        attributedChildren: {
          '0': new Set<number>().add(1),
        },
        pathsToIndices: {
          '/': 0,
          '/first/': 1,
        },
        paths: ['/', '/first/'],
      },
    };
    const newManualData: AttributionData = deleteManualAttribution(
      testManualData,
      testUuid,
      () => false
    );
    expect(newManualData.attributions).toEqual({
      '000': { packageName: 'another testpackage' },
    });
    expect(newManualData.resourcesToAttributions).toEqual({
      '/first/': ['000'],
    });
    expect(newManualData.attributionsToResources).toEqual({
      '000': ['/first/'],
    });
    expect(newManualData.resourcesWithAttributedChildren).toEqual({
      attributedChildren: {
        '0': new Set<number>().add(1),
      },
      pathsToIndices: {
        '/': 0,
        '/first/': 1,
      },
      paths: ['/', '/first/'],
    });
  });
});

describe('The updateManualAttribution function', () => {
  it('updates an existing manual attribution', () => {
    const testPackageInfo: PackageInfo = { packageName: 'Vue' };
    const testTemporaryPackageInfo: PackageInfo = {
      packageName: 'React',
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/something.js': [testUuid],
      'somethingElse.js': [testUuid],
    };
    const expectedManualAttributionsToResources: AttributionsToResources = {
      [testUuid]: ['/something.js', 'somethingElse.js'],
    };
    const expectedPackageInfo: PackageInfo = { packageName: 'React' };
    const testManualData: AttributionData = {
      attributions: { [testUuid]: testPackageInfo },
      resourcesToAttributions: testResourcesToManualAttributions,
      attributionsToResources: {
        [testUuid]: ['/something.js', 'somethingElse.js'],
      },
      resourcesWithAttributedChildren: {
        attributedChildren: {},
        pathsToIndices: {},
        paths: [],
      },
    };

    const newManualData: AttributionData = updateManualAttribution(
      testUuid,
      testManualData,
      testTemporaryPackageInfo
    );

    expect(newManualData.attributions).toEqual({
      [testUuid]: expectedPackageInfo,
    });
    expect(newManualData.resourcesToAttributions).toEqual(
      testResourcesToManualAttributions
    );
    expect(newManualData.attributionsToResources).toEqual(
      expectedManualAttributionsToResources
    );
  });
});

describe('_removeManualAttributionFromChildrenIfAllAreIdentical', () => {
  it('three matching', () => {
    const testManualData: AttributionData = {
      attributions: {
        uuid1: {
          packageName: 'React',
        },
      },
      resourcesToAttributions: {
        '/first/': ['uuid1'],
        '/first/second/': ['uuid1'],
        '/first/second/third/': ['uuid1'],
      },
      attributionsToResources: {
        uuid1: ['/first/', '/first/second/', '/first/second/third/'],
      },
      resourcesWithAttributedChildren: {
        attributedChildren: {
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '0': new Set<number>().add(1).add(2).add(3),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '1': new Set<number>().add(2).add(3),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '2': new Set<number>().add(3),
        },
        pathsToIndices: {
          '/': 0,
          '/first/': 1,
          '/first/second/': 2,
          '/first/second/third/': 3,
        },
        paths: ['/', '/first/', '/first/second/', '/first/second/third/'],
      },
    };

    const expectedStrippedManualData: AttributionData = {
      attributions: {
        uuid1: {
          packageName: 'React',
        },
      },
      resourcesToAttributions: {
        '/first/': ['uuid1'],
      },
      attributionsToResources: {
        uuid1: ['/first/'],
      },
      resourcesWithAttributedChildren: {
        attributedChildren: {
          '0': new Set<number>().add(1),
        },
        pathsToIndices: {
          '/': 0,
          '/first/': 1,
          '/first/second/': 2,
          '/first/second/third/': 3,
        },
        paths: ['/', '/first/', '/first/second/', '/first/second/third/'],
      },
    };

    _removeManualAttributionFromChildrenIfAllAreIdentical(
      testManualData,
      ['/first/second/', '/first/second/third/'],
      () => false
    );
    expect(testManualData).toEqual(expectedStrippedManualData);
  });

  it('matching and non-matching children attributions', () => {
    const testManualData: AttributionData = {
      attributions: {
        uuid1: {
          packageName: 'React',
        },
        uuid2: {
          packageName: 'Vue',
        },
        uuid3: {
          packageName: 'Angular',
        },
      },
      resourcesToAttributions: {
        '/first/': ['uuid1', 'uuid3'],
        '/first/second/': ['uuid3', 'uuid1'],
        '/first/second/third/': ['uuid2', 'uuid1'],
        '/first/second/third/fourth': ['uuid1', 'uuid3'],
      },
      attributionsToResources: {
        uuid1: [
          '/first/',
          '/first/second/',
          '/first/second/third/',
          '/first/second/third/fourth',
        ],
        uuid2: ['/first/second/third/'],
        uuid3: ['/first/', '/first/second/', '/first/second/third/fourth'],
      },
      resourcesWithAttributedChildren: {
        attributedChildren: {
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '0': new Set<number>().add(1).add(2).add(3).add(4),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '1': new Set<number>().add(2).add(3).add(4),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '2': new Set<number>().add(3).add(4),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '3': new Set<number>().add(4),
        },
        pathsToIndices: {
          '/': 0,
          '/first/': 1,
          '/first/second/': 2,
          '/first/second/third/': 3,
          '/first/second/third/fourth': 4,
        },
        paths: [
          '/',
          '/first/',
          '/first/second/',
          '/first/second/third/',
          '/first/second/third/fourth',
        ],
      },
    };

    const expectedStrippedManualData: AttributionData = {
      attributions: {
        uuid1: {
          packageName: 'React',
        },
        uuid2: {
          packageName: 'Vue',
        },
        uuid3: {
          packageName: 'Angular',
        },
      },
      resourcesToAttributions: {
        '/first/': ['uuid1', 'uuid3'],
        '/first/second/third/': ['uuid1', 'uuid2'],
        '/first/second/third/fourth': ['uuid1', 'uuid3'],
      },
      attributionsToResources: {
        uuid1: [
          '/first/',
          '/first/second/third/',
          '/first/second/third/fourth',
        ],
        uuid2: ['/first/second/third/'],
        uuid3: ['/first/', '/first/second/third/fourth'],
      },
      resourcesWithAttributedChildren: {
        attributedChildren: {
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '0': new Set<number>().add(1).add(3).add(4),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '1': new Set<number>().add(3).add(4),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '2': new Set<number>().add(3).add(4),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '3': new Set<number>().add(4),
        },
        pathsToIndices: {
          '/': 0,
          '/first/': 1,
          '/first/second/': 2,
          '/first/second/third/': 3,
          '/first/second/third/fourth': 4,
        },
        paths: [
          '/',
          '/first/',
          '/first/second/',
          '/first/second/third/',
          '/first/second/third/fourth',
        ],
      },
    };

    _removeManualAttributionFromChildrenIfAllAreIdentical(
      testManualData,
      [
        '/first/',
        '/first/second/',
        '/first/second/third/',
        '/first/second/third/fourth',
      ],
      () => false
    );
    expect(testManualData).toEqual(expectedStrippedManualData);
  });
});

describe('_removeAttributionsFromChildrenAndParents', () => {
  it('matching and non-matching children attributions', () => {
    const testManualData: AttributionData = {
      attributions: {
        uuid1: {
          packageName: 'React',
        },
        uuid2: {
          packageName: 'Vue',
        },
        uuid3: {
          packageName: 'Angular',
        },
      },
      resourcesToAttributions: {
        '/first/': ['uuid1', 'uuid3'],
        '/first/second/': ['uuid3', 'uuid1'],
        '/first/second/third/': ['uuid2', 'uuid1'],
        '/first/second/third/fourth': ['uuid1', 'uuid3'],
      },
      attributionsToResources: {
        uuid1: [
          '/first/',
          '/first/second/',
          '/first/second/third/',
          '/first/second/third/fourth',
        ],
        uuid2: ['/first/second/third/'],
        uuid3: ['/first/', '/first/second/', '/first/second/third/fourth'],
      },
      resourcesWithAttributedChildren: {
        attributedChildren: {
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '0': new Set<number>().add(1).add(2).add(3).add(4),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '1': new Set<number>().add(2).add(3).add(4),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '2': new Set<number>().add(3).add(4),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '3': new Set<number>().add(4),
        },
        pathsToIndices: {
          '/': 0,
          '/first/': 1,
          '/first/second/': 2,
          '/first/second/third/': 3,
          '/first/second/third/fourth': 4,
        },
        paths: [
          '/',
          '/first/',
          '/first/second/',
          '/first/second/third/',
          '/first/second/third/fourth',
        ],
      },
    };

    const testSelectedResourceId = '/first/second/';

    const expectedStrippedManualData: AttributionData = {
      attributions: {
        uuid1: {
          packageName: 'React',
        },
        uuid2: {
          packageName: 'Vue',
        },
        uuid3: {
          packageName: 'Angular',
        },
      },
      resourcesToAttributions: {
        '/first/': ['uuid1', 'uuid3'],
        '/first/second/third/': ['uuid1', 'uuid2'],
        '/first/second/third/fourth': ['uuid1', 'uuid3'],
      },
      attributionsToResources: {
        uuid1: [
          '/first/',
          '/first/second/third/',
          '/first/second/third/fourth',
        ],
        uuid2: ['/first/second/third/'],
        uuid3: ['/first/', '/first/second/third/fourth'],
      },
      resourcesWithAttributedChildren: {
        attributedChildren: {
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '0': new Set<number>().add(1).add(3).add(4),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '1': new Set<number>().add(3).add(4),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '2': new Set<number>().add(3).add(4),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '3': new Set<number>().add(4),
        },
        pathsToIndices: {
          '/': 0,
          '/first/': 1,
          '/first/second/': 2,
          '/first/second/third/': 3,
          '/first/second/third/fourth': 4,
        },
        paths: [
          '/',
          '/first/',
          '/first/second/',
          '/first/second/third/',
          '/first/second/third/fourth',
        ],
      },
    };

    _removeAttributionsFromChildrenAndParents(
      testManualData,
      [testSelectedResourceId],
      () => false
    );
    expect(testManualData).toEqual(expectedStrippedManualData);
  });

  it('child has subset of attributions from parent', () => {
    const testManualData: AttributionData = {
      attributions: {
        uuid1: {
          packageName: 'React',
        },
        uuid2: {
          packageName: 'Vue',
        },
      },
      resourcesToAttributions: {
        '/first/second/third/': ['uuid2', 'uuid1'],
        '/first/second/third/fourth': ['uuid1'],
      },
      attributionsToResources: {
        uuid1: ['/first/second/third/', '/first/second/third/fourth'],
        uuid2: ['/first/second/third/'],
      },
      resourcesWithAttributedChildren: {
        attributedChildren: {
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '0': new Set<number>().add(1).add(2).add(3).add(4),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '1': new Set<number>().add(2).add(3).add(4),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '2': new Set<number>().add(3).add(4),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '3': new Set<number>().add(4),
        },
        pathsToIndices: {
          '/': 0,
          '/first/': 1,
          '/first/second/': 2,
          '/first/second/third/': 3,
          '/first/second/third/fourth': 4,
        },
        paths: [
          '/',
          '/first/',
          '/first/second/',
          '/first/second/third/',
          '/first/second/third/fourth',
        ],
      },
    };

    const testSelectedResourceId = '/first/second/third/fourth/';

    const expectedStrippedManualData: AttributionData = {
      attributions: {
        uuid1: {
          packageName: 'React',
        },
        uuid2: {
          packageName: 'Vue',
        },
      },
      resourcesToAttributions: {
        '/first/second/third/': ['uuid1', 'uuid2'],
        '/first/second/third/fourth': ['uuid1'],
      },
      attributionsToResources: {
        uuid1: ['/first/second/third/', '/first/second/third/fourth'],
        uuid2: ['/first/second/third/'],
      },
      resourcesWithAttributedChildren: {
        attributedChildren: {
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '0': new Set<number>().add(1).add(2).add(3).add(4),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '1': new Set<number>().add(2).add(3).add(4),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '2': new Set<number>().add(3).add(4),
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          '3': new Set<number>().add(4),
        },
        pathsToIndices: {
          '/': 0,
          '/first/': 1,
          '/first/second/': 2,
          '/first/second/third/': 3,
          '/first/second/third/fourth': 4,
        },
        paths: [
          '/',
          '/first/',
          '/first/second/',
          '/first/second/third/',
          '/first/second/third/fourth',
        ],
      },
    };

    _removeAttributionsFromChildrenAndParents(
      testManualData,
      [testSelectedResourceId],
      () => false
    );
    expect(testManualData).toEqual(expectedStrippedManualData);
  });
});

describe('_getIdsOfResourcesThatMightHaveChildrenWithTheSameAttributions', () => {
  it('returns only parents linked to the same attribution', () => {
    const testResourceId = '/parent/resource';
    const testAttributionId = 'ATTRIBUTION_ID';
    const expectedOutput = ['/parent/', testResourceId];
    const testAttributionsToResources = {
      [testAttributionId]: expectedOutput,
    };

    expect(
      _getIdsOfResourcesThatMightHaveChildrenWithTheSameAttributions(
        testAttributionsToResources,
        testResourceId,
        testAttributionId
      )
    ).toEqual(expectedOutput);
  });

  it('returns only itself & parents if the resource cannot have children', () => {
    const testResourceId = '/parent/resource';
    const testAttributionId = 'ATTRIBUTION_ID';
    const expectedOutput = ['/parent/', testResourceId];
    const testAttributionsToResources = {
      [testAttributionId]: expectedOutput.concat(
        '/parent/resourceIncludeFakeChild'
      ),
    };

    expect(
      _getIdsOfResourcesThatMightHaveChildrenWithTheSameAttributions(
        testAttributionsToResources,
        testResourceId,
        testAttributionId
      )
    ).toEqual(expectedOutput);
  });

  it('returns itself & parents and children linked to the same attribution', () => {
    const testResourceId = '/parent/resource/';
    const testAttributionId = 'ATTRIBUTION_ID';
    const expectedOutput = [
      '/',
      testResourceId,
      '/parent/resource/child/',
      '/parent/resource/child/grandChild',
    ];
    const testAttributionsToResources = {
      [testAttributionId]: expectedOutput,
    };

    expect(
      _getIdsOfResourcesThatMightHaveChildrenWithTheSameAttributions(
        testAttributionsToResources,
        testResourceId,
        testAttributionId
      )
    ).toEqual(expectedOutput);
  });
});
