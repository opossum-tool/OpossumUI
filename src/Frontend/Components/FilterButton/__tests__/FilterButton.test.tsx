// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../shared/text';
import { renderComponent } from '../../../test-helpers/render';
import { FilterButton } from '../FilterButton';

describe('FilterButton', () => {
  it('adds a filter', async () => {
    const onAdd = vi.fn();
    await renderFilterButton({ onAdd });

    await userEvent.click(
      screen.getByRole('button', { name: 'filter button' }),
    );
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'test filter' }),
    );

    expect(onAdd).toHaveBeenCalledOnce();
  });

  it('removes a selected filter', async () => {
    const onDelete = vi.fn();
    await renderFilterButton({
      selected: true,
      onDelete,
    });

    await userEvent.click(
      screen.getByRole('button', { name: 'filter button' }),
    );
    await userEvent.click(
      screen.getByRole('menuitem', { name: 'test filter' }),
    );

    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('clears filters when active', async () => {
    const onClear = vi.fn();
    await renderFilterButton({ isActive: true, onClear });

    await userEvent.click(
      screen.getByRole('button', { name: 'filter button' }),
    );
    await userEvent.click(
      screen.getByRole('menuitem', { name: text.packageLists.clearFilters }),
    );

    expect(onClear).toHaveBeenCalledOnce();
  });

  it('does not show a clear action without a callback', async () => {
    await renderFilterButton({ isActive: true });

    await userEvent.click(
      screen.getByRole('button', { name: 'filter button' }),
    );

    expect(
      screen.queryByRole('menuitem', { name: text.packageLists.clearFilters }),
    ).not.toBeInTheDocument();
  });
});

async function renderFilterButton({
  selected = false,
  isActive = false,
  onAdd = vi.fn(),
  onDelete = vi.fn(),
  onClear,
}: {
  selected?: boolean;
  isActive?: boolean;
  onAdd?: () => void;
  onDelete?: () => void;
  onClear?: () => void;
}) {
  return renderComponent(
    <FilterButton
      options={[
        { id: 'test-filter', label: 'test filter', selected, onAdd, onDelete },
      ]}
      isActive={isActive}
      onClear={onClear}
    />,
  );
}
