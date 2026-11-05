// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { VirtuosoMockContext } from 'react-virtuoso';

import { renderComponent } from '../../../test-helpers/render';
import { FilterButton } from '../FilterButton';
import {
  createLicenseFilterOption,
  type LicenseSelection,
} from '../license-editor';
import { buildLicenseEditorRows } from '../license-editor.util';

function Fixture({
  onOpenChange = vi.fn(),
  onOtherFilter = vi.fn(),
  initialSelection = {
    licenses: [{ id: 'Zlib', label: 'Zlib' }],
    licenseSearches: [],
  },
}: {
  initialSelection?: LicenseSelection;
  onOpenChange?: (open: boolean) => void;
  onOtherFilter?: () => void;
}) {
  const [selected, setSelected] = useState<LicenseSelection>(initialSelection);
  return (
    <VirtuosoMockContext value={{ viewportHeight: 300, itemHeight: 40 }}>
      <FilterButton
        isActive={
          !!(selected.licenses.length + selected.licenseSearches.length)
        }
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
            selection: selected,
            onSelectionChange: setSelected,
          }),
        ]}
      />
    </VirtuosoMockContext>
  );
}

async function renderLicenseEditor(initialSelection?: LicenseSelection) {
  const user = userEvent.setup();
  await renderComponent(<Fixture initialSelection={initialSelection} />);
  await user.click(screen.getByRole('button', { name: 'filter button' }));
  await user.click(screen.getByRole('menuitem', { expanded: false }));
  return {
    user,
    search: screen.getByRole('textbox', { name: 'Search licenses' }),
  };
}

test('keeps non-ASCII case variants distinct and searchable in Selected', async () => {
  const { user, search } = await renderLicenseEditor({
    licenses: [],
    licenseSearches: ['Ä'],
  });
  await user.type(search, 'ä{Enter}');
  await user.click(screen.getByRole('tab', { name: 'Selected (2)' }));
  const upper = screen.getByRole('option', { name: 'Name contains “Ä”' });
  const lower = screen.getByRole('option', { name: 'Name contains “ä”' });
  expect(upper.id).not.toBe(lower.id);
  await user.type(search, 'ä');
  expect(
    screen.queryByRole('option', { name: 'Name contains “Ä”' }),
  ).toBeNull();
  expect(
    screen.getByRole('option', { name: 'Name contains “ä”' }),
  ).toBeVisible();
  await user.clear(search);
  expect(screen.getAllByRole('option')).toHaveLength(2);
});

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
    screen.getByRole('menuitem', { name: '2 license filters' }),
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
  const { user } = await renderLicenseEditor({
    licenses: [{ id: 'MIT', label: 'MIT' }],
    licenseSearches: ['MIT'],
  });
  await user.click(screen.getByRole('tab', { name: 'Selected (2)' }));
  const list = screen.getByRole('listbox');
  list.focus();
  const exact = screen.getByRole('option', { name: 'MIT' });
  const searchRow = screen.getByRole('option', { name: 'Name contains “MIT”' });
  expect(exact.id).not.toBe(searchRow.id);
  expect(exact).toHaveAttribute('aria-selected', 'true');
  expect(searchRow).toHaveAttribute('aria-selected', 'true');
  await user.keyboard('{Home}{Enter}');
  expect(screen.queryByRole('option', { name: 'MIT' })).not.toBeInTheDocument();
  const remaining = screen.getByRole('option', {
    name: 'Name contains “MIT”',
  });
  expect(remaining).toHaveAttribute('aria-selected', 'true');
  expect(list).toHaveAttribute('aria-activedescendant', remaining.id);
  expect(list).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(screen.getByText('No licenses selected.')).toBeVisible();
  await user.keyboard('{Escape}');
  expect(
    screen.getByRole('menuitem', { name: 'Select licenses' }),
  ).toHaveFocus();
});

