// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import { expectPanelsSettled, isNodeEnabled, SETTLED_TIMEOUT } from './common';

const PATH_BAR_LABEL = 'path bar';

function getPathBar(): HTMLElement {
  return screen.getByLabelText(PATH_BAR_LABEL);
}

export async function expectPathBarHistoryButton(
  button: 'go back' | 'go forward',
  enabled: boolean,
): Promise<void> {
  await waitFor(() => {
    // The aria-label sits on the icon svg inside the IconButton (as in the
    // Playwright page object), so walk up to the actual button node.
    const icon = within(getPathBar()).getByLabelText(button);
    const pathBarButton = icon.closest('button') as HTMLElement | null;
    expect(pathBarButton).not.toBeNull();
    expect(isNodeEnabled(pathBarButton!)).toBe(enabled);
  }, SETTLED_TIMEOUT);
}

export async function clickPathBarHistoryButton(
  button: 'go back' | 'go forward',
): Promise<void> {
  const icon = within(getPathBar()).getByLabelText(button);
  await userEvent.click(icon.closest('button') as HTMLElement);
}

export async function expectPathBarCrumbs(
  visible: Array<string>,
  hidden: Array<string> = [],
): Promise<void> {
  for (const crumb of visible) {
    await waitFor(() => {
      expect(within(getPathBar()).getByText(crumb)).toBeVisible();
    }, SETTLED_TIMEOUT);
  }
  for (const crumb of hidden) {
    await waitFor(() => {
      expect(within(getPathBar()).queryByText(crumb)).toBeNull();
    }, SETTLED_TIMEOUT);
  }
}

export async function clickPathBarBreadcrumb(crumb: string): Promise<void> {
  await userEvent.click(within(getPathBar()).getByText(crumb));
}

export async function gotoResourceTreeRoot(): Promise<void> {
  await userEvent.click(
    within(getPathBar()).getByText('Home', { exact: true }),
  );
  await waitFor(() => {
    expect(
      within(getPathBar())
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Home']);
  }, SETTLED_TIMEOUT);
  await expectPanelsSettled();
}
