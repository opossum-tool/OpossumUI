// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { DisplayPackageInfo } from '../../../shared/shared-types';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../shared-constants';
import { DisplayAttributionWithCount } from '../../types/types';
import { getAttributionFromDisplayAttributionsWithCount } from '../get-attribution-from-display-attributions-with-count';

describe('getAttributionFromDisplayAttributionsWithCount', () => {
  it('finds item with queried attributionId', () => {
    const testAttributionId = 'uuid_1';
    const testDisplayAttributionsWithCount: Array<DisplayAttributionWithCount> =
      [
        {
          attributionId: 'uuid_1',
          attribution: {
            packageName: 'React',
            attributionIds: ['uuid_1', 'uuid_2'],
          },
          count: 3,
        },
        {
          attributionId: 'uuid_3',
          attribution: {
            packageName: 'Vue',
            attributionIds: ['uuid_3', 'uuid_4'],
          },
          count: 5,
        },
      ];
    const expectedAttribution: DisplayPackageInfo = {
      packageName: 'React',
      attributionIds: ['uuid_1', 'uuid_2'],
    };
    const testAttribution = getAttributionFromDisplayAttributionsWithCount(
      testAttributionId,
      testDisplayAttributionsWithCount
    );
    expect(testAttribution).toEqual(expectedAttribution);
  });

  it('finds first item that matches the attributionId', () => {
    const testAttributionId = 'uuid_1';
    const testDisplayAttributionsWithCount: Array<DisplayAttributionWithCount> =
      [
        {
          attributionId: 'uuid_1',
          attribution: {
            packageName: 'React',
            attributionIds: ['uuid_1'],
          },
          count: 3,
        },
        {
          attributionId: 'uuid_1',
          attribution: {
            packageName: 'Vue',
            attributionIds: ['uuid_1'],
          },
          count: 5,
        },
      ];
    const expectedAttribution: DisplayPackageInfo = {
      packageName: 'React',
      attributionIds: ['uuid_1'],
    };
    const testAttribution = getAttributionFromDisplayAttributionsWithCount(
      testAttributionId,
      testDisplayAttributionsWithCount
    );
    expect(testAttribution).toEqual(expectedAttribution);
  });

  it('yields an empty DisplayPackageInfo if no matching item is found', () => {
    const testAttributionId = 'uuid_3';
    const testDisplayAttributionsWithCount: Array<DisplayAttributionWithCount> =
      [
        {
          attributionId: 'uuid_1',
          attribution: {
            packageName: 'React',
            attributionIds: ['uuid_1'],
          },
          count: 3,
        },
        {
          attributionId: 'uuid_2',
          attribution: {
            packageName: 'Vue',
            attributionIds: ['uuid_2'],
          },
          count: 5,
        },
      ];
    const expectedAttribution: DisplayPackageInfo = EMPTY_DISPLAY_PACKAGE_INFO;
    const testAttribution = getAttributionFromDisplayAttributionsWithCount(
      testAttributionId,
      testDisplayAttributionsWithCount
    );
    expect(testAttribution).toEqual(expectedAttribution);
  });
});
