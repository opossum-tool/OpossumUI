// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { describe, it } from 'vitest';

import { deserializeAttributions } from '../../ElectronBackend/input/parseInputData';
import { faker } from '../../testing/Faker';
import { getParsedInputFileEnrichedWithTestData } from '../test-helpers/general-test-helpers';
import { renderApp } from './helpers/render-app';
import {
  cancelSplitDialog,
  expectSplitDialogCreateButtonEnabled,
  expectSplitDialogVisibility,
  expectUnsavedChangesPopupVisibility,
  fillFormField,
  gotoResource,
  openSplitDialogFromMenu,
  openSplitDialogViaTreeContextMenu,
} from './helpers/ui';

const [
  firstDirectoryName,
  secondDirectoryName,
  nestedDirectoryName,
  firstResourceName,
  secondResourceName,
] = faker.opossum.resourceNames({ count: 5 });
const firstResourcePath = faker.opossum.filePath(
  firstDirectoryName,
  firstResourceName,
);
const [attributionId, packageInfo] = faker.opossum.rawAttribution();

const data = getParsedInputFileEnrichedWithTestData({
  resources: faker.opossum.resources({
    [firstDirectoryName]: { [firstResourceName]: 1 },
    [secondDirectoryName]: {
      [nestedDirectoryName]: { [secondResourceName]: 1 },
    },
  }),
  metadata: faker.opossum.metadata({ projectId: 'test_project' }),
  manualAttributions: deserializeAttributions({
    [attributionId]: packageInfo,
  }),
  resourcesToManualAttributions: faker.opossum.resourcesToAttributions({
    [firstResourcePath]: [attributionId],
  }),
});

describe('splitting opossum files (dialog UX)', () => {
  it('opens and cancels the create split dialog', async () => {
    await renderApp({ data });
    await openSplitDialogViaTreeContextMenu(firstDirectoryName);
    await expectSplitDialogVisibility(true);

    await cancelSplitDialog();

    await expectSplitDialogVisibility(false);
  });

  it('opens the create split dialog from the File menu', async () => {
    const { sendToChannel } = await renderApp({ data });
    openSplitDialogFromMenu(sendToChannel);

    await expectSplitDialogVisibility(true);
    await expectSplitDialogCreateButtonEnabled(false);
  });

  it('warns user of unsaved changes before creating a split', async () => {
    const comment = faker.lorem.sentences();

    await renderApp({ data });
    await gotoResource(firstDirectoryName, firstResourceName);
    fillFormField('comment', comment);

    await openSplitDialogViaTreeContextMenu(firstDirectoryName);

    await expectUnsavedChangesPopupVisibility(true);
    await expectSplitDialogVisibility(false);
  });
});
