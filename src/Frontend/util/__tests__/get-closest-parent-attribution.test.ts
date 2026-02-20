// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ResourcesToAttributions } from '../../../shared/shared-types';
import { getClosestParentWithAttributions } from '../get-closest-parent-attributions';

describe('getClosestParentWithAttributions', () => {
  it('returns the id of the closest parent with attributions', () => {
    const childId = '/parent1/parent2/parent3/child';
    const resourcesToAttributions: ResourcesToAttributions = {
      '/parent1/parent2/': ['uuid1'],
      '/parent1/': ['uuid1'],
    };

    expect(
      getClosestParentWithAttributions(
        childId,
        resourcesToAttributions,
        new Set(),
      ),
    ).toBe('/parent1/parent2/');
  });

  it('respects breakpoints', () => {
    const childId = '/parent1/parent2/parent3/child';
    const resourcesToAttributions: ResourcesToAttributions = {
      '/parent1/parent2/': ['uuid1'],
      '/parent1/': ['uuid1'],
    };

    expect(
      getClosestParentWithAttributions(
        childId,
        resourcesToAttributions,
        new Set(['/parent1/parent2/parent3/']),
      ),
    ).toBeNull();
  });
});
