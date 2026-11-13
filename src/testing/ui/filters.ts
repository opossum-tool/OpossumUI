// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import { text } from '../../shared/text';
import {
  escapeRegExp,
  getPanel,
  type PanelTestId,
  SETTLED_TIMEOUT,
} from './common';

const FILTER_MENU_LABELS = {
  needsFollowUp: text.filters.needsFollowUp,
  firstParty: text.filters.firstParty,
  thirdParty: text.filters.thirdParty,
  aiDeferred: text.filters.aiDeferred,
  unreviewed: text.filters.unreviewed,
  previouslyPreferred: text.filters.previouslyPreferred,
} as const;

type FilterMenuLabel = keyof typeof FILTER_MENU_LABELS;

export async function clickFilterMenuButton(
  container: HTMLElement,
): Promise<void> {
  await userEvent.click(
    within(container).getByRole('button', { name: 'filter button' }),
  );
}

export async function clickPanelFilterMenuButton(
  panelTestId: PanelTestId,
): Promise<void> {
  await clickFilterMenuButton(getPanel(panelTestId));
}

export async function selectFilterMenuDropdown(
  dropdownLabel: string,
  optionName: string,
  optionIndex = 0,
): Promise<void> {
  const dropdown = await screen.findByLabelText(dropdownLabel);
  await userEvent.click(dropdown);
  // Duplicate option descriptions exist (e.g. classifications with the same
  // text but different IDs); optionIndex disambiguates.
  const options = await screen.findAllByRole('option', { name: optionName });
  await userEvent.click(options[optionIndex]);
}

export async function expectFilterMenuDropdownValue(
  dropdownLabel: string,
  value: string,
): Promise<void> {
  await waitFor(() => {
    expect(screen.getByLabelText(dropdownLabel)).toHaveValue(value);
  }, SETTLED_TIMEOUT);
}

export async function expectFilterMenuIconVisible(
  iconLabel: string,
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    const icon = within(screen.getByRole('menu')).queryByLabelText(iconLabel);
    if (visible) {
      expect(icon).not.toBeNull();
      expect(icon).toBeVisible();
    } else {
      expect(icon).toBeNull();
    }
  }, SETTLED_TIMEOUT);
}

export async function expectFilterMenuItemCount(
  name: string,
  count: string,
): Promise<void> {
  await waitFor(() => {
    const item = screen.getByRole('menuitem', { name: menuNameMatcher(name) });
    expect(item.textContent).toBe(`${name}${count ? ` (${count})` : ''}`);
  }, SETTLED_TIMEOUT);
}

export async function clearFilterMenuFilterChip(): Promise<void> {
  await userEvent.click(
    within(screen.getByRole('menu')).getByRole('button', {
      name: 'clear button',
    }),
  );
}

const MENU_URL_OPTION_COUNT_SUFFIX = '( \\(\\d+\\))?$';

