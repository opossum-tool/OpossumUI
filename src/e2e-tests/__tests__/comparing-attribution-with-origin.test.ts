// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { AttributionType } from '../../Frontend/enums/enums';
import { OpossumColors } from '../../Frontend/shared-styles';
import { faker, test } from '../utils';

const [resourceName1, resourceName2] = faker.opossum.resourceNames({
  count: 2,
});
const [attributionId1, manualPackageInfo1] = faker.opossum.manualAttribution();
const [attributionId2, manualPackageInfo2] = faker.opossum.manualAttribution({
  originIds: [faker.opossum.attributionId()],
  licenseText: faker.opossum.license().defaultText,
});
const [externalAttributionId, externalPackageInfo] =
  faker.opossum.externalAttribution(manualPackageInfo2);

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName1]: 1,
        [resourceName2]: 1,
      }),
      externalAttributions: faker.opossum.externalAttributions({
        [externalAttributionId]: externalPackageInfo,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName2)]: [externalAttributionId],
      }),
    }),
    outputData: faker.opossum.outputData({
      manualAttributions: faker.opossum.manualAttributions({
        [attributionId1]: manualPackageInfo1,
        [attributionId2]: manualPackageInfo2,
      }),
      resourcesToAttributions: faker.opossum.resourcesToAttributions({
        [faker.opossum.filePath(resourceName1)]: [attributionId1],
        [faker.opossum.filePath(resourceName2)]: [attributionId2],
      }),
    }),
  },
});

test('enables comparing attribution to origin if origin is present', async ({
  attributionDetails,
  diffPopup,
  resourceBrowser,
}) => {
  await resourceBrowser.goto(resourceName1);
  await attributionDetails.assert.compareButtonIsHidden();

  await resourceBrowser.goto(resourceName2);
  await attributionDetails.assert.compareButtonIsEnabled();

  await attributionDetails.compareButton.click();
  await diffPopup.assert.isVisible();

  await diffPopup.originalAttributionForm.assert.matchesPackageInfo(
    externalPackageInfo,
  );
  await diffPopup.currentAttributionForm.assert.matchesPackageInfo(
    manualPackageInfo2,
  );
});

test('shows modified fields in colours that indicate the change', async ({
  attributionDetails,
  diffPopup,
  resourceBrowser,
}) => {
  await resourceBrowser.goto(resourceName2);
  await attributionDetails.compareButton.click();
  await diffPopup.assert.isVisible();
  await diffPopup.currentAttributionForm.assert.nameHasColor(
    OpossumColors.black,
  );
  await diffPopup.originalAttributionForm.assert.licenseTextHasColor(
    OpossumColors.black,
  );

  await diffPopup.cancelButton.click();
  await diffPopup.assert.isHidden();

  await attributionDetails.attributionForm.name.fill(faker.word.noun());
  await attributionDetails.attributionForm.licenseTextToggleButton.click();
  await attributionDetails.attributionForm.licenseText.fill(
    faker.lorem.sentence(),
  );
  await attributionDetails.compareButton.click();
  await diffPopup.originalAttributionForm.assert.nameHasColor(
    OpossumColors.red,
  );
  await diffPopup.currentAttributionForm.assert.nameHasColor(
    OpossumColors.green,
  );
  await diffPopup.originalAttributionForm.assert.licenseTextHasColor(
    OpossumColors.red,
  );
  await diffPopup.currentAttributionForm.assert.licenseTextHasColor(
    OpossumColors.green,
  );

  await diffPopup.cancelButton.click();
  await attributionDetails.saveButton.click();
  await attributionDetails.compareButton.click();
  await diffPopup.originalAttributionForm.assert.nameHasColor(
    OpossumColors.red,
  );
  await diffPopup.currentAttributionForm.assert.nameHasColor(
    OpossumColors.green,
  );
  await diffPopup.originalAttributionForm.assert.licenseTextHasColor(
    OpossumColors.red,
  );
  await diffPopup.currentAttributionForm.assert.licenseTextHasColor(
    OpossumColors.green,
  );
});

test('hides copyright and license fields if package is first party', async ({
  attributionDetails,
  diffPopup,
  resourceBrowser,
}) => {
  await resourceBrowser.goto(resourceName2);
  await attributionDetails.attributionForm.selectAttributionType(
    AttributionType.FirstParty,
  );
  await attributionDetails.compareButton.click();
  await diffPopup.currentAttributionForm.assert.licenseTextIsHidden();
  await diffPopup.originalAttributionForm.assert.licenseTextHasColor(
    OpossumColors.black,
  );
});
