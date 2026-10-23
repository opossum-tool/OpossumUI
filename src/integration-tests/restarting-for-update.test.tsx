// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen, waitFor, within } from '@testing-library/react';

import { deserializeAttributions } from '../ElectronBackend/input/parseInputData';
import { getIsPackageInfoDirty } from '../Frontend/state/selectors/resource-selectors';
import { getParsedInputFileEnrichedWithTestData } from '../Frontend/test-helpers/general-test-helpers';
import { AllowedFrontendChannels } from '../shared/ipc-channels';
import { text } from '../shared/text';
import { faker } from '../testing/Faker';
import { renderApp } from './helpers/render-app';
import {
  clickTopBarViewButton,
  expectFormFieldValues,
  expectViewIsActive,
  fillFormField,
  gotoResource,
  saveChangesInAttributionColumn,
} from './helpers/ui';

const [attributionId, packageInfo] = faker.opossum.rawAttribution({
  packageName: 'before update',
});
const data = getParsedInputFileEnrichedWithTestData({
  resources: { file: 1 },
  manualAttributions: deserializeAttributions({ [attributionId]: packageInfo }),
  resourcesToManualAttributions: { '/file': [attributionId] },
});
const tag = 'OpossumUI-2026-10-23';

beforeEach(() => {
  vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue({
    status: 'downloaded',
    tag,
  });
  vi.mocked(window.electronAPI.restartAndUpdate).mockResolvedValue(undefined);
});

async function clickRestart() {
  fireEvent.click(
    await screen.findByRole('button', { name: text.updateApp.restart }),
  );
}
async function dirtyEditor() {
  const view = await renderApp({ data });
  await gotoResource('file');
  await expectFormFieldValues({ name: 'before update' });
  fillFormField('name', 'edited before update');
  await expectFormFieldValues({ name: 'edited before update' });
  expect(getIsPackageInfoDirty(view.store.getState())).toBe(true);
  return view;
}

test('shows progress and the restart action with automatic checks disabled', async () => {
  vi.mocked(window.electronAPI.getUpdateState).mockResolvedValue({
    status: 'downloading',
    tag,
    percent: 42,
  });
  const view = await renderApp({
    data,
    userSettings: { automaticallyCheckForUpdates: false },
  });
  expect(
    await screen.findByText(text.updateApp.downloading(42)),
  ).toBeInTheDocument();
  view.sendToChannel(AllowedFrontendChannels.UpdateStateChanged, {
    status: 'downloaded',
    tag,
  });
  expect(
    await screen.findByRole('button', { name: text.updateApp.restart }),
  ).toBeInTheDocument();
  expect(window.electronAPI.restartAndUpdate).not.toHaveBeenCalled();
});

test('requests installation directly when there are no unsaved editor changes', async () => {
  await renderApp({ data });
  await clickRestart();
  expect(window.electronAPI.restartAndUpdate).toHaveBeenCalledTimes(1);
  expect(
    screen.queryByLabelText('unsaved changes popup'),
  ).not.toBeInTheDocument();
});

test('uses the existing unsaved-changes popup and cancels without losing the draft', async () => {
  await dirtyEditor();
  await clickRestart();
  const popup = await screen.findByLabelText('unsaved changes popup');
  fireEvent.click(
    within(popup).getByRole('button', { name: text.buttons.cancel }),
  );
  await expectFormFieldValues({ name: 'edited before update' });
  expect(window.electronAPI.restartAndUpdate).not.toHaveBeenCalled();
  await clickTopBarViewButton('report');
  const navigationPopup = await screen.findByLabelText('unsaved changes popup');
  fireEvent.click(
    within(navigationPopup).getByRole('button', {
      name: text.unsavedChangesPopup.discard,
    }),
  );
  await expectViewIsActive('report');
  expect(window.electronAPI.restartAndUpdate).not.toHaveBeenCalled();
});

test('discards through the existing continuation and requests installation', async () => {
  const { store } = await dirtyEditor();
  await clickRestart();
  const popup = await screen.findByLabelText('unsaved changes popup');
  fireEvent.click(
    within(popup).getByRole('button', {
      name: text.unsavedChangesPopup.discard,
    }),
  );
  expect(window.electronAPI.restartAndUpdate).toHaveBeenCalledTimes(1);
  expect(getIsPackageInfoDirty(store.getState())).toBe(false);
});

test('uses the normal editor save after cancelling, then requests installation', async () => {
  await dirtyEditor();
  await clickRestart();
  const popup = await screen.findByLabelText('unsaved changes popup');
  fireEvent.click(
    within(popup).getByRole('button', { name: text.buttons.cancel }),
  );
  await saveChangesInAttributionColumn();
  await clickRestart();
  expect(window.electronAPI.restartAndUpdate).toHaveBeenCalledTimes(1);
});

test('reports installation request errors and allows another attempt', async () => {
  vi.mocked(window.electronAPI.restartAndUpdate).mockRejectedValueOnce(
    new Error('Could not start installer'),
  );
  await renderApp({ data });
  await clickRestart();
  expect(
    await screen.findByText('Could not start installer'),
  ).toBeInTheDocument();
  await clickRestart();
  await waitFor(() =>
    expect(window.electronAPI.restartAndUpdate).toHaveBeenCalledTimes(2),
  );
});

test('displays asynchronous installer errors and keeps the restart action available', async () => {
  const { sendToChannel } = await renderApp({ data });
  await clickRestart();
  sendToChannel(AllowedFrontendChannels.UpdateStateChanged, {
    status: 'restarting',
    tag,
  });
  expect(
    await screen.findByText(text.updateApp.restarting),
  ).toBeInTheDocument();
  sendToChannel(AllowedFrontendChannels.UpdateStateChanged, {
    status: 'downloaded',
    tag,
    error: 'Installer failed',
  });
  expect(await screen.findByText('Installer failed')).toBeInTheDocument();
  await clickRestart();
  expect(window.electronAPI.restartAndUpdate).toHaveBeenCalledTimes(2);
});
