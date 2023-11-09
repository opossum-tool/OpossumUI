// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { faker } from '../../shared/Faker';
import { PackageCard } from './PackageCard';

export class ResourceDetails {
  private readonly node: Locator;
  private readonly attributions: Locator;
  private readonly signals: Locator;
  readonly signalsAccordion: Locator;
  readonly signalsInFolderContentAccordion: Locator;
  readonly openResourceUrlButton: Locator;
  readonly localTab: Locator;
  readonly globalTab: Locator;
  readonly attributionCard: PackageCard;
  readonly signalCard: PackageCard;

  constructor(window: Page) {
    this.node = window.getByLabel('resource details');
    this.attributions = this.node.getByLabel('resource attributions');
    this.signals = this.node.getByLabel('resource signals');
    this.signalsAccordion = this.node.getByRole('button', {
      name: 'Signals',
      exact: true,
    });
    this.signalsInFolderContentAccordion = this.node.getByRole('button', {
      name: 'Signals in Folder Content',
      exact: true,
    });
    this.openResourceUrlButton = this.node
      .getByRole('button')
      .getByLabel('link to open');
    this.localTab = this.node.getByLabel('local tab');
    this.globalTab = this.node.getByLabel('global tab');
    this.attributionCard = new PackageCard(window, this.attributions);
    this.signalCard = new PackageCard(window, this.signals);
  }

  public assert = {
    resourcePathIsVisible: async (...elements: string[]): Promise<void> => {
      await expect(
        this.node.getByText(faker.opossum.filePath(...elements)),
      ).toBeVisible();
    },
    signalsAccordionIsVisible: async (): Promise<void> => {
      await expect(this.signalsAccordion).toBeVisible();
    },
    signalsAccordionIsHidden: async (): Promise<void> => {
      await expect(this.signalsAccordion).toBeHidden();
    },
    signalsInFolderContentAccordionIsVisible: async (): Promise<void> => {
      await expect(this.signalsInFolderContentAccordion).toBeVisible();
    },
    signalsInFolderContentAccordionIsHidden: async (): Promise<void> => {
      await expect(this.signalsInFolderContentAccordion).toBeHidden();
    },
  };

  async openResourceUrl(): Promise<void> {
    await this.openResourceUrlButton.click();
  }

  async gotoLocalTab(): Promise<void> {
    await this.localTab.click();
  }

  async gotoGlobalTab(): Promise<void> {
    await this.globalTab.click();
  }
}
