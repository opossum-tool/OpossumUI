// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Page } from '@playwright/test';

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
  };

  async waitForLoadingToFinish(): Promise<void> {
    await this.window
      .getByTestId('linked-resources-loading')
      .waitFor({ state: 'hidden' });
  }
}
