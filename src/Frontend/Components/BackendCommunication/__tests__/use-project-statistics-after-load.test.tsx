// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, waitFor } from '@testing-library/react';
import type { IpcRendererEvent } from 'electron';
import { useCallback, useEffect, useState } from 'react';

import { AllowedFrontendChannels } from '../../../../shared/ipc-channels';
import { DEFAULT_USER_SETTINGS } from '../../../../shared/shared-constants';
import { PopupType } from '../../../enums/enums';
import {
  fetchUserSettings,
  setUserSetting,
} from '../../../state/actions/user-settings-actions/user-settings-actions';
import {
  closePopup,
  openPopup,
} from '../../../state/actions/view-actions/view-actions';
import { getOpenPopups } from '../../../state/selectors/view-selector';
import {
  type createTestStore,
  renderComponent,
} from '../../../test-helpers/render';
import { Dialog } from '../../Dialog/dialog';
import { ProcessPopup } from '../../ProcessPopup/ProcessPopup';
import { useProjectStatisticsAfterLoad } from '../use-project-statistics-after-load';

type ProcessingListener = (
  event: IpcRendererEvent,
  state: { type: 'ProcessingStarted' | 'ProcessingDone' },
) => void;

interface HarnessControls {
  setReferenceOpen: (open: boolean) => void;
  setSecondReferenceOpen: (open: boolean) => void;
}

function StatisticsAfterLoadHarness({
  onControls,
}: {
  onControls: (controls: HarnessControls) => void;
}) {
  useProjectStatisticsAfterLoad();
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [secondReferenceOpen, setSecondReferenceOpen] = useState(false);
  const setReferenceOpenCallback = useCallback(
    (open: boolean) => setReferenceOpen(open),
    [],
  );
  const setSecondReferenceOpenCallback = useCallback(
    (open: boolean) => setSecondReferenceOpen(open),
    [],
  );

  useEffect(() => {
    onControls({
      setReferenceOpen: setReferenceOpenCallback,
      setSecondReferenceOpen: setSecondReferenceOpenCallback,
    });
  }, [onControls, setSecondReferenceOpenCallback, setReferenceOpenCallback]);

  return (
    <>
      <Dialog open={referenceOpen} classification="reference" />
      <Dialog open={secondReferenceOpen} classification="reference" />
      <ProcessPopup />
    </>
  );
}

function captureProcessingListeners(): Array<ProcessingListener> {
  const listeners: Array<ProcessingListener> = [];
  vi.mocked(window.electronAPI.on).mockImplementation((channel, listener) => {
    if (channel === AllowedFrontendChannels.ProcessingStateChanged) {
      listeners.push(listener as ProcessingListener);
    }
    return vi.fn();
  });
  return listeners;
}

function emit(channel: AllowedFrontendChannels, ...args: Array<unknown>): void {
  const listener = vi
    .mocked(window.electronAPI.on)
    .mock.calls.filter(([registeredChannel]) => registeredChannel === channel)
    .map(([, registeredListener]) => registeredListener);
  act(() => {
    listener.forEach((callback) => callback({} as IpcRendererEvent, ...args));
  });
}

function emitProcessingState(
  listeners: Array<ProcessingListener>,
  type: 'ProcessingStarted' | 'ProcessingDone',
): void {
  act(() => {
    listeners.forEach((listener) => listener({} as IpcRendererEvent, { type }));
  });
}

async function loadSettings(
  store: Awaited<ReturnType<typeof createTestStore>>,
  showProjectStatistics: boolean,
): Promise<void> {
  vi.mocked(window.electronAPI.getUserSettings).mockResolvedValueOnce({
    ...DEFAULT_USER_SETTINGS,
    showProjectStatistics,
  });
  await act(async () => {
    await store.dispatch(fetchUserSettings());
  });
}

