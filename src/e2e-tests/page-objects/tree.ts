// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  type ElementHandle,
  expect,
  type Locator,
  type Page,
} from '@playwright/test';
import chroma from 'chroma-js';

import { OpossumColors } from '../../Frontend/shared-styles';

export class Tree {
  protected readonly window: Page;
  protected readonly root: Locator;
  protected readonly header: Locator;
  protected readonly searchField: Locator;
  protected readonly clearSearchButton: Locator;
  protected readonly scroller: Locator;
  protected readonly treeAssertions = {
    isVisible: async (timeout?: number): Promise<void> =>
      expect(this.root).toBeVisible({ timeout }),
    isHidden: async (): Promise<void> => expect(this.root).toBeHidden(),
    resourceIsVisible: async (name: string): Promise<void> =>
      expect(this.getResourceByName(name)).toBeVisible(),
    resourceIsHidden: async (name: string): Promise<void> =>
      expect(this.getResourceByName(name)).toBeHidden(),
    resourceAtPathIsVisible: async (path: string): Promise<void> =>
      expect(this.getResourceByPath(path)).toBeVisible(),
    resourceAtPathIsHidden: async (path: string): Promise<void> =>
      expect(this.getResourceByPath(path)).toBeHidden(),
    resourceAtPathIsInViewport: async (path: string): Promise<void> =>
      expect(this.getResourceByPath(path)).toBeInViewport(),
    resourceAtPathIsNotInViewport: async (path: string): Promise<void> =>
      expect(this.getResourceByPath(path)).not.toBeInViewport(),
    resourceIsEditable: async (name: string): Promise<void> =>
      this.assertReadonly(this.getResourceByName(name), false),
    resourceIsReadonly: async (name: string): Promise<void> =>
      this.assertReadonly(this.getResourceByName(name), true),
    resourceAtPathIsEditable: async (path: string): Promise<void> =>
      this.assertReadonly(this.getResourceByPath(path), false),
    resourceAtPathIsReadonly: async (path: string): Promise<void> =>
      this.assertReadonly(this.getResourceByPath(path), true),
    resourceAtPathIsSelected: async (path: string): Promise<void> => {
      const expectedPath = this.normalizePath(path).replace(/\/$/, '') || '/';
      await expect
        .poll(async () => {
          const selectedPath =
            await this.scroller.getAttribute('data-selected-id');
          return selectedPath === null
            ? null
            : this.normalizePath(selectedPath).replace(/\/$/, '') || '/';
        })
        .toBe(expectedPath);
    },
    resourceIsSelected: async (name: string): Promise<void> =>
      expect(this.getResourceByName(name)).toHaveAttribute(
        'aria-selected',
        'true',
      ),
    searchIsFocused: async (): Promise<void> =>
      expect(this.searchField).toBeFocused(),
    resourceIsHighlighted: async (name: string): Promise<void> =>
      expect(this.getRowLabel(this.getResourceByName(name), name)).toHaveCSS(
        'background-color',
        this.highlightColor,
      ),
    resourceIsNotHighlighted: async (name: string): Promise<void> =>
      expect(
        this.getRowLabel(this.getResourceByName(name), name),
      ).not.toHaveCSS('background-color', this.highlightColor),
  };
  private readonly highlightColor = `rgb(${chroma(OpossumColors.lightBlue).rgb().join(', ')})`;

  constructor(window: Page, rootTestId: string, headerTestId: string) {
    this.window = window;
    this.root = window.getByTestId(rootTestId);
    this.header = window.getByTestId(headerTestId);
    this.searchField = this.header.getByRole('searchbox');
    this.clearSearchButton = this.header.getByLabel('clear search');
    this.scroller = this.root.locator('[data-virtuoso-scroller="true"]');
  }

  protected getResourceByName(name: string): Locator {
    return this.root.getByRole('treeitem', { name, exact: true });
  }
  protected normalizePath(path: string): string {
    const segments = path.split('/').filter(Boolean);
    return segments.length ? `/${segments.join('/')}/` : '/';
  }
  protected getResourceByPath(path: string): Locator {
    const normalizedPath = this.normalizePath(path);
    const pathWithoutTrailingSlash = normalizedPath.replace(/\/$/, '');
    return this.root.locator(
      `[data-resource-path="${normalizedPath}"], [data-resource-path="${pathWithoutTrailingSlash}"]`,
    );
  }
  private getRowLabel(row: Locator, name: string): Locator {
    return row.getByText(name, { exact: true }).locator('..');
  }
  private async assertReadonly(row: Locator, readonly: boolean): Promise<void> {
    await expect(row).toBeVisible();
    const indicator = row.getByTestId('readonly-indicator');
    if (readonly) {
      await expect(indicator).toBeVisible();
    } else {
      await expect(indicator).toBeHidden();
    }
  }

