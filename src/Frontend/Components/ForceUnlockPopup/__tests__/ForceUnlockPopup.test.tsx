// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../shared/text';
import { PopupType } from '../../../enums/enums';
import {
  closePopup,
  openPopup,
} from '../../../state/actions/view-actions/view-actions';
import {
  getOpenPopup,
  getOpenPopups,
} from '../../../state/selectors/view-selector';
import { renderComponent } from '../../../test-helpers/render';
import * as backendClient from '../../../util/backendClient';
import { GlobalPopup } from '../../GlobalPopup/GlobalPopup';

describe('ForceUnlockPopup', () => {
  it('disables buttons and shows a loading indicator while force unlock is running', async () => {
    let resolveForceUnlock: () => void = () => undefined;
    const forceUnlockPromise = new Promise<void>((resolve) => {
      resolveForceUnlock = resolve;
    });
    vi.mocked(window.electronAPI.forceUnlock).mockReturnValueOnce(
      forceUnlockPromise,
    );
    await renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.ForceUnlockPopup)],
    });
    const forceUnlockButton = screen.getByRole('button', {
      name: text.forceUnlock.confirm,
    });
    const cancelButton = screen.getByRole('button', {
      name: text.buttons.cancel,
    });

    await userEvent.click(forceUnlockButton);

    expect(forceUnlockButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    resolveForceUnlock();
  });

  it('closes after force unlock completes', async () => {
    vi.mocked(window.electronAPI.forceUnlock).mockResolvedValueOnce();
    const { store } = await renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.ForceUnlockPopup)],
    });

    await userEvent.click(
      screen.getByRole('button', { name: text.forceUnlock.confirm }),
    );

    await waitFor(() => {
      expect(getOpenPopup(store.getState())).toBeNull();
    });
  });

  it('keeps a replacement instance when the original async completion arrives late', async () => {
    let resolveForceUnlock: () => void = () => undefined;
    const forceUnlockPending = new Promise<void>((resolve) => {
      resolveForceUnlock = resolve;
    });
    let resolveInvalidation: () => void = () => undefined;
    const invalidationPending = new Promise<undefined>((resolve) => {
      resolveInvalidation = () => resolve(undefined);
    });
    const forceUnlock = vi
      .spyOn(window.electronAPI, 'forceUnlock')
      .mockReturnValueOnce(forceUnlockPending);
    const invalidateQueries = vi
      .spyOn(backendClient, 'invalidateBackendQueries')
      .mockReturnValueOnce(invalidationPending);
    const { store } = await renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.ForceUnlockPopup)],
    });

    const originalEntry = store.getState().viewState.popupInfo.at(-1)!;
    await userEvent.click(
      screen.getByRole('button', { name: text.forceUnlock.confirm }),
    );
    await waitFor(() => expect(forceUnlock).toHaveBeenCalledOnce());

    act(() => {
      void store.dispatch(openPopup(PopupType.WhatsNewPopup));
      void store.dispatch(closePopup(originalEntry.id));
      void store.dispatch(openPopup(PopupType.ForceUnlockPopup));
    });
    const notesEntry = getOpenPopups(store.getState()).find(
      ({ info }) => info.popup === PopupType.WhatsNewPopup,
    )!;
    const replacementEntry = store.getState().viewState.popupInfo.at(-1)!;
    expect(replacementEntry.id).not.toBe(originalEntry.id);

    resolveForceUnlock();
    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledOnce());
    resolveInvalidation();
    await act(async () => invalidationPending);

    await waitFor(() =>
      expect(getOpenPopups(store.getState()).map(({ id }) => id)).toEqual([
        notesEntry.id,
        replacementEntry.id,
      ]),
    );
    expect(
      screen.getByRole('dialog', { name: text.forceUnlock.title }),
    ).toBeVisible();
    expect(screen.getByText(text.whatsNew.title)).toBeInTheDocument();
    forceUnlock.mockRestore();
    invalidateQueries.mockRestore();
  });

  it('closes on cancel', async () => {
    const { store } = await renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.ForceUnlockPopup)],
    });

    await userEvent.click(
      screen.getByRole('button', { name: text.buttons.cancel }),
    );

    await waitFor(() => {
      expect(getOpenPopup(store.getState())).toBeNull();
    });
  });
});
