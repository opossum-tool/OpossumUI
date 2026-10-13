// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { describe, it } from 'vitest';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import type {
  FrequentLicenses,
  RawPackageInfo,
} from '../../shared/shared-types';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';
import {
  clickFormField,
  clickPanelButton,
  expectAttributionFormIsEmpty,
  expectFormFieldValues,
  expectLicenseAutocompleteOptionContent,
  expectLicenseAutocompleteOptionOccurrenceTooltip,
  gotoResource,
  selectLicenseExpressionOption,
} from './helpers/ui';

const ATTRIBUTIONS_PANEL = 'attributions-panel';

const resourceName = faker.opossum.resourceName();
const licenses = faker.opossum.licenses({ count: 4 });
const occurrenceCounts = [
  { attributions: 4, signals: 5 },
  { attributions: 3, signals: 2 },
  { attributions: 2, signals: 0 },
  { attributions: 0, signals: 1 },
]; // sum of occurrences per license must be decreasing, otherwise the test fails

const attributionItems: Array<{ id: string; packageInfo: RawPackageInfo }> = [];
const signalItems: Array<{ id: string; packageInfo: RawPackageInfo }> = [];

for (const [licenseIndex, occurrenceCount] of occurrenceCounts.entries()) {
  const license = licenses[licenseIndex];
  for (let i = 0; i < occurrenceCount.attributions; i++) {
    const [id, packageInfo] = faker.opossum.rawAttribution({
      licenseName: license.shortName,
    });
    attributionItems.push({ id, packageInfo });
  }
  for (let i = 0; i < occurrenceCount.signals; i++) {
    const [id, packageInfo] = faker.opossum.rawAttribution({
      licenseName: license.shortName,
    });
    signalItems.push({ id, packageInfo });
  }
}

const frequentLicenses: FrequentLicenses = {
  nameOrder: licenses,
  texts: {},
};

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    [resourceName]: 1,
  }),
  frequentLicenses,
  externalAttributions: deserializeAttributions(
    Object.fromEntries(
      signalItems.map(({ id, packageInfo }) => [id, packageInfo]),
    ),
  ),
  resourcesToExternalAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(resourceName)]: signalItems.map(({ id }) => id),
  }),
  manualAttributions: deserializeAttributions(
    Object.fromEntries(
      attributionItems.map(({ id, packageInfo }) => [id, packageInfo]),
    ),
  ),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(resourceName)]: attributionItems.map(
      ({ id }) => id,
    ),
  }),
});

describe('license autocomplete', () => {
  it('sorts common licenses by number of occurrences', async () => {
    await renderApp({ data });
    await gotoResource(resourceName);
    await clickPanelButton(ATTRIBUTIONS_PANEL, 'Create new attribution');
    await expectAttributionFormIsEmpty();

    await clickFormField('licenseExpression');

    for (const [index, license] of licenses.entries()) {
      await expectLicenseAutocompleteOptionContent(index, {
        shortName: license.shortName,
        fullName: license.fullName,
      });
      const { attributions, signals } = occurrenceCounts[index];
      await expectLicenseAutocompleteOptionOccurrenceTooltip(
        index,
        attributions,
        signals,
      );
    }

    await selectLicenseExpressionOption(licenses[0].fullName);
    await expectFormFieldValues({
      licenseExpression: licenses[0].shortName,
    });
  });
});
