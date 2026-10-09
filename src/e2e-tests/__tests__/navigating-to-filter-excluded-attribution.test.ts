// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const [resourceName1, resourceName2, resourceName3, resourceName4] =
  faker.opossum.resourceNames({ count: 4 });
const [attributionId1, packageInfo1] = faker.opossum.rawAttribution({
  followUp: 'FOLLOW_UP',
  licenseName: 'MIT',
  url: '',
  wasPreferred: true,
});
const [attributionId2, packageInfo2] = faker.opossum.rawAttribution({
  licenseName: 'Apache-2.0',
});
const [attributionId3, packageInfo3] = faker.opossum.rawAttribution({
  firstParty: true,
});

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: {
          [resourceName2]: {
            [resourceName3]: 1,
          },
        },
        [resourceName4]: 1,
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.rawAttributions({
        [attributionId1]: packageInfo1,
        [attributionId2]: packageInfo2,
        [attributionId3]: packageInfo3,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1, resourceName2, resourceName3)]: [
          attributionId1,
        ],
        [faker.opossum.filePath(resourceName4)]: [attributionId2],
        [faker.opossum.folderPath(resourceName1, resourceName2)]: [
          attributionId3,
        ],
      }),
    }),
  },
});

test('navigates to an attribution excluded by audit filters', async ({
  attributionDetails,
  attributionsPanel,
  reportView,
  topBar,
}) => {
  await attributionsPanel.filterButton.click();
  await attributionsPanel.filters.firstParty.click();
  await attributionsPanel.closeFilterMenu();
  await attributionsPanel.packageCard.assert.isHidden(packageInfo1);

  await topBar.gotoReportView();
  await topBar.assert.reportViewIsActive();
  await reportView.assert.attributionIsVisible(attributionId1);
  await reportView.openAttributionInAuditView(attributionId1);

  await topBar.assert.auditViewIsActive();
  await attributionsPanel.packageCard.assert.isVisible(packageInfo1);
  await attributionDetails.attributionForm.assert.nameIs(
    packageInfo1.packageName!,
  );
});
