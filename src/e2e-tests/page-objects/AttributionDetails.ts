// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, Page } from '@playwright/test';

import { text } from '../../shared/text';
import { AttributionForm } from './AttributionForm';

export class AttributionDetails {
  private readonly node: Locator;
  readonly attributionForm: AttributionForm;
  readonly compareButton: Locator;
  readonly confirmButton: Locator;
  readonly deleteButton: Locator;
  readonly linkButton: Locator;
  readonly replaceButton: Locator;
  readonly restoreButton: Locator;
  readonly revertButton: Locator;
  readonly saveButton: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel('attribution column');
    this.attributionForm = new AttributionForm(this.node, window);
    this.confirmButton = this.node.getByRole('button', {
      name: text.attributionColumn.confirm,
      exact: true,
    });
    this.saveButton = this.node.getByRole('button', {
      name: text.attributionColumn.save,
      exact: true,
    });
    this.restoreButton = this.node.getByRole('button', {
      name: text.attributionColumn.restore,
      exact: true,
    });
    this.linkButton = this.node.getByRole('button', {
      name: text.attributionColumn.link,
      exact: true,
    });
    this.deleteButton = this.node.getByRole('button', {
      name: text.attributionColumn.delete,
      exact: true,
    });
    this.revertButton = this.node.getByRole('button', {
      name: text.attributionColumn.revert,
      exact: true,
    });
    this.replaceButton = this.node.getByRole('button', {
      name: text.attributionColumn.replace,
      exact: true,
    });
    this.compareButton = this.node.getByRole('button', {
      name: text.attributionColumn.compareToOriginal,
      exact: true,
    });
  }

  public assert = {
    isVisible: async (): Promise<void> => {
      await expect(this.node).toBeVisible();
    },
    isHidden: async (): Promise<void> => {
      await expect(this.node).toBeHidden();
    },
    saveButtonIsVisible: async (): Promise<void> => {
      await expect(this.saveButton).toBeVisible();
    },
    saveButtonIsHidden: async (): Promise<void> => {
      await expect(this.saveButton).toBeHidden();
    },
    saveButtonIsEnabled: async (): Promise<void> => {
      await expect(this.saveButton).toBeEnabled();
    },
    saveButtonIsDisabled: async (): Promise<void> => {
      await expect(this.saveButton).toBeDisabled();
    },
    revertButtonIsEnabled: async (): Promise<void> => {
      await expect(this.revertButton).toBeEnabled();
    },
    revertButtonIsDisabled: async (): Promise<void> => {
      await expect(this.revertButton).toBeDisabled();
    },
    revertButtonIsVisible: async (): Promise<void> => {
      await expect(this.revertButton).toBeVisible();
    },
    revertButtonIsHidden: async (): Promise<void> => {
      await expect(this.revertButton).toBeHidden();
    },
    confirmButtonIsVisible: async (): Promise<void> => {
      await expect(this.confirmButton).toBeVisible();
    },
    confirmButtonIsHidden: async (): Promise<void> => {
      await expect(this.confirmButton).toBeHidden();
    },
    confirmButtonIsEnabled: async (): Promise<void> => {
      await expect(this.confirmButton).toBeEnabled();
    },
    confirmButtonIsDisabled: async (): Promise<void> => {
      await expect(this.confirmButton).toBeDisabled();
    },
    deleteButtonIsVisible: async (): Promise<void> => {
      await expect(this.deleteButton).toBeVisible();
    },
    deleteButtonIsHidden: async (): Promise<void> => {
      await expect(this.deleteButton).toBeHidden();
    },
    compareButtonIsHidden: async (): Promise<void> => {
      await expect(this.compareButton).toBeHidden();
    },
    compareButtonIsVisible: async (): Promise<void> => {
      await expect(this.compareButton).toBeVisible();
    },
    replaceButtonIsVisible: async (): Promise<void> => {
      await expect(this.replaceButton).toBeVisible();
    },
    replaceButtonIsHidden: async (): Promise<void> => {
      await expect(this.replaceButton).toBeHidden();
    },
    restoreButtonIsVisible: async (): Promise<void> => {
      await expect(this.restoreButton).toBeVisible();
    },
    restoreButtonIsHidden: async (): Promise<void> => {
      await expect(this.restoreButton).toBeHidden();
    },
    linkButtonIsVisible: async (): Promise<void> => {
      await expect(this.linkButton).toBeVisible();
    },
    linkButtonIsHidden: async (): Promise<void> => {
      await expect(this.linkButton).toBeHidden();
    },
    linkButtonIsEnabled: async (): Promise<void> => {
      await expect(this.linkButton).toBeEnabled();
    },
    linkButtonIsDisabled: async (): Promise<void> => {
      await expect(this.linkButton).toBeDisabled();
    },
  };
}
