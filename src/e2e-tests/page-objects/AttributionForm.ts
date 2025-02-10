// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, Locator, Page } from '@playwright/test';

import { RawFrequentLicense } from '../../ElectronBackend/types/types';
import { RawPackageInfo } from '../../shared/shared-types';
import { text } from '../../shared/text';

export class AttributionForm {
  private readonly window: Page;
  private readonly node: Locator;
  readonly type: Locator;
  readonly namespace: Locator;
  readonly name: Locator;
  readonly version: Locator;
  readonly purl: Locator;
  readonly url: Locator;
  readonly comment: Locator;
  readonly copyright: Locator;
  readonly licenseExpression: Locator;
  readonly licenseText: Locator;
  readonly licenseTextToggleButton: Locator;
  readonly attributionType: Locator;
  readonly addAuditingOptionButton: Locator;
  readonly auditingOptionsMenu: {
    readonly currentlyPreferredOption: Locator;
    readonly needsFollowUpOption: Locator;
    readonly needsReviewOption: Locator;
    readonly excludedFromNoticeOption: Locator;
  };
  readonly auditingLabels: {
    readonly confidenceLabel: Locator;
    readonly criticalityLabel: Locator;
    readonly currentlyPreferredLabel: Locator;
    readonly excludedFromNoticeLabel: Locator;
    readonly followUpLabel: Locator;
    readonly modifiedPreferredLabel: Locator;
    readonly needsReviewLabel: Locator;
    readonly preselectedLabel: Locator;
    readonly previouslyPreferredLabel: Locator;
    readonly sourceLabel: Locator;
  };
  readonly nameUndoButton: Locator;
  readonly nameRedoButton: Locator;
  readonly copyrightUndoButton: Locator;
  readonly copyrightRedoButton: Locator;
  readonly attributionTypeUndoButton: Locator;
  readonly attributionTypeRedoButton: Locator;

