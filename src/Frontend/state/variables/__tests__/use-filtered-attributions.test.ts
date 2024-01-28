// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker } from '../../../../testing/Faker';
import { renderHook } from '../../../test-helpers/render';
import { setManualData } from '../../actions/resource-actions/all-views-simple-actions';
import { setVariable } from '../../actions/variables-actions/variables-actions';
import {
  FILTERED_ATTRIBUTIONS,
  FilteredAttributions,
  initialFilteredAttributions,
  useFilteredAttributions,
} from '../use-filtered-attributions';

describe('useFilteredAttributions', () => {
  it('returns all manual attributions when no filters set', () => {
    const manualAttributions = faker.opossum.attributions();
    const { result } = renderHook(() => useFilteredAttributions(), {
      actions: [
        setManualData(
          manualAttributions,
          faker.opossum.resourcesToAttributions(),
        ),
      ],
    });

    expect(result.current[0].attributions).toEqual(manualAttributions);
  });

  it('returns filtered manual attributions when filters set', () => {
    const manualAttributions = faker.opossum.attributions();
    const { result } = renderHook(() => useFilteredAttributions(), {
      actions: [
        setManualData(
          manualAttributions,
          faker.opossum.resourcesToAttributions(),
        ),
        setVariable<FilteredAttributions>(FILTERED_ATTRIBUTIONS, {
          ...initialFilteredAttributions,
          selectedFilters: ['First Party'],
        }),
      ],
    });

    expect(result.current[0].attributions).toEqual({});
  });
});
