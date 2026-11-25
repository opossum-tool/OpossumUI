// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Page } from '@playwright/test';

import { LINKED_RESOURCES_EXPANSION_LIMIT } from '../../shared/shared-constants';
import { text } from '../../shared/text';
import { Tree } from './tree';

export class LinkedResourcesTree extends Tree {
  constructor(window: Page) {
    super(window, 'linked-resources-tree', 'linked-resources-tree-header');
  }

  public assert = {
    ...this.treeAssertions,
    totalCountIs: async (count: number): Promise<void> =>
      expect(this.header).toContainText(
        ` / ${new Intl.NumberFormat().format(count)})`,
      ),
    overLimitMessageIsVisible: async (): Promise<void> =>
      expect(
        this.window.getByText(
          text.resourceBrowser.linkedResourcesOverLimitMessage(
            LINKED_RESOURCES_EXPANSION_LIMIT,
          ),
        ),
      ).toBeVisible(),
    overLimitHeaderIsVisible: async (): Promise<void> =>
      expect(this.header).toContainText(
        text.resourceBrowser.linkedResourcesOverLimitTitle(
          LINKED_RESOURCES_EXPANSION_LIMIT,
        ),
      ),
  };

  async waitForLoadingToFinish(): Promise<void> {
    await this.window
      .getByTestId('linked-resources-panel-content')
      .waitFor({ state: 'attached' });
    await expect(
      this.window.getByTestId('linked-resources-panel-content'),
    ).toHaveAttribute('aria-busy', 'false');
  }
}
