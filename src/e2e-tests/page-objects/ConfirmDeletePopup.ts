// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import type { RawPackageInfo } from '../../shared/shared-types';
import { text } from '../../shared/text';
import { expectNoVerticalScroll } from '../utils/expect-no-vertical-scroll';
import { scrollToBottomUntilVisible } from '../utils/scroll-to-bottom-until-visible';
import { PackageCard } from './PackageCard';

export class ConfirmDeletePopup {
  private readonly node: Locator;
  readonly cancelButton: Locator;
  readonly deleteButton: Locator;
  readonly deleteGloballyButton: Locator;
  readonly deleteLocallyButton: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('confirm delete popup');
    this.cancelButton = this.node.getByRole('button', {
      name: text.buttons.cancel,
      exact: true,
    });
    this.deleteButton = this.node.getByRole('button', {
      name: text.deleteAttributionsPopup.delete,
      exact: true,
    });
    this.deleteGloballyButton = this.node.getByRole('button', {
      name: text.deleteAttributionsPopup.deleteGlobally,
      exact: true,
    });
    this.deleteLocallyButton = this.node.getByRole('button', {
      name: text.deleteAttributionsPopup.deleteLocally,
      exact: true,
    });
  }

  public assert = {
    controlsAreInViewport: async (): Promise<void> => {
      await expect(this.node.getByRole('heading', { level: 2 })).toBeInViewport(
        { ratio: 1 },
      );
      for (const button of [
        this.deleteLocallyButton,
        this.deleteGloballyButton,
        this.cancelButton,
      ]) {
        await expect(button).toBeInViewport({ ratio: 1 });
      }
    },
    warningIsInViewport: async (): Promise<void> => {
      await expect(this.node.getByRole('alert')).toBeInViewport({ ratio: 1 });
    },
    resourceIsInViewport: async (name: string): Promise<void> => {
      await expect(
        this.node
          .getByTestId('linked-resources-tree')
          .getByText(name, { exact: true }),
      ).toBeInViewport({ ratio: 1 });
    },
    treeHasNoScrollbar: async (): Promise<void> => {
      await expectNoVerticalScroll(this.treeScroller);
    },
    bodyHasNoScrollbar: async (): Promise<void> => {
      await expectNoVerticalScroll(this.node.locator('.MuiDialogContent-root'));
    },
    isVisible: async (): Promise<void> => {
      await expect(this.node).toBeVisible();
    },
    isHidden: async (): Promise<void> => {
      await expect(this.node).toBeHidden();
    },
    hasText: async (text: string): Promise<void> => {
      await expect(this.node.getByText(text)).toBeVisible();
    },
  };

  private get treeScroller(): Locator {
    return this.node
      .getByTestId('linked-resources-tree')
      .locator('[data-virtuoso-scroller]');
  }

  async scrollToResource(name: string): Promise<void> {
    const resource = this.node
      .getByTestId('linked-resources-tree')
      .getByText(name, { exact: true });
    await scrollToBottomUntilVisible(this.treeScroller, resource);
  }

  async scrollToAttribution(attribution: RawPackageInfo): Promise<void> {
    const card = new PackageCard(this.node).node(attribution);
    const scroller = this.node.getByTestId('attribution-preview');
    await scrollToBottomUntilVisible(scroller, card);
  }
}
