// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, Page } from '@playwright/test';

import { RawFrequentLicense } from '../../ElectronBackend/types/types';
import { DiscreteConfidence, PackageInfo } from '../../shared/shared-types';
import { text } from '../../shared/text';

export class AttributionDetails {
  private readonly window: Page;
  private readonly node: Locator;
  readonly type: Locator;
  readonly namespace: Locator;
  readonly name: Locator;
  readonly version: Locator;
  readonly purl: Locator;
  readonly url: Locator;
  readonly copyright: Locator;
  readonly licenseName: Locator;
  readonly licenseText: Locator;
  readonly licenseTextToggleButton: Locator;
  readonly attributionType: Locator;
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
  readonly showHideSignalButton: Locator;
  readonly addAuditingOptionButton: Locator;
  readonly auditingOptionsMenu: {
    readonly currentlyPreferredOption: Locator;
    readonly needsFollowUpOption: Locator;
    readonly needsReviewOption: Locator;
    readonly excludedFromNoticeOption: Locator;
  };
  readonly auditingLabels: {
    readonly confidenceLabel: Locator;
    readonly currentlyPreferredLabel: Locator;
    readonly excludedFromNoticeLabel: Locator;
    readonly followUpLabel: Locator;
    readonly needsReviewLabel: Locator;
    readonly preselectedLabel: Locator;
    readonly previouslyPreferredLabel: Locator;
    readonly sourceLabel: Locator;
  };

  constructor(window: Page) {
    this.window = window;
    this.node = window.getByLabel('attribution column');
    this.type = this.node.getByLabel(
      text.attributionColumn.packageSubPanel.packageType,
      { exact: true },
    );
    this.namespace = this.node.getByLabel(
      text.attributionColumn.packageSubPanel.packageNamespace,
      {
        exact: true,
      },
    );
    this.attributionType = this.node.getByRole('group');
    this.name = this.node.getByLabel(
      text.attributionColumn.packageSubPanel.packageName,
      { exact: true },
    );
    this.version = this.node.getByLabel(
      text.attributionColumn.packageSubPanel.packageVersion,
      { exact: true },
    );
    this.purl = this.node.getByLabel(
      text.attributionColumn.packageSubPanel.purl,
      { exact: true },
    );
    this.url = this.node.getByLabel(
      text.attributionColumn.packageSubPanel.repositoryUrl,
      { exact: true },
    );
    this.copyright = this.node.getByLabel('Copyright', { exact: true });
    this.licenseName = this.node.getByLabel(
      text.attributionColumn.licenseName,
      {
        exact: true,
      },
    );
    this.licenseText = this.node.getByLabel(
      'License Text (to appear in attribution document)',
      { exact: true },
    );
    this.licenseTextToggleButton = this.node.getByLabel('license text toggle');
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
    this.showHideSignalButton = this.node.getByLabel('resolve attribution');
    this.auditingLabels = {
      sourceLabel: this.node.getByTestId('auditing-option-source'),
      confidenceLabel: this.node.getByTestId('auditing-option-confidence'),
      preselectedLabel: this.node.getByTestId('auditing-option-pre-selected'),
      currentlyPreferredLabel: this.node.getByTestId(
        'auditing-option-preferred',
      ),
      previouslyPreferredLabel: this.node.getByTestId(
        'auditing-option-was-preferred',
      ),
      followUpLabel: this.node.getByTestId('auditing-option-follow-up'),
      needsReviewLabel: this.node.getByTestId('auditing-option-needs-review'),
      excludedFromNoticeLabel: this.node.getByTestId(
        'auditing-option-excluded-from-notice',
      ),
    };
    this.addAuditingOptionButton = this.node.getByRole('button', {
      name: text.auditingOptions.add,
    });
    this.auditingOptionsMenu = {
      currentlyPreferredOption: window
        .getByRole('menuitem')
        .getByText(text.auditingOptions.currentlyPreferred),
      needsFollowUpOption: window
        .getByRole('menuitem')
        .getByText(text.auditingOptions.followUp),
      needsReviewOption: window
        .getByRole('menuitem')
        .getByText(text.auditingOptions.needsReview),
      excludedFromNoticeOption: window
        .getByRole('menuitem')
        .getByText(text.auditingOptions.excludedFromNotice),
    };
  }

