// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiLink from '@mui/material/Link';
import MuiTypography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { ReactElement } from 'react';

import commitInfo from '../../../commitInfo.json';
import { ButtonText } from '../../enums/enums';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { openUrl } from '../../util/open-url';
import { Alert } from '../Alert/Alert';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { Spinner } from '../Spinner/Spinner';
import { searchLatestReleaseNameAndUrl } from './update-app-popup-helpers';

export function UpdateAppPopup(): ReactElement {
  const dispatch = useAppDispatch();

  function close(): void {
    dispatch(closePopup());
  }

  const { isLoading, data, isError, error } = useQuery({
    queryKey: ['latestReleaseNameSearch'],
    queryFn: () => searchLatestReleaseNameAndUrl(),
    refetchOnWindowFocus: false,
  });

  const content = !isError ? (
    isLoading ? (
      <Spinner />
    ) : data ? (
      data.name === commitInfo.commitInfo ? (
        'You have the latest version of the app.'
      ) : (
        <>
          <MuiTypography>
            There is a new release! You can download it using the following
            link:
            <br />
            <MuiLink component="button" onClick={(): void => openUrl(data.url)}>
              {data.name}
            </MuiLink>
          </MuiTypography>
        </>
      )
    ) : (
      'No information found.'
    )
  ) : (
    <Alert
      errorMessage={`Failed while fetching release data${
        error instanceof Error ? `: ${error.message}` : ''
      }`}
    />
  );

  return (
    <NotificationPopup
      content={content}
      header={'Check for updates'}
      isOpen={true}
      fullWidth={false}
      rightButtonConfig={{
        onClick: close,
        buttonText: ButtonText.Close,
      }}
      onBackdropClick={close}
      onEscapeKeyDown={close}
    />
  );
}
