// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';

import { parseOpossumFile } from '../../ElectronBackend/input/parseFile';
import { faker, test } from '../utils';

const cliResourceName = faker.opossum.resourceName();
const cliResourcePath = faker.opossum.filePath(cliResourceName);
const [preselectedAttributionId, preselectedPackageInfo] =
  faker.opossum.rawAttribution({
    preSelected: true,
  });

test.describe('saving an archive opened from the CLI', () => {
  test.use({
    data: {
      inputData: faker.opossum.inputData({
        externalAttributions: faker.opossum.rawAttributions({
          [preselectedAttributionId]: preselectedPackageInfo,
        }),
        resources: faker.opossum.resources({ [cliResourceName]: 1 }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [cliResourcePath]: [preselectedAttributionId],
        }),
      }),
    },
    openFromCLI: true,
  });

  test('persists a modification', async ({
    attributionDetails,
    attributionsPanel,
    filePaths,
    menuBar,
    resourcesTree,
  }) => {
    const comment = faker.lorem.sentences();

    await menuBar.assert.initiallyDisabledEntriesAreEnabled();
    await resourcesTree.goto(cliResourceName);
    await attributionsPanel.packageCard.click(preselectedPackageInfo);
    await attributionDetails.attributionForm.comment.fill(comment);
    await menuBar.saveChanges();

    // wait for the changes to be written to disk before loading
    await expect
      .poll(() => archiveContainsComment(filePaths!.opossum, comment), {
        message: 'Expected output.json to contain the updated attribution',
      })
      .toBe(true);

    await menuBar.openFileAndWaitForLoad(filePaths!.opossum);
    await resourcesTree.goto(cliResourceName);
    await attributionsPanel.packageCard.click(preselectedPackageInfo);
    await attributionDetails.attributionForm.assert.commentIs(comment);
  });
});

const [
  auditLinkedResourceName,
  auditDeletedResourceName,
  auditRejectedResourceName,
] = faker.opossum.resourceNames({ count: 3 });
const auditLinkedResourcePath = faker.opossum.filePath(auditLinkedResourceName);
const auditDeletedResourcePath = faker.opossum.filePath(
  auditDeletedResourceName,
);
const auditRejectedResourcePath = faker.opossum.filePath(
  auditRejectedResourceName,
);
const [auditLinkedAttributionId, auditLinkedPackageInfo] =
  faker.opossum.rawAttribution();
const [auditRejectedAttributionId, auditRejectedPackageInfo] =
  faker.opossum.rawAttribution();
const [auditDeletedAttributionId, auditDeletedPackageInfo] =
  faker.opossum.rawAttribution();

test.describe('saving an archive opened with the file dialog', () => {
  test.use({
    data: {
      inputData: faker.opossum.inputData({
        externalAttributions: faker.opossum.rawAttributions({
          [auditLinkedAttributionId]: auditLinkedPackageInfo,
          [auditRejectedAttributionId]: auditRejectedPackageInfo,
        }),
        resources: faker.opossum.resources({
          [auditLinkedResourceName]: 1,
          [auditDeletedResourceName]: 1,
          [auditRejectedResourceName]: 1,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [auditLinkedResourcePath]: [auditLinkedAttributionId],
          [auditRejectedResourcePath]: [auditRejectedAttributionId],
        }),
      }),
      outputData: faker.opossum.outputData({
        manualAttributions: faker.opossum.rawAttributions({
          [auditDeletedAttributionId]: auditDeletedPackageInfo,
        }),
        resourcesToAttributions: faker.opossum.resourcesToAttributions({
          [auditDeletedResourcePath]: [auditDeletedAttributionId],
          [auditRejectedResourcePath]: [auditDeletedAttributionId],
        }),
      }),
    },
    openFromCLI: false,
  });

  test('persists modifications', async ({
    attributionDetails,
    attributionsPanel,
    confirmDeletePopup,
    filePaths,
    menuBar,
    resourcesTree,
    signalsPanel,
  }) => {
    const comment = `Persisted audit value ${faker.string.uuid()}`;

    await menuBar.openFileAndWaitForLoad(filePaths!.opossum);

    await resourcesTree.goto(auditLinkedResourceName);
    await signalsPanel.packageCard.click(auditLinkedPackageInfo);
    await attributionDetails.linkButton.click();

    await resourcesTree.goto(auditDeletedResourceName);
    await attributionsPanel.packageCard.click(auditDeletedPackageInfo);
    await attributionDetails.deleteButton.click();
    await confirmDeletePopup.deleteGloballyButton.click();

    await resourcesTree.goto(auditRejectedResourceName);
    await signalsPanel.packageCard.click(auditRejectedPackageInfo);
    await attributionDetails.deleteButton.click();
    await signalsPanel.packageCard.assert.isHidden(auditRejectedPackageInfo);

    await resourcesTree.goto(auditLinkedResourceName);
    await attributionsPanel.packageCard.click(auditLinkedPackageInfo);
    await attributionDetails.attributionForm.comment.fill(comment);
    await menuBar.saveChanges();

    // wait for the changes to be written to disk before loading
    await expect
      .poll(() => archiveContainsComment(filePaths!.opossum, comment), {
        message: 'Expected changes to be persisted',
      })
      .toBe(true);

    await menuBar.openFileAndWaitForLoad(filePaths!.opossum);

    await resourcesTree.goto(auditLinkedResourceName);
    await attributionsPanel.packageCard.click(auditLinkedPackageInfo);
    await attributionDetails.attributionForm.assert.commentIs(comment);

    await resourcesTree.goto(auditDeletedResourceName);
    await attributionsPanel.packageCard.assert.isHidden(
      auditDeletedPackageInfo,
    );

    await resourcesTree.goto(auditRejectedResourceName);
    await attributionsPanel.packageCard.assert.isHidden(
      auditDeletedPackageInfo,
    );
    await signalsPanel.packageCard.assert.isHidden(auditRejectedPackageInfo);
    await signalsPanel.showDeletedButton.click();
    await signalsPanel.packageCard.assert.isVisible(auditRejectedPackageInfo);
  });
});

async function archiveContainsComment(
  filePath: string,
  comment: string,
): Promise<boolean> {
  const parsedFile = await parseOpossumFile(filePath);
  return (
    'input' in parsedFile &&
    parsedFile.output !== null &&
    Object.values(parsedFile.output.manualAttributions).some(
      (attribution) => attribution.comment === comment,
    )
  );
}
