// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import UpdateIcon from '@mui/icons-material/Update';
import MuiBox from '@mui/material/Box';
import MuiButton from '@mui/material/Button';
import MuiLink from '@mui/material/Link';

import { OPOSSUM_UI_GITHUB_URL } from '../../../shared/shared-constants';
import type { UpdateState } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { restartAndUpdateOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch } from '../../state/hooks';
import { openUrl } from '../../util/open-url';
import { LoadingIndicator } from '../LoadingIndicator/loading-indicator';
import { NotificationBanner } from '../NotificationBanner/NotificationBanner';
import { Spinner } from '../Spinner/Spinner';
import { useUpdateState } from './use-update-state';

export function UpdateBanner(): React.ReactNode {
  const { updateState, visible, dismiss, checkForUpdates, downloadUpdate } =
    useUpdateState();
  const dispatch = useAppDispatch();
  if (!visible || !updateState) {
    return null;
  }
  const banner = updateState;
  const hasError =
    banner.status === 'error' ||
    (banner.status === 'downloaded' && !!banner.error);
  const busy = banner.status === 'checking' || banner.status === 'restarting';
  return (
    <NotificationBanner
      severity={hasError ? 'error' : 'info'}
      dismissLabel={text.updateApp.dismissed}
      onDismiss={banner.status === 'restarting' ? undefined : dismiss}
      icon={
        busy ? (
          <Spinner />
        ) : hasError ? undefined : (
          <UpdateIcon fontSize="small" />
        )
      }
      sx={{
        position: 'relative',
        typography: 'body1',
        minHeight: '48px',
        '& .MuiAlert-message': { py: 0 },
        '& .MuiAlert-icon': { color: hasError ? 'error.main' : 'primary.main' },
        '& .MuiAlert-action': { color: 'text.secondary' },
        '& .MuiButtonBase-root.Mui-focusVisible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: '2px',
        },
      }}
    >
      {banner.status === 'downloading' && (
        <LoadingIndicator
          variant="determinate"
          value={banner.percent}
          aria-label={text.updateApp.downloading(banner.percent)}
          sx={{ top: 'auto', bottom: 0 }}
        />
      )}
      <MuiBox
        sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}
      >
        {renderContent(banner)}
      </MuiBox>
    </NotificationBanner>
  );

  function renderContent(banner: UpdateState) {
    switch (banner.status) {
      case 'checking':
        return text.updateApp.loading;
      case 'downloading':
        return text.updateApp.downloading(banner.percent);
      case 'downloaded':
        return (
          <>
            <span>{banner.error ?? text.updateApp.ready}</span>
            {renderAction(text.updateApp.restart, () =>
              dispatch(restartAndUpdateOrOpenUnsavedPopup()),
            )}
          </>
        );
      case 'restarting':
        return text.updateApp.restarting;
      case 'error':
        if (banner.reason === 'unsupported-installation') {
          return text.updateApp.unsupportedInstallation;
        }
        if (banner.reason === 'unknown-installed-version') {
          return (
            <span>
              {text.updateApp.unknownInstalledVersion}{' '}
              {renderExternalLink(
                `${OPOSSUM_UI_GITHUB_URL}/releases`,
                text.updateApp.viewReleases,
              )}
            </span>
          );
        }
        return (
          <>
            <span>{banner.message ?? text.updateApp.fetchFailed}</span>
            {renderAction(text.updateApp.retry, () => {
              void (banner.retry === 'download'
                ? downloadUpdate()
                : checkForUpdates());
            })}
          </>
        );
      case 'up-to-date':
        return text.updateApp.noUpdateAvailable;
      case 'available':
        if (!banner.canInstall) {
          return (
            <span>
              {text.updateApp.available(banner.tag)}{' '}
              {renderExternalLink(banner.url, text.updateApp.download)}
            </span>
          );
        }
        return (
          <>
            <span>{text.updateApp.available(banner.tag)}</span>
            {renderAction(text.updateApp.downloadUpdate, () => {
              void downloadUpdate();
            })}
          </>
        );
    }
  }

  function renderAction(label: string, onClick: () => void) {
    return (
      <MuiButton
        variant="contained"
        size="small"
        disableElevation
        sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
        onClick={onClick}
      >
        {label}
      </MuiButton>
    );
  }

  function renderExternalLink(url: string, label: string) {
    return (
      <MuiLink
        href={'#'}
        color={'inherit'}
        onClick={(event) => {
          event.preventDefault();
          openUrl(url);
        }}
      >
        {label}
      </MuiLink>
    );
  }
}
