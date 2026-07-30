// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { expect } from '@playwright/test';

import { faker, stubOpenDialogSync, test } from '../utils';

interface ProgressStateUpdatedEvent {
  type: 'ProcessingStateUpdated';
  message: string;
}

type TestWindow = Window & {
  electronAPI: {
    on: (
      channel: string,
      listener: (event: unknown, data: ProgressStateUpdatedEvent) => void,
    ) => void;
  };
  __progressMessages: Array<string>;
};

const [resourceName] = faker.opossum.resourceName();

test.use({
  data: {
    inputData: faker.opossum.inputData({
      resources: faker.opossum.resources({
        [resourceName]: 1,
      }),
      metadata: faker.opossum.metadata({
        projectId: 'loading-progress',
      }),
    }),
    outputData: faker.opossum.outputData({}),
  },
  openFromCLI: false,
});

test('sends progress updates to the frontend while loading a file', async ({
  menuBar,
  resourcesTree,
  window,
  filePaths,
}) => {
  // Collect all ProcessingStateChanged events sent to the frontend.
  // The progress callback in loadFile emits info-level messages like
  // 'Deserializing signals', 'Loading into database', etc. If the
  // progress wiring is dropped these never arrive, so this test catches
  // that regression.
  await window.evaluate(() => {
    const testWindow = window as unknown as TestWindow;
    const messages: Array<string> = [];
    testWindow.__progressMessages = messages;
    testWindow.electronAPI.on('processing-state-changed', (_event, data) => {
      if (data?.type === 'ProcessingStateUpdated') {
        messages.push(data.message);
      }
    });
  });

  await stubOpenDialogSync(window.app, [filePaths!.opossum]);
  await menuBar.openFile();

  await resourcesTree.assert.resourceIsVisible(resourceName);

  const progressMessages = await window.evaluate(
    () => (window as unknown as TestWindow).__progressMessages,
  );

  // Assert on a loadFile-internal message, not the 'Initializing global
  // backend state' that handleOpeningFile sends directly — this only
  // arrives if the onProgress callback is wired through the db client.
  expect(progressMessages).toContain('Deserializing signals');
});