test('replaces Selected checkmarks with removal buttons and a short tooltip', async () => {
  const { user } = await renderLicenseEditor({
    licenses: [{ id: 'MIT', label: 'MIT' }],
    licenseSearches: ['MIT'],
  });
  expect(
    within(screen.getByRole('option', { name: 'MIT' })).getByTestId(
      'CheckIcon',
    ),
  ).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Remove MIT' }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('tab', { name: 'Selected (2)' }));
  const list = screen.getByRole('listbox');
  expect(within(list).queryByTestId('CheckIcon')).not.toBeInTheDocument();
  const remove = screen.getByRole('button', {
    name: 'Remove Name contains “MIT”',
  });
  await user.hover(remove);
  expect(
    await screen.findByRole('tooltip', { name: 'Remove' }),
  ).toHaveTextContent(/^Remove$/);
  await user.click(remove);
  expect(
    screen.queryByRole('option', { name: 'Name contains “MIT”' }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('tab', { name: 'Selected (1)' })).toBeVisible();
  expect(screen.getByRole('option', { name: 'MIT' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(list).toHaveFocus();
  expect(list).toHaveAttribute(
    'aria-activedescendant',
    screen.getByRole('option', { name: 'MIT' }).id,
  );
  screen.getByRole('button', { name: 'Remove MIT' }).focus();
  await user.keyboard(' ');
  expect(screen.getByText('No licenses selected.')).toBeVisible();
  expect(list).toHaveFocus();
});

test('shares search between tabs and clears search in Selected', async () => {
  await renderComponent(<Fixture />);
  await userEvent.click(screen.getByRole('button', { name: 'filter button' }));
  await userEvent.click(screen.getByRole('menuitem', { name: 'Zlib' }));
  const search = screen.getByRole('textbox', { name: 'Search licenses' });
  await userEvent.type(search, 'no matching name');
  expect(
    screen.getByRole('option', {
      name: 'Add filter: name contains “no matching name”',
    }),
  ).toBeVisible();
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
  const { user, search } = await renderLicenseEditor({
    licenses: [
      { id: 'Zlib', label: 'Zlib' },
      { id: 'MIT', label: 'MIT' },
    ],
    licenseSearches: ['zlib'],
  });
  expect(
    screen.getByRole('menuitem', { name: '3 license filters' }),
  ).toBeVisible();
  await user.type(search, 'zlib');
  await user.click(screen.getByRole('tab', { name: 'Selected (3)' }));
  await user.click(screen.getByRole('button', { name: 'Clear licenses' }));
  expect(search).toBeVisible();
  expect(search).toHaveValue('zlib');
  expect(screen.getByRole('tab', { name: 'Selected (0)' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(screen.getByRole('dialog', { name: 'Licenses' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Clear licenses' })).toBeDisabled();
  expect(screen.getByText('No licenses selected.')).toBeVisible();
  await user.click(screen.getByRole('tab', { name: 'All' }));
  expect(screen.getByRole('textbox', { name: 'Search licenses' })).toHaveValue(
    'zlib',
  );
  expect(screen.getByRole('menu')).toBeVisible();
  expect(
    screen.queryByRole('option', { name: 'Zlib' }),
  ).not.toBeInTheDocument();
  await user.clear(search);
  expect(screen.getByRole('option', { name: 'MIT' })).toHaveAttribute(
    'aria-selected',
    'false',
  );
  await user.type(search, 'zlib');
  await user.keyboard('{Enter}');
  await user.click(screen.getByRole('tab', { name: 'Selected (1)' }));
  expect(
    screen.getByRole('option', { name: 'Name contains “zlib”' }),
  ).toBeVisible();
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
    const [selected, setSelected] = useState<LicenseSelection>({
      licenses: [{ id: 'mit', label: 'MIT' }],
      licenseSearches: [],
    });
    return (
      <VirtuosoMockContext value={{ viewportHeight: 300, itemHeight: 40 }}>
        <FilterButton
          isActive={
            !!(selected.licenses.length + selected.licenseSearches.length)
          }
          options={[
            createLicenseFilterOption({
              licenses: [{ id: 'mit', label: 'M I T' }],
              selection: selected,
              onSelectionChange: setSelected,
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
  await userEvent.keyboard('{End}{Enter}');
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

test('adds a trimmed query by clicking its suggestion when no exact option matches', async () => {
  const { user, search } = await renderLicenseEditor();
  await user.type(search, '  unknown%_!  ');
  const suggestion = screen.getByRole('option', {
    name: 'Add filter: name contains “unknown%_!”',
  });
  expect(screen.getAllByRole('option')).toEqual([suggestion]);
  await user.click(suggestion);
  await user.click(screen.getByRole('tab', { name: 'Selected (2)' }));
  expect(
    screen.getByRole('option', { name: 'Name contains “unknown%_!”' }),
  ).toHaveAttribute('aria-selected', 'true');
});

test('adds with Enter, clears the input, and restores focus', async () => {
  const { user, search } = await renderLicenseEditor();
  await user.type(search, 'MIT{Enter}');
  expect(search).toHaveValue('');
  expect(search).toHaveFocus();
  expect(screen.getByRole('option', { name: 'MIT' })).toHaveAttribute(
    'aria-selected',
    'false',
  );
  await user.click(screen.getByRole('tab', { name: 'Selected (2)' }));
  expect(
    screen.getByRole('option', { name: 'Name contains “MIT”' }),
  ).toBeVisible();
});

test('ignores Enter during IME composition', async () => {
  const { user, search } = await renderLicenseEditor();
  await user.type(search, 'Zlib');
  fireEvent.keyDown(search, { key: 'Enter', isComposing: true });
  expect(search).toHaveValue('Zlib');
  expect(screen.getByRole('tab', { name: 'Selected (1)' })).toBeVisible();
});

test('shows committed searches in Selected with a search icon and explanatory tooltip', async () => {
  const { user } = await renderLicenseEditor({
    licenses: [],
    licenseSearches: ['unknown%_!'],
  });
  expect(screen.getAllByRole('option').map((row) => row.textContent)).toEqual([
    'Apache-2.0',
    'MIT',
  ]);
  await user.click(screen.getByRole('tab', { name: 'Selected (1)' }));
  const row = screen.getByRole('option', {
    name: 'Name contains “unknown%_!”',
  });
  expect(row).toHaveAttribute('aria-selected', 'true');
  expect(within(row).getByTestId('SearchIcon')).toBeVisible();
  await user.hover(row);
  expect(
    await screen.findByRole('tooltip', { name: 'Name contains “unknown%_!”' }),
  ).toBeVisible();
});

test('shows a compact caption for a single search', async () => {
  const { user } = await renderLicenseEditor({
    licenses: [],
    licenseSearches: ['unknown%_!'],
  });
  const caption = screen.getByRole('menuitem', {
    name: 'Name contains “unknown%_!”',
  });
  expect(caption.textContent).toBe('unknown%_!');
  expect(within(caption).getByTestId('CopyrightIcon')).toBeVisible();
  expect(within(caption).getByTestId('SearchIcon')).toBeVisible();
  await user.hover(within(caption).getByText('unknown%_!'));
  expect(
    await screen.findByRole('tooltip', { name: 'Name contains “unknown%_!”' }),
  ).toBeVisible();
});

test('keeps case-insensitive, canonically normalized duplicate suggestions navigable and inert', async () => {
  const { user, search } = await renderLicenseEditor({
    licenses: [],
    licenseSearches: ['unknown'],
  });
  await user.type(search, ' UN-KNOWN ');
  const duplicate = screen.getByRole('option', {
    name: 'Add filter: name contains “UN-KNOWN”',
  });
  expect(duplicate).toHaveAttribute('aria-disabled', 'true');
  await user.click(duplicate);
  expect(search).toHaveFocus();
  expect(screen.getByRole('tab', { name: 'Selected (1)' })).toBeVisible();
  await user.keyboard('{Enter}');
  expect(search).toHaveValue(' UN-KNOWN ');
  await user.keyboard('{ArrowDown}');
  const list = screen.getByRole('listbox');
  expect(list).toHaveFocus();
  expect(list).toHaveAttribute('aria-activedescendant', duplicate.id);
  await user.keyboard('{Enter}');
  expect(screen.getByRole('tab', { name: 'Selected (1)' })).toBeVisible();
  await user.keyboard(' ');
  expect(search).toHaveValue(' UN-KNOWN ');
  expect(screen.getByRole('tab', { name: 'Selected (1)' })).toBeVisible();
  await user.hover(duplicate);
  expect(
    await screen.findByRole('tooltip', { name: 'Already selected' }),
  ).toBeVisible();
});

test('navigates suggestion → exact option → suggestion, including Home and End', async () => {
  const { user, search } = await renderLicenseEditor();
  await user.type(search, 'mit');
  const list = screen.getByRole('listbox');
  const suggestion = screen.getByRole('option', {
    name: 'Add filter: name contains “mit”',
  });
  const exact = screen.getByRole('option', { name: 'MIT' });
  expect(within(list).getAllByRole('option')).toEqual([suggestion, exact]);
  await user.keyboard('{ArrowDown}');
  expect(list).toHaveFocus();
  expect(list).toHaveAttribute('aria-activedescendant', suggestion.id);
  await user.keyboard('{ArrowDown}');
  expect(list).toHaveAttribute('aria-activedescendant', exact.id);
  await user.keyboard('{Enter}');
  expect(exact).toHaveAttribute('aria-selected', 'true');
  expect(search).toHaveValue('mit');
  expect(list).toHaveFocus();
  await user.keyboard('{ArrowUp}');
  expect(list).toHaveAttribute('aria-activedescendant', suggestion.id);
  await user.keyboard('{End}');
  expect(list).toHaveAttribute('aria-activedescendant', exact.id);
  await user.keyboard('{Home}');
  expect(list).toHaveAttribute('aria-activedescendant', suggestion.id);
});

test.each(['{Enter}', ' '])('activates a suggestion with %s', async (key) => {
  const { user, search } = await renderLicenseEditor();
  await user.type(search, 'mit');
  await user.keyboard('{ArrowDown}');
  await user.keyboard(key);
  expect(search).toHaveValue('');
  expect(search).toHaveFocus();
  await user.click(screen.getByRole('tab', { name: 'Selected (2)' }));
  expect(
    screen.getByRole('option', { name: 'Name contains “mit”' }),
  ).toHaveAttribute('aria-selected', 'true');
});

test('keeps padded-input results consistent with the trimmed query', async () => {
  const { user, search } = await renderLicenseEditor();
  await user.type(search, 'MIT');
  expect(
    screen
      .getAllByRole('option')
      .map((row) => row.getAttribute('aria-label') ?? row.textContent),
  ).toEqual(['Add filter: name contains “MIT”', 'MIT']);
  await user.clear(search);
  await user.type(search, '  MIT  ');
  expect(
    screen
      .getAllByRole('option')
      .map((row) => row.getAttribute('aria-label') ?? row.textContent),
  ).toEqual(['Add filter: name contains “MIT”', 'MIT']);
  expect(screen.getByRole('option', { name: 'MIT' })).toHaveAttribute(
    'aria-selected',
    'false',
  );
  await user.click(
    screen.getByRole('option', { name: 'Add filter: name contains “MIT”' }),
  );
  await user.click(screen.getByRole('tab', { name: 'Selected (2)' }));
  await user.type(search, '  MIT  ');
  expect(
    screen.getAllByRole('option').map((row) => row.getAttribute('aria-label')),
  ).toEqual(['Name contains “MIT”']);
});

test('preserves internal whitespace in the suggestion and committed accessible labels', async () => {
  const { user, search } = await renderLicenseEditor();
  await user.type(search, ' Custom  License (x) ');
  expect(
    screen.getByRole('option', {
      name: 'Add filter: name contains “Custom License (x)”',
    }),
  ).toHaveAttribute(
    'aria-label',
    'Add filter: name contains “Custom  License (x)”',
  );
  await user.keyboard('{Enter}');
  await user.click(screen.getByRole('tab', { name: 'Selected (2)' }));
  expect(
    screen.getByRole('option', { name: 'Name contains “Custom License (x)”' }),
  ).toHaveAttribute('aria-label', 'Name contains “Custom  License (x)”');
});

test('treats whitespace-only input as empty without offering a suggestion', async () => {
  const { user, search } = await renderLicenseEditor();
  await user.type(search, '   ');
  expect(screen.getAllByRole('option').map((row) => row.textContent)).toEqual([
    'Apache-2.0',
    'MIT',
    'Zlib',
  ]);
  await user.keyboard('{Enter}');
  expect(search).toHaveValue('   ');
  expect(screen.getByRole('tab', { name: 'Selected (1)' })).toBeVisible();
});

test('adds two distinct searches through the UI and removes one while retaining the other', async () => {
  const { user, search } = await renderLicenseEditor();
  await user.type(search, 'first{Enter}');
  await user.type(search, 'second{Enter}');
  await user.click(screen.getByRole('tab', { name: 'Selected (3)' }));
  expect(
    screen.getByRole('option', { name: 'Name contains “first”' }),
  ).toBeVisible();
  expect(
    screen.getByRole('option', { name: 'Name contains “second”' }),
  ).toBeVisible();
  await user.click(
    screen.getByRole('button', { name: 'Remove Name contains “first”' }),
  );
  expect(
    screen.queryByRole('option', { name: 'Name contains “first”' }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('option', { name: 'Name contains “second”' }),
  ).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: 'Selected (2)' })).toBeVisible();
});

test('keeps Enter in Selected from adding a new search', async () => {
  const { user, search } = await renderLicenseEditor();
  await user.click(screen.getByRole('tab', { name: 'Selected (1)' }));
  await user.click(search);
  await user.type(search, 'MIT{Enter}');
  expect(search).toHaveValue('MIT');
  expect(screen.getByRole('tab', { name: 'Selected (1)' })).toBeVisible();
  await user.clear(search);
  expect(screen.getAllByRole('option')).toEqual([
    screen.getByRole('option', { name: 'Zlib' }),
  ]);
});

test.each(['all', 'selected'] as const)(
  'searches canonical names in %s with stable labels',
  (view) => {
    const option = {
      id: 'apache2.0',
      label: 'Apache 2.0',
    };
    const { rows } = buildLicenseEditorRows({
      licenses: [option],
      selection: { licenses: [option], licenseSearches: [] },
      search: 'aPaChE-',
      view,
    });
    expect(rows.filter((row) => row.kind === 'exact')).toEqual([
      { id: 'exact:apache2.0', label: 'Apache 2.0', kind: 'exact', option },
    ]);
  },
);
