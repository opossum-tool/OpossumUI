// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiLink from '@mui/material/Link';
import MuiTypography from '@mui/material/Typography';

import commitInfo from '../../../commitInfo.json';
import { text } from '../../../shared/text';
import { ButtonText } from '../../enums/enums';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { openUrl } from '../../util/open-url';
import { Alert } from '../Alert/Alert';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { Spinner } from '../Spinner/Spinner';
import { useLatestRelease } from './UpdateAppPopup.util';

export function UpdateAppPopup() {
  const dispatch = useAppDispatch();
  const { latestRelease, latestReleaseError, latestReleaseLoading } =
    useLatestRelease();

  const handleClose = () => {
    dispatch(closePopup());
  };

  return (
    <NotificationPopup
      content={renderContent()}
      header={text.updateAppPopup.title}
      isOpen
      width={600}
      rightButtonConfig={{
        onClick: handleClose,
        buttonText: ButtonText.Close,
      }}
      onBackdropClick={handleClose}
      onEscapeKeyDown={handleClose}
    />
  );

  function renderContent() {
    if (latestReleaseLoading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Spinner />
          <MuiTypography style={{ marginLeft: '12px' }}>
            {text.updateAppPopup.loading}
          </MuiTypography>
        </div>
      );
    }

    if (latestReleaseError) {
      return (
        <Alert
          errorMessage={text.updateAppPopup.fetchFailed(
            latestReleaseError.message,
          )}
        />
      );
    }

    if (!latestRelease || latestRelease.name === commitInfo.commitInfo) {
      return text.updateAppPopup.noUpdateAvailable;
    }

    return (
      <MuiTypography>
        {text.updateAppPopup.updateAvailable}{' '}
        <MuiLink href={'#'} onClick={() => openUrl(latestRelease.url)}>
          {latestRelease.name}
        </MuiLink>
      </MuiTypography>
    );
  }
}
