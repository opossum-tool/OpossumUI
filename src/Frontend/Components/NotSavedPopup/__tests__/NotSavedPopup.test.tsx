// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { MutationObserver } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../shared/text';
import { faker } from '../../../../testing/Faker';
import { queryClient } from '../../../Components/AppContainer/queryClient';
import { PopupType, View } from '../../../enums/enums';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import {
  setSelectedAttributionId,
  setSelectedResourceId,
  setTargetSelectedAttributionId,
  setTargetSelectedResourceId,
} from '../../../state/actions/resource-actions/audit-view-simple-actions';
import {
  openPopup,
  setOpenFileRequest,
  setQuitAppRequest,
  setTargetView,
  setView,
} from '../../../state/actions/view-actions/view-actions';
import {
  getSelectedAttributionId,
  getSelectedResourceId,
  getTemporaryDisplayPackageInfo,
} from '../../../state/selectors/resource-selectors';
import {
  getOpenPopup,
  getQuitAppRequested,
  getSelectedView,
} from '../../../state/selectors/view-selector';
import { renderComponent } from '../../../test-helpers/render';
import { NotSavedPopup } from '../NotSavedPopup';

describe('NotSavedPopup', () => {
  it('cancels without changes', async () => {
    const currentResourceId = faker.system.filePath();
    const targetResourceId = faker.system.filePath();
    const currentView = View.Audit;
    const targetView = View.Report;
    const currentAttributionId = faker.string.uuid();
    const targetAttributionId = faker.string.uuid();
    const packageInfo = faker.opossum.packageInfo();
    const { store } = await renderComponent(<NotSavedPopup />, {
      actions: [
        openPopup(PopupType.NotSavedPopup),
        setSelectedAttributionId(currentAttributionId),
        setSelectedResourceId(currentResourceId, 'auto'),
        setTargetSelectedAttributionId(targetAttributionId),
        setTargetSelectedResourceId(targetResourceId),
        setTargetView(targetView),
        setTemporaryDisplayPackageInfo(packageInfo),
        setView(currentView),
      ],
    });

    await userEvent.click(screen.getByText(text.buttons.cancel));

    expect(getOpenPopup(store.getState())).toBeFalsy();
    expect(getSelectedView(store.getState())).toBe(currentView);
    expect(getSelectedResourceId(store.getState())).toBe(currentResourceId);
    expect(getSelectedAttributionId(store.getState())).toBe(
      currentAttributionId,
    );
    expect(getTemporaryDisplayPackageInfo(store.getState())).toEqual(
      packageInfo,
    );
  });

  it('discards changes and navigates to target', async () => {
    const currentResourceId = faker.system.filePath();
    const targetResourceId = faker.system.filePath();
    const currentView = View.Audit;
    const targetView = View.Report;
    const currentAttributionId = faker.string.uuid();
    const targetAttributionId = faker.string.uuid();
    const packageInfo = faker.opossum.packageInfo();
    const { store } = await renderComponent(<NotSavedPopup />, {
      actions: [
        openPopup(PopupType.NotSavedPopup),
        setSelectedAttributionId(currentAttributionId),
        setSelectedResourceId(currentResourceId, 'auto'),
        setTargetSelectedAttributionId(targetAttributionId),
        setTargetSelectedResourceId(targetResourceId),
        setTargetView(targetView),
        setTemporaryDisplayPackageInfo(packageInfo),
        setView(currentView),
      ],
    });

    await userEvent.click(screen.getByText(text.unsavedChangesPopup.discard));

    expect(getOpenPopup(store.getState())).toBeFalsy();
    expect(getSelectedView(store.getState())).toBe(targetView);
    expect(getSelectedResourceId(store.getState())).toBe(targetResourceId);
    expect(getSelectedAttributionId(store.getState())).toBe(
      targetAttributionId,
    );
  });

  it('handles request to open a file', async () => {
    const filePath = '/path/to/project.opossum';

    await renderComponent(<NotSavedPopup />, {
      actions: [
        openPopup(PopupType.NotSavedPopup),
        setOpenFileRequest({ kind: 'path', filePath }),
      ],
    });

    await userEvent.click(screen.getByText(text.unsavedChangesPopup.discard));

    expect(global.window.electronAPI.openFile).toHaveBeenCalledWith(filePath);
  });

  it('shows the discard-and-quit label and confirms quit when quitting', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const { store } = await renderComponent(<NotSavedPopup />, {
      actions: [
        openPopup(PopupType.NotSavedPopup),
        setQuitAppRequest(true),
        setTemporaryDisplayPackageInfo(packageInfo),
      ],
    });

    expect(
      screen.getByText(text.unsavedChangesPopup.discardAndQuit),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByText(text.unsavedChangesPopup.discardAndQuit),
    );

    await vi.waitFor(() =>
      expect(global.window.electronAPI.confirmQuit).toHaveBeenCalledTimes(1),
    );
    expect(getQuitAppRequested(store.getState())).toBe(false);
    expect(getOpenPopup(store.getState())).toBeFalsy();
  });

  it('shows a spinner and disables cancel while quitting until mutations have settled', async () => {
    const packageInfo = faker.opossum.packageInfo();
    const { store } = await renderComponent(<NotSavedPopup />, {
      actions: [
        openPopup(PopupType.NotSavedPopup),
        setQuitAppRequest(true),
        setTemporaryDisplayPackageInfo(packageInfo),
      ],
    });

    let resolveMutation!: () => void;
    const observer = new MutationObserver(queryClient, {
      mutationFn: () =>
        new Promise<void>((resolve) => {
          resolveMutation = resolve;
        }),
    });
    void observer.mutate();
    await vi.waitFor(() => expect(queryClient.isMutating()).toBe(1));

    await userEvent.click(
      screen.getByText(text.unsavedChangesPopup.discardAndQuit),
    );

    expect(getOpenPopup(store.getState())?.popup).toBe(PopupType.NotSavedPopup);
    expect(
      screen.getByRole('button', {
        name: text.unsavedChangesPopup.discardAndQuit,
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: text.buttons.cancel }),
    ).toBeDisabled();

    resolveMutation();
    await vi.waitFor(() =>
      expect(global.window.electronAPI.confirmQuit).toHaveBeenCalledTimes(1),
    );
    expect(getOpenPopup(store.getState())).toBeFalsy();

    observer.reset();
  });
});
