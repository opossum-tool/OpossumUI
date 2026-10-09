// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import userEvent from '@testing-library/user-event';
import { describe, it } from 'vitest';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';
import {
  clickAttributionTypeButton,
  clickFormField,
  clickLicenseOption,
  clickPanelButton,
  clickPopupButton,
  expectAttributionFormIsEmpty,
  expectAttributionFormMatchesPackageInfo,
  expectAttributionSaveButtonIsEnabled,
  expectPackageCards,
  expectPopupHasText,
  expectPopupHidden,
  fillFormField,
  gotoResource,
  resourceTreeItem,
  saveChangesInAttributionColumn,
} from './helpers/ui';

const ATTRIBUTIONS_PANEL = 'attributions-panel';

const [resourceName1, resourceName2, resourceName3] =
  faker.opossum.resourceNames({ count: 3 });
const license1 = faker.opossum.license();
const license2 = faker.opossum.license();
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution();
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution();

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    [resourceName1]: 1,
    [resourceName2]: 1,
    [resourceName3]: 1,
  }),
  frequentLicenses: {
    nameOrder: [license1, license2],
    texts: {},
  },
  manualAttributions: deserializeAttributions({
    [attributionId1]: packageInfo1,
    [attributionId2]: packageInfo2,
  }),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(resourceName1)]: [attributionId1],
    [faker.opossum.filePath(resourceName2)]: [attributionId1],
    [faker.opossum.filePath(resourceName3)]: [attributionId2],
  }),
});

describe('creating attributions', () => {
  it('creates a new third-party attribution', async () => {
    const newPackageInfo = faker.opossum.rawPackageInfo({
      attributionConfidence: undefined,
      licenseName: license1.shortName,
    });
    await renderApp({ data });
    await gotoResource(resourceName1);
    await clickPanelButton(ATTRIBUTIONS_PANEL, 'Create new attribution');
    await expectAttributionFormIsEmpty();

    fillFormField('name', newPackageInfo.packageName ?? '');
    fillFormField('packageType', newPackageInfo.packageType ?? '');
    fillFormField('version', newPackageInfo.packageVersion ?? '');
    fillFormField('url', newPackageInfo.url ?? '');
    fillFormField('copyright', newPackageInfo.copyright ?? '');

    await clickFormField('licenseExpression');
    await clickLicenseOption(license1.fullName);
    await expectAttributionFormMatchesPackageInfo(newPackageInfo);

    await userEvent.click(resourceTreeItem(resourceName2));
    await expectPopupHasText(
      'unsaved changes popup',
      'You have unsaved changes. What would you like to do?',
    );

    await clickPopupButton('unsaved changes popup', 'Cancel');
    await expectPopupHidden('unsaved changes popup');
    await saveChangesInAttributionColumn();
    await expectPackageCards(ATTRIBUTIONS_PANEL, [newPackageInfo]);
  });

  it('creates a new first-party attribution', async () => {
    const firstPartyPackageInfo = faker.opossum.rawPackageInfo({
      attributionConfidence: undefined,
      copyright: undefined,
      firstParty: true,
      licenseName: undefined,
      packageName: undefined,
      packageType: undefined,
      packageVersion: undefined,
      url: undefined,
    });
    await renderApp({ data });
    await gotoResource(resourceName1);
    await clickPanelButton(ATTRIBUTIONS_PANEL, 'Create new attribution');
    await expectAttributionFormIsEmpty();

    await clickAttributionTypeButton('First Party');
    await expectAttributionFormMatchesPackageInfo(firstPartyPackageInfo);
    await expectAttributionSaveButtonIsEnabled();

    await saveChangesInAttributionColumn();
    await expectPackageCards(ATTRIBUTIONS_PANEL, [firstPartyPackageInfo]);
  });
});
