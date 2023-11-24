// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const resourceName = faker.opossum.resourceName();
const [attributionId, packageInfo] = faker.opossum.manualAttribution({});

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName]: 1,
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.manualAttributions({
        [attributionId]: packageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName)]: [attributionId],
      }),
    }),
  },
});

test('modifies attribution via attribution wizard', async ({
  attributionDetails,
  attributionWizard,
  resourceBrowser,
  resourceDetails,
}) => {
  await resourceBrowser.goto(resourceName);
  await resourceDetails.attributionCard.openContextMenu(packageInfo);
  await resourceDetails.attributionCard.contextMenu.openAttributionWizardButton.click();
  await attributionWizard.assert.isVisible();

  await attributionWizard.cancelButton.click();
  await attributionWizard.assert.isHidden();

  const namespace = faker.internet.domainWord();
  await resourceDetails.attributionCard.openContextMenu(packageInfo);
  await resourceDetails.attributionCard.contextMenu.openAttributionWizardButton.click();
  await attributionWizard.addItemToPackageNamespaceList(namespace);
  await attributionWizard.packageNamespaceList.getByText(namespace).click();
  await attributionWizard.nextButton.click();
  await attributionWizard.applyButton.click();
  await attributionDetails.assert.namespaceIs(namespace);
});
