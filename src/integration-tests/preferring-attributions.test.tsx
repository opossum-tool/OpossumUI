// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { describe, it } from 'vitest';

import { deserializeAttributions } from '../ElectronBackend/input/parseInputData';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { text } from '../shared/text';
import { faker } from '../testing/Faker';
import { renderApp } from '../testing/render-app';
import {
  clickAuditingMenuOption,
  closeAuditingOptionsMenu,
  expectAttributionFormMatchesPackageInfo,
  expectAttributionSaveButtonIsEnabled,
  expectAuditingMenuOptionNotShown,
  expectAuditingMenuOptionShown,
  expectAuditingOptionChipNotShown,
  expectAuditingOptionChipShown,
  gotoResource,
  openAuditingOptionsMenu,
  removeAuditingOption,
  sendUserSettingsChange,
} from '../testing/ui';

const source = faker.opossum.source();
const [resourceName1, resourceName2] = faker.opossum.resourceNames({
  count: 2,
});
const [externalAttributionId, externalPackageInfo] =
  faker.opossum.rawAttribution({ source });
const [manualAttributionId, manualPackageInfo] = faker.opossum.rawAttribution();

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    [resourceName1]: 1,
    [resourceName2]: 1,
  }),
  externalAttributions: deserializeAttributions({
    [externalAttributionId]: externalPackageInfo,
  }),
  resourcesToExternalAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(resourceName1)]: [externalAttributionId],
  }),
  manualAttributions: deserializeAttributions({
    [manualAttributionId]: manualPackageInfo,
  }),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [faker.opossum.filePath(resourceName1)]: [manualAttributionId],
    [faker.opossum.filePath(resourceName2)]: [manualAttributionId],
  }),
  externalAttributionSources: faker.opossum.externalAttributionSources({
    [source.name]: faker.opossum.externalAttributionSource({
      isRelevantForPreferred: true,
    }),
  }),
});

describe('preferring attributions', () => {
  it('allows QA user to mark and unmark attributions as preferred', async () => {
    const { sendToChannel } = await renderApp({ data });
    await gotoResource(resourceName1);
    await expectAttributionFormMatchesPackageInfo(manualPackageInfo);
    await expectAttributionSaveButtonIsEnabled(false);
    await expectAuditingOptionChipNotShown('preferred');

    await openAuditingOptionsMenu();
    await expectAuditingMenuOptionNotShown(
      text.auditingOptions.currentlyPreferred,
    );

    // Simulates the View > QA Mode native menu toggle.
    sendUserSettingsChange(sendToChannel, { qaMode: true });
    await expectAuditingMenuOptionShown(
      text.auditingOptions.currentlyPreferred,
    );

    await clickAuditingMenuOption(text.auditingOptions.currentlyPreferred);
    await closeAuditingOptionsMenu();
    await expectAuditingOptionChipShown('preferred');
    await expectAttributionSaveButtonIsEnabled(true);

    await openAuditingOptionsMenu();
    await expectAuditingMenuOptionNotShown(
      text.auditingOptions.currentlyPreferred,
    );

    await closeAuditingOptionsMenu();
    await removeAuditingOption('preferred');
    await expectAuditingOptionChipNotShown('preferred');
    await expectAttributionSaveButtonIsEnabled(false);
  });
});
