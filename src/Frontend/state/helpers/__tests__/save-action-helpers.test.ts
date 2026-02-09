// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { isEmpty } from 'lodash';

import {
  AttributionData,
  Attributions,
  AttributionsToResources,
  Criticality,
  PackageInfo,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { faker } from '../../../../testing/Faker';
import { EMPTY_ATTRIBUTION_DATA } from '../../../shared-constants';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { loadFromFile } from '../../actions/resource-actions/load-actions';
import { getCalculatePreferredOverOriginIds } from '../../actions/resource-actions/preference-actions';
import { createAppStore } from '../../configure-store';
import { initialResourceState } from '../../reducers/resource-reducer';
import { getManualData } from '../../selectors/resource-selectors';
import {
  _getIdsOfResourcesThatMightHaveChildrenWithTheSameAttributions,
  _removeAttributionsFromChildrenAndParents,
  _removeManualAttributionFromChildrenIfAllAreIdentical,
  computeChildrenWithAttributions,
  createManualAttribution,
  deleteManualAttribution,
  getWasPreferred,
  linkToAttributionManualData,
  unlinkResourceFromAttributionId,
  updateManualAttribution,
} from '../save-action-helpers';

const testUuid: string = faker.string.uuid();

describe('The createManualAttribution function', () => {
  it('adds a new manual attribution', () => {
    const testManualData: AttributionData = EMPTY_ATTRIBUTION_DATA;
    const testSelectedResourceId = '/something.js';
    const testTemporaryDisplayPackageInfo: PackageInfo = {
      packageName: 'React',
      criticality: Criticality.None,
      id: expect.any(String),
    };

    const testAttributionId = faker.string.uuid();
    const { newManualData, newAttributionId } = createManualAttribution(
      testManualData,
      testSelectedResourceId,
      testAttributionId,
      testTemporaryDisplayPackageInfo,
      getCalculatePreferredOverOriginIds(initialResourceState),
    );
    expect(newManualData.attributions[newAttributionId]).toEqual(
      testTemporaryDisplayPackageInfo,
    );
    expect(newManualData.attributionsToResources[newAttributionId]).toEqual([
      '/something.js',
    ]);
  });

  it('correctly updates preferences', () => {
    const testSelectedResourceId = '/child';
    const testTemporaryDisplayPackageInfo: PackageInfo = {
      packageName: 'React',
      criticality: Criticality.None,
      id: faker.string.uuid(),
    };

    const testStore = createAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: { child: 1 },
          resourcesToExternalAttributions: {
            '/child': ['externalUuid'],
          },
          externalAttributions: {
            externalUuid: {
              source: { name: 'testSource', documentConfidence: 0 },
              originIds: ['originId'],
              criticality: Criticality.None,
              id: 'externalUuid',
            },
          },
          externalAttributionSources: {
            testSource: {
              name: 'Test source',
              priority: 0,
              isRelevantForPreferred: true,
            },
          },
          manualAttributions: {
            manualUuid1: {
              preferred: true,
              preferredOverOriginIds: ['originId'],
              criticality: Criticality.None,
              id: 'manualUuid1',
            },
          },
          resourcesToManualAttributions: {
            '/': ['manualUuid1'],
          },
        }),
      ),
    );
    const resourceState = testStore.getState().resourceState;
    const testManualData = getManualData(testStore.getState());

    const testAttributionId = faker.string.uuid();
    const { newManualData } = createManualAttribution(
      testManualData,
      testSelectedResourceId,
      testAttributionId,
      testTemporaryDisplayPackageInfo,
      getCalculatePreferredOverOriginIds(resourceState),
    );

    expect(newManualData.attributions['manualUuid1']).toEqual<PackageInfo>({
      id: 'manualUuid1',
      criticality: Criticality.None,
      preferred: true,
      preferredOverOriginIds: [],
    });
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
          criticality: Criticality.None,
          id: testUuid,
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
      new Set(),
      new Set(),
      getCalculatePreferredOverOriginIds(initialResourceState),
    );
    expect(isEmpty(newManualData.attributions)).toBe(true);
    expect(isEmpty(newManualData.resourcesToAttributions)).toBe(true);
    expect(isEmpty(newManualData.attributionsToResources)).toBe(true);
    expect(newManualData.resourcesWithAttributedChildren).toEqual({
      attributedChildren: {},
      pathsToIndices: {},
      paths: [],
    });
  });

  it('correctly maintains childrenFromAttributedResources', () => {
    const testAnotherUuid = '000';
    const testManualData: AttributionData = {
      attributions: {
        [testAnotherUuid]: {
          packageName: 'another testpackage',
          criticality: Criticality.None,
          id: testAnotherUuid,
        },
        [testUuid]: {
          packageName: 'testpackage',
          packageVersion: '2.0',
          licenseText: 'Permission is hereby granted',
          criticality: Criticality.None,
          id: testUuid,
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
      new Set(),
      new Set(),
      getCalculatePreferredOverOriginIds(initialResourceState),
    );
    expect(newManualData.attributions).toEqual<Attributions>({
      '000': {
        packageName: 'another testpackage',
        criticality: Criticality.None,
        id: '000',
      },
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

  it('correctly updates preferences', () => {
    const testStore = createAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: { child: 1 },
          resourcesToExternalAttributions: {
            '/child': ['externalUuid'],
          },
          externalAttributions: {
            externalUuid: {
              source: { name: 'testSource', documentConfidence: 0 },
              originIds: ['originId'],
              criticality: Criticality.None,
              id: 'externalUuid',
            },
          },
          externalAttributionSources: {
            testSource: {
              name: 'Test source',
              priority: 0,
              isRelevantForPreferred: true,
            },
          },
          manualAttributions: {
            manualUuid1: {
              preferred: true,
              preferredOverOriginIds: [],
              criticality: Criticality.None,
              id: 'manualUuid1',
            },
            manualUuid2: {
              criticality: Criticality.None,
              id: 'manualUuid2',
            },
          },
          resourcesToManualAttributions: {
            '/': ['manualUuid1'],
            '/child/': ['manualUuid2'],
          },
        }),
      ),
    );
    const resourceState = testStore.getState().resourceState;
    const testManualData = getManualData(testStore.getState());

    const newManualData: AttributionData = deleteManualAttribution(
      testManualData,
      'manualUuid2',
      new Set(),
      new Set(),
      getCalculatePreferredOverOriginIds(resourceState),
    );

    expect(newManualData.attributions['manualUuid1']).toEqual<PackageInfo>({
      id: 'manualUuid1',
      criticality: Criticality.None,
      preferred: true,
      preferredOverOriginIds: ['originId'],
    });
  });
});

