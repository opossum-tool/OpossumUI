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
  readonly signalsPanel: Locator;
  readonly signalsToggle: Locator;
  readonly signalsInFolderContentPanel: Locator;
  readonly signalsInFolderContentToggle: Locator;
  readonly attributionsInFolderContentPanel: Locator;
  readonly attributionsInFolderContentToggle: Locator;
  readonly openResourceUrlButton: Locator;
  readonly overrideParentButton: Locator;
  readonly localTab: Locator;
  readonly globalTab: Locator;
  readonly attributionCard: PackageCard;
  readonly signalCard: PackageCard;

  constructor(window: Page) {
    this.node = window.getByLabel('resource details');
    this.attributions = this.node.getByLabel('resource attributions');
    this.signals = this.node.getByLabel('resource signals');
    this.signalsPanel = this.signals.getByLabel('signals panel');
    this.signalsToggle = this.node.getByRole('button', {
      name: 'Signals',
      exact: true,
    });
    this.signalsInFolderContentPanel = this.signals.getByLabel(
      'signals in folder content panel',
    );
    this.signalsInFolderContentToggle = this.node.getByRole('button', {
      name: 'Signals in Folder Content',
      exact: true,
    });
    this.attributionsInFolderContentPanel = this.signals.getByLabel(
      'attributions in folder content panel',
    );
    this.attributionsInFolderContentToggle = this.node.getByRole('button', {
      name: 'Attributions in Folder Content',
      exact: true,
    });
    this.openResourceUrlButton = this.node
      .getByRole('button')
      .getByLabel('link to open');
    this.overrideParentButton = this.attributions.getByRole('button', {
      name: 'override parent',
    });
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
      await expect(this.signalsToggle).toBeVisible();
    },
    signalsAccordionIsHidden: async (): Promise<void> => {
      await expect(this.signalsToggle).toBeHidden();
    },
    signalsInFolderContentAccordionIsVisible: async (): Promise<void> => {
      await expect(this.signalsInFolderContentToggle).toBeVisible();
    },
    signalsInFolderContentAccordionIsHidden: async (): Promise<void> => {
      await expect(this.signalsInFolderContentToggle).toBeHidden();
    },
    attributionsInFolderContentAccordionIsVisible: async (): Promise<void> => {
      await expect(this.attributionsInFolderContentToggle).toBeVisible();
    },
    attributionsInFolderContentAccordionIsHidden: async (): Promise<void> => {
      await expect(this.attributionsInFolderContentToggle).toBeHidden();
    },
    overrideParentButtonIsVisible: async (): Promise<void> => {
      await expect(this.overrideParentButton).toBeVisible();
    },
    overrideParentButtonIsHidden: async (): Promise<void> => {
      await expect(this.overrideParentButton).toBeHidden();
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
