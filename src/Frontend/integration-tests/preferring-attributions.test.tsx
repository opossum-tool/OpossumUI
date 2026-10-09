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
  clickAuditingMenuOption,
  closeAuditingOptionsMenu,
  expectAttributionFormMatchesPackageInfo,
  expectAttributionSaveButtonIsEnabled,
  expectAuditingMenuOption,
  expectAuditingOptionChip,
  gotoResource,
  openAuditingOptionsMenu,
  removeAuditingOption,
  sendUserSettingsChange,
} from './helpers/ui';

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
    await expectAuditingOptionChip('preferred', false);

    await openAuditingOptionsMenu();
    await expectAuditingMenuOption(
      text.auditingOptions.currentlyPreferred,
      false,
    );

    // Simulates the View > QA Mode native menu toggle.
    sendUserSettingsChange(sendToChannel, { qaMode: true });
    await expectAuditingMenuOption(
      text.auditingOptions.currentlyPreferred,
      true,
    );

    await clickAuditingMenuOption(text.auditingOptions.currentlyPreferred);
    await closeAuditingOptionsMenu();
    await expectAuditingOptionChip('preferred', true);
    await expectAttributionSaveButtonIsEnabled(true);

    await openAuditingOptionsMenu();
    await expectAuditingMenuOption(
      text.auditingOptions.currentlyPreferred,
      false,
    );

    await closeAuditingOptionsMenu();
    await removeAuditingOption('preferred');
    await expectAuditingOptionChip('preferred', false);
    await expectAttributionSaveButtonIsEnabled(false);
  });
});