  public comment(number = 0): Locator {
    return this.node.getByLabel(number ? `Comment ${number}` : 'Comment', {
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
    isEmpty: async (): Promise<void> => {
      await expect(this.name).toBeEmpty();
      await expect(this.version).toBeEmpty();
      await expect(this.purl).toBeEmpty();
      await expect(this.url).toBeEmpty();
      await expect(this.comment()).toBeEmpty();
      await expect(this.licenseName).toBeEmpty();
      await this.assert.confidenceIs(DiscreteConfidence.High);
      await this.assert.attributionTypeIs('Third Party');
    },
    typeIs: async (type: string): Promise<void> => {
      await expect(this.type).toHaveValue(type);
    },
    namespaceIs: async (namespace: string): Promise<void> => {
      await expect(this.namespace).toHaveValue(namespace);
    },
    nameIs: async (name: string): Promise<void> => {
      await expect(this.name).toHaveValue(name);
    },
    versionIs: async (version: string): Promise<void> => {
      await expect(this.version).toHaveValue(version);
    },
    purlIs: async (purl: string): Promise<void> => {
      await expect(this.purl).toHaveValue(purl);
    },
    urlIs: async (url: string): Promise<void> => {
      await expect(this.url).toHaveValue(url);
    },
    copyrightIs: async (copyright: string): Promise<void> => {
      await expect(this.copyright).toHaveValue(copyright);
    },
    confidenceIs: async (confidence: number): Promise<void> => {
      await expect(
        this.auditingLabels.confidenceLabel.getByLabel(
          `confidence of ${Math.round((confidence / 100) * 5)}`,
        ),
      ).toHaveAttribute('aria-disabled', 'false');
    },
    attributionTypeIs: async (type: string): Promise<void> => {
      await expect(
        this.attributionType.getByRole('button', { name: type, exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
    },
    licenseNameIs: async (licenseName: string): Promise<void> => {
      await expect(this.licenseName).toHaveValue(licenseName);
    },
    licenseTextIs: async (licenseText: string): Promise<void> => {
      await expect(this.licenseText).toHaveValue(licenseText);
    },
    licenseTextIsVisible: async (): Promise<void> => {
      await expect(this.licenseText).toBeVisible();
    },
    licenseTextIsHidden: async (): Promise<void> => {
      await expect(this.licenseText).toBeHidden();
    },
    commentIs: async (comment: string, number = 0): Promise<void> => {
      await expect(this.comment(number)).toHaveValue(comment);
    },
    matchesPackageInfo: async ({
      attributionConfidence,
      comment,
      comments,
      copyright,
      firstParty,
      licenseName,
      licenseText,
      packageName,
      packageNamespace,
      packageType,
      packageVersion,
      url,
    }: PackageInfo & { comments?: Array<string> }): Promise<void> => {
      await Promise.all([
        ...(packageType ? [this.assert.typeIs(packageType)] : []),
        ...(packageNamespace
          ? [this.assert.namespaceIs(packageNamespace)]
          : []),
        ...(packageName ? [this.assert.nameIs(packageName)] : []),
        ...(packageVersion ? [this.assert.versionIs(packageVersion)] : []),
        ...(url ? [this.assert.urlIs(url)] : []),
        ...(copyright
          ? [
              firstParty
                ? await expect(this.copyright).toBeHidden()
                : this.assert.copyrightIs(copyright),
            ]
          : []),
        ...(firstParty ? [this.assert.attributionTypeIs('First Party')] : []),
        ...(licenseName
          ? [
              firstParty
                ? await expect(this.licenseName).toBeHidden()
                : this.assert.licenseNameIs(licenseName),
            ]
          : []),
        ...(licenseText ? [this.assert.licenseTextIs(licenseText)] : []),
        ...(comment ? [this.assert.commentIs(comment)] : []),
        ...(comments
          ? comments.map((item, index) =>
              this.assert.commentIs(item, index + 1),
            )
          : []),
        ...(attributionConfidence
          ? [this.assert.confidenceIs(attributionConfidence)]
          : []),
      ]);
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
    showHideSignalButtonIsVisible: async (): Promise<void> => {
      await expect(this.showHideSignalButton).toBeVisible();
    },
    showHideSignalButtonIsHidden: async (): Promise<void> => {
      await expect(this.showHideSignalButton).toBeHidden();
    },
    auditingMenuOptionIsVisible: async (
      option: keyof typeof this.auditingOptionsMenu,
    ): Promise<void> => {
      await expect(this.auditingOptionsMenu[option]).toBeVisible();
    },
    auditingMenuOptionIsHidden: async (
      option: keyof typeof this.auditingOptionsMenu,
    ): Promise<void> => {
      await expect(this.auditingOptionsMenu[option]).toBeHidden();
    },
    auditingLabelIsVisible: async (
      label: keyof typeof this.auditingLabels,
    ): Promise<void> => {
      await expect(this.auditingLabels[label]).toBeVisible();
    },
    auditingLabelIsHidden: async (
      label: keyof typeof this.auditingLabels,
    ): Promise<void> => {
      await expect(this.auditingLabels[label]).toBeHidden();
    },
  };

  async openAuditingOptionsMenu(): Promise<void> {
    await this.addAuditingOptionButton.click();
  }

  async closeAuditingOptionsMenu(): Promise<void> {
    await this.window.keyboard.press('Escape');
  }

  async toggleLicenseTextVisibility(): Promise<void> {
    await this.licenseTextToggleButton.click();
  }

  async selectLicense(license: RawFrequentLicense): Promise<void> {
    await this.window.getByText(license.fullName).click();
  }

  async removeAuditingLabel(
    label: keyof typeof this.auditingLabels,
  ): Promise<void> {
    await this.auditingLabels[label].getByTestId('CancelIcon').click();
  }

  async selectAttributionType(type: string): Promise<void> {
    await this.attributionType
      .getByRole('button', { name: type, exact: true })
      .click();
  }

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