describe('The updateManualAttribution function', () => {
  it('updates an existing manual attribution', () => {
    const testPackageInfo: PackageInfo = {
      packageName: 'Vue',
      criticality: Criticality.None,
      id: testUuid,
    };
    const testTemporaryDisplayPackageInfo: PackageInfo = {
      packageName: 'React',
      criticality: Criticality.None,
      id: testUuid,
    };
    const testResourcesToManualAttributions: ResourcesToAttributions = {
      '/something.js': [testUuid],
      'somethingElse.js': [testUuid],
    };
    const expectedManualAttributionsToResources: AttributionsToResources = {
      [testUuid]: ['/something.js', 'somethingElse.js'],
    };
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
      testTemporaryDisplayPackageInfo,
      '/something.js',
      getCalculatePreferredOverOriginIds(initialResourceState),
    );

    expect(newManualData.attributions).toEqual({
      [testUuid]: testTemporaryDisplayPackageInfo,
    });
    expect(newManualData.resourcesToAttributions).toEqual(
      testResourcesToManualAttributions,
    );
    expect(newManualData.attributionsToResources).toEqual(
      expectedManualAttributionsToResources,
    );
  });
});

describe('The linkToAttributionManualData function', () => {
  it('links a manual attribution', () => {
    const testManualData: AttributionData = {
      attributions: {
        [testUuid]: {
          packageName: 'testpackage',
          packageVersion: '2.0',
          licenseText: 'Permission is hereby granted',
          criticality: Criticality.None,
          id: testUuid,
        },
      },
      resourcesToAttributions: {},
      attributionsToResources: {},
      resourcesWithAttributedChildren: {
        attributedChildren: {},
        pathsToIndices: {
          '/': 0,
          '/first/': 1,
        },
        paths: ['/', '/first/'],
      },
    };

    const newManualData = linkToAttributionManualData(
      testManualData,
      '/first/',
      testUuid,
      new Set(),
      getCalculatePreferredOverOriginIds(initialResourceState),
    );

    expect(newManualData.attributions).toEqual(testManualData.attributions);
    expect(newManualData.resourcesToAttributions).toEqual({
      '/first/': [testUuid],
    });
    expect(newManualData.attributionsToResources).toEqual({
      [testUuid]: ['/first/'],
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

  it('correctly updates preferences', () => {
    const testSelectedResourceId = '/child';

    const testStore = createAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: { child: 1 },
          resourcesToExternalAttributions: {
            '/child': ['externalUuid'],
          },
          externalAttributions: {
            externalUuid: {
              source: { name: 'testSource', documentConfidence: 0 },
              originIds: ['originId'],
              criticality: Criticality.None,
              id: 'externalUuid',
            },
          },
          externalAttributionSources: {
            testSource: {
              name: 'Test source',
              priority: 0,
              isRelevantForPreferred: true,
            },
          },
          manualAttributions: {
            parentAttriubtionUuid: {
              preferred: true,
              preferredOverOriginIds: [],
              criticality: Criticality.None,
              id: 'parentAttriubtionUuid',
            },
            childAttributionUuid: {
              preferred: false,
              criticality: Criticality.None,
              id: 'childAttributionUuid',
            },
          },
          resourcesToManualAttributions: {
            '/': ['parentAttriubtionUuid'],
            '/child': ['childAttributionUuid'],
          },
        }),
      ),
    );
    const resourceState = testStore.getState().resourceState;
    const testManualData = getManualData(testStore.getState());

    const newManualData = linkToAttributionManualData(
      testManualData,
      testSelectedResourceId,
      'childAttributionUuid',
      new Set(),
      getCalculatePreferredOverOriginIds(resourceState),
    );

    expect(
      newManualData.attributions['parentAttriubtionUuid'],
    ).toEqual<PackageInfo>({
      id: 'parentAttriubtionUuid',
      criticality: Criticality.None,
      preferred: true,
      preferredOverOriginIds: [],
    });
  });
});

