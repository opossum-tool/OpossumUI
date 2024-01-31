// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, Page } from '@playwright/test';

import { text } from '../../shared/text';
import { AttributionForm } from './AttributionForm';

export class AttributionDetails {
  private readonly window: Page;
  private readonly node: Locator;
  readonly attributionForm: AttributionForm;
  readonly saveButton: Locator;
  readonly saveGloballyButton: Locator;
  readonly saveMenuButton: Locator;
  readonly saveMenuOptions: {
    readonly save: Locator;
    readonly saveGlobally: Locator;
  };
  readonly confirmButton: Locator;
  readonly confirmGloballyButton: Locator;
  readonly confirmMenuButton: Locator;
  readonly confirmMenuOptions: {
    readonly confirm: Locator;
    readonly confirmGlobally: Locator;
  };
  readonly deleteButton: Locator;
  readonly deleteGloballyButton: Locator;
  readonly deleteMenuButton: Locator;
  readonly deleteMenuOptions: {
    readonly delete: Locator;
    readonly deleteGlobally: Locator;
  };
  readonly revertButton: Locator;
  readonly compareButton: Locator;
  readonly showHideSignalButton: Locator;

  constructor(window: Page) {
    this.window = window;
    this.node = window.getByLabel('attribution column');
    this.attributionForm = new AttributionForm(this.node, window);
    this.confirmButton = this.node.getByRole('button', {
      name: 'Confirm',
      exact: true,
    });
    this.confirmGloballyButton = this.node.getByRole('button', {
      name: 'Confirm globally',
      exact: true,
    });
    this.confirmMenuButton = this.node.getByLabel('save menu button');
    this.confirmMenuOptions = {
      confirm: this.window.getByRole('menuitem').getByText('Confirm', {
        exact: true,
      }),
      confirmGlobally: this.window
        .getByRole('menuitem')
        .getByText('Confirm globally', { exact: true }),
    };
    this.saveButton = this.node.getByRole('button', {
      name: 'Save',
      exact: true,
    });
    this.saveMenuButton = this.node.getByLabel('save menu button');
    this.saveMenuOptions = {
      save: this.window.getByRole('menuitem').getByText('Save', {
        exact: true,
      }),
      saveGlobally: this.window
        .getByRole('menuitem')
        .getByText('Save globally', {
          exact: true,
        }),
    };
    this.saveGloballyButton = this.node.getByRole('button', {
      name: 'Save globally',
      exact: true,
    });
    this.deleteButton = this.node.getByRole('button', {
      name: 'Delete',
      exact: true,
    });
    this.deleteGloballyButton = this.node.getByRole('button', {
      name: 'Delete globally',
      exact: true,
    });
    this.deleteMenuButton = this.node.getByLabel('delete menu button');
    this.deleteMenuOptions = {
      delete: this.window
        .getByRole('menuitem')
        .getByText('Delete', { exact: true }),
      deleteGlobally: this.window
        .getByRole('menuitem')
        .getByText('Delete globally', { exact: true }),
    };
    this.revertButton = this.node.getByRole('button', {
      name: 'Revert',
      exact: true,
    });
    this.compareButton = this.node.getByRole('button', {
      name: text.buttons.compareToOriginal,
      exact: true,
    });
    this.showHideSignalButton = this.node.getByLabel('resolve attribution');
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
    saveGloballyButtonIsVisible: async (): Promise<void> => {
      await expect(this.saveGloballyButton).toBeVisible();
    },
    saveGloballyButtonIsHidden: async (): Promise<void> => {
      await expect(this.saveGloballyButton).toBeHidden();
    },
    saveGloballyButtonIsEnabled: async (): Promise<void> => {
      await expect(this.saveGloballyButton).toBeEnabled();
    },
    saveGloballyButtonIsDisabled: async (): Promise<void> => {
      await expect(this.saveGloballyButton).toBeDisabled();
    },
    confirmButtonIsVisible: async (): Promise<void> => {
      await expect(this.confirmButton).toBeVisible();
    },
    confirmButtonIsHidden: async (): Promise<void> => {
      await expect(this.confirmButton).toBeHidden();
    },
    confirmGloballyButtonIsVisible: async (): Promise<void> => {
      await expect(this.confirmGloballyButton).toBeVisible();
    },
    confirmGloballyButtonIsHidden: async (): Promise<void> => {
      await expect(this.confirmGloballyButton).toBeHidden();
    },
    deleteButtonIsVisible: async (): Promise<void> => {
      await expect(this.deleteButton).toBeVisible();
    },
    deleteButtonIsHidden: async (): Promise<void> => {
      await expect(this.deleteButton).toBeHidden();
    },
    deleteGloballyButtonIsVisible: async (): Promise<void> => {
      await expect(this.deleteGloballyButton).toBeVisible();
    },
    deleteGloballyButtonIsHidden: async (): Promise<void> => {
      await expect(this.deleteGloballyButton).toBeHidden();
    },
    revertButtonIsVisible: async (): Promise<void> => {
      await expect(this.revertButton).toBeVisible();
    },
    revertButtonIsHidden: async (): Promise<void> => {
      await expect(this.revertButton).toBeHidden();
    },
    compareButtonIsEnabled: async (): Promise<void> => {
      await expect(this.compareButton).toBeEnabled();
    },
    compareButtonIsHidden: async (): Promise<void> => {
      await expect(this.compareButton).toBeHidden();
    },
    showHideSignalButtonIsVisible: async (): Promise<void> => {
      await expect(this.showHideSignalButton).toBeVisible();
    },
    showHideSignalButtonIsHidden: async (): Promise<void> => {
      await expect(this.showHideSignalButton).toBeHidden();
    },
  };

  async selectSaveMenuOption(
    option: keyof typeof this.saveMenuOptions,
  ): Promise<void> {
    await this.saveMenuButton.click();
    await this.saveMenuOptions[option].click();
  }

  async selectConfirmMenuOption(
    option: keyof typeof this.confirmMenuOptions,
  ): Promise<void> {
    await this.confirmMenuButton.click();
    await this.confirmMenuOptions[option].click();
  }

  async selectDeleteMenuOption(
    option: keyof typeof this.deleteMenuOptions,
  ): Promise<void> {
    await this.deleteMenuButton.click();
    await this.deleteMenuOptions[option].click();
  }
}
