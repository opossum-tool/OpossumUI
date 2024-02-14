// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const metadata = faker.opossum.metadata();

test.use({
  data: {
    inputData: faker.opossum.inputData({ metadata }),
  },
});

test('opens, displays, and closes project metadata', async ({
  menuBar,
  projectMetadataPopup,
}) => {
  await menuBar.openProjectMetadata();
  await projectMetadataPopup.assert.titleIsVisible();
  await projectMetadataPopup.assert.attributeIsVisible(metadata.projectId);

  await projectMetadataPopup.closeButton.click();
  await projectMetadataPopup.assert.titleIsHidden();
});