describe('useProjectStatisticsAfterLoad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('waits for processing and all registered dialogs without adding its own activity blocker', async () => {
    const processingListeners = captureProcessingListeners();
    let controls: HarnessControls | undefined;
    const onControls = (nextControls: HarnessControls) => {
      controls = nextControls;
    };
    const { store } = await renderComponent(
      <StatisticsAfterLoadHarness onControls={onControls} />,
    );

    await waitFor(() => expect(controls).toBeDefined());
    act(() => {
      controls?.setReferenceOpen(true);
      controls?.setSecondReferenceOpen(true);
    });
    emitProcessingState(processingListeners, 'ProcessingStarted');
    await waitFor(() =>
      expect(
        vi
          .mocked(window.electronAPI.setFrontendDialogState)
          .mock.calls.filter(([state]) => state.activityActive),
      ).toHaveLength(1),
    );
    emit(AllowedFrontendChannels.ProjectOpened);
    await loadSettings(store, true);
    expect(
      vi
        .mocked(window.electronAPI.setFrontendDialogState)
        .mock.calls.filter(([state]) => state.activityActive),
    ).toHaveLength(1);
    emitProcessingState(processingListeners, 'ProcessingDone');

    expect(
      getOpenPopups(store.getState()).some(
        ({ info }) => info.popup === PopupType.ProjectStatisticsPopup,
      ),
    ).toBe(false);
    await waitFor(() =>
      expect(
        window.electronAPI.setFrontendDialogState,
      ).toHaveBeenLastCalledWith({
        anyDialogOpen: true,
        activityActive: false,
      }),
    );

    act(() => controls?.setReferenceOpen(false));
    expect(
      getOpenPopups(store.getState()).some(
        ({ info }) => info.popup === PopupType.ProjectStatisticsPopup,
      ),
    ).toBe(false);
    act(() => controls?.setSecondReferenceOpen(false));
    await waitFor(() =>
      expect(
        getOpenPopups(store.getState()).map(({ info }) => info.popup),
      ).toContain(PopupType.ProjectStatisticsPopup),
    );
    expect(
      vi
        .mocked(window.electronAPI.setFrontendDialogState)
        .mock.calls.filter(([state]) => state.activityActive),
    ).toHaveLength(1);
  });

  it('waits for a startup notes request that has not mounted as a dialog yet', async () => {
    let controls: HarnessControls | undefined;
    const { store } = await renderComponent(
      <StatisticsAfterLoadHarness onControls={(next) => (controls = next)} />,
    );

    await waitFor(() => expect(controls).toBeDefined());
    emit(AllowedFrontendChannels.ProjectOpened);
    act(() => void store.dispatch(openPopup(PopupType.WhatsNewPopup)));
    await loadSettings(store, true);

    expect(
      getOpenPopups(store.getState()).map(({ info }) => info.popup),
    ).toEqual([PopupType.WhatsNewPopup]);
    expect(
      vi
        .mocked(window.electronAPI.setFrontendDialogState)
        .mock.calls.some(([state]) => state.activityActive),
    ).toBe(false);

    act(() => {
      const popup = getOpenPopups(store.getState()).find(
        ({ info }) => info.popup === PopupType.WhatsNewPopup,
      );
      if (popup) {
        store.dispatch(closePopup(popup.id));
      }
    });
    await waitFor(() =>
      expect(
        getOpenPopups(store.getState()).map(({ info }) => info.popup),
      ).toContain(PopupType.ProjectStatisticsPopup),
    );
  });

  it('consumes a waiting request when the setting is turned off', async () => {
    let controls: HarnessControls | undefined;
    const { store } = await renderComponent(
      <StatisticsAfterLoadHarness onControls={(next) => (controls = next)} />,
    );
    await waitFor(() => expect(controls).toBeDefined());
    act(() => {
      emit(AllowedFrontendChannels.ProjectOpened);
      void store.dispatch(openPopup(PopupType.WhatsNewPopup));
    });
    await loadSettings(store, true);
    act(
      () =>
        void store.dispatch(setUserSetting({ showProjectStatistics: false })),
    );
    act(() => {
      const notes = getOpenPopups(store.getState()).find(
        ({ info }) => info.popup === PopupType.WhatsNewPopup,
      );
      if (notes) {
        store.dispatch(closePopup(notes.id));
      }
    });

    await waitFor(() =>
      expect(getOpenPopups(store.getState())).toHaveLength(0),
    );
    act(
      () =>
        void store.dispatch(setUserSetting({ showProjectStatistics: true })),
    );
    expect(getOpenPopups(store.getState())).toHaveLength(0);
  });

  it('consumes disabled requests, reuses initialized settings, and does not reopen closed statistics', async () => {
    let controls: HarnessControls | undefined;
    const { store } = await renderComponent(
      <StatisticsAfterLoadHarness onControls={(next) => (controls = next)} />,
    );
    await waitFor(() => expect(controls).toBeDefined());

    await loadSettings(store, true);
    expect(window.electronAPI.getUserSettings).toHaveBeenCalledOnce();
    emit(AllowedFrontendChannels.ProjectOpened);
    await waitFor(() =>
      expect(
        getOpenPopups(store.getState()).map(({ info }) => info.popup),
      ).toContain(PopupType.ProjectStatisticsPopup),
    );

    act(() => {
      const popup = getOpenPopups(store.getState()).find(
        ({ info }) => info.popup === PopupType.ProjectStatisticsPopup,
      );
      if (popup) {
        store.dispatch(closePopup(popup.id));
      }
      void store.dispatch(setUserSetting({ showProjectStatistics: false }));
    });
    emit(AllowedFrontendChannels.ProjectOpened);
    await waitFor(() =>
      expect(getOpenPopups(store.getState())).toHaveLength(0),
    );

    act(
      () =>
        void store.dispatch(setUserSetting({ showProjectStatistics: true })),
    );
    expect(getOpenPopups(store.getState())).toHaveLength(0);
    expect(window.electronAPI.getUserSettings).toHaveBeenCalledOnce();
  });
});
