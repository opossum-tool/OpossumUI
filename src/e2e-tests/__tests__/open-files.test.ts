// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker, test } from '../utils';

const resourceName = faker.opossum.resourceName();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName]: 1,
      }),
      metadata: faker.opossum.metadata({
        projectId: 'test_project',
      }),
    }),
    outputData: faker.opossum.outputData({}),
  },
  openFromCLI: false,
});

test('opens Opossum file and shows project as recently opened', async ({
  menuBar,
  resourcesTree,
  filePaths,
}) => {
  await menuBar.assert.openRecentIsDisabled();

  await menuBar.openFileAndWaitForLoad(filePaths!.opossum);

  await resourcesTree.assert.resourceIsVisible(resourceName);
  await menuBar.assert.openRecentIsEnabled();
  await menuBar.assert.hasRecentlyOpenedProject(filePaths!.opossum);
});

test('opens file and activates initially disabled menu entries afterwards', async ({
  menuBar,
  filePaths,
  resourcesTree,
}) => {
  await menuBar.assert.openRecentIsDisabled();
  await menuBar.assert.initiallyDisabledEntriesAreDisabled();

  await menuBar.openFileAndWaitForLoad(filePaths!.opossum);

  await resourcesTree.assert.resourceIsVisible(resourceName);
  await menuBar.assert.initiallyDisabledEntriesAreEnabled();
});
