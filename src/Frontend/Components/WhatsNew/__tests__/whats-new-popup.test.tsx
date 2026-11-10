// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import type { IpcRendererEvent } from 'electron';

import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import { DEFAULT_USER_SETTINGS } from '../../../../shared/shared-constants';
import { text } from '../../../../shared/text';
import { PopupType } from '../../../enums/enums';
import { openPopup } from '../../../state/actions/view-actions/view-actions';
import { getOpenPopup } from '../../../state/selectors/view-selector';
import { renderComponent } from '../../../test-helpers/render';
import { BackendCommunication } from '../../BackendCommunication/BackendCommunication';
import { GlobalPopup } from '../../GlobalPopup/GlobalPopup';

const notes = vi.hoisted(() => ({ revision: 1 }));

vi.mock('../../../whats-new/release-notes', () => ({
  get revision() {
    return notes.revision;
  },
  ReleaseNotes: () => (
    <>
      <h2>A useful new feature</h2>
      <p>How to use the feature.</p>
      <img src="feature.webp" alt="The feature in action" />
    </>
  ),
}));

describe('What’s new popup', () => {
  beforeEach(() => {
    vi.stubEnv('PROD', false);
    notes.revision = 1;
    vi.mocked(window.electronAPI.getUserSettings).mockResolvedValue(
      DEFAULT_USER_SETTINGS,
    );
    vi.mocked(window.electronAPI.updateUserSettings).mockResolvedValue(
      undefined,
    );
  });

  afterEach(() => vi.unstubAllEnvs());

  it('renders the authored content through the shared popup host', async () => {
    await renderComponent(<GlobalPopup />, {
      actions: [openPopup(PopupType.WhatsNewPopup)],
    });
    expect(
      screen.getByRole('dialog', { name: text.whatsNew.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'A useful new feature' }),
    ).toBeInTheDocument();
    expect(screen.getByText('How to use the feature.')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'The feature in action' }),
    ).toHaveAttribute('src', 'feature.webp');
  });

  it.each(['button', 'escape', 'backdrop'])(
    'closes shared popup state using %s',
    async (method) => {
      const { store } = await renderComponent(<GlobalPopup />, {
        actions: [openPopup(PopupType.WhatsNewPopup)],
      });
      if (method === 'button') {
        fireEvent.click(
          screen.getByRole('button', { name: text.buttons.close }),
        );
      } else if (method === 'escape') {
        fireEvent.keyDown(screen.getByRole('dialog'), {
          key: 'Escape',
          code: 'Escape',
        });
      } else {
        const backdrop = screen.getAllByRole('presentation').at(-1)!;
        fireEvent.mouseDown(backdrop);
        fireEvent.click(backdrop);
      }
      expect(getOpenPopup(store.getState())).toBeNull();
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );
      expect(window.electronAPI.setFrontendPopupOpen).toHaveBeenLastCalledWith(
        false,
      );
    },
  );

  it('opens and reopens the empty state from Help without a project', async () => {
    notes.revision = 0;
    let showWhatsNew: Parameters<typeof window.electronAPI.on>[1] | undefined;
    vi.mocked(window.electronAPI.on).mockImplementation((channel, listener) => {
      if (channel === AllowedFrontendChannels.ShowWhatsNew) {
        showWhatsNew = listener;
      }
      return () => {};
    });
    const { store } = await renderComponent(
      <>
        <GlobalPopup />
        <BackendCommunication />
      </>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(showWhatsNew).toBeDefined();
    act(() => showWhatsNew?.({} as IpcRendererEvent));
    expect(await screen.findByText(text.whatsNew.empty)).toBeInTheDocument();
    expect(getOpenPopup(store.getState())?.popup).toBe(PopupType.WhatsNewPopup);
    fireEvent.click(screen.getByRole('button', { name: text.buttons.close }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    act(() => showWhatsNew?.({} as IpcRendererEvent));
    expect(await screen.findByText(text.whatsNew.empty)).toBeInTheDocument();
  });
});
