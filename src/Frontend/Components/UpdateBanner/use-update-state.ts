// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import type { UpdateState } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { useUserSettings } from '../../state/variables/use-user-setting';

interface UpdateNotification {
  updateState: UpdateState | null;
  releaseTag: string | null;
  dismissedTag: string | null;
  dismissed: boolean;
}

export function useUpdateState() {
  const [notification, setNotification] = useState<UpdateNotification>({
    updateState: null,
    releaseTag: null,
    dismissedTag: null,
    dismissed: false,
  });
  const [settings] = useUserSettings();
  const revisionRef = useRef(0);
  const requestIdRef = useRef(0);
  const pendingRequestIdRef = useRef<number | null>(null);

  const requestUpdate = useCallback(
    async (request: () => Promise<UpdateState>, initialState: UpdateState) => {
      const requestId = ++requestIdRef.current;
      const revision = ++revisionRef.current;
      pendingRequestIdRef.current = requestId;
      setNotification({
        updateState: initialState,
        releaseTag: getReleaseTag(initialState, null),
        dismissedTag: null,
        dismissed: false,
      });
      const nextState = await request().catch((): UpdateState =>
        initialState.status === 'downloading'
          ? {
              status: 'error',
              retry: 'check',
              message: text.updateApp.fetchFailed,
            }
          : { status: 'error' },
      );
      if (requestId !== pendingRequestIdRef.current) {
        return;
      }
      pendingRequestIdRef.current = null;
      // Events are authoritative, including events received while hidden.
      if (revision === revisionRef.current) {
        setNotification((current) => ({
          ...current,
          updateState: nextState,
          releaseTag: getReleaseTag(nextState, current.releaseTag),
        }));
      }
    },
    [],
  );

  const checkForUpdates = useCallback(
    () =>
      requestUpdate(() => window.electronAPI.checkForUpdates(), {
        status: 'checking',
      }),
    [requestUpdate],
  );

  function downloadUpdate() {
    const tag = notification.releaseTag;
    if (tag) {
      return requestUpdate(() => window.electronAPI.downloadUpdate(tag), {
        status: 'downloading',
        tag,
        percent: 0,
      });
    }
    return checkForUpdates();
  }

  const acceptBackgroundState = useEffectEvent((nextState: UpdateState) => {
    if (
      !isInstallerState(nextState) &&
      !(
        nextState.status === 'available' &&
        settings.automaticallyCheckForUpdates
      )
    ) {
      return;
    }
    ++revisionRef.current;
    const pending = pendingRequestIdRef.current !== null;
    setNotification((current) => {
      const releaseTag = getReleaseTag(nextState, current.releaseTag);
      const dismissedWhilePending = current.dismissed && pending;
      return {
        updateState: nextState,
        releaseTag,
        dismissedTag: dismissedWhilePending
          ? (releaseTag ?? current.dismissedTag)
          : current.dismissedTag,
        dismissed: dismissedWhilePending,
      };
    });
  });

  useEffect(() => {
    let active = true;
    const snapshotRevision = revisionRef.current;
    const unsubscribeState = window.electronAPI.on(
      AllowedFrontendChannels.UpdateStateChanged,
      (_, nextState: UpdateState) => acceptBackgroundState(nextState),
    );
    const unsubscribeCheck = window.electronAPI.on(
      AllowedFrontendChannels.CheckForUpdatesRequested,
      () => {
        void checkForUpdates();
      },
    );
    void window.electronAPI
      .getUpdateState()
      .then((nextState) => {
        if (active && revisionRef.current === snapshotRevision) {
          acceptBackgroundState(nextState);
        }
      })
      .catch(() => {
        /* Background snapshot failures stay quiet. */
      });
    return () => {
      active = false;
      pendingRequestIdRef.current = null;
      unsubscribeState();
      unsubscribeCheck();
    };
  }, [checkForUpdates]);

  const { updateState, releaseTag, dismissedTag, dismissed } = notification;
  const visible =
    updateState !== null &&
    !dismissed &&
    (releaseTag === null || releaseTag !== dismissedTag);

  function dismiss() {
    setNotification((current) => ({
      ...current,
      dismissedTag: current.releaseTag ?? current.dismissedTag,
      dismissed: true,
    }));
  }

  return { updateState, visible, dismiss, checkForUpdates, downloadUpdate };
}

function getReleaseTag(
  state: UpdateState,
  previousTag: string | null,
): string | null {
  if ('tag' in state) {
    return state.tag;
  }
  // Download errors have no tag in the IPC contract, but belong to the
  // selected release and should respect that release's dismissal too.
  return state.status === 'error' && state.retry === 'download'
    ? previousTag
    : null;
}

function isInstallerState(state: UpdateState): boolean {
  return (
    state.status === 'downloading' ||
    state.status === 'downloaded' ||
    state.status === 'restarting' ||
    (state.status === 'error' && state.retry === 'download')
  );
}
