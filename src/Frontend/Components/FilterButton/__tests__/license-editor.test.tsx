// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { VirtuosoMockContext } from 'react-virtuoso';

import { renderComponent } from '../../../test-helpers/render';
import { FilterButton } from '../FilterButton';
import { createLicenseFilterOption } from '../license-editor';

function Fixture({
  onOpenChange = vi.fn(),
  onOtherFilter = vi.fn(),
}: {
  onOpenChange?: (open: boolean) => void;
  onOtherFilter?: () => void;
}) {
  const [selected, setSelected] = useState([{ id: 'Zlib', label: 'Zlib' }]);
  return (
    <VirtuosoMockContext value={{ viewportHeight: 300, itemHeight: 40 }}>
      <FilterButton
        isActive={!!selected.length}
        onOpenChange={onOpenChange}
        options={[
          {
            kind: 'toggle' as const,
            id: 'another-filter',
            label: 'Another filter',
            selected: false,
            onAdd: onOtherFilter,
          },
          createLicenseFilterOption({
            licenses: ['MIT', 'Apache-2.0', 'MIT'].map((label) => ({
              id: label,
              label,
            })),
            selectedLicenses: selected,
            setSelectedLicenses: setSelected,
          }),
        ]}
      />
    </VirtuosoMockContext>
  );
}

test('opens beside the menu and uses two-stage Escape without closing during navigation', async () => {
  const onOpenChange = vi.fn();
  await renderComponent(<Fixture onOpenChange={onOpenChange} />);
  const trigger = screen.getByRole('button', { name: 'filter button' });
  await userEvent.click(trigger);
  const row = screen.getByRole('menuitem', { name: 'Zlib' });
  row.focus();
  await userEvent.keyboard('{ArrowRight}');
  expect(
    screen.getByRole('textbox', { name: 'Search licenses' }),
  ).toHaveFocus();
  expect(screen.getByRole('menu')).toBeVisible();
  expect(row).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByRole('dialog', { name: 'Licenses' }).id).toBe(
    row.getAttribute('aria-controls'),
  );
  expect(onOpenChange).toHaveBeenCalledTimes(1);
  await userEvent.keyboard('{Escape}');
  expect(row).toHaveFocus();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(onOpenChange).toHaveBeenCalledTimes(1);
  await userEvent.keyboard('{Escape}');
  expect(trigger).toHaveFocus();
  expect(onOpenChange).toHaveBeenLastCalledWith(false);
});

test('keeps the editor open while Tab and Shift+Tab move between controls', async () => {
  const onOpenChange = vi.fn();
  await renderComponent(<Fixture onOpenChange={onOpenChange} />);
  await userEvent.click(screen.getByRole('button', { name: 'filter button' }));
  await userEvent.click(screen.getByRole('menuitem', { name: 'Zlib' }));

  await userEvent.tab();
  expect(screen.getByRole('listbox')).toHaveFocus();
  await userEvent.tab({ shift: true });
  expect(
    screen.getByRole('textbox', { name: 'Search licenses' }),
  ).toHaveFocus();
  await userEvent.tab({ shift: true });
  expect(screen.getByRole('button', { name: 'Clear licenses' })).toHaveFocus();
  expect(screen.getByRole('dialog', { name: 'Licenses' })).toBeVisible();
  expect(screen.getByRole('menu')).toBeVisible();
  expect(onOpenChange).toHaveBeenCalledOnce();
});

