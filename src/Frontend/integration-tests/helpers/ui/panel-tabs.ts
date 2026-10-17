// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import { text } from '../../../../shared/text';
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

function queryRelationTab(
  panelTestId: PanelTestId,
  relation: AttributionRelation,
): HTMLElement | null {
  return within(getPanel(panelTestId)).queryByRole('tab', {
    name: new RegExp(`^${text.relations[relation]}`),
  });
}

export async function expectSelectedTabIs(
  panelTestId: PanelTestId,
  relation: AttributionRelation,
): Promise<void> {
  await waitFor(() => {
    expect(getRelationTab(panelTestId, relation)).toHaveAttribute(
      'aria-selected',
      'true',
    );
  }, SETTLED_TIMEOUT);
}

export async function selectTab(
  panelTestId: PanelTestId,
  relation: AttributionRelation,
): Promise<void> {
  await userEvent.click(getRelationTab(panelTestId, relation));
}

export async function expectTabVisibility(
  panelTestId: PanelTestId,
  visible: Array<AttributionRelation>,
  hidden: Array<AttributionRelation> = [],
): Promise<void> {
  for (const relation of visible) {
    await waitFor(() => {
      expect(queryRelationTab(panelTestId, relation)).not.toBeNull();
    }, SETTLED_TIMEOUT);
  }
  for (const relation of hidden) {
    await waitFor(() => {
      expect(queryRelationTab(panelTestId, relation)).toBeNull();
    }, SETTLED_TIMEOUT);
  }
}
