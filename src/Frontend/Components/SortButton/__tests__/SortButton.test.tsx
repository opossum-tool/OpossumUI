// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../shared/text';
import {
  AttributionFilters,
  initialFilters,
  UseAttributionFilters,
} from '../../../state/variables/use-filters';
import { renderComponent } from '../../../test-helpers/render';
import { SortButton } from '../SortButton';
import { SortOption } from '../useSortingOptions';

describe('SortButton', () => {
  it('switches to selected sorting', async () => {
    let result: AttributionFilters;
    const prev: AttributionFilters = initialFilters;
    const setFilteredData = vi.fn((fn) => {
      result = fn(prev);
    });
    const sorting: SortOption = 'criticality';
    const useFilteredData: UseAttributionFilters = () => [
      initialFilters,
      setFilteredData,
    ];
    await renderComponent(<SortButton useFilteredData={useFilteredData} />);

    await userEvent.click(screen.getByRole('button', { name: 'sort button' }));
    await userEvent.click(
      screen.getByRole('menuitem', { name: text.sortings.criticality }),
    );

    expect(result!.sorting).toEqual(sorting);
  });

  it('sort button is disabled when there are no attributions', async () => {
    const useFilteredData: UseAttributionFilters = () => [
      initialFilters,
      vi.fn(),
    ];
    await renderComponent(
      <SortButton useFilteredData={useFilteredData} disabled />,
    );

    expect(screen.getByRole('button', { name: 'sort button' })).toBeDisabled();
  });

  it('shows all sort options', async () => {
    const useFilteredData: UseAttributionFilters = () => [
      initialFilters,
      vi.fn(),
    ];
    await renderComponent(<SortButton useFilteredData={useFilteredData} />);

    await userEvent.click(screen.getByRole('button', { name: 'sort button' }));
    Object.values(text.sortings).forEach((menuItemText) => {
      expect(
        screen.getByRole('menuitem', { name: menuItemText }),
      ).toBeVisible();
    });
  });
});
