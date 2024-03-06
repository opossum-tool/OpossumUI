// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { Filter } from '../../../shared-constants';
import {
  FilteredData,
  initialFilteredAttributions,
  UseFilteredData,
} from '../../../state/variables/use-filtered-data';
import { renderComponent } from '../../../test-helpers/render';
import { FilterButton } from '../FilterButton';

describe('FilterButton', () => {
  it('adds selected filter', async () => {
    let result: FilteredData;
    const prev: FilteredData = initialFilteredAttributions;
    const setFilteredData = jest.fn((fn) => {
      result = fn(prev);
    });
    const filter: Filter = 'Currently Preferred';
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: faker.opossum.attributions(),
      },
      setFilteredData,
    ];
    renderComponent(
      <FilterButton
        useFilteredData={useFilteredData}
        availableFilters={[filter]}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'filter button' }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: filter }));

    expect(result!.filters).toEqual([filter]);
  });

  it('removes selected filter', async () => {
    let result: FilteredData;
    const prev: FilteredData = initialFilteredAttributions;
    const setFilteredData = jest.fn((fn) => {
      result = fn(prev);
    });
    const filter: Filter = 'Currently Preferred';
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        filters: [filter],
        attributions: faker.opossum.attributions(),
      },
      setFilteredData,
    ];
    renderComponent(
      <FilterButton
        useFilteredData={useFilteredData}
        availableFilters={[filter]}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'filter button' }),
    );
    await userEvent.click(screen.getByRole('menuitem', { name: filter }));

    expect(result!.filters).toEqual([]);
  });

  it('filters by license name via keyboard selection', async () => {
    let result: FilteredData;
    const prev: FilteredData = initialFilteredAttributions;
    const setFilteredData = jest.fn((fn) => {
      result = fn(prev);
    });
    const packageInfo = faker.opossum.packageInfo();
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: faker.opossum.attributions({
          [packageInfo.id]: packageInfo,
        }),
      },
      setFilteredData,
    ];
    renderComponent(
      <FilterButton useFilteredData={useFilteredData} availableFilters={[]} />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'filter button' }),
    );
    await userEvent.click(screen.getByLabelText('license names'));
    await userEvent.keyboard('{ArrowUp}');
    await userEvent.keyboard('{Enter}');

    expect(result!.selectedLicense).toBe(packageInfo.licenseName);
  });

  it('filters by license name via search', async () => {
    let result: FilteredData;
    const prev: FilteredData = initialFilteredAttributions;
    const setFilteredData = jest.fn((fn) => {
      result = fn(prev);
    });
    const licenseName = faker.commerce.productName();
    const packageInfo = faker.opossum.packageInfo({ licenseName });
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: faker.opossum.attributions({
          [packageInfo.id]: packageInfo,
        }),
      },
      setFilteredData,
    ];
    renderComponent(
      <FilterButton useFilteredData={useFilteredData} availableFilters={[]} />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'filter button' }),
    );
    await userEvent.click(screen.getByLabelText('license names'));
    await userEvent.paste(licenseName);
    await userEvent.keyboard('{ArrowUp}');
    await userEvent.keyboard('{Enter}');

    expect(result!.selectedLicense).toBe(licenseName);
  });

  it('filters by license name via mouse click', async () => {
    let result: FilteredData;
    const prev: FilteredData = initialFilteredAttributions;
    const setFilteredData = jest.fn((fn) => {
      result = fn(prev);
    });
    const packageInfo = faker.opossum.packageInfo();
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: faker.opossum.attributions({
          [packageInfo.id]: packageInfo,
        }),
      },
      setFilteredData,
    ];
    renderComponent(
      <FilterButton useFilteredData={useFilteredData} availableFilters={[]} />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'filter button' }),
    );
    await userEvent.click(screen.getByLabelText('license names'));
    await userEvent.click(screen.getByText(packageInfo.licenseName!));

    expect(result!.selectedLicense).toBe(packageInfo.licenseName);
  });

  it('removes filter by license name', async () => {
    let result: FilteredData;
    const prev: FilteredData = initialFilteredAttributions;
    const setFilteredData = jest.fn((fn) => {
      result = fn(prev);
    });
    const packageInfo = faker.opossum.packageInfo();
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        selectedLicense: packageInfo.licenseName!,
        attributions: faker.opossum.attributions({
          [packageInfo.id]: packageInfo,
        }),
      },
      setFilteredData,
    ];
    renderComponent(
      <FilterButton useFilteredData={useFilteredData} availableFilters={[]} />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'filter button' }),
    );
    await userEvent.click(screen.getByLabelText('clear button'));

    expect(result!.selectedLicense).toBe('');
  });

  it('removes all selected filters via clear button', async () => {
    let result: FilteredData;
    const prev: FilteredData = initialFilteredAttributions;
    const setFilteredData = jest.fn((fn) => {
      result = fn(prev);
    });
    const packageInfo = faker.opossum.packageInfo();
    const filter: Filter = 'Currently Preferred';
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        filters: [filter],
        selectedLicense: packageInfo.licenseName!,
        attributions: faker.opossum.attributions({
          [packageInfo.id]: packageInfo,
        }),
      },
      setFilteredData,
    ];
    renderComponent(
      <FilterButton
        useFilteredData={useFilteredData}
        availableFilters={[filter]}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'filter button' }),
    );
    await userEvent.click(
      screen.getByLabelText(text.packageLists.clearFilters),
    );

    expect(result!.filters).toEqual([]);
    expect(result!.selectedLicense).toBe('');
  });

  it('filter button is disabled when there are no attributions', () => {
    const useFilteredData: UseFilteredData = () => [
      {
        ...initialFilteredAttributions,
        attributions: {},
      },
      jest.fn(),
    ];
    renderComponent(
      <FilterButton useFilteredData={useFilteredData} availableFilters={[]} />,
    );

    expect(
      screen.getByRole('button', { name: 'filter button' }),
    ).toBeDisabled();
  });
});
