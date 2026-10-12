// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { describe, it } from 'vitest';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import { ExportType, FileType } from '../../shared/shared-types';
import { text } from '../../shared/text';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';
import {
  clearFormField,
  clickAttributionColumnButton,
  clickAttributionLicenseTextToggle,
  clickAttributionTypeButton,
  clickPanelButton,
  clickPopupButton,
  clickTopBarOpenFileButton,
  clickTopBarViewButton,
  clickValidationSuggestion,
  expectAttributionColumnButtonEnabled,
  expectAttributionFormIsEmpty,
  expectAttributionFormLicenseText,
  expectAttributionFormMatchesPackageInfo,
  expectConfirmSavePopupIsVisible,
  expectFormFieldValues,
  expectMergeDialogMergesIntoCurrentProject,
  expectMergeDialogShowsCurrentFile,
  expectMergeDialogVisibility,
  expectPopupHidden,
  expectResourceVisibility,
  expectUnsavedChangesPopupVisibility,
  expectValidationDisplayHasNoMessages,
  expectValidationMessage,
  expectViewIsActive,
  fillAttributionLicenseText,
  fillFormField,
  gotoResource,
  selectLicenseExpressionOption,
} from './helpers/ui';

const ATTRIBUTIONS_PANEL = 'attributions-panel';

const [
  resourceName1,
  resourceName2,
  resourceName3,
  resourceName4,
  resourceName5,
] = faker.opossum.resourceNames({ count: 5 });
const license1 = faker.opossum.license();
const license2 = faker.opossum.license();
// Real SPDX license for testing suggestions
const apacheLicense = faker.opossum.license({
  shortName: 'Apache-2.0',
  fullName: 'Apache License 2.0',
});
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  packageType: undefined,
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  packageType: undefined,
  licenseName: license1.fullName,
});
const originId = faker.string.uuid();
const [wasPreferredOriginalAttributionId, wasPreferredOriginalPackageInfo] =
  faker.opossum.rawAttribution({
    wasPreferred: true,
    originIds: [originId],
  });
const [wasPreferredAttributionId, wasPreferredPackageInfo] =
  faker.opossum.rawAttribution({ ...wasPreferredOriginalPackageInfo });

const legacyOpossumFileFormat = {
  fileType: FileType.LEGACY_OPOSSUM,
  name: 'Legacy Opossum',
  extensions: ['json', 'json.gz'],
};

const data = getParsedInputFileEnrichedWithTestData({
  config: faker.opossum.inputData().config,
  resources: faker.opossum.resources({
    [resourceName1]: 1,
    [resourceName2]: 1,
    [resourceName3]: 1,
    [resourceName4]: 1,
    [resourceName5]: 1,
  }),
  externalAttributions: deserializeAttributions({
    [wasPreferredOriginalAttributionId]: wasPreferredOriginalPackageInfo,
  }),
  resourcesToExternalAttributions: {
    [faker.opossum.filePath(resourceName1)]: [
      wasPreferredOriginalAttributionId,
    ],
  },
  manualAttributions: deserializeAttributions({
    [attributionId1]: packageInfo1,
    [attributionId2]: packageInfo2,
    [wasPreferredAttributionId]: wasPreferredPackageInfo,
  }),
  resourcesToManualAttributions: {
    [faker.opossum.filePath(resourceName1)]: [attributionId1],
    [faker.opossum.filePath(resourceName2)]: [attributionId1],
    [faker.opossum.filePath(resourceName3)]: [attributionId2],
    [faker.opossum.filePath(resourceName4)]: [attributionId2],
    [faker.opossum.filePath(resourceName5)]: [wasPreferredAttributionId],
  },
  frequentLicenses: {
    nameOrder: [license1, license2, apacheLicense].map(
      ({ shortName, fullName }) => ({ shortName, fullName }),
    ),
    texts: {},
  },
});