  constructor(context: Locator, window: Page) {
    this.window = window;
    this.node = context;
    this.type = this.node.getByLabel(text.attributionColumn.packageType, {
      exact: true,
    });
    this.namespace = this.node.getByLabel(
      text.attributionColumn.packageNamespace,
      {
        exact: true,
      },
    );
    this.attributionType = this.node.getByRole('group');
    this.name = this.node.getByLabel(text.attributionColumn.packageName, {
      exact: true,
    });
    this.version = this.node.getByLabel(text.attributionColumn.packageVersion, {
      exact: true,
    });
    this.purl = this.node.getByLabel(text.attributionColumn.purl, {
      exact: true,
    });
    this.url = this.node.getByLabel(text.attributionColumn.repositoryUrl, {
      exact: true,
    });
    this.comment = this.node.getByLabel('Comment', { exact: true });
    this.copyright = this.node.getByLabel('Copyright', { exact: true });
    this.licenseExpression = this.node.getByLabel(
      text.attributionColumn.licenseExpression,
      {
        exact: true,
      },
    );
    this.licenseTextToggleButton = this.node.getByLabel(
      'license-text-toggle-button',
    );
    this.licenseText = this.node.getByLabel(text.attributionColumn.licenseText);
    this.auditingLabels = {
      criticalityLabel: this.node.getByTestId('auditing-option-criticality'),
      confidenceLabel: this.node.getByTestId('auditing-option-confidence'),
      currentlyPreferredLabel: this.node.getByTestId(
        'auditing-option-preferred',
      ),
      excludedFromNoticeLabel: this.node.getByTestId(
        'auditing-option-excluded-from-notice',
      ),
      followUpLabel: this.node.getByTestId('auditing-option-follow-up'),
      modifiedPreferredLabel: this.node.getByTestId(
        'auditing-option-is-modified-preferred',
      ),
      needsReviewLabel: this.node.getByTestId('auditing-option-needs-review'),
      preselectedLabel: this.node.getByTestId('auditing-option-pre-selected'),
      previouslyPreferredLabel: this.node.getByTestId(
        'auditing-option-was-preferred',
      ),
      sourceLabel: this.node.getByTestId('auditing-option-source'),
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
    this.nameUndoButton = this.node.getByTestId('packageName-undo');
    this.nameRedoButton = this.node.getByTestId('packageName-redo');
    this.copyrightUndoButton = this.node.getByTestId('copyright-undo');
    this.copyrightRedoButton = this.node.getByTestId('copyright-redo');
    this.attributionTypeUndoButton = this.node.getByTestId('firstParty-undo');
    this.attributionTypeRedoButton = this.node.getByTestId('firstParty-redo');
  }

  public assert = {
    isEmpty: async (): Promise<void> => {
      await expect(this.name).toBeEmpty();
      await expect(this.version).toBeEmpty();
      await expect(this.purl).toBeEmpty();
      await expect(this.url).toBeEmpty();
      await expect(this.comment).toBeEmpty();
      await expect(this.licenseExpression).toBeEmpty();
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
      await expect(this.licenseExpression).toHaveValue(licenseName);
    },
    licenseTextIs: async (licenseText: string): Promise<void> => {
      await expect(this.licenseText).toHaveValue(licenseText);
    },
    commentIs: async (comment: string): Promise<void> => {
      await expect(this.comment).toHaveValue(comment);
    },
    matchesPackageInfo: async ({
      attributionConfidence,
      comment,
      copyright,
      firstParty,
      licenseName,
      licenseText,
      packageName,
      packageNamespace,
      packageType,
      packageVersion,
      url,
    }: RawPackageInfo): Promise<void> => {
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
                ? await expect(this.licenseExpression).toBeHidden()
                : this.assert.licenseNameIs(licenseName),
            ]
          : []),
        ...(licenseText ? [this.assert.licenseTextIs(licenseText)] : []),
        ...(comment ? [this.assert.commentIs(comment)] : []),
        ...(attributionConfidence
          ? [this.assert.confidenceIs(attributionConfidence)]
          : []),
      ]);
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
    nameUndoButtonIsVisible: async () => {
      await expect(this.nameUndoButton).toBeVisible();
    },
    nameUndoButtonIsHidden: async () => {
      await expect(this.nameUndoButton).toBeHidden();
    },
    nameRedoButtonIsVisible: async () => {
      await expect(this.nameRedoButton).toBeVisible();
    },
    nameRedoButtonIsHidden: async () => {
      await expect(this.nameRedoButton).toBeHidden();
    },
    copyrightUndoButtonIsVisible: async () => {
      await expect(this.copyrightUndoButton).toBeVisible();
    },
    copyrightUndoButtonIsHidden: async () => {
      await expect(this.copyrightUndoButton).toBeHidden();
    },
    copyrightRedoButtonIsVisible: async () => {
      await expect(this.copyrightRedoButton).toBeVisible();
    },
    copyrightRedoButtonIsHidden: async () => {
      await expect(this.copyrightRedoButton).toBeHidden();
    },
    attributionTypeUndoButtonIsVisible: async () => {
      await expect(this.attributionTypeUndoButton).toBeVisible();
    },
    attributionTypeUndoButtonIsHidden: async () => {
      await expect(this.attributionTypeUndoButton).toBeHidden();
    },
    attributionTypeRedoButtonIsVisible: async () => {
      await expect(this.attributionTypeRedoButton).toBeVisible();
    },
    attributionTypeRedoButtonIsHidden: async () => {
      await expect(this.attributionTypeRedoButton).toBeHidden();
    },
  };

  async openAuditingOptionsMenu(): Promise<void> {
    await this.addAuditingOptionButton.click();
  }

  async closeAuditingOptionsMenu(): Promise<void> {
    await this.window.keyboard.press('Escape');
  }

  async selectLicense(license: RawFrequentLicense): Promise<void> {
    await this.window.getByText(license.fullName).click();
  }

  async removeAuditingLabel(
    label: keyof typeof this.auditingLabels,
  ): Promise<void> {
    await this.auditingLabels[label].getByTestId('CancelIcon').click();
  }

  async selectAttributionType(
    type: 'First Party' | 'Third Party',
  ): Promise<void> {
    await this.attributionType
      .getByRole('button', { name: type, exact: true })
      .click();
  }
}
