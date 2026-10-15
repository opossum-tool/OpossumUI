// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

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

test.use({
  data: {
    inputData: faker.opossum.inputData({
      externalAttributions: faker.opossum.rawAttributions({
        [wasPreferredOriginalAttributionId]: wasPreferredOriginalPackageInfo,
      }),
      resources: faker.opossum.resources({
        [resourceName1]: 1,
        [resourceName2]: 1,
        [resourceName3]: 1,
        [resourceName4]: 1,
        [resourceName5]: 1,
      }),
      resourcesToAttributions: {
        [faker.opossum.filePath(resourceName1)]: [
          wasPreferredOriginalAttributionId,
        ],
      },
      frequentLicenses: [license1, license2, apacheLicense],
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
        [wasPreferredAttributionId]: wasPreferredPackageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [attributionId1],
        [faker.opossum.filePath(resourceName2)]: [attributionId1],
        [faker.opossum.filePath(resourceName3)]: [attributionId2],
        [faker.opossum.filePath(resourceName4)]: [attributionId2],
        [faker.opossum.filePath(resourceName5)]: [wasPreferredAttributionId],
      }),
    }),
  },
});

// The remaining 17 tests of this suite were converted to integration tests
// (src/Frontend/integration-tests/updating-attributions.test.tsx); their
// renderer-only coverage of unsaved-changes warnings, updating, reverting and
// form validation lives there. This test was kept e2e: porting it to the
// happy-dom harness surfaced a behavior divergence — after confirming the
// was-preferred modification dialog the integration store commits the draft
// earlier than a real browser (data-dirty becomes false), so the assertions
// cannot be mirrored faithfully yet.

test('switches correctly between previously-preferred and modified previously preferred statuses of an attribution', async ({
  attributionDetails,
  confirmationDialog,
  resourcesTree,
  attributionsPanel,
}) => {
  await resourcesTree.goto(resourceName5);
  await attributionsPanel.packageCard.assert.wasPreferredIconIsVisible(
    wasPreferredPackageInfo,
  );
  await attributionDetails.attributionForm.assert.auditingLabelIsVisible(
    'previouslyPreferredLabel',
  );

  await attributionDetails.attributionForm.comment.fill(faker.lorem.sentence());
  await confirmationDialog.assert.isVisible();

  await confirmationDialog.cancelButton.click();
  await attributionsPanel.packageCard.assert.wasPreferredIconIsVisible(
    wasPreferredPackageInfo,
  );

  await attributionDetails.attributionForm.comment.fill(faker.lorem.sentence());
  await confirmationDialog.okButton.click();
  await attributionsPanel.packageCard.assert.wasPreferredIconIsVisible(
    wasPreferredPackageInfo,
  );
  await attributionDetails.attributionForm.assert.auditingLabelIsHidden(
    'previouslyPreferredLabel',
  );
  await attributionDetails.attributionForm.assert.auditingLabelIsVisible(
    'modifiedPreferredLabel',
  );

  await attributionDetails.saveChanges();
  await attributionsPanel.packageCard.assert.wasPreferredIconIsHidden(
    wasPreferredPackageInfo,
  );
  await attributionsPanel.packageCard.assert.modifiedPreferredIconIsVisible(
    wasPreferredPackageInfo,
  );

  await attributionDetails.attributionForm.comment.fill('');
  await attributionsPanel.packageCard.assert.modifiedPreferredIconIsVisible(
    wasPreferredPackageInfo,
  );
  await attributionDetails.attributionForm.assert.auditingLabelIsHidden(
    'modifiedPreferredLabel',
  );
  await attributionDetails.attributionForm.assert.auditingLabelIsVisible(
    'previouslyPreferredLabel',
  );

  await attributionDetails.saveChanges();
  await attributionsPanel.packageCard.assert.modifiedPreferredIconIsHidden(
    wasPreferredPackageInfo,
  );
  await attributionsPanel.packageCard.assert.wasPreferredIconIsVisible(
    wasPreferredPackageInfo,
  );

  await attributionDetails.attributionForm.comment.fill(faker.lorem.sentence());
  await confirmationDialog.assert.isVisible();
});
