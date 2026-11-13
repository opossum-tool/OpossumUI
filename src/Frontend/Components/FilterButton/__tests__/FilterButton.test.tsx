// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../shared/text';
import {
  clickClearFiltersMenuItem,
  clickFilterMenuItem,
  getButton,
} from '../../../../testing/ui';
import { renderComponent } from '../../../test-helpers/render';
import { FilterButton } from '../FilterButton';

describe('FilterButton', () => {
  it.each([false, true])(
    'dismisses on Tab (shift: %s) and restores focus',
    async (shift) => {
      const onOpenChange = vi.fn();
      await renderFilterButton({ onOpenChange });
      const trigger = getButton('filter button');
      await userEvent.click(trigger);

      await userEvent.tab({ shift });

      await waitFor(() =>
        expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
      );
      expect(trigger).toHaveFocus();
      expect(onOpenChange).toHaveBeenCalledTimes(2);
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
    },
  );

  it('adds a filter', async () => {
    const onAdd = vi.fn();
    await renderFilterButton({ onAdd });

    await userEvent.click(getButton('filter button'));
    await clickFilterMenuItem('test filter');

    expect(onAdd).toHaveBeenCalledOnce();
  });

  it('removes a selected filter', async () => {
    const onDelete = vi.fn();
    await renderFilterButton({
      selected: true,
      onDelete,
    });

    await userEvent.click(getButton('filter button'));
    await clickFilterMenuItem('test filter');

    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('clears filters when active', async () => {
    const onClear = vi.fn();
    await renderFilterButton({ isActive: true, onClear });

    await userEvent.click(getButton('filter button'));
    await clickClearFiltersMenuItem();

    expect(onClear).toHaveBeenCalledOnce();
  });

  it('does not show a clear action without a callback', async () => {
    await renderFilterButton({ isActive: true });

    await userEvent.click(getButton('filter button'));

    expect(
      screen.queryByRole('menuitem', { name: text.packageLists.clearFilters }),
    ).not.toBeInTheDocument();
  });

  it('reports when the filter menu opens and closes', async () => {
    const onOpenChange = vi.fn();
    await renderFilterButton({ onOpenChange });

    await userEvent.click(getButton('filter button'));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('menu')).not.toBeInTheDocument(),
    );
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});

async function renderFilterButton({
  selected = false,
  isActive = false,
  onAdd = vi.fn(),
  onDelete = vi.fn(),
  onClear,
  onOpenChange,
}: {
  selected?: boolean;
  isActive?: boolean;
  onAdd?: () => void;
  onDelete?: () => void;
  onClear?: () => void;
  onOpenChange?: (open: boolean) => void;
}) {
  return renderComponent(
    <FilterButton
      options={[
        {
          kind: 'toggle',
          id: 'test-filter',
          label: 'test filter',
          selected,
          onAdd,
          onDelete,
        },
      ]}
      isActive={isActive}
      onClear={onClear}
      onOpenChange={onOpenChange}
    />,
  );
}
