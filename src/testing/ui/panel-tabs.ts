// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import { text } from '../../shared/text';
import { getPanel, type PanelTestId, SETTLED_TIMEOUT } from './common';

export type AttributionRelation =
  'resource' | 'children' | 'parents' | 'unrelated';

function getRelationTab(
  panelTestId: PanelTestId,
  relation: AttributionRelation,
): HTMLElement {
  return within(getPanel(panelTestId)).getByRole('tab', {
    name: new RegExp(`^${text.relations[relation]}`),
  });
}

export async function expectSelectedTabIs(
  panelTestId: PanelTestId,
  relation: AttributionRelation,
): Promise<void> {
  await waitFor(() => {
    // A tablist has exactly one selected tab; assert the siblings within the
    // tab's own tablist explicitly so tests do not need to duplicate the
    // exclusion check for every relation. Other tablists rendered inside the
    // panel are not affected.
    const selectedTab = getRelationTab(panelTestId, relation);
    expect(selectedTab).toHaveAttribute('aria-selected', 'true');
    const tablist = selectedTab.closest('[role="tablist"]');
    expect(tablist).not.toBeNull();
    for (const tab of within(tablist as HTMLElement).getAllByRole('tab')) {
      if (tab !== selectedTab) {
        expect(tab).toHaveAttribute('aria-selected', 'false');
      }
    }
  }, SETTLED_TIMEOUT);
}

export async function selectTab(
  panelTestId: PanelTestId,
  relation: AttributionRelation,
): Promise<void> {
  await userEvent.click(getRelationTab(panelTestId, relation));
}

// Relation tabs unmount when the panel has no karton with that relation, so
// both helpers assert presence in the accessibility tree within the panel.
export async function expectTabsShown(
  panelTestId: PanelTestId,
  relations: Array<AttributionRelation>,
): Promise<void> {
  for (const relation of relations) {
    await waitFor(() => {
      expect(
        within(getPanel(panelTestId)).getByRole('tab', {
          name: new RegExp(`^${text.relations[relation]}`),
        }),
      ).toBeVisible();
    }, SETTLED_TIMEOUT);
  }
}

export async function expectTabsNotShown(
  panelTestId: PanelTestId,
  relations: Array<AttributionRelation>,
): Promise<void> {
  for (const relation of relations) {
    await waitFor(() => {
      expect(
        within(getPanel(panelTestId)).queryByRole('tab', {
          name: new RegExp(`^${text.relations[relation]}`),
        }),
      ).not.toBeInTheDocument();
    }, SETTLED_TIMEOUT);
  }
}
