// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

export class ProjectStatisticsPopup {
  private readonly node: Locator;
  readonly title: Locator;
  readonly closeButton: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('project statistics');
    this.title = this.node.getByText('Project Statistics');
    this.closeButton = this.node.getByRole('button', { name: 'Close' });
  }

  public assert = {
    titleIsVisible: async (): Promise<void> => {
      await expect(this.title).toBeVisible();
    },
    titleIsHidden: async (): Promise<void> => {
      await expect(this.title).toBeHidden();
    },
  };
}
