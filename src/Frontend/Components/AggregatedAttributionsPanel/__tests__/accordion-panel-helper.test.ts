// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  AttributionIdWithCount,
  DisplayAttributionWithCount,
} from '../../../types/types';
import {
  Attributions,
  AttributionsToHashes,
  ResourcesToAttributions,
  ResourcesWithAttributedChildren,
} from '../../../../shared/shared-types';
import {
  getDisplayContainedManualPackagesWithCount,
  getDisplayExternalAttributionsWithCount,
} from '../accordion-panel-helpers';
import { PanelAttributionData } from '../../../util/get-contained-packages';

describe('getDisplayExternalAttributionsWithCount', () => {
  const testAttributionsWithIdCount: Array<AttributionIdWithCount> = [
    { attributionId: 'uuid1', count: 3 },
    { attributionId: 'uuid2', count: 2 },
  ];

  it('merges attributions with same hash', () => {
    const testAttributions: Attributions = {
      uuid1: { packageName: 'Typescript' },
      uuid2: { packageName: 'Typescript' },
    };
    const testExternalAttributionsToHashes: AttributionsToHashes = {
      uuid1: 'a',
      uuid2: 'a',
    };

    const expectedDisplayAttributions: Array<DisplayAttributionWithCount> = [
      {
        attributionId: 'uuid1',
        count: 5,
        attribution: {
          attributionIds: ['uuid1', 'uuid2'],
          packageName: 'Typescript',
        },
      },
    ];

    expect(
      getDisplayExternalAttributionsWithCount(
        testAttributionsWithIdCount,
        testAttributions,
        testExternalAttributionsToHashes
      )
    ).toEqual(expectedDisplayAttributions);
  });

  it('does not merge attributions without hash', () => {
    const testAttributions: Attributions = {
      uuid1: { packageName: 'Typescript' },
      uuid2: { packageName: 'Typescript' },
    };
    const testExternalAttributionsToHashes: AttributionsToHashes = {};

    const expectedDisplayAttributions: Array<DisplayAttributionWithCount> = [
      {
        attributionId: 'uuid1',
        count: 3,
        attribution: {
          packageName: 'Typescript',
          attributionIds: ['uuid1'],
        },
      },
      {
        attributionId: 'uuid2',
        count: 2,
        attribution: {
          packageName: 'Typescript',
          attributionIds: ['uuid2'],
        },
      },
    ];

    expect(
      getDisplayExternalAttributionsWithCount(
        testAttributionsWithIdCount,
        testAttributions,
        testExternalAttributionsToHashes
      )
    ).toEqual(expectedDisplayAttributions);
  });

  it('keeps the minimum confidence in the merged attribution', () => {
    const testAttributions: Attributions = {
      uuid1: { attributionConfidence: 20 },
      uuid2: { attributionConfidence: 80 },
    };
    const testExternalAttributionsToHashes: AttributionsToHashes = {
      uuid1: 'a',
      uuid2: 'a',
    };

    const expectedDisplayAttributions: Array<DisplayAttributionWithCount> = [
      {
        attributionId: 'uuid1',
        count: 5,
        attribution: {
          attributionIds: ['uuid1', 'uuid2'],
          attributionConfidence: 20,
        },
      },
    ];

    expect(
      getDisplayExternalAttributionsWithCount(
        testAttributionsWithIdCount,
        testAttributions,
        testExternalAttributionsToHashes
      )
    ).toEqual(expectedDisplayAttributions);
  });

  it('appends comments, skipping empty ones', () => {
    const testAttributionsWithIdCount: Array<AttributionIdWithCount> = [
      { attributionId: 'uuid1' },
      { attributionId: 'uuid2' },
      { attributionId: 'uuid3' },
      { attributionId: 'uuid4' },
    ];
    const testAttributions: Attributions = {
      uuid1: { comment: 'comment A' },
      uuid2: { comment: 'comment B' },
      uuid3: {},
      uuid4: { comment: '' },
    };
    const testExternalAttributionsToHashes: AttributionsToHashes = {
      uuid1: 'a',
      uuid2: 'a',
      uuid3: 'a',
      uuid4: 'a',
    };

    const expectedDisplayAttributions: Array<DisplayAttributionWithCount> = [
      {
        attributionId: 'uuid1',
        attribution: {
          attributionIds: ['uuid1', 'uuid2', 'uuid3', 'uuid4'],
          comments: ['comment A', 'comment B'],
        },
      },
    ];

    expect(
      getDisplayExternalAttributionsWithCount(
        testAttributionsWithIdCount,
        testAttributions,
        testExternalAttributionsToHashes
      )
    ).toEqual(expectedDisplayAttributions);
  });

  it('merges originIds, de-duplicating them', () => {
    const testAttributions: Attributions = {
      uuid1: { originIds: ['uuid3', 'uuid4'] },
      uuid2: { originIds: ['uuid3', 'uuid5'] },
    };
    const testExternalAttributionsToHashes: AttributionsToHashes = {
      uuid1: 'a',
      uuid2: 'a',
    };

    const expectedDisplayAttributions: Array<DisplayAttributionWithCount> = [
      {
        attributionId: 'uuid1',
        count: 5,
        attribution: {
          attributionIds: ['uuid1', 'uuid2'],
          originIds: ['uuid3', 'uuid4', 'uuid5'],
        },
      },
    ];

    expect(
      getDisplayExternalAttributionsWithCount(
        testAttributionsWithIdCount,
        testAttributions,
        testExternalAttributionsToHashes
      )
    ).toEqual(expectedDisplayAttributions);
  });
});

describe('getDisplayContainedManualPackagesWithCount', () => {
  it('yields correct results', () => {
    const selectedResourceId = 'folder/';
    const testAttributions: Attributions = {
      uuid_1: {
        packageName: 'React',
      },
      uuid_2: {
        packageName: 'Vue',
      },
      uuid_3: {
        packageName: 'Angular',
      },
    };
    const testResourcesToAttributions: ResourcesToAttributions = {
      'folder/file1': ['uuid_1', 'uuid_2'],
      'folder/file2': ['uuid_2', 'uuid_3'],
    };
    const testResourcesWithAttributedChildren: ResourcesWithAttributedChildren =
      {
        paths: ['folder/', 'folder/file1', 'folder/file2'],
        pathsToIndices: { 'folder/': 0, 'folder/file1': 1, 'folder/file2': 2 },
        attributedChildren: { 0: new Set([1, 2]) },
      };
    const manualData: PanelAttributionData = {
      attributions: testAttributions,
      resourcesToAttributions: testResourcesToAttributions,
      resourcesWithAttributedChildren: testResourcesWithAttributedChildren,
    };
    const expectedDisplayAttributionsWithCount: Array<DisplayAttributionWithCount> =
      [
        {
          attributionId: 'uuid_2',
          attribution: { packageName: 'Vue', attributionIds: ['uuid_2'] },
          count: 2,
        },
        {
          attributionId: 'uuid_3',
          attribution: { packageName: 'Angular', attributionIds: ['uuid_3'] },
          count: 1,
        },
        {
          attributionId: 'uuid_1',
          attribution: { packageName: 'React', attributionIds: ['uuid_1'] },
          count: 1,
        },
      ];

    const testDisplayAttributionsWithCount =
      getDisplayContainedManualPackagesWithCount({
        selectedResourceId,
        manualData,
      });

    expect(testDisplayAttributionsWithCount).toEqual(
      expectedDisplayAttributionsWithCount
    );
  });
});
