// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiLink from '@mui/material/Link';
import { useEffect, useRef, useState } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import type { UpdateState } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { useUserSettings } from '../../state/variables/use-user-setting';
import { openUrl } from '../../util/open-url';
import { NotificationBanner } from '../NotificationBanner/NotificationBanner';
import { Spinner } from '../Spinner/Spinner';

interface UpdateBannerState {
  banner: UpdateState | null;
  dismissedTag: string | null;
}

export function UpdateBanner(): React.ReactNode {
  const [state, setState] = useState<UpdateBannerState>({
    banner: null,
    dismissedTag: null,
  });
  const [settings] = useUserSettings();
  const manualCheckIdRef = useRef(0);
  const receivedStateChangeRef = useRef(false);

  useEffect(() => {
    let active = true;
    void window.electronAPI.getUpdateState().then((nextState) => {
      if (!active || receivedStateChangeRef.current) {
        return;
      }
      if (
        nextState.status === 'available' &&
        settings.automaticallyCheckForUpdates
      ) {
        setState((current) =>
          current.dismissedTag === nextState.tag
            ? current
            : { ...current, banner: nextState },
        );
      }
    });
    return () => {
      active = false;
    };
  }, [settings.automaticallyCheckForUpdates]);

  useEffect(() => {
    return window.electronAPI.on(
      AllowedFrontendChannels.UpdateStateChanged,
      (_, nextState: UpdateState) => {
        receivedStateChangeRef.current = true;
        if (
          nextState.status !== 'available' ||
          !settings.automaticallyCheckForUpdates
        ) {
          return;
        }
        setState((current) =>
          current.dismissedTag === nextState.tag
            ? current
            : { ...current, banner: nextState },
        );
      },
    );
  }, [settings.automaticallyCheckForUpdates]);

  useEffect(() => {
    let active = true;
    const unsubscribeManualCheck = window.electronAPI.on(
      AllowedFrontendChannels.CheckForUpdatesRequested,
      () => {
        const checkId = ++manualCheckIdRef.current;
        setState((current) => ({
          ...current,
          dismissedTag: null,
          banner: { status: 'checking' },
        }));
        void window.electronAPI.checkForUpdates().then((nextState) => {
          if (!active || manualCheckIdRef.current !== checkId) {
            return;
          }
          setState((current) => {
            if (nextState.status === 'available') {
              return current.dismissedTag === nextState.tag
                ? { ...current, banner: null }
                : { ...current, banner: nextState };
            }
            return current.banner?.status === 'checking'
              ? { ...current, banner: nextState }
              : current;
          });
        });
      },
    );
    return () => {
      active = false;
      unsubscribeManualCheck();
    };
  }, []);

  if (!state.banner) {
    return null;
  }

  return (
    <NotificationBanner
      severity={state.banner.status === 'error' ? 'error' : 'info'}
      dismissLabel={text.updateApp.dismissed}
      onDismiss={() => {
        setState((current) => ({
          banner: null,
          dismissedTag:
            current.banner?.status === 'available'
              ? current.banner.tag
              : current.dismissedTag,
        }));
      }}
    >
      {renderContent(state.banner)}
    </NotificationBanner>
  );

  function renderContent(banner: UpdateState) {
    switch (banner.status) {
      case 'checking':
        return (
          <MuiBox sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Spinner />
            {text.updateApp.loading}
          </MuiBox>
        );
      case 'error':
        return text.updateApp.fetchFailed;
      case 'up-to-date':
        return text.updateApp.noUpdateAvailable;
      case 'available':
        return (
          <>
            {text.updateApp.available(banner.tag)}{' '}
            <MuiLink
              href={'#'}
              color={'inherit'}
              onClick={(event) => {
                event.preventDefault();
                openUrl(banner.url);
              }}
            >
              {text.updateApp.download}
            </MuiLink>
          </>
        );
    }
  }
}
