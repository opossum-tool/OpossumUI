// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { DisplayAttributionWithCount } from '../../../types/types';
import { getFilteredPackageIdsFromDisplayAttributions } from '../package-list-helpers';

describe('The PackageListHelper', () => {
  it('filters Attributions', () => {
    const testDisplayAttributions: Array<DisplayAttributionWithCount> = [
      {
        attributionId: 'uuid1',
        attribution: {
          packageName: 'Search_term package',
          attributionIds: ['uuid1'],
        },
      },
      {
        attributionId: 'uuid2',
        attribution: {
          copyright: '(c) Search_term 2022',
          attributionIds: ['uuid2'],
        },
      },
      {
        attributionId: 'uuid3',
        attribution: {
          licenseName: 'Search_term licence',
          attributionIds: ['uuid3'],
        },
      },
      {
        attributionId: 'uuid4',
        attribution: {
          packageVersion: 'version search_term',
          attributionIds: ['uuid4'],
        },
      },
      {
        attributionId: 'uuid5',
        attribution: {
          comments: ['comment search_term'],
          licenseText: 'text search_term',
          url: 'www.search_term.com',
          attributionIds: ['uuid5'],
        },
      },
    ];
    const filteredTestAttributions =
      getFilteredPackageIdsFromDisplayAttributions(
        testDisplayAttributions,
        'SeArCh_TeRm'
      );

    expect(filteredTestAttributions).toContain('uuid1');
    expect(filteredTestAttributions).toContain('uuid2');
    expect(filteredTestAttributions).toContain('uuid3');
    expect(filteredTestAttributions).toContain('uuid4');
    expect(filteredTestAttributions).not.toContain('uuid5');
  });

  it('sorts Attributions', () => {
    const testDisplayAttributions: Array<DisplayAttributionWithCount> = [
      {
        attributionId: 'uuid1',
        attribution: {
          packageName: 'package 3',
          attributionIds: ['uuid1'],
        },
      },
      {
        attributionId: 'uuid2',
        attribution: {
          packageName: 'package 1',
          attributionIds: ['uuid2'],
        },
      },
      {
        attributionId: 'uuid3',
        attribution: {
          packageName: 'package 2',
          attributionIds: ['uuid3'],
        },
      },
    ];
    const filteredTestAttributions =
      getFilteredPackageIdsFromDisplayAttributions(testDisplayAttributions, '');
    expect(filteredTestAttributions).toEqual(['uuid1', 'uuid2', 'uuid3']);
  });
});
