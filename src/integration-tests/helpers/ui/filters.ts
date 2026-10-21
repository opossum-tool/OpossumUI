// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import { text } from '../../../shared/text';
import { getPanel, type PanelTestId, SETTLED_TIMEOUT } from './common';

const FILTER_MENU_LABELS = {
  needsFollowUp: text.filters.needsFollowUp,
  firstParty: text.filters.firstParty,
  thirdParty: text.filters.thirdParty,
  unreviewed: text.filters.unreviewed,
} as const;

type FilterMenuLabel = keyof typeof FILTER_MENU_LABELS;

export async function clickFilterMenuButton(
  container: HTMLElement,
): Promise<void> {
  await userEvent.click(
    within(container).getByRole('button', { name: 'filter button' }),
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

export async function closeFilterMenu(): Promise<void> {
  // Escape must be dispatched on the menu element itself, like the Playwright
  // page object does: after interacting with an autocomplete inside the menu,
  // document.activeElement may be outside the modal's key-handling subtree.
  const menu = screen.queryByRole('menu');
  if (menu) {
    menu.focus();
    await userEvent.keyboard('{Escape}');
  }
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
  const licenseInput = await screen.findByLabelText('license names');
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

const LICENSE_FILTER_INPUT_LABEL = 'license names';

export async function fillLicenseFilter(value: string): Promise<void> {
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