describe('The unlinkResourceFromAttributionId function', () => {
  it('unlinks a manual attribution', () => {
    const testManualData: AttributionData = {
      attributions: {
        [testUuid]: {
          packageName: 'testpackage',
          packageVersion: '2.0',
          licenseText: 'Permission is hereby granted',
          criticality: Criticality.None,
          id: testUuid,
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

    const newManualData: AttributionData = unlinkResourceFromAttributionId(
      testManualData,
      '/first/',
      testUuid,
      new Set(),
      getCalculatePreferredOverOriginIds(initialResourceState),
    );

    expect(newManualData.attributions).toEqual(testManualData.attributions);
    expect(isEmpty(newManualData.resourcesToAttributions)).toBe(true);
    expect(isEmpty(newManualData.attributionsToResources)).toBe(true);
    expect(newManualData.resourcesWithAttributedChildren).toEqual({
      attributedChildren: {},
      pathsToIndices: {},
      paths: [],
    });
  });

  it('correctly updates preferences', () => {
    const testSelectedResourceId = '/child';

    const testStore = createAppStore();
    testStore.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: { child: 1 },
          resourcesToExternalAttributions: {
            '/child': ['externalUuid'],
          },
          externalAttributions: {
            externalUuid: {
              source: { name: 'testSource', documentConfidence: 0 },
              originIds: ['originId'],
              criticality: Criticality.None,
              id: 'externalUuid',
            },
          },
          externalAttributionSources: {
            testSource: {
              name: 'Test source',
              priority: 0,
              isRelevantForPreferred: true,
            },
          },
          manualAttributions: {
            parentAttriubtionUuid: {
              preferred: true,
              preferredOverOriginIds: [],
              criticality: Criticality.None,
              id: 'parentAttriubtionUuid',
            },
            childAttributionUuid: {
              preferred: false,
              criticality: Criticality.None,
              id: 'childAttributionUuid',
            },
          },
          resourcesToManualAttributions: {
            '/': ['parentAttriubtionUuid'],
            '/child': ['childAttributionUuid'],
          },
        }),
      ),
    );
    const resourceState = testStore.getState().resourceState;
    const testManualData = getManualData(testStore.getState());

    const newManualData = unlinkResourceFromAttributionId(
      testManualData,
      testSelectedResourceId,
      'childAttributionUuid',
      new Set(),
      getCalculatePreferredOverOriginIds(resourceState),
    );

    expect(
      newManualData.attributions['parentAttriubtionUuid'],
    ).toEqual<PackageInfo>({
      id: 'parentAttriubtionUuid',
      criticality: Criticality.None,
      preferred: true,
      preferredOverOriginIds: ['originId'],
    });
  });
});

