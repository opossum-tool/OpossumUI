// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { stubDialog } from 'electron-playwright-helpers';

import { faker, test } from '../utils';

const [resourceName] = faker.opossum.resourceName();

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
  window,
  filePaths,
  data,
}) => {
  await menuBar.assert.openRecentIsDisabled();

  await stubDialog(window.app, 'showOpenDialogSync', [filePaths!.opossum]);
  await menuBar.openFile();

  await resourcesTree.assert.resourceIsVisible(resourceName);
  await menuBar.assert.openRecentIsEnabled();
  await menuBar.assert.hasRecentlyOpenedProject(
    data!.inputData.metadata.projectId,
  );
});