describe('updating attributions', () => {
  it('warns user of unsaved changes if user attempts to open new file before saving', async () => {
    const { sendToChannel } = await renderApp({ data });
    const comment = faker.lorem.sentences();
    await gotoResource(resourceName1);
    fillFormField('comment', comment);

    await clickTopBarOpenFileButton();
    await expectUnsavedChangesPopupVisibility(true);

    await clickPopupButton('unsaved changes popup', text.buttons.cancel);
    await expectFormFieldValues({ comment });

    sendToChannel(AllowedFrontendChannels.OpenFile);
    await expectUnsavedChangesPopupVisibility(true);
  });

  it('warns user of unsaved changes if user attempts to navigate away before saving', async () => {
    await renderApp({ data });
    await gotoResource(resourceName1);
    fillFormField('comment', faker.lorem.sentences());

    await clickPanelButton(ATTRIBUTIONS_PANEL, 'Create new attribution');
    await expectUnsavedChangesPopupVisibility(true);

    await clickPopupButton(
      'unsaved changes popup',
      text.unsavedChangesPopup.discard,
    );
    await expectAttributionFormIsEmpty();
    await expectFormFieldValues({ licenseExpression: '' });

    fillFormField('comment', faker.lorem.sentences());
    await clickTopBarViewButton('report');
    await expectUnsavedChangesPopupVisibility(true);

    await clickPopupButton(
      'unsaved changes popup',
      text.unsavedChangesPopup.discard,
    );
    await expectViewIsActive('report');
  });

  it('warns user of unsaved changes if user attempts to import new file before saving', async () => {
    const { sendToChannel } = await renderApp({ data });
    const comment = faker.lorem.sentences();
    await gotoResource(resourceName1);
    fillFormField('comment', comment);

    sendToChannel(
      AllowedFrontendChannels.ShowImportDialog,
      legacyOpossumFileFormat,
      true,
    );
    await expectUnsavedChangesPopupVisibility(true);
  });

  it('warns user of unsaved changes if user attempts to merge file before saving', async () => {
    const { sendToChannel } = await renderApp({ data });
    const comment = faker.lorem.sentences();
    const currentFilePath = '/current/project.opossum';

    await gotoResource(resourceName1);
    fillFormField('comment', comment);

    // The native menu sends (loaded, currentFilePath); render the dialog the
    // same way so its current-file row appears as it did under the menu.
    sendToChannel(
      AllowedFrontendChannels.ShowMergeOpossumFilesDialog,
      true,
      currentFilePath,
    );
    await expectUnsavedChangesPopupVisibility(true);

    await clickPopupButton(
      'unsaved changes popup',
      text.unsavedChangesPopup.discard,
    );
    await expectMergeDialogVisibility(true);
    await expectMergeDialogMergesIntoCurrentProject();
    await expectMergeDialogShowsCurrentFile(currentFilePath);
  });

  it('warns user of unsaved changes if user attempts to export data before saving', async () => {
    const { sendToChannel } = await renderApp({ data });
    const comment = faker.lorem.sentences();
    await gotoResource(resourceName1);
    fillFormField('comment', comment);

    sendToChannel(
      AllowedFrontendChannels.ExportFileRequest,
      ExportType.FollowUp,
    );
    await expectUnsavedChangesPopupVisibility(true);
  });

  it('allows user to update an attribution on the selected resource only', async () => {
    await renderApp({ data });
    const newPackageInfo = faker.opossum.rawPackageInfo({
      comment: faker.lorem.sentences(),
      licenseText: faker.lorem.sentences(),
      attributionConfidence: packageInfo1.attributionConfidence,
      packageType: undefined,
    });

    await gotoResource(resourceName1);
    await expectResourceVisibility(
      [resourceName1, resourceName2],
      [],
      'linked-resources-tree',
    );
    await expectAttributionFormMatchesPackageInfo(packageInfo1);
    await expectAttributionColumnButtonEnabled('save', false);
    await expectAttributionColumnButtonEnabled('revert', false);

    await clickAttributionLicenseTextToggle();
    fillAttributionLicenseText(newPackageInfo.licenseText!);
    await expectAttributionFormLicenseText(newPackageInfo.licenseText!);

    await clickAttributionTypeButton('First Party');
    await expectAttributionFormMatchesPackageInfo({
      ...packageInfo1,
      firstParty: true,
    });

    await clickAttributionTypeButton('Third Party');
    fillFormField('name', newPackageInfo.packageName!);
    fillFormField('version', newPackageInfo.packageVersion!);
    fillFormField('url', newPackageInfo.url!);
    fillFormField('copyright', newPackageInfo.copyright!);
    fillFormField('licenseExpression', newPackageInfo.licenseName!);
    fillFormField('comment', newPackageInfo.comment!);
    await expectAttributionFormMatchesPackageInfo(newPackageInfo);
    await expectAttributionColumnButtonEnabled('save', true);
    await expectAttributionColumnButtonEnabled('revert', true);

    await clickAttributionColumnButton('save');
    await expectConfirmSavePopupIsVisible();

    await clickPopupButton(
      text.saveAttributionsPopup.ariaLabel,
      text.saveAttributionsPopup.saveLocally,
    );
    await expectAttributionColumnButtonEnabled('save', false);
    await expectAttributionColumnButtonEnabled('revert', false);
    await expectResourceVisibility(
      [resourceName1],
      [resourceName2],
      'linked-resources-tree',
    );
  });

  it('allows user to update an attribution on all linked resources', async () => {
    await renderApp({ data });
    const newPackageName = faker.internet.domainWord();

    await gotoResource(resourceName1);
    await expectResourceVisibility(
      [resourceName1, resourceName2],
      [],
      'linked-resources-tree',
    );

    fillFormField('name', newPackageName);
    await clickAttributionColumnButton('save');
    await expectConfirmSavePopupIsVisible();
    await clickPopupButton(
      text.saveAttributionsPopup.ariaLabel,
      text.saveAttributionsPopup.saveGlobally,
    );
    // need to make sure that the confirmSavePopup is closed before any assertions
    // are run on linkedResourcesTree, because the confirmSavePopup also contains
    // a LinkedResourcesTree which makes locators resolve to 2 elements
    await expectPopupHidden(text.saveAttributionsPopup.ariaLabel);
    await expectFormFieldValues({ name: newPackageName });
    await expectResourceVisibility(
      [resourceName1, resourceName2],
      [],
      'linked-resources-tree',
    );
  });

  it('allows user to revert changes', async () => {
    await renderApp({ data });
    const newPackageName = faker.internet.domainWord();

    await gotoResource(resourceName1);
    await expectAttributionFormMatchesPackageInfo(packageInfo1);

    fillFormField('name', newPackageName);
    await expectAttributionFormMatchesPackageInfo({
      ...packageInfo1,
      packageName: newPackageName,
    });

    await clickAttributionColumnButton('revert');
    await expectAttributionFormMatchesPackageInfo(packageInfo1);
  });

  it('resets custom license text when user selects suggested license expression', async () => {
    await renderApp({ data });
    const licenseText = faker.lorem.sentences();

    await gotoResource(resourceName1);

    await clickAttributionLicenseTextToggle();
    fillAttributionLicenseText(licenseText);
    await expectAttributionFormLicenseText(licenseText);

    clearFormField('licenseExpression');
    await selectLicenseExpressionOption(license1.fullName);
    await expectAttributionFormLicenseText('');
  });

  it('autocomplete fills in SPDX licenses instead of friendly', async () => {
    await renderApp({ data });
    await gotoResource(resourceName1);

    clearFormField('licenseExpression');
    await selectLicenseExpressionOption(license1.fullName);
    await expectFormFieldValues({ licenseExpression: license1.shortName });
  });

  it('autocomplete appears again after entering AND or OR', async () => {
    await renderApp({ data });
    await gotoResource(resourceName1);

    for (const exp of ['AND', 'OR']) {
      fillFormField('licenseExpression', `${license1.shortName} ${exp} `);
      await selectLicenseExpressionOption(license2.fullName);
      await expectFormFieldValues({
        licenseExpression: `${license1.shortName} ${exp} ${license2.shortName}`,
      });
    }
  });

  it('shows validation error for invalid package type', async () => {
    await renderApp({ data });
    await gotoResource(resourceName1);

    fillFormField('packageType', 'NPM!');
    await expectValidationMessage(
      'autocomplete-packageType',
      'The type can only contain a-z and 0-9.',
    );

    fillFormField('packageType', 'npm');
    await expectValidationDisplayHasNoMessages('autocomplete-packageType');
  });

  it('shows validation error for invalid URL', async () => {
    await renderApp({ data });
    await gotoResource(resourceName1);
    await expectValidationDisplayHasNoMessages('autocomplete-url');

    fillFormField('url', 'not-a-valid-url');
    await expectValidationMessage('autocomplete-url', 'Invalid URL');

    fillFormField('url', 'https://example.com');
    await expectValidationDisplayHasNoMessages('autocomplete-url');
  });

  it('shows error for invalid SPDX expression syntax', async () => {
    await renderApp({ data });
    await gotoResource(resourceName1);

    fillFormField(
      'licenseExpression',
      `${license1.shortName} AND AND ${license2.shortName}`,
    );
    await expectValidationMessage(
      'license-sub-panel',
      'Invalid SPDX expression.',
    );

    fillFormField(
      'licenseExpression',
      `${license1.shortName} AND ${license2.shortName}`,
    );
    await expectValidationDisplayHasNoMessages('license-sub-panel');
  });

  it('suggests capitalizing SPDX conjunctions and applies fix on click', async () => {
    await renderApp({ data });
    await gotoResource(resourceName1);

    fillFormField(
      'licenseExpression',
      `${license1.shortName} and ${license2.shortName}`,
    );
    await expectValidationMessage(
      'license-sub-panel',
      'AND, OR and WITH need to be',
    );

    await clickValidationSuggestion('license-sub-panel', 'capitalized');
    await expectFormFieldValues({
      licenseExpression: `${license1.shortName} AND ${license2.shortName}`,
    });
    await expectValidationDisplayHasNoMessages('license-sub-panel');
  });

  it('shows warning for unknown license id', async () => {
    await renderApp({ data });
    await gotoResource(resourceName1);

    fillFormField('licenseExpression', 'Unknown-License-12345');
    await expectValidationMessage(
      'license-sub-panel',
      'is not a known license id.',
    );

    // Using a known license from the test data clears the warning
    clearFormField('licenseExpression');
    await selectLicenseExpressionOption(license1.fullName);
    await expectValidationDisplayHasNoMessages('license-sub-panel');
  });

  it('shows suggestion for misspelled SPDX license and applies fix on click', async () => {
    await renderApp({ data });
    await gotoResource(resourceName1);

    fillFormField('licenseExpression', 'Apache 2.0');
    await expectValidationMessage(
      'license-sub-panel',
      'is not a known license id.',
    );
    await expectValidationMessage('license-sub-panel', 'Did you mean');

    await clickValidationSuggestion('license-sub-panel', 'Apache-2.0');
    await expectFormFieldValues({ licenseExpression: 'Apache-2.0' });
    await expectValidationDisplayHasNoMessages('license-sub-panel');
  });
});
