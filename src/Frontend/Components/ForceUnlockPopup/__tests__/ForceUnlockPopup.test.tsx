// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen, waitFor } from '@testing-library/react';

import { text } from '../../../../shared/text';
import {
  clickPopupButton,
  expectButtonDisabled,
  FORCE_UNLOCK_POPUP_LABEL,
} from '../../../../testing/ui';
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

    await clickPopupButton(FORCE_UNLOCK_POPUP_LABEL, text.forceUnlock.confirm);

    expectButtonDisabled(text.forceUnlock.confirm);
    expectButtonDisabled(text.buttons.cancel);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    resolveForceUnlock();
  });

  it('closes after force unlock completes', async () => {
    vi.mocked(window.electronAPI.forceUnlock).mockResolvedValueOnce();
    const { store } = await renderComponent(<ForceUnlockPopup />, {
      actions: [openPopup(PopupType.ForceUnlockPopup)],
    });

    await clickPopupButton(FORCE_UNLOCK_POPUP_LABEL, text.forceUnlock.confirm);

    await waitFor(() => {
      expect(getOpenPopup(store.getState())).toBeNull();
    });
  });

  it('closes on cancel', async () => {
    const { store } = await renderComponent(<ForceUnlockPopup />, {
      actions: [openPopup(PopupType.ForceUnlockPopup)],
    });

    await clickPopupButton(FORCE_UNLOCK_POPUP_LABEL, text.buttons.cancel);

    await waitFor(() => {
      expect(getOpenPopup(store.getState())).toBeNull();
    });
  });
});