function menuNameMatcher(name: string | RegExp): RegExp {
  if (name instanceof RegExp) {
    return name;
  }
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}${MENU_URL_OPTION_COUNT_SUFFIX}`);
}

export async function clickFilterMenuItem(
  name: string | RegExp,
): Promise<void> {
  await userEvent.click(
    screen.getByRole('menuitem', { name: menuNameMatcher(name) }),
  );
}

const LICENSE_EDITOR_DIALOG_LABEL = text.licenseEditor.title;

export async function closeFilterMenu(): Promise<void> {
  // Escape must be dispatched on the menu element itself, like the Playwright
  // page object does: after interacting with an autocomplete inside the menu,
  // document.activeElement may be outside the modal's key-handling subtree.
  const menu = await waitFor(() => {
    // Fail fast when neither the menu nor the license editor is open instead
    // of silently succeeding and masking a "did not open" regression.
    const menu =
      screen.queryByRole('menu') ??
      screen.queryByRole('dialog', { name: LICENSE_EDITOR_DIALOG_LABEL });
    expect(menu).not.toBeNull();
    return menu!;
  }, SETTLED_TIMEOUT);
  menu.focus();
  await userEvent.keyboard('{Escape}');
  await waitFor(() => {
    expect(screen.queryByRole('menu')).toBeNull();
  }, SETTLED_TIMEOUT);
}

export async function clickClearFiltersMenuItem(): Promise<void> {
  await clickFilterMenuItem(text.packageLists.clearFilters);
}

export async function selectFilterLicenseName(
  licenseName: string,
): Promise<void> {
  await openLicenseEditor();
  const licenseInput = await screen.findByLabelText('Search licenses');
  fireEvent.change(licenseInput, { target: { value: licenseName } });
  await userEvent.click(
    await screen.findByRole('option', { name: licenseName }),
  );
}

export async function applyPanelFilter(
  panelTestId: PanelTestId,
  filter: FilterMenuLabel,
): Promise<void> {
  await clickFilterMenuButton(getPanel(panelTestId));
  await clickFilterMenuItem(FILTER_MENU_LABELS[filter]);
  await closeFilterMenu();
}

async function openLicenseEditor() {
  if (!screen.queryByRole('dialog', { name: 'Licenses' })) {
    await userEvent.click(
      within(screen.getByRole('menu'))
        .getAllByRole('menuitem')
        .find((item) => item.getAttribute('aria-haspopup') === 'dialog')!,
    );
  }
}
const LICENSE_FILTER_INPUT_LABEL = 'Search licenses';

export async function fillLicenseFilter(value: string): Promise<void> {
  await openLicenseEditor();
  const input = await screen.findByLabelText<HTMLInputElement>(
    LICENSE_FILTER_INPUT_LABEL,
  );
  fireEvent.change(input, { target: { value } });
}

export async function expectLicenseFilterOption(
  name: string,
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    const option = screen.queryByRole('option', { name });
    if (visible) {
      expect(option).not.toBeNull();
      expect(option).toBeVisible();
    } else {
      expect(option).toBeNull();
    }
  }, SETTLED_TIMEOUT);
}

const RESOURCES_TREE_HEADER_TEST_ID = 'resources-tree-header';

export async function clickTreeFilterMenuButton(): Promise<void> {
  const button = await waitFor(
    () =>
      within(screen.getByTestId(RESOURCES_TREE_HEADER_TEST_ID)).getByRole(
        'button',
        { name: 'filter button' },
      ),
    SETTLED_TIMEOUT,
  );
  await userEvent.click(button);
}

export async function addLicenseSearchFilter(value: string): Promise<void> {
  await fillLicenseFilter(value);
  await userEvent.click(
    screen.getByRole('option', {
      name: text.licenseEditor.addContains(value.trim()),
    }),
  );
}

export async function closeLicenseEditorDialog(): Promise<void> {
  // Only the license editor dialog closes; the outer filter menu stays open.
  // Fail fast when the editor was never opened instead of silently succeeding
  // and masking a "did not open" regression.
  const dialog = await waitFor(() => {
    const dialog = screen.queryByRole('dialog', {
      name: LICENSE_EDITOR_DIALOG_LABEL,
    });
    expect(dialog).not.toBeNull();
    return dialog!;
  }, SETTLED_TIMEOUT);
  dialog.focus();
  await userEvent.keyboard('{Escape}');
  await waitFor(() => {
    expect(
      screen.queryByRole('dialog', { name: LICENSE_EDITOR_DIALOG_LABEL }),
    ).toBeNull();
  }, SETTLED_TIMEOUT);
}

export async function expectLicenseFilterOptionSelected(
  name: string,
  selected: boolean,
): Promise<void> {
  await waitFor(() => {
    expect(screen.getByRole('option', { name })).toHaveAttribute(
      'aria-selected',
      selected ? 'true' : 'false',
    );
  }, SETTLED_TIMEOUT);
}

export async function clickLicenseEditorTab(
  name: string | RegExp,
): Promise<void> {
  await userEvent.click(screen.getByRole('tab', { name }));
}

export async function expectLicenseEditorTabVisible(
  name: string,
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    const tab = screen.queryByRole('tab', { name });
    if (visible) {
      expect(tab).not.toBeNull();
      expect(tab).toBeVisible();
    } else {
      expect(tab).toBeNull();
    }
  }, SETTLED_TIMEOUT);
}

export async function removeLicenseFilterOption(
  licenseName: string,
): Promise<void> {
  await userEvent.click(
    screen.getByRole('button', {
      name: text.licenseEditor.removeLicense(licenseName),
    }),
  );
}

// The counted menu item is named "{n} license filters" via
// text.licenseEditor.selectionCount; derive the matcher from the text
// template (with a 0 sentinel standing in for the count) so wording changes
// stay in sync.
const LICENSE_FILTERS_MENU_ITEM_PATTERN = new RegExp(
  escapeRegExp(text.licenseEditor.selectionCount(0)).replaceAll('0', '\\d+'),
);

export async function clearAllLicenseFilters(): Promise<void> {
  // The counted "{n} license filters" menu item opens the license editor on
  // the selection list, from which all selected licenses can be cleared.
  await userEvent.click(
    screen.getByRole('menuitem', { name: LICENSE_FILTERS_MENU_ITEM_PATTERN }),
  );
  await userEvent.click(
    screen.getByRole('button', { name: text.licenseEditor.clearLicenses }),
  );
}