describe('_removeManualAttributionFromChildrenIfAllAreIdentical', () => {
  it('three matching', () => {
    const testManualData: AttributionData = {
      attributions: {
        uuid1: {
          packageName: 'React',
          criticality: Criticality.None,
          id: 'uuid1',
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
          '0': new Set<number>().add(1).add(2).add(3),
          '1': new Set<number>().add(2).add(3),
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
          criticality: Criticality.None,
          id: 'uuid1',
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
      new Set(),
    );
    expect(testManualData).toEqual(expectedStrippedManualData);
  });

  it('matching and non-matching children attributions', () => {
    const testManualData: AttributionData = {
      attributions: {
        uuid1: {
          packageName: 'React',
          criticality: Criticality.None,
          id: 'uuid1',
        },
        uuid2: {
          packageName: 'Vue',
          criticality: Criticality.None,
          id: 'uuid2',
        },
        uuid3: {
          packageName: 'Angular',
          criticality: Criticality.None,
          id: 'uuid3',
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
          '0': new Set<number>().add(1).add(2).add(3).add(4),
          '1': new Set<number>().add(2).add(3).add(4),
          '2': new Set<number>().add(3).add(4),
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
          criticality: Criticality.None,
          id: 'uuid1',
        },
        uuid2: {
          packageName: 'Vue',
          criticality: Criticality.None,
          id: 'uuid2',
        },
        uuid3: {
          packageName: 'Angular',
          criticality: Criticality.None,
          id: 'uuid3',
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
          '0': new Set<number>().add(1).add(3).add(4),
          '1': new Set<number>().add(3).add(4),
          '2': new Set<number>().add(3).add(4),
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
      new Set(),
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
          criticality: Criticality.None,
          id: 'uuid1',
        },
        uuid2: {
          packageName: 'Vue',
          criticality: Criticality.None,
          id: 'uuid2',
        },
        uuid3: {
          packageName: 'Angular',
          criticality: Criticality.None,
          id: 'uuid3',
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
          '0': new Set<number>().add(1).add(2).add(3).add(4),
          '1': new Set<number>().add(2).add(3).add(4),
          '2': new Set<number>().add(3).add(4),
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
          criticality: Criticality.None,
          id: 'uuid1',
        },
        uuid2: {
          packageName: 'Vue',
          criticality: Criticality.None,
          id: 'uuid2',
        },
        uuid3: {
          packageName: 'Angular',
          criticality: Criticality.None,
          id: 'uuid3',
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
          '0': new Set<number>().add(1).add(3).add(4),
          '1': new Set<number>().add(3).add(4),
          '2': new Set<number>().add(3).add(4),
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
      new Set(),
    );
    expect(testManualData).toEqual(expectedStrippedManualData);
  });

  it('child has subset of attributions from parent', () => {
    const testManualData: AttributionData = {
      attributions: {
        uuid1: {
          packageName: 'React',
          criticality: Criticality.None,
          id: 'uuid1',
        },
        uuid2: {
          packageName: 'Vue',
          criticality: Criticality.None,
          id: 'uuid2',
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
          '0': new Set<number>().add(1).add(2).add(3).add(4),
          '1': new Set<number>().add(2).add(3).add(4),
          '2': new Set<number>().add(3).add(4),
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
          criticality: Criticality.None,
          id: 'uuid1',
        },
        uuid2: {
          packageName: 'Vue',
          criticality: Criticality.None,
          id: 'uuid2',
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
          '0': new Set<number>().add(1).add(2).add(3).add(4),
          '1': new Set<number>().add(2).add(3).add(4),
          '2': new Set<number>().add(3).add(4),
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
      new Set(),
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
        testAttributionId,
      ),
    ).toEqual(expectedOutput);
  });

  it('returns only itself & parents if the resource cannot have children', () => {
    const testResourceId = '/parent/resource';
    const testAttributionId = 'ATTRIBUTION_ID';
    const expectedOutput = ['/parent/', testResourceId];
    const testAttributionsToResources = {
      [testAttributionId]: expectedOutput.concat(
        '/parent/resourceIncludeFakeChild',
      ),
    };

    expect(
      _getIdsOfResourcesThatMightHaveChildrenWithTheSameAttributions(
        testAttributionsToResources,
        testResourceId,
        testAttributionId,
      ),
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
        testAttributionId,
      ),
    ).toEqual(expectedOutput);
  });
});

describe('computeChildrenWithAttributions', () => {
  it('parses ResourcesWithAttributionsFromDb', () => {
    const testUuid = faker.string.uuid();
    const attributionsToResources: AttributionsToResources = {
      [testUuid]: ['/root/src/', '/root/src/something.js/subfolder'],
    };
    const result = computeChildrenWithAttributions(attributionsToResources);

    expect(result).toEqual({
      attributedChildren: {
        '0': new Set<number>().add(3),
        '1': new Set<number>().add(0).add(3),
        '2': new Set<number>().add(0).add(3),
        '4': new Set<number>().add(3),
      },
      pathsToIndices: {
        '/': 1,
        '/root/': 2,
        '/root/src/': 0,
        '/root/src/something.js/': 4,
        '/root/src/something.js/subfolder': 3,
      },
      paths: [
        '/root/src/',
        '/',
        '/root/',
        '/root/src/something.js/subfolder',
        '/root/src/something.js/',
      ],
    });
  });
});

describe('getWasPreferred', () => {
  const originalAttributionId = faker.string.uuid();

  it("returns the attribution's value of wasPreferred if it has no original", () => {
    const wasPreferred = getWasPreferred({
      packageInfo: faker.opossum.packageInfo({ wasPreferred: true }),
      externalAttributions: {},
    });
    const wasNotPreferred = getWasPreferred({
      packageInfo: faker.opossum.packageInfo(),
      externalAttributions: {},
    });

    expect(wasPreferred).toBe(true);
    expect(wasNotPreferred).toBeUndefined();
  });

  it('is undefined if original is equal but was not previously preferred', () => {
    const packageInfo = faker.opossum.packageInfo({
      originalAttributionId,
      wasPreferred: false,
    });
    const wasPreferred = getWasPreferred({
      packageInfo,
      externalAttributions: {
        [originalAttributionId]: { ...packageInfo, wasPreferred: undefined },
      },
    });

    expect(wasPreferred).toBeUndefined();
  });

  it('is true if original is equal and was previously preferred', () => {
    const packageInfo = faker.opossum.packageInfo({
      wasPreferred: true,
      originalAttributionId,
    });
    const wasPreferred = getWasPreferred({
      packageInfo: { ...packageInfo, wasPreferred: undefined },
      externalAttributions: { [originalAttributionId]: packageInfo },
    });

    expect(wasPreferred).toBe(true);
  });

  it('is false if original was previously preferred but is not equal', () => {
    const packageInfo = faker.opossum.packageInfo({
      wasPreferred: true,
      originalAttributionId,
    });
    const wasPreferred = getWasPreferred({
      packageInfo: { ...packageInfo, packageName: faker.word.noun() },
      externalAttributions: { [originalAttributionId]: packageInfo },
    });

    expect(wasPreferred).toBe(false);
  });
});
