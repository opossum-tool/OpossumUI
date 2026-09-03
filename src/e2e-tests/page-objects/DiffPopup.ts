// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, type Page } from '@playwright/test';

import { text } from '../../shared/text';

type DiffPopupSide = 'left' | 'right';
type EditableAuditingOption = 'followUp' | 'needsReview' | 'excludedFromNotice';
type AttributionType = 'First Party' | 'Third Party';
type LegalField = 'copyright' | 'licenseName' | 'licenseText';

export class DiffPopup {
  readonly node: Locator;
  readonly cancelButton: Locator;
  readonly saveButton: Locator;
  readonly leftPackageName: Locator;
  readonly rightPackageName: Locator;
  readonly leftPackageVersion: Locator;
  readonly rightPackageVersion: Locator;
  readonly header: Locator;

  constructor(window: Page) {
    this.node = window.getByLabel(text.diffPopup.ariaLabel, { exact: true });
    this.cancelButton = this.node.getByRole('button', {
      name: text.buttons.cancel,
      exact: true,
    });
    this.saveButton = this.node.getByRole('button', {
      name: text.diffPopup.saveChanges,
      exact: true,
    });
    this.leftPackageName = this.node.getByTestId('left-packageName');
    this.rightPackageName = this.node.getByTestId('right-packageName');
    this.leftPackageVersion = this.node.getByTestId('left-packageVersion');
    this.rightPackageVersion = this.node.getByTestId('right-packageVersion');
    this.header = this.node.getByTestId('comparison-header');
  }

  public assert = {
    isVisible: async (): Promise<void> => {
      await expect(this.node).toBeVisible();
    },
    isHidden: async (): Promise<void> => {
      await expect(this.node).toBeHidden();
    },
    leftPackageNameIs: async (value: string): Promise<void> => {
      await expect(this.leftPackageName).toHaveValue(value);
    },
    rightPackageNameIs: async (value: string): Promise<void> => {
      await expect(this.rightPackageName).toHaveValue(value);
    },
    rightPackageVersionIs: async (value: string): Promise<void> => {
      await expect(this.rightPackageVersion).toHaveValue(value);
    },
    leftTitleIs: async (value: string): Promise<void> => {
      await expect(this.header.locator(':scope > *').first()).toContainText(
        value,
      );
    },
    rightTitleIs: async (value: string): Promise<void> => {
      await expect(this.header.locator(':scope > *').last()).toContainText(
        value,
      );
    },
    rightPackageNameIsDirty: async (): Promise<void> => {
      await expect(
        this.node.getByTestId('right-packageName-field'),
      ).toHaveAttribute('data-dirty', 'true');
    },
    attributionTypeIs: async (
      side: DiffPopupSide,
      type: AttributionType,
    ): Promise<void> => {
      await expect(
        this.typeField(side).getByRole('button', { name: type, exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
    },
    legalFieldsAreHidden: async (side: DiffPopupSide): Promise<void> => {
      for (const field of [
        'copyright',
        'licenseName',
        'licenseText',
      ] as const) {
        await expect(this.legalField(side, field)).toBeHidden();
      }
    },
    legalFieldIs: async (
      side: DiffPopupSide,
      field: LegalField,
      value: string,
    ): Promise<void> => {
      await expect(this.legalField(side, field)).toHaveValue(value);
    },
    auditingOptionIsVisible: async (
      side: DiffPopupSide,
      option: 'follow-up' | 'needs-review' | 'excluded-from-notice',
    ): Promise<void> => {
      await expect(
        this.auditingOptions(side).getByTestId(`auditing-option-${option}`),
      ).toBeVisible();
    },
  };

  async addAuditingOption(
    side: DiffPopupSide,
    option: EditableAuditingOption,
  ): Promise<void> {
    await this.auditingOptions(side)
      .getByRole('button', { name: text.auditingOptions.add, exact: true })
      .click();
    await this.node
      .page()
      .getByRole('menuitem', {
        name: text.auditingOptions[option],
        exact: true,
      })
      .click();
    await this.node.page().keyboard.press('Escape');
  }

  async selectAttributionType(
    side: DiffPopupSide,
    type: AttributionType,
  ): Promise<void> {
    await this.typeField(side)
      .getByRole('group', { name: text.diffPopup.attributionType })
      .getByRole('button', { name: type, exact: true })
      .click();
  }

  async restoreAttributionType(
    side: DiffPopupSide,
    originalType: AttributionType,
    itemLabel: string,
  ): Promise<void> {
    await this.typeField(side)
      .getByRole('button', {
        name: text.diffPopup.restoreField(originalType, itemLabel),
        exact: true,
      })
      .click();
  }

  async expandLicenseText(side: DiffPopupSide): Promise<void> {
    await this.node
      .getByTestId(`${side}-licenseName-field`)
      .getByRole('button', {
        name: 'license-text-toggle-button',
        exact: true,
      })
      .click();
  }

  private auditingOptions(side: DiffPopupSide): Locator {
    return this.node.getByTestId(`${side}-auditing-options`);
  }

  private typeField(side: DiffPopupSide): Locator {
    return this.node.getByTestId(`${side}-firstParty-field`);
  }

  private legalField(side: DiffPopupSide, field: LegalField): Locator {
    return this.node.getByTestId(`${side}-${field}`);
  }
}
