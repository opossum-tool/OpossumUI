// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { SortOption } from '../../../../shared/attribution-result-set';
import { text } from '../../../../shared/text';
import { setUserSetting } from '../../../state/actions/user-settings-actions/user-settings-actions';
import { renderComponent } from '../../../test-helpers/render';
import { SortButton } from '../SortButton';

describe('SortButton', () => {
  it('switches to selected sorting', async () => {
    const onSortingChange = vi.fn();
    const sorting: SortOption = 'criticality';
    await renderComponent(
      <SortButton sorting="alphabetically" onSortingChange={onSortingChange} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'sort button' }));
    await userEvent.click(
      screen.getByRole('menuitem', { name: text.sortings.criticality }),
    );

    expect(onSortingChange).toHaveBeenCalledWith(sorting);
  });

  it('respects the disabled prop', async () => {
    await renderComponent(
      <SortButton
        sorting="alphabetically"
        onSortingChange={vi.fn()}
        disabled
      />,
    );

    expect(screen.getByRole('button', { name: 'sort button' })).toBeDisabled();
  });

  it('shows the current sorting as a badge', async () => {
    await renderComponent(
      <SortButton sorting="occurrence" onSortingChange={vi.fn()} />,
    );
    const button = screen.getByRole('button', { name: 'sort button' });
    expect(within(button).getByTestId('BarChartIcon')).toBeVisible();
    await userEvent.hover(within(button).getByTestId('SortIcon'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      text.buttons.sort,
    );
  });

  it.each(['criticality', 'classification'] as const)(
    'falls back from %s and hides options disabled by user settings',
    async (sorting) => {
      const onSortingChange = vi.fn();
      await renderComponent(
        <SortButton sorting={sorting} onSortingChange={onSortingChange} />,
        {
          actions: [
            setUserSetting({
              showCriticality: false,
              showClassifications: false,
            }),
          ],
        },
      );

      expect(onSortingChange).toHaveBeenCalledWith('alphabetically');
      await userEvent.click(
        screen.getByRole('button', { name: 'sort button' }),
      );
      expect(
        screen.queryByRole('menuitem', { name: text.sortings.criticality }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('menuitem', { name: text.sortings.classification }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('menuitem', { name: text.sortings.name }),
      ).toBeVisible();
      expect(
        screen.getByRole('menuitem', { name: text.sortings.occurrence }),
      ).toBeVisible();
    },
  );

  it('falls back and hides criticality sorting when its setting is disabled at runtime', async () => {
    const onSortingChange = vi.fn();
    const { store } = await renderComponent(
      <SortButton sorting="criticality" onSortingChange={onSortingChange} />,
    );

    store.dispatch(setUserSetting({ showCriticality: false }));

    await waitFor(() =>
      expect(onSortingChange).toHaveBeenCalledWith('alphabetically'),
    );
    await userEvent.click(screen.getByRole('button', { name: 'sort button' }));
    expect(
      screen.queryByRole('menuitem', { name: text.sortings.criticality }),
    ).not.toBeInTheDocument();
  });

  it('shows all sort options', async () => {
    await renderComponent(
      <SortButton sorting="alphabetically" onSortingChange={vi.fn()} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'sort button' }));
    Object.values(text.sortings).forEach((menuItemText) => {
      expect(
        screen.getByRole('menuitem', { name: menuItemText }),
      ).toBeVisible();
    });
  });
});
