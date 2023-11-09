// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DiscreteConfidence } from '../../shared/shared-types';
import { faker, test } from '../utils';

const resourceName1 = faker.opossum.resourceName();
const resourceName2 = faker.opossum.resourceName();
const resourceName3 = faker.opossum.resourceName();
const resourceName4 = faker.opossum.resourceName();
const [attributionId1, packageInfo1] = faker.opossum.manualAttribution({
  preSelected: true,
});
const [attributionId2, packageInfo2] = faker.opossum.manualAttribution({
  preSelected: true,
});

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: 1,
        [resourceName2]: 1,
        [resourceName3]: 1,
        [resourceName4]: 1,
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.manualAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [attributionId1],
        [faker.opossum.filePath(resourceName2)]: [attributionId1],
        [faker.opossum.filePath(resourceName3)]: [attributionId1],
        [faker.opossum.filePath(resourceName4)]: [attributionId2],
      }),
    }),
  },
});

test('updates progress bar and confidence when user confirms preselected attributions in audit view', async ({
  attributionDetails,
  projectStatisticsPopup,
  resourceBrowser,
  resourceDetails,
  topBar,
}) => {
  await projectStatisticsPopup.close();
  await resourceBrowser.goto(resourceName1);
  await attributionDetails.assert.matchPackageInfo(packageInfo1);
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 4,
    filesWithOnlyPreSelectedAttributions: 4,
  });
  await attributionDetails.assert.confirmButtonIsVisible();
  await attributionDetails.assert.confirmGloballyButtonIsVisible();

  await resourceDetails.attributionCard.openContextMenu(packageInfo1);
  await resourceDetails.attributionCard.assert.contextMenu.buttonsAreVisible(
    'confirmButton',
    'confirmGloballyButton',
  );

  await resourceDetails.attributionCard.closeContextMenu();
  await attributionDetails.confirmButton.click();
  await attributionDetails.assert.confidenceIs(DiscreteConfidence.High);
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 4,
    filesWithAttributions: 1,
    filesWithOnlyPreSelectedAttributions: 3,
  });
  await attributionDetails.assert.confirmButtonIsHidden();
  await attributionDetails.assert.confirmGloballyButtonIsHidden();

  await resourceDetails.attributionCard.openContextMenu(packageInfo1);
  await resourceDetails.attributionCard.assert.contextMenu.buttonsAreHidden(
    'confirmButton',
    'confirmGloballyButton',
  );

  await resourceDetails.attributionCard.closeContextMenu();
  await resourceBrowser.goto(resourceName2);
  await attributionDetails.assert.matchPackageInfo(packageInfo1);

  await resourceDetails.attributionCard.openContextMenu(packageInfo1);
  await resourceDetails.attributionCard.contextMenu.confirmGloballyButton.click();
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 4,
    filesWithAttributions: 3,
    filesWithOnlyPreSelectedAttributions: 1,
  });

  await resourceBrowser.goto(resourceName3);
  await attributionDetails.assert.confidenceIs(DiscreteConfidence.High);
  await attributionDetails.assert.confirmButtonIsHidden();
  await attributionDetails.assert.confirmGloballyButtonIsHidden();

  await resourceDetails.gotoGlobalTab();
  await resourceDetails.signalCard.openContextMenu(packageInfo2);
  await resourceDetails.signalCard.contextMenu.confirmGloballyButton.click();
  await topBar.assert.progressBarTooltipShowsValues({
    numberOfFiles: 4,
    filesWithAttributions: 4,
    filesWithOnlyPreSelectedAttributions: 0,
  });

  await resourceBrowser.goto(resourceName4);
  await attributionDetails.assert.matchPackageInfo({
    ...packageInfo2,
    attributionConfidence: DiscreteConfidence.High,
  });
  await attributionDetails.assert.confirmButtonIsHidden();
  await attributionDetails.assert.confirmGloballyButtonIsHidden();
});

test('updates confidence when user confirms preselected attributions in attribution view', async ({
  attributionDetails,
  attributionList,
  projectStatisticsPopup,
  resourceBrowser,
  topBar,
}) => {
  await projectStatisticsPopup.close();
  await topBar.gotoAttributionView();
  await attributionList.attributionCard.openContextMenu(packageInfo1);
  await attributionList.attributionCard.assert.contextMenu.buttonsAreHidden(
    'confirmButton',
  );
  await attributionList.attributionCard.assert.contextMenu.buttonsAreVisible(
    'confirmGloballyButton',
  );

  await attributionList.attributionCard.contextMenu.confirmGloballyButton.click();
  await attributionList.attributionCard.openContextMenu(packageInfo1);
  await attributionList.attributionCard.assert.contextMenu.buttonsAreHidden(
    'confirmButton',
    'confirmGloballyButton',
  );

  await attributionList.attributionCard.closeContextMenu();
  await attributionList.attributionCard.click(packageInfo1);
  await attributionDetails.assert.matchPackageInfo({
    ...packageInfo1,
    attributionConfidence: DiscreteConfidence.High,
  });

  await topBar.gotoAuditView();
  await resourceBrowser.goto(resourceName2);
  await attributionDetails.assert.matchPackageInfo({
    ...packageInfo1,
    attributionConfidence: DiscreteConfidence.High,
  });
});
