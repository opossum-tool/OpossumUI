// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect, type Locator, Page } from '@playwright/test';

import { RawFrequentLicense } from '../../ElectronBackend/types/types';
import { DiscreteConfidence, PackageInfo } from '../../shared/shared-types';

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
  readonly confidence: Locator;
  readonly confirmButton: Locator;
  readonly confirmGloballyButton: Locator;
  readonly saveButton: Locator;
  readonly saveGloballyButton: Locator;
  readonly hideToggleButton: Locator;
  readonly hamburgerMenuButton: Locator;
  readonly hamburgerMenu: {
    readonly deleteButton: Locator;
    readonly deleteGloballyButton: Locator;
    readonly markAsPreferred: Locator;
    readonly markForReplacementButton: Locator;
    readonly replaceMarkedButton: Locator;
    readonly undoButton: Locator;
    readonly unmarkAsPreferred: Locator;
    readonly unmarkForReplacementButton: Locator;
  };

  constructor(window: Page) {
    this.window = window;
    this.node = window.getByLabel('attribution column');
    this.type = this.node.getByLabel('Package Type', { exact: true });
    this.namespace = this.node.getByLabel('Package Namespace', {
      exact: true,
    });
    this.name = this.node.getByLabel('Package Name', { exact: true });
    this.version = this.node.getByLabel('Package Version', { exact: true });
    this.purl = this.node.getByLabel('PURL', { exact: true });
    this.url = this.node.getByLabel('Repository URL', { exact: true });
    this.copyright = this.node.getByLabel('Copyright', { exact: true });
    this.licenseName = this.node.getByRole('combobox', {
      name: 'License Name',
    });
    this.licenseText = this.node.getByLabel(
      'License Text (to appear in attribution document)',
      { exact: true },
    );
    this.licenseTextToggleButton = this.node.getByLabel('license text toggle');
    this.confidence = this.node.getByRole('combobox', {
      name: 'Confidence',
    });
    this.confirmButton = this.node.getByRole('button', {
      name: 'Confirm',
      exact: true,
    });
    this.confirmGloballyButton = this.node.getByRole('button', {
      name: 'Confirm globally',
      exact: true,
    });
    this.saveButton = this.node.getByRole('button', {
      name: 'Save',
      exact: true,
    });
    this.saveGloballyButton = this.node.getByRole('button', {
      name: 'Save globally',
      exact: true,
    });
    this.hideToggleButton = this.node.getByLabel('resolve attribution');
    this.hamburgerMenuButton = this.node.getByLabel('button-hamburger-menu');
    this.hamburgerMenu = {
      deleteButton: window
        .getByRole('menu')
        .getByRole('button', { name: 'Delete', exact: true }),
      deleteGloballyButton: window.getByRole('menu').getByRole('button', {
        name: 'Delete globally',
        exact: true,
      }),
      markAsPreferred: window.getByRole('menu').getByRole('button', {
        name: 'Mark as preferred',
        exact: true,
      }),
      markForReplacementButton: window.getByRole('menu').getByRole('button', {
        name: 'Mark for replacement',
        exact: true,
      }),
      replaceMarkedButton: window.getByRole('menu').getByRole('button', {
        name: 'Replace marked',
        exact: true,
      }),
      undoButton: window
        .getByRole('menu')
        .getByRole('button', { name: 'Undo', exact: true }),
      unmarkAsPreferred: window.getByRole('menu').getByRole('button', {
        name: 'Unmark as preferred',
        exact: true,
      }),
      unmarkForReplacementButton: window.getByRole('menu').getByRole('button', {
        name: 'Unmark for replacement',
        exact: true,
      }),
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
        this.confidence.getByText(confidence.toString()),
      ).toBeVisible();
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
    matchPackageInfo: async ({
      attributionConfidence,
      comment,
      comments,
      copyright,
      licenseName,
      licenseText,
      packageName,
      packageNamespace,
      packageType,
      packageVersion,
      url,
    }: PackageInfo & { comments?: string[] }): Promise<void> => {
      await Promise.all([
        ...(packageType ? [this.assert.typeIs(packageType)] : []),
        ...(packageNamespace
          ? [this.assert.namespaceIs(packageNamespace)]
          : []),
        ...(packageName ? [this.assert.nameIs(packageName)] : []),
        ...(packageVersion ? [this.assert.versionIs(packageVersion)] : []),
        ...(url ? [this.assert.urlIs(url)] : []),
        ...(copyright ? [this.assert.copyrightIs(copyright)] : []),
        ...(licenseName ? [this.assert.licenseNameIs(licenseName)] : []),
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
    buttonInHamburgerMenuIsVisible: async (
      button: keyof typeof this.hamburgerMenu,
    ): Promise<void> => {
      await expect(this.hamburgerMenu[button]).toBeVisible();
    },
    buttonInHamburgerMenuIsHidden: async (
      button: keyof typeof this.hamburgerMenu,
    ): Promise<void> => {
      await expect(this.hamburgerMenu[button]).toBeHidden();
    },
    buttonInHamburgerMenuIsEnabled: async (
      button: keyof typeof this.hamburgerMenu,
    ): Promise<void> => {
      await expect(this.hamburgerMenu[button]).toBeEnabled();
    },
    buttonInHamburgerMenuIsDisabled: async (
      button: keyof typeof this.hamburgerMenu,
    ): Promise<void> => {
      await expect(this.hamburgerMenu[button]).toBeDisabled();
    },
  };

  async openHamburgerMenu(): Promise<void> {
    await this.hamburgerMenuButton.click();
  }

  async closeHamburgerMenu(): Promise<void> {
    await this.window.keyboard.press('Escape');
  }

  async toggleLicenseTextVisibility(): Promise<void> {
    await this.licenseTextToggleButton.click();
  }

  async selectLicense(license: RawFrequentLicense): Promise<void> {
    await this.window
      .getByText(`${license.shortName} - ${license.fullName}`)
      .click();
  }
}
