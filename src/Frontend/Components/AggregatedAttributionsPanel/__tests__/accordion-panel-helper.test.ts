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
} from '../../../../shared/shared-types';
import { getDisplayAttributionsWithCount } from '../accordion-panel-helpers';

describe('getDisplayAttributionsWithCount', () => {
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
          attributionConfidence: 0,
        },
      },
    ];

    expect(
      getDisplayAttributionsWithCount(
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
          attributionConfidence: 0,
          attributionIds: ['uuid1'],
        },
      },
      {
        attributionId: 'uuid2',
        count: 2,
        attribution: {
          packageName: 'Typescript',
          attributionConfidence: 0,
          attributionIds: ['uuid2'],
        },
      },
    ];

    expect(
      getDisplayAttributionsWithCount(
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
      getDisplayAttributionsWithCount(
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
          attributionConfidence: 0,
          comments: ['comment A', 'comment B'],
        },
      },
    ];

    expect(
      getDisplayAttributionsWithCount(
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
          attributionConfidence: 0,
          originIds: ['uuid3', 'uuid4', 'uuid5'],
        },
      },
    ];

    expect(
      getDisplayAttributionsWithCount(
        testAttributionsWithIdCount,
        testAttributions,
        testExternalAttributionsToHashes
      )
    ).toEqual(expectedDisplayAttributions);
  });
});
