// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'vitest';

import { OpossumColors } from '../../../Frontend/shared-styles';
import { text } from '../../../shared/text';
import {
  expectPanelsSettled,
  expectReadonlyIndicator,
  LINKED_RESOURCES_TREE,
  SETTLED_TIMEOUT,
} from './common';

const RESOURCES_TREE_TEST_ID = 'resources-tree';

export function resourceTreeItem(name: string): HTMLElement {
  return within(screen.getByTestId(RESOURCES_TREE_TEST_ID)).getByRole(
    'treeitem',
    { name },
  );
}

export async function expectResourceVisibility(
  visible: Array<string>,
  hidden: Array<string> = [],
  treeTestId: string = RESOURCES_TREE_TEST_ID,
): Promise<void> {
  for (const name of visible) {
    await waitFor(() => {
      expect(
        within(screen.getByTestId(treeTestId)).getByRole('treeitem', { name }),
      ).toBeVisible();
    }, SETTLED_TIMEOUT);
  }
  for (const name of hidden) {
    await waitFor(() => {
      expect(
        within(screen.getByTestId(treeTestId)).queryByRole('treeitem', {
          name,
        }),
      ).toBeNull();
    }, SETTLED_TIMEOUT);
  }
}

export async function gotoResource(...names: Array<string>): Promise<void> {
  for (const name of names) {
    await waitFor(() => {
      expect(resourceTreeItem(name)).toBeVisible();
    }, SETTLED_TIMEOUT);
    await userEvent.click(resourceTreeItem(name));
    await waitFor(() => {
      expect(resourceTreeItem(name)).toHaveAttribute('aria-selected', 'true');
    }, SETTLED_TIMEOUT);
    await expectPanelsSettled();
  }
}

function getTreeItem(treeTestId: string, name: string): HTMLElement {
  return within(screen.getByTestId(treeTestId)).getByRole('treeitem', {
    name,
  });
}

export async function gotoResourceInOtherTree(
  treeTestId: string,
  name: string,
): Promise<void> {
  await waitFor(() => {
    expect(getTreeItem(treeTestId, name)).toBeVisible();
  }, SETTLED_TIMEOUT);
  await userEvent.click(getTreeItem(treeTestId, name));
  await waitFor(() => {
    expect(getTreeItem(treeTestId, name)).toHaveAttribute(
      'aria-selected',
      'true',
    );
  }, SETTLED_TIMEOUT);
  await expectPanelsSettled();
}

export function focusResourceTreeItem(name: string): void {
  getTreeItem(RESOURCES_TREE_TEST_ID, name).focus();
}

function resourceTreeItemAtPath(path: string): HTMLElement | null {
  return screen
    .getByTestId(RESOURCES_TREE_TEST_ID)
    .querySelector<HTMLElement>(`[data-resource-path="${path}"]`);
}

export async function expectResourceAtPathVisibility(
  visible: Array<string>,
  hidden: Array<string> = [],
): Promise<void> {
  for (const path of visible) {
    await waitFor(() => {
      expect(resourceTreeItemAtPath(path)).not.toBeNull();
      expect(resourceTreeItemAtPath(path)).toBeVisible();
    }, SETTLED_TIMEOUT);
  }
  for (const path of hidden) {
    await waitFor(() => {
      expect(resourceTreeItemAtPath(path)).toBeNull();
    }, SETTLED_TIMEOUT);
  }
}

function getTreeHeader(headerTestId: string): HTMLElement {
  return screen.getByTestId(headerTestId);
}

export async function searchTree(
  value: string,
  headerTestId: string,
): Promise<void> {
  const searchField = within(getTreeHeader(headerTestId)).getByRole(
    'searchbox',
  );
  fillSearchField(searchField, value);
  await waitFor(() => {
    expect(getTreeHeader(headerTestId)).toHaveAttribute(
      'data-applied-search',
      value,
    );
  }, SETTLED_TIMEOUT);
}

function fillSearchField(searchField: HTMLElement, value: string): void {
  const input = searchField as HTMLInputElement;
  fireEvent.change(input, { target: { value } });
}

