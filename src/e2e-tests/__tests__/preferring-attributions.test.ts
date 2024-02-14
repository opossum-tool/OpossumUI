// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const source = faker.opossum.source();
const [resourceName1, resourceName2] = faker.opossum.resourceNames({
  count: 2,
});
const [externalAttributionId, externalPackageInfo] =
  faker.opossum.rawAttribution({ source });
const [manualAttributionId, manualPackageInfo] = faker.opossum.rawAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: 1,
        [resourceName2]: 1,
      }),
      externalAttributions: faker.opossum.rawAttributions({
        [externalAttributionId]: externalPackageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [externalAttributionId],
      }),
      externalAttributionSources: faker.opossum.externalAttributionSources({
        [source.name]: faker.opossum.externalAttributionSource({
          isRelevantForPreferred: true,
        }),
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [manualAttributionId]: manualPackageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [manualAttributionId],
        [faker.opossum.filePath(resourceName2)]: [manualAttributionId],
      }),
    }),
  },
});

test('allows QA user to mark and unmark attributions as preferred', async ({
  attributionDetails,
  menuBar,
  resourcesTree,
}) => {
  await resourcesTree.goto(resourceName1);
  await attributionDetails.attributionForm.assert.matchesPackageInfo(
    manualPackageInfo,
  );
  await attributionDetails.assert.saveButtonIsDisabled();
  await attributionDetails.attributionForm.assert.auditingLabelIsHidden(
    'currentlyPreferredLabel',
  );

  await attributionDetails.attributionForm.openAuditingOptionsMenu();
  await attributionDetails.attributionForm.assert.auditingMenuOptionIsHidden(
    'currentlyPreferredOption',
  );

  await menuBar.toggleQaMode();
  await attributionDetails.attributionForm.assert.auditingMenuOptionIsVisible(
    'currentlyPreferredOption',
  );

  await attributionDetails.attributionForm.auditingOptionsMenu.currentlyPreferredOption.click();
  await attributionDetails.attributionForm.closeAuditingOptionsMenu();
  await attributionDetails.attributionForm.assert.auditingLabelIsVisible(
    'currentlyPreferredLabel',
  );
  await attributionDetails.assert.saveButtonIsEnabled();

  await attributionDetails.attributionForm.openAuditingOptionsMenu();
  await attributionDetails.attributionForm.assert.auditingMenuOptionIsHidden(
    'currentlyPreferredOption',
  );

  await attributionDetails.attributionForm.closeAuditingOptionsMenu();
  await attributionDetails.attributionForm.removeAuditingLabel(
    'currentlyPreferredLabel',
  );
  await attributionDetails.assert.saveButtonIsDisabled();
});