test('applies selections immediately, preserves search, and separates clearing actions', async () => {
  await renderComponent(<Fixture />);
  await userEvent.click(screen.getByRole('button', { name: 'filter button' }));
  await userEvent.click(screen.getByRole('menuitem', { name: 'Zlib' }));
  expect(screen.getByRole('option', { name: 'Zlib' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  const search = screen.getByRole('textbox', { name: 'Search licenses' });
  await userEvent.type(search, 'mit');
  await userEvent.click(screen.getByRole('option', { name: 'MIT' }));
  expect(search).toHaveValue('mit');
  expect(search).toHaveFocus();
  expect(screen.getByRole('tab', { name: 'Selected (2)' })).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
  expect(search).toHaveValue('');
  await userEvent.click(screen.getByRole('tab', { name: 'Selected (2)' }));
  expect(
    screen.queryByRole('option', { name: 'Apache-2.0' }),
  ).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Clear licenses' }));
  expect(screen.getByText('No licenses selected.')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Clear licenses' })).toBeDisabled();
  expect(
    screen.queryByRole('button', { name: 'Done' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('menu')).toBeVisible();
});

test('toggles results from the keyboard and retains selections on Escape', async () => {
  await renderComponent(<Fixture />);
  await userEvent.click(screen.getByRole('button', { name: 'filter button' }));
  await userEvent.click(screen.getByRole('menuitem', { name: 'Zlib' }));
  await userEvent.keyboard('{ArrowDown}{End}{Home}{Enter}');
  expect(screen.getByRole('option', { name: 'Apache-2.0' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(screen.getByRole('listbox')).toHaveFocus();
  await userEvent.keyboard('{Escape}{Escape}');
  await userEvent.click(screen.getByRole('button', { name: 'filter button' }));
  expect(
    screen.getByRole('menuitem', { name: '2 licenses selected' }),
  ).toBeVisible();
});

test('outlines the active row only while the list has focus', async () => {
  await renderComponent(<Fixture />);
  await userEvent.click(screen.getByRole('button', { name: 'filter button' }));
  await userEvent.click(screen.getByRole('menuitem', { name: 'Zlib' }));
  const search = screen.getByRole('textbox', { name: 'Search licenses' });
  const first = screen.getByRole('option', { name: 'Apache-2.0' });
  expect(first).not.toHaveStyle({ outline: '1px solid currentColor' });
  await userEvent.keyboard('{ArrowDown}');
  expect(first).toHaveStyle({ outline: '1px solid currentColor' });
  await userEvent.keyboard('{ArrowDown}');
  const next = screen.getByRole('option', { name: 'MIT' });
  expect(first).not.toHaveStyle({ outline: '1px solid currentColor' });
  expect(next).toHaveStyle({ outline: '1px solid currentColor' });
  await userEvent.click(search);
  expect(next).not.toHaveStyle({ outline: '1px solid currentColor' });
});

test('keeps keyboard position when a selected row disappears', async () => {
  await renderComponent(<Fixture />);
  await userEvent.click(screen.getByRole('button', { name: 'filter button' }));
  await userEvent.click(screen.getByRole('menuitem', { name: 'Zlib' }));
  await userEvent.click(screen.getByRole('option', { name: 'MIT' }));
  await userEvent.click(screen.getByRole('tab', { name: 'Selected (2)' }));
  const list = screen.getByRole('listbox');
  list.focus();
  await userEvent.keyboard('{Home}{Enter}');
  expect(screen.queryByRole('option', { name: 'MIT' })).not.toBeInTheDocument();
  const remaining = screen.getByRole('option', {
    name: 'Zlib',
  });
  expect(list).toHaveAttribute('aria-activedescendant', remaining.id);
  expect(list).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  expect(screen.getByText('No licenses selected.')).toBeVisible();
  await userEvent.keyboard('{Escape}');
  expect(
    screen.getByRole('menuitem', { name: 'Select licenses' }),
  ).toHaveFocus();
});

test('replaces Selected checkmarks with removal buttons and a short tooltip', async () => {
  await renderComponent(<Fixture />);
  await userEvent.click(screen.getByRole('button', { name: 'filter button' }));
  await userEvent.click(screen.getByRole('menuitem', { name: 'Zlib' }));
  await userEvent.click(screen.getByRole('option', { name: 'MIT' }));
  expect(
    within(screen.getByRole('option', { name: 'MIT' })).getByTestId(
      'CheckIcon',
    ),
  ).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Remove MIT' }),
  ).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('tab', { name: 'Selected (2)' }));
  const list = screen.getByRole('listbox');
  expect(within(list).queryByTestId('CheckIcon')).not.toBeInTheDocument();
  const remove = screen.getByRole('button', { name: 'Remove MIT' });
  await userEvent.hover(remove);
  expect(
    await screen.findByRole('tooltip', { name: 'Remove' }),
  ).toHaveTextContent(/^Remove$/);
  await userEvent.click(remove);
  expect(screen.queryByRole('option', { name: 'MIT' })).not.toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Selected (1)' })).toBeVisible();
  expect(list).toHaveFocus();
  expect(list).toHaveAttribute(
    'aria-activedescendant',
    screen.getByRole('option', { name: 'Zlib' }).id,
  );
  screen.getByRole('button', { name: 'Remove Zlib' }).focus();
  await userEvent.keyboard(' ');
  expect(screen.getByText('No licenses selected.')).toBeVisible();
  expect(list).toHaveFocus();
});

test('shares search between tabs and clears search in Selected', async () => {
  await renderComponent(<Fixture />);
  await userEvent.click(screen.getByRole('button', { name: 'filter button' }));
  await userEvent.click(screen.getByRole('menuitem', { name: 'Zlib' }));
  const search = screen.getByRole('textbox', { name: 'Search licenses' });
  await userEvent.type(search, 'no matching name');
  expect(screen.getByText('No licenses match your search.')).toBeVisible();
  await userEvent.click(screen.getByRole('tab', { name: 'Selected (1)' }));
  expect(search).toBeVisible();
  expect(search).toHaveValue('no matching name');
  expect(screen.getByRole('tab', { name: 'Selected (1)' })).toHaveFocus();
  expect(screen.getByText('No licenses match your search.')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
  expect(search).toHaveValue('');
  expect(screen.getByRole('option', { name: 'Zlib' })).toBeVisible();
  await userEvent.type(search, 'ZLIB');
  expect(screen.getByRole('option', { name: 'Zlib' })).toBeVisible();
  await userEvent.click(screen.getByRole('tab', { name: 'All' }));
  expect(search).toHaveValue('ZLIB');
  expect(screen.queryByRole('option', { name: 'MIT' })).not.toBeInTheDocument();
});

test('removes a filtered selected license from the keyboard', async () => {
  await renderComponent(<Fixture />);
  await userEvent.click(screen.getByRole('button', { name: 'filter button' }));
  await userEvent.click(screen.getByRole('menuitem', { name: 'Zlib' }));
  await userEvent.click(screen.getByRole('option', { name: 'MIT' }));
  await userEvent.click(screen.getByRole('tab', { name: 'Selected (2)' }));
  const search = screen.getByRole('textbox', { name: 'Search licenses' });
  await userEvent.type(search, 'mit');
  expect(screen.getAllByRole('option')).toHaveLength(1);
  await userEvent.keyboard('{ArrowDown}{Enter}');
  expect(screen.getByRole('listbox')).toHaveFocus();
  expect(screen.getByRole('tab', { name: 'Selected (1)' })).toBeVisible();
  expect(screen.getByText('No licenses match your search.')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
  expect(screen.getByRole('option', { name: 'Zlib' })).toBeVisible();
});

test('clears licenses beside the tabs while keeping the current search and tab', async () => {
  await renderComponent(<Fixture />);
  await userEvent.click(screen.getByRole('button', { name: 'filter button' }));
  await userEvent.click(screen.getByRole('menuitem', { name: 'Zlib' }));
  const search = screen.getByRole('textbox', { name: 'Search licenses' });
  await userEvent.type(search, 'zlib');
  await userEvent.click(screen.getByRole('tab', { name: 'Selected (1)' }));
  await userEvent.click(screen.getByRole('button', { name: 'Clear licenses' }));
  expect(search).toBeVisible();
  expect(search).toHaveValue('zlib');
  expect(screen.getByRole('tab', { name: 'Selected (0)' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(screen.getByRole('dialog', { name: 'Licenses' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Clear licenses' })).toBeDisabled();
  expect(screen.getByText('No licenses selected.')).toBeVisible();
  await userEvent.click(screen.getByRole('tab', { name: 'All' }));
  expect(screen.getByRole('textbox', { name: 'Search licenses' })).toHaveValue(
    'zlib',
  );
  expect(screen.getByRole('menu')).toBeVisible();
});

test('returns with Left Arrow, toggles the license row, and keeps other filters usable', async () => {
  const onOtherFilter = vi.fn();
  const onOpenChange = vi.fn();
  await renderComponent(
    <Fixture onOtherFilter={onOtherFilter} onOpenChange={onOpenChange} />,
  );
  await userEvent.click(screen.getByRole('button', { name: 'filter button' }));
  const row = screen.getByRole('menuitem', { name: 'Zlib' });
  await userEvent.click(row);
  await userEvent.keyboard('{ArrowDown}{ArrowLeft}');
  expect(row).toHaveFocus();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await userEvent.click(row);
  await userEvent.click(row);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await userEvent.click(row);
  await userEvent.click(
    screen.getByRole('menuitem', { name: 'Another filter' }),
  );
  expect(onOtherFilter).toHaveBeenCalledOnce();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('menu')).toBeVisible();
  expect(onOpenChange).toHaveBeenCalledTimes(1);
});

test('uses the current label in the caption and both tabs, and toggles by ID', async () => {
  function EditorFixture() {
    const [selected, setSelected] = useState([{ id: 'mit', label: 'MIT' }]);
    return (
      <VirtuosoMockContext value={{ viewportHeight: 300, itemHeight: 40 }}>
        <FilterButton
          isActive={!!selected.length}
          options={[
            createLicenseFilterOption({
              licenses: [{ id: 'mit', label: 'M I T' }],
              selectedLicenses: selected,
              setSelectedLicenses: setSelected,
            }),
          ]}
        />
      </VirtuosoMockContext>
    );
  }
  await renderComponent(<EditorFixture />);
  await userEvent.click(screen.getByRole('button', { name: 'filter button' }));
  await userEvent.click(screen.getByRole('menuitem', { name: 'M I T' }));
  expect(screen.getAllByRole('option')).toHaveLength(1);
  const search = screen.getByRole('textbox', { name: 'Search licenses' });
  await userEvent.type(search, 'M I T');
  const row = screen.getByRole('option', { name: 'M I T' });
  expect(row).toHaveAttribute('aria-selected', 'true');
  await userEvent.click(screen.getByRole('tab', { name: 'Selected (1)' }));
  expect(screen.getAllByRole('option')).toHaveLength(1);
  expect(screen.getByRole('option', { name: 'M I T' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await userEvent.click(screen.getByRole('tab', { name: 'All' }));
  await userEvent.click(screen.getByRole('option', { name: 'M I T' }));
  expect(screen.getByRole('option', { name: 'M I T' })).toHaveAttribute(
    'aria-selected',
    'false',
  );
  await userEvent.click(screen.getByRole('option', { name: 'M I T' }));
  screen.getByRole('listbox').focus();
  await userEvent.keyboard('{Home}{Enter}');
  expect(screen.getByRole('tab', { name: 'Selected (0)' })).toBeVisible();
});

test('supports a generic panel with live content and focus re-entry', async () => {
  function GenericFixture() {
    const [count, setCount] = useState(0);
    return (
      <FilterButton
        isActive={false}
        options={[
          {
            id: 'arbitrary',
            label: 'Custom panel',
            selected: false,
            kind: 'panel',
            renderPanel: ({ id, initialFocusRef }) => (
              <div id={id} role="dialog" aria-label="Custom">
                <input aria-label="Custom input" ref={initialFocusRef} />
                <button onClick={() => setCount(count + 1)}>{count}</button>
              </div>
            ),
          },
          { kind: 'toggle', id: 'other', label: 'Other', selected: false },
        ]}
      />
    );
  }
  const user = userEvent.setup();
  await renderComponent(<GenericFixture />);
  await user.click(screen.getByLabelText('filter button'));
  const trigger = screen.getByRole('menuitem', { name: 'Custom panel' });
  await user.click(trigger);
  expect(screen.getByLabelText('Custom input')).toHaveFocus();
  await user.click(screen.getByRole('button', { name: '0' }));
  expect(screen.getByRole('button', { name: '1' })).toHaveFocus();
  trigger.focus();
  await user.keyboard('{ArrowRight}');
  expect(screen.getByLabelText('Custom input')).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(trigger).toHaveFocus();
  await user.keyboard('{ArrowRight}');
  await user.click(screen.getByRole('menuitem', { name: 'Other' }));
  expect(
    screen.queryByRole('dialog', { name: 'Custom' }),
  ).not.toBeInTheDocument();
});
