// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { describe, it } from 'vitest';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import { text } from '../../shared/text';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';
import {
  clickAttributionColumnButton,
  clickAttributionLicenseTextToggle,
  clickDiffPopupAttributionType,
  clickDiffPopupButton,
  clickDiffPopupLicenseTextToggle,
  clickDiffPopupRestoreAttributionType,
  clickPopupButton,
  expectAttributionColumnButtonVisibility,
  expectAttributionFormLicenseText,
  expectAttributionLicenseTextVisibility,
  expectAttributionSaveButtonIsEnabled,
  expectAttributionTypePressed,
  expectDiffPopupAttributionType,
  expectDiffPopupFieldDirty,
  expectDiffPopupLegalField,
  expectDiffPopupLegalFieldsHidden,
  expectDiffPopupPackageName,
  expectDiffPopupSaveButtonEnabled,
  expectDiffPopupTitleIs,
  expectDiffPopupVisibility,
  expectFormFieldValues,
  expectPopupHidden,
  fillDiffPopupField,
  fillFormField,
  gotoResource,
} from './helpers/ui';

const [resourceName1, resourceName2] = faker.opossum.resourceNames({
  count: 2,
});
const packageName = faker.lorem.word();
const copyright = faker.lorem.sentence();
const [attributionId1, manualPackageInfo1] = faker.opossum.rawAttribution();
const [attributionId2, manualPackageInfo2] = faker.opossum.rawAttribution({
  originIds: [faker.string.uuid()],
  packageName,
  copyright,
  licenseName: 'MIT',
  licenseText: 'MIT License',
  firstParty: false,
});
const [externalAttributionId, externalPackageInfo] =
  faker.opossum.rawAttribution(manualPackageInfo2);

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    [resourceName1]: 1,
    [resourceName2]: 1,
  }),
  externalAttributions: deserializeAttributions({
    [externalAttributionId]: externalPackageInfo,
  }),
  resourcesToExternalAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(resourceName2)]: [externalAttributionId],
  }),
  manualAttributions: deserializeAttributions({
    [attributionId1]: manualPackageInfo1,
    [attributionId2]: manualPackageInfo2,
  }),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(resourceName1)]: [attributionId1],
    [faker.opossum.filePath(resourceName2)]: [attributionId2],
  }),
});

describe('comparing attribution with origin', () => {
  it('opens the diff popup with the original signal and current draft', async () => {
    await renderApp({ data });
    await gotoResource(resourceName1);
    await expectAttributionColumnButtonVisibility('compare', false);

    await gotoResource(resourceName2);
    await clickAttributionColumnButton('compare');
    await expectDiffPopupVisibility(true);
    await expectDiffPopupPackageName(
      'left',
      externalPackageInfo.packageName ?? '',
    );
    await expectDiffPopupPackageName('right', packageName);
    await expectDiffPopupTitleIs('left', text.attributionColumn.original);
    await expectDiffPopupTitleIs('right', text.attributionColumn.current);
  });

  it('preserves legal data when restoring the comparison attribution type', async () => {
    const changedPackageName = 'legal-data-preservation-edit';

    await renderApp({ data });
    await gotoResource(resourceName2);
    await clickAttributionColumnButton('compare');
    fillDiffPopupField('right', 'packageName', changedPackageName);
    await clickDiffPopupLicenseTextToggle('right');
    await clickDiffPopupAttributionType('right', 'First Party');
    await expectDiffPopupLegalFieldsHidden('right');

    await clickDiffPopupRestoreAttributionType(
      'right',
      'Third Party',
      text.attributionColumn.current,
    );
    await expectDiffPopupAttributionType('right', 'Third Party');
    await expectDiffPopupLegalField('right', 'copyright', copyright);
    await expectDiffPopupLegalField('right', 'licenseName', 'MIT');
    await expectDiffPopupLegalField('right', 'licenseText', 'MIT License');

    await clickDiffPopupButton('save');
    await clickPopupButton('confirm save popup', 'Save');
    await expectPopupHidden('confirm save popup');
    await expectDiffPopupVisibility(false);
    await expectFormFieldValues({ name: changedPackageName });
    await expectAttributionTypePressed('Third Party');
    await expectFormFieldValues({ copyright });
    await expectFormFieldValues({ licenseExpression: 'MIT' });
    await expectAttributionLicenseTextVisibility(false);
    await clickAttributionLicenseTextToggle();
    await expectAttributionFormLicenseText('MIT License');
    await expectAttributionSaveButtonIsEnabled(false);
  });

  it('edits stay local and closing the popup discards them', async () => {
    await renderApp({ data });
    await gotoResource(resourceName2);
    await clickAttributionColumnButton('compare');
    fillDiffPopupField('right', 'packageName', 'popup-only-edit');
    await expectDiffPopupFieldDirty('right', 'packageName', true);
    await clickDiffPopupButton('cancel');
    await expectDiffPopupVisibility(false);
    await expectFormFieldValues({ name: packageName });
  });

  it('preexisting attribution edits are visible when comparison opens', async () => {
    await renderApp({ data });
    await gotoResource(resourceName2);
    const newPackageName = faker.lorem.word();
    fillFormField('name', newPackageName);
    await clickAttributionColumnButton('compare');
    await expectDiffPopupPackageName('right', newPackageName);
  });

  it('restores an unsaved details edit through comparison', async () => {
    const unsavedPackageName = 'unsaved-comparison-edit';

    await renderApp({ data });
    await gotoResource(resourceName2);
    fillFormField('name', unsavedPackageName);
    await clickAttributionColumnButton('compare');
    await expectDiffPopupPackageName('right', unsavedPackageName);

    fillDiffPopupField('right', 'packageName', packageName);
    await expectDiffPopupSaveButtonEnabled(true);
    await clickDiffPopupButton('save');
    await expectPopupHidden('confirm save popup');
    await expectDiffPopupVisibility(false);
    await expectFormFieldValues({ name: packageName });
    await expectAttributionSaveButtonIsEnabled(false);

    await gotoResource(resourceName1);
    await expectPopupHidden('unsaved changes popup');
    await gotoResource(resourceName2);
    await expectPopupHidden('unsaved changes popup');
    await expectFormFieldValues({ name: packageName });
  });
});
