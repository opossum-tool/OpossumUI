// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { faker } from '../../../../testing/Faker';
import { Sorting } from '../../../shared-constants';
import {
  FilteredData,
  initialFilteredAttributions,
  UseFilteredData,
} from '../../../state/variables/use-filtered-data';
import { renderComponent } from '../../../test-helpers/render';
import { SortButton } from '../SortButton';

describe('SortButton', () => {
  it('switches to selected sorting', async () => {
    let result: FilteredData;
    const prev: FilteredData = initialFilteredAttributions;
    const setFilteredData = jest.fn((fn) => {
      result = fn(prev);
    });
    const sorting: Sorting = 'By Criticality';
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: faker.opossum.attributions(),
      },
      setFilteredData,
    ];
    renderComponent(<SortButton useFilteredData={useFilteredData} />);

    await userEvent.click(screen.getByRole('button', { name: 'sort button' }));
    await userEvent.click(screen.getByRole('menuitem', { name: sorting }));

    expect(result!.sorting).toEqual(sorting);
  });

  it('sort button is disabled when there are no attributions', () => {
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: {},
      },
      jest.fn(),
    ];
    renderComponent(<SortButton useFilteredData={useFilteredData} />);

    expect(screen.getByRole('button', { name: 'sort button' })).toBeDisabled();
  });
});
