// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackagePanelTitle } from '../../../../enums/enums';
import { createTestAppStore } from '../../../../test-helpers/render-component-with-store';
import { PanelPackage } from '../../../../types/types';
import {
  getDisplayedPackage,
  getExpandedIds,
  getResolvedExternalAttributions,
  getSelectedResourceId,
  getTargetDisplayedPackage,
  getTargetSelectedResourceId,
} from '../../../selectors/audit-view-resource-selectors';
import {
  addResolvedExternalAttribution,
  removeResolvedExternalAttribution,
  setDisplayedPackage,
  setExpandedIds,
  setSelectedResourceId,
  setTargetDisplayedPackage,
  setTargetSelectedResourceId,
} from '../audit-view-simple-actions';
import { setExternalData, setResources } from '../all-views-simple-actions';
import {
  Attributions,
  ResourcesToAttributions,
} from '../../../../../shared/shared-types';
import { getResourcesWithExternalAttributedChildren } from '../../../selectors/all-views-resource-selectors';

describe('The audit view simple actions', () => {
  it('sets and gets selectedResourceId', () => {
    const testStore = createTestAppStore();
    testStore.dispatch(setSelectedResourceId('test'));
    expect(getSelectedResourceId(testStore.getState())).toBe('test');
  });

  it('sets and gets targetSelectedResourceId', () => {
    const testTargetSelectedResourceId = 'test_id';
    const testStore = createTestAppStore();
    testStore.dispatch(
      setTargetSelectedResourceId(testTargetSelectedResourceId)
    );
    expect(getTargetSelectedResourceId(testStore.getState())).toBe(
      testTargetSelectedResourceId
    );
  });

  it('sets and gets expandedIds', () => {
    const testExpandedIds: Array<string> = ['/folder1/', '/folder2/'];

    const testStore = createTestAppStore();
    expect(getExpandedIds(testStore.getState())).toEqual(['/']);

    testStore.dispatch(setExpandedIds(testExpandedIds));
    expect(getExpandedIds(testStore.getState())).toEqual(testExpandedIds);
  });

  it('sets and gets displayedPackage', () => {
    const testSelectedPackage: PanelPackage = {
      panel: PackagePanelTitle.AllAttributions,
      packageCardId: 'All Attributions-0',
      displayPackageInfo: { packageName: 'react', attributionIds: ['uuid'] },
    };

    const testStore = createTestAppStore();
    expect(getDisplayedPackage(testStore.getState())).toBeNull();

    testStore.dispatch(setDisplayedPackage(testSelectedPackage));
    expect(getDisplayedPackage(testStore.getState())).toEqual(
      testSelectedPackage
    );
  });

  it('sets and gets targetDisplayedPackage', () => {
    const testTargetSelectedPackage: PanelPackage = {
      panel: PackagePanelTitle.AllAttributions,
      packageCardId: 'All Attributions-0',
      displayPackageInfo: { packageName: 'react', attributionIds: ['uuid'] },
    };

    const testStore = createTestAppStore();
    expect(getTargetDisplayedPackage(testStore.getState())).toBeNull();

    testStore.dispatch(setTargetDisplayedPackage(testTargetSelectedPackage));
    expect(getTargetDisplayedPackage(testStore.getState())).toEqual(
      testTargetSelectedPackage
    );
  });

  it('add resolved external attributions to state', () => {
    const testStore = createTestAppStore();
    const uuid1 = 'd3a753c0-5100-11eb-ae93-0242ac130002';
    const uuid2 = 'd3a7565e-5100-11eb-ae93-0242ac130002';
    const expectedResolvedExternalAttributions: Set<string> = new Set();
    const testExternalAttributions: Attributions = {
      [uuid1]: { packageName: 'jquery' },
      [uuid2]: { packageName: 'react' },
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/root/src/': [uuid1],
      '/root/external/': [uuid2],
    };

    testStore.dispatch(
      setExternalData(
        testExternalAttributions,
        testResourcesToExternalAttributions
      )
    );

    expect(
      getResourcesWithExternalAttributedChildren(testStore.getState())
    ).toMatchObject({
      attributedChildren: {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        '1': new Set<number>().add(0).add(3),
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        '2': new Set<number>().add(0).add(3),
      },
      pathsToIndices: {
        '/': 1,
        '/root/': 2,
        '/root/external/': 3,
        '/root/src/': 0,
      },
      paths: ['/root/src/', '/', '/root/', '/root/external/'],
    });

    expectedResolvedExternalAttributions.add(uuid1).add(uuid2);
    testStore.dispatch(setResources({}));

    expect(getResolvedExternalAttributions(testStore.getState())).toMatchObject(
      new Set()
    );

    testStore.dispatch(addResolvedExternalAttribution(uuid1));
    testStore.dispatch(addResolvedExternalAttribution(uuid2));
    expect(getResolvedExternalAttributions(testStore.getState())).toMatchObject(
      expectedResolvedExternalAttributions
    );
    expect(
      getResourcesWithExternalAttributedChildren(testStore.getState())
    ).toMatchObject({});

    // Test that external attributions are deduplicated
    testStore.dispatch(addResolvedExternalAttribution(uuid1));
    expect(getResolvedExternalAttributions(testStore.getState())).toMatchObject(
      expectedResolvedExternalAttributions
    );
    expect(
      getResourcesWithExternalAttributedChildren(testStore.getState())
    ).toMatchObject({});
  });

  it('remove resolved external attributions from state', () => {
    const testStore = createTestAppStore();
    const uuid1 = 'd3a753c0-5100-11eb-ae93-0242ac130002';
    const uuid2 = 'd3a7565e-5100-11eb-ae93-0242ac130002';
    const uuid3 = 'd3a75926-5100-11eb-ae93-0242ac130002';
    const testExternalAttributions: Attributions = {
      [uuid1]: { packageName: 'jquery' },
      [uuid2]: { packageName: 'react' },
      [uuid3]: { packageName: 'angular' },
    };
    const testResourcesToExternalAttributions: ResourcesToAttributions = {
      '/root/src/': [uuid1, uuid3],
      '/root/external/': [uuid2],
    };

    testStore.dispatch(
      setExternalData(
        testExternalAttributions,
        testResourcesToExternalAttributions
      )
    );

    testStore.dispatch(setResources({}));

    testStore.dispatch(addResolvedExternalAttribution(uuid1));
    testStore.dispatch(addResolvedExternalAttribution(uuid2));
    expect(getResolvedExternalAttributions(testStore.getState())).toEqual(
      new Set([uuid1, uuid2])
    );
    expect(
      getResourcesWithExternalAttributedChildren(testStore.getState())
    ).toEqual({
      attributedChildren: {
        '1': new Set<number>().add(0),
        '2': new Set<number>().add(0),
      },
      pathsToIndices: {
        '/': 1,
        '/root/': 2,
        '/root/external/': 3,
        '/root/src/': 0,
      },
      paths: ['/root/src/', '/', '/root/', '/root/external/'],
    });

    testStore.dispatch(addResolvedExternalAttribution(uuid3));
    expect(getResolvedExternalAttributions(testStore.getState())).toEqual(
      new Set([uuid1, uuid2, uuid3])
    );
    expect(
      getResourcesWithExternalAttributedChildren(testStore.getState())
    ).toEqual({
      attributedChildren: {},
      pathsToIndices: {
        '/': 1,
        '/root/': 2,
        '/root/external/': 3,
        '/root/src/': 0,
      },
      paths: ['/root/src/', '/', '/root/', '/root/external/'],
    });

    testStore.dispatch(removeResolvedExternalAttribution(uuid2));
    expect(getResolvedExternalAttributions(testStore.getState())).toEqual(
      new Set([uuid1, uuid3])
    );

    expect(
      getResourcesWithExternalAttributedChildren(testStore.getState())
    ).toEqual({
      attributedChildren: {
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        '1': new Set<number>().add(3),
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        '2': new Set<number>().add(3),
      },
      pathsToIndices: {
        '/': 1,
        '/root/': 2,
        '/root/external/': 3,
        '/root/src/': 0,
      },
      paths: ['/root/src/', '/', '/root/', '/root/external/'],
    });
  });
});
