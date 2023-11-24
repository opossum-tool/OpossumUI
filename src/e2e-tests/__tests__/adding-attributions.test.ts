// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DiscreteConfidence } from '../../shared/shared-types';
import { faker, test } from '../utils';

const [
  resourceName1,
  resourceName2,
  resourceName3,
  resourceName4,
  resourceName5,
  resourceName6,
] = faker.opossum.resourceNames({ count: 6 });
const [attributionId1, packageInfo1] = faker.opossum.manualAttribution();
const [attributionId2, packageInfo2] = faker.opossum.manualAttribution();
const [attributionId3, packageInfo3] = faker.opossum.manualAttribution();
const [attributionId4a, packageInfo4a] = faker.opossum.externalAttribution({
  comment: faker.lorem.sentence(),
});
const [attributionId4b, packageInfo4b] = faker.opossum.externalAttribution({
  ...packageInfo4a,
  comment: faker.lorem.sentence(),
});
const [attributionId5, packageInfo5] = faker.opossum.externalAttribution();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: { [resourceName2]: 1 },
        [resourceName3]: 1,
        [resourceName4]: 1,
        [resourceName5]: { [resourceName6]: 1 },
      }),
      attributionBreakpoints: [faker.opossum.folderPath(resourceName5)],
      externalAttributions: faker.opossum.externalAttributions({
        [attributionId4a]: packageInfo4a,
        [attributionId4b]: packageInfo4b,
        [attributionId5]: packageInfo5,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName4)]: [
          attributionId4a,
          attributionId4b,
        ],
        [faker.opossum.folderPath(resourceName5)]: [attributionId5],
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.manualAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
        [attributionId3]: packageInfo3,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.folderPath(resourceName1)]: [attributionId1],
        [faker.opossum.filePath(resourceName3)]: [attributionId2],
        [faker.opossum.filePath(resourceName4)]: [attributionId3],
      }),
    }),
  },
});

test('adds attribution and displays it correctly on parent and children', async ({
  attributionDetails,
  resourceBrowser,
  resourceDetails,
}) => {
  await resourceBrowser.gotoRoot();
  await resourceDetails.signalCard.assert.isVisible(packageInfo1, {
    subContext: resourceDetails.attributionsInFolderContentPanel,
  });
  await resourceDetails.signalCard.assert.isVisible(packageInfo2, {
    subContext: resourceDetails.attributionsInFolderContentPanel,
  });
  await resourceDetails.signalCard.assert.isVisible(packageInfo3, {
    subContext: resourceDetails.attributionsInFolderContentPanel,
  });
  await resourceDetails.signalCard.assert.isVisible(packageInfo5, {
    subContext: resourceDetails.signalsInFolderContentPanel,
  });

  await resourceBrowser.goto(resourceName1);
  await resourceDetails.attributionCard.assert.isVisible(packageInfo1);
  await resourceDetails.attributionCard.assert.isHidden(packageInfo2);

  await resourceDetails.gotoGlobalTab();
  await resourceDetails.signalCard.addButton(packageInfo2).click();
  await resourceDetails.attributionCard.assert.isVisible(packageInfo2);

  await resourceBrowser.goto(resourceName2);
  await resourceDetails.attributionCard.assert.isVisible(packageInfo1);
  await resourceDetails.attributionCard.assert.isVisible(packageInfo2);

  await resourceBrowser.gotoRoot();
  await resourceDetails.signalCard.assert.isVisible(packageInfo1, {
    subContext: resourceDetails.attributionsInFolderContentPanel,
  });
  await resourceDetails.signalCard.assert.isVisible(packageInfo2, {
    count: 2,
    subContext: resourceDetails.attributionsInFolderContentPanel,
  });
  await resourceDetails.signalCard.assert.isVisible(packageInfo3, {
    subContext: resourceDetails.attributionsInFolderContentPanel,
  });
  await resourceDetails.signalCard.assert.isVisible(packageInfo5, {
    subContext: resourceDetails.signalsInFolderContentPanel,
  });

  await resourceBrowser.goto(resourceName4);
  await resourceDetails.signalCard.assert.isVisible(packageInfo4a, {
    subContext: resourceDetails.signalsPanel,
  });

  await resourceDetails.signalCard.click(packageInfo4a);
  await attributionDetails.assert.matchesPackageInfo({
    ...packageInfo4a,
    comment: undefined,
    comments: [packageInfo4a.comment!, packageInfo4b.comment!],
  });

  await resourceDetails.signalCard.addButton(packageInfo4a).click();
  await attributionDetails.assert.matchesPackageInfo({
    ...packageInfo4a,
    attributionConfidence: DiscreteConfidence.High,
    comment: undefined,
  });
});

test('adds attribution to child via parent override', async ({
  attributionDetails,
  resourceBrowser,
  resourceDetails,
}) => {
  await resourceBrowser.goto(resourceName1);
  await resourceDetails.assert.overrideParentButtonIsHidden();

  await resourceBrowser.goto(resourceName2);
  await resourceDetails.attributionCard.assert.isVisible(packageInfo1);
  await attributionDetails.assert.matchesPackageInfo(packageInfo1);
  await resourceDetails.assert.globalTabIsDisabled();
  await resourceDetails.assert.overrideParentButtonIsVisible();
  await attributionDetails.assert.buttonInHamburgerMenuIsHidden('deleteButton');

  await resourceDetails.overrideParentButton.click();
  await resourceDetails.assert.globalTabIsEnabled();
  await resourceDetails.attributionCard.assert.isHidden(packageInfo1);

  await resourceDetails.gotoGlobalTab();
  await attributionDetails.assert.isEmpty();
  await resourceDetails.signalCard.assert.isVisible(packageInfo1);
  await resourceDetails.signalCard.assert.isVisible(packageInfo2);
  await resourceDetails.signalCard.assert.isVisible(packageInfo3);

  await resourceDetails.signalCard.click(packageInfo1);
  await attributionDetails.assert.matchesPackageInfo(packageInfo1);

  await resourceDetails.signalCard.addButton(packageInfo1).click();
  await resourceDetails.attributionCard.assert.isVisible(packageInfo1);
  await resourceDetails.signalCard.assert.isVisible(packageInfo1);
  await resourceDetails.signalCard.assert.isVisible(packageInfo2);
  await resourceDetails.signalCard.assert.isVisible(packageInfo3);

  await attributionDetails.assert.matchesPackageInfo({
    ...packageInfo1,
    attributionConfidence: DiscreteConfidence.High,
  });
});

test('does not add attributions to breakpoints', async ({
  attributionDetails,
  resourceBrowser,
  resourceDetails,
}) => {
  await resourceBrowser.goto(resourceName5);
  await resourceDetails.assert.addNewAttributionButtonIsHidden();
  await attributionDetails.assert.isHidden();
  await resourceDetails.signalCard.assert.isVisible(packageInfo5, {
    subContext: resourceDetails.signalsPanel,
  });
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo5);

  await resourceDetails.gotoGlobalTab();
  await resourceDetails.signalCard.assert.isVisible(packageInfo1);
  await resourceDetails.signalCard.assert.isVisible(packageInfo2);
  await resourceDetails.signalCard.assert.isVisible(packageInfo3);
  await resourceDetails.signalCard.assert.isHidden(packageInfo5);
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo1);
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo2);
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo3);
  await resourceDetails.signalCard.assert.addButtonIsHidden(packageInfo5);
});
