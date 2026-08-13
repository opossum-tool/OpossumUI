// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { text } from '../../../../shared/text';
import { PopupType } from '../../../enums/enums';
import { openPopup } from '../../../state/actions/view-actions/view-actions';
import { getOpenPopup } from '../../../state/selectors/view-selector';
import { renderComponent } from '../../../test-helpers/render';
import { ForceUnlockPopup } from '../ForceUnlockPopup';

describe('ForceUnlockPopup', () => {
  it('disables buttons and shows a loading indicator while force unlock is running', async () => {
    let resolveForceUnlock: () => void = () => undefined;
    const forceUnlockPromise = new Promise<void>((resolve) => {
      resolveForceUnlock = resolve;
    });
    vi.mocked(window.electronAPI.forceUnlock).mockReturnValueOnce(
      forceUnlockPromise,
    );
    await renderComponent(<ForceUnlockPopup />);
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
    const { store } = await renderComponent(<ForceUnlockPopup />, {
      actions: [openPopup(PopupType.ForceUnlockPopup)],
    });

    await userEvent.click(
      screen.getByRole('button', { name: text.forceUnlock.confirm }),
    );

    await waitFor(() => {
      expect(getOpenPopup(store.getState())).toBeNull();
    });
  });

  it('closes on cancel', async () => {
    const { store } = await renderComponent(<ForceUnlockPopup />, {
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