export async function clearTreeSearch(headerTestId: string): Promise<void> {
  await userEvent.click(
    within(getTreeHeader(headerTestId)).getByLabelText('clear search'),
  );
  await waitFor(() => {
    expect(getTreeHeader(headerTestId)).toHaveAttribute(
      'data-applied-search',
      '',
    );
  }, SETTLED_TIMEOUT);
}

export async function expectTreeSearchFocused(
  headerTestId: string,
): Promise<void> {
  await waitFor(() => {
    expect(
      within(getTreeHeader(headerTestId)).getByRole('searchbox'),
    ).toHaveFocus();
  }, SETTLED_TIMEOUT);
}

export async function expectTreeResourceCountIs(
  count: number,
  headerTestId: string = 'resources-tree-header',
): Promise<void> {
  await waitFor(() => {
    expect(
      within(getTreeHeader(headerTestId)).getByText(
        `Resources (${count} / ${count})`,
        { exact: false },
      ),
    ).toBeVisible();
  }, SETTLED_TIMEOUT);
}

function normalizeColor(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

const HIGHLIGHT_COLOR = normalizeColor(OpossumColors.lightBlue);

export async function expectTreeItemHighlight(
  treeTestId: string,
  name: string,
  highlighted: boolean,
): Promise<void> {
  await waitFor(() => {
    const item = getTreeItem(treeTestId, name);
    const textNode = within(item).getByText(name);
    const labelBox = textNode.parentElement ?? textNode;
    if (highlighted) {
      expect(labelBox).toHaveStyle({ 'background-color': HIGHLIGHT_COLOR });
    } else {
      expect(labelBox).not.toHaveStyle({
        'background-color': HIGHLIGHT_COLOR,
      });
    }
  }, SETTLED_TIMEOUT);
}

export async function expectLinkedResourcesTreeVisibility(
  visible: boolean,
): Promise<void> {
  await waitFor(() => {
    if (visible) {
      expect(screen.getByTestId(LINKED_RESOURCES_TREE)).toBeVisible();
    } else {
      expect(screen.queryByTestId(LINKED_RESOURCES_TREE)).toBeNull();
    }
  }, SETTLED_TIMEOUT);
}

export async function openSplitDialogViaTreeContextMenu(
  name: string,
): Promise<void> {
  await waitFor(() => {
    expect(resourceTreeItem(name)).toBeVisible();
  }, SETTLED_TIMEOUT);
  fireEvent.contextMenu(resourceTreeItem(name));
  await userEvent.click(
    await waitFor(
      () =>
        screen.getByRole('menuitem', { name: text.resourceBrowser.splitHere }),
      SETTLED_TIMEOUT,
    ),
  );
}

export async function expectSplitHereDisabled(name: string): Promise<void> {
  await waitFor(() => {
    expect(resourceTreeItem(name)).toBeVisible();
  }, SETTLED_TIMEOUT);
  fireEvent.contextMenu(resourceTreeItem(name));
  await waitFor(() => {
    const menuItem = screen.getByRole('menuitem', {
      name: text.resourceBrowser.splitHere,
    });
    expect(menuItem).toHaveAttribute('aria-disabled', 'true');
  }, SETTLED_TIMEOUT);
}

export async function expectTreeItemPartition(
  name: string,
  readonly: boolean,
): Promise<void> {
  await waitFor(() => {
    const item = resourceTreeItem(name);
    expect(item).toBeVisible();
    expectReadonlyIndicator(item, readonly);
  }, SETTLED_TIMEOUT);
}

export async function expandTreeResourceAtPath(path: string): Promise<void> {
  await waitFor(() => {
    expect(resourceTreeItemAtPath(path)).not.toBeNull();
  }, SETTLED_TIMEOUT);
  const node = resourceTreeItemAtPath(path) as HTMLElement;
  const actualPath = node.getAttribute('data-resource-path');
  expect(actualPath).not.toBeNull();
  const collapsedControl = within(node).queryByLabelText(
    `expand ${actualPath}`,
  );
  if (collapsedControl) {
    await userEvent.click(collapsedControl);
  }
  await waitFor(() => {
    const updatedNode = resourceTreeItemAtPath(path);
    expect(updatedNode).not.toBeNull();
    expect(
      within(updatedNode as HTMLElement).queryByLabelText(
        `collapse ${actualPath}`,
      ),
    ).not.toBeNull();
  }, SETTLED_TIMEOUT);
}
