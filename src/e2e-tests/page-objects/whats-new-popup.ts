// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import type { ElectronAPI } from '../../shared/shared-types';
import { text } from '../../shared/text';

export class WhatsNewPopup {
  private readonly node: Locator;
  readonly closeButton: Locator;

  constructor(private readonly window: Page) {
    this.node = window.getByRole('dialog', { name: text.whatsNew.title });
    this.closeButton = this.node.getByRole('button', {
      name: text.buttons.close,
    });
  }

  async getSeenRevision(): Promise<number> {
    return this.window.evaluate(async () => {
      const settings = await (
        globalThis as unknown as { electronAPI: ElectronAPI }
      ).electronAPI.getUserSettings();
      return settings.lastSeenWhatsNewRevision;
    });
  }

  public assert = {
    isVisible: async (): Promise<void> => {
      await expect(this.node).toBeVisible();
    },
    isHidden: async (): Promise<void> => {
      await expect(this.node).toBeHidden();
    },
    seenRevisionIsRecorded: async (): Promise<void> => {
      await expect.poll(() => this.getSeenRevision()).toBeGreaterThan(0);
    },
    seenRevisionIs: async (revision: number): Promise<void> => {
      await expect.poll(() => this.getSeenRevision()).toBe(revision);
    },
  };
}