  async getElementHandle(): Promise<ElementHandle | undefined> {
    return (await this.root.elementHandles())[0];
  }
  async clickResource(name: string): Promise<void> {
    await this.getResourceByName(name).click();
  }
  async clickResourceAtPath(path: string): Promise<void> {
    await this.getResourceByPath(path).click();
  }
  async focusResource(name: string): Promise<void> {
    await this.getResourceByName(name).focus();
  }
  async focusResourceAtPath(path: string): Promise<void> {
    await this.getResourceByPath(path).focus();
  }
  async scrollToTop(): Promise<void> {
    await this.scroller.evaluate((el) => el.scrollTo({ top: 0 }));
  }
  async scrollToBottom(): Promise<void> {
    await this.scroller.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
  }
  async search(value: string): Promise<void> {
    await this.searchField.fill(value);
    await this.waitForSearchResults(value);
  }
  async clearSearch(): Promise<void> {
    if ((await this.searchField.inputValue()) !== '') {
      await this.clearSearchButton.click();
    }
    await expect(this.searchField).toHaveValue('');
    await this.waitForSearchResults('');
  }
  async waitForSearchResults(value: string): Promise<void> {
    await expect(this.header).toHaveAttribute('data-applied-search', value);
  }
  async expandResourceAtPath(path: string): Promise<void> {
    await this.toggleAtPath(path, true, false);
  }
  async collapseResourceAtPath(path: string): Promise<void> {
    await this.toggleAtPath(path, false, false);
  }
  async ensureResourceExpanded(path: string): Promise<void> {
    await this.toggleAtPath(path, true, true);
  }
  async ensureResourceCollapsed(path: string): Promise<void> {
    await this.toggleAtPath(path, false, true);
  }
  private async toggleAtPath(
    path: string,
    expanded: boolean,
    ensure: boolean,
  ): Promise<void> {
    const row = this.getResourceByPath(path);
    await expect(row).toBeVisible();
    const actualPath = await row.getAttribute('data-resource-path');
    if (!actualPath) {
      throw new Error(`Missing data-resource-path for ${path}`);
    }
    const control = (state: 'expand' | 'collapse') =>
      row.getByLabel(`${state} ${actualPath}`, { exact: true });
    const current = expanded ? control('collapse') : control('expand');
    const action = expanded ? control('expand') : control('collapse');
    await expect
      .poll(async () => (await current.count()) + (await action.count()))
      .toBeGreaterThan(0);
    if (ensure && (await current.isVisible())) {
      return;
    }
    await expect(action).toBeVisible();
    await action.click();
    await expect(current).toBeVisible();
  }
  private parentPaths(path: string): Array<string> {
    const segments = path.split('/').filter(Boolean);
    return segments
      .slice(0, -1)
      .map((_, index) => `/${segments.slice(0, index + 1).join('/')}/`);
  }
  async revealResource(path: string): Promise<void> {
    await this.gotoRoot();
    await this.search(path);
    for (const parent of this.parentPaths(path)) {
      await this.ensureResourceExpanded(parent);
    }
    await expect(this.getResourceByPath(path)).toBeVisible();
  }
  async gotoRoot(): Promise<void> {
    await this.window
      .getByLabel('path bar')
      .getByText('Home', { exact: true })
      .click();
    await expect(
      this.window.getByLabel('path bar').getByRole('listitem'),
    ).toHaveText(['Home']);
    await this.waitForAuditPanel();
  }
  async goto(...names: Array<string>): Promise<void> {
    for (const name of names) {
      const row = this.getResourceByName(name);
      await row.click();
      await expect(row).toHaveAttribute('aria-selected', 'true');
      await this.waitForAuditPanel();
    }
  }
  async gotoAtPath(path: string): Promise<void> {
    const row = this.getResourceByPath(path);
    await row.click();
    await expect(row).toHaveAttribute('aria-selected', 'true');
    await this.waitForAuditPanel();
  }
  protected async waitForAuditPanel(): Promise<void> {
    await expect(
      this.window
        .getByTestId('attributions-panel')
        .getByTestId('loading')
        .or(this.window.getByTestId('signals-panel').getByTestId('loading'))
        .or(this.window.getByTestId('attribution-details-loading')),
    ).toHaveCount(0);
  }
}
