// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useEffect, useState } from 'react';
import CachedIcon from '@mui/icons-material/Cached';
import { IconButton } from '../IconButton/IconButton';
import { makeStyles } from '@mui/styles';
import {
  clickableIcon,
  disabledIcon,
  baseIcon,
  OpossumColors,
} from '../../shared-styles';
import { setTemporaryPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { getTemporaryPackageInfo } from '../../state/selectors/all-views-resource-selectors';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import clsx from 'clsx';
import { PackageInfo } from '../../../shared/shared-types';
import { getSelectedResourceId } from '../../state/selectors/audit-view-resource-selectors';
import { doNothing } from '../../util/do-nothing';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getLicenseFetchingInformation,
  LicenseFetchingInformation,
} from './license-fetching-helpers';

const useStyles = makeStyles({
  clickableIcon,
  disabledIcon,
  baseIcon,
  errorIcon: {
    color: OpossumColors.red,
  },
  successfulIcon: {
    color: OpossumColors.green,
  },
  spinningIcon: {
    color: OpossumColors.darkBlue,
    animationName: '$spin',
    animationDuration: '1000ms',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
  },
  '@keyframes spin': {
    from: {
      transform: 'rotate(0deg)',
    },
    to: {
      transform: 'rotate(-360deg)',
    },
  },
});

const FETCH_DATA_TOOLTIP = 'Fetch data';

export enum FetchStatus {
  Idle = 'Idle',
  Success = 'Success',
  Error = 'Error',
  InFlight = 'InFlight',
}

export function useFetchPackageInfo(props: LicenseFetchingInformation): {
  fetchStatus: FetchStatus;
  errorMessage: string;
  fetchData: () => void;
} {
  const dispatch = useAppDispatch();
  const temporaryPackageInfo = useAppSelector(getTemporaryPackageInfo);
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>(FetchStatus.Idle);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fetchedPackageInfo, setFetchedPackageInfo] =
    useState<{ selectedResourceId: string; packageInfo: PackageInfo }>();

  function fetchData(): void {
    setFetchStatus(FetchStatus.InFlight);
    fetch(props.url)
      .then(async (res) => {
        setFetchedPackageInfo({
          selectedResourceId,
          packageInfo: await props.convertPayload(res),
        });
        setFetchStatus(FetchStatus.Success);
      })
      .catch((error: Error) => {
        setErrorMessage(error.message);
        setFetchStatus(FetchStatus.Error);
      });
  }

  useEffect(() => {
    if (
      fetchStatus === FetchStatus.Success &&
      fetchedPackageInfo?.packageInfo &&
      selectedResourceId === fetchedPackageInfo?.selectedResourceId
    ) {
      dispatch(
        setTemporaryPackageInfo({
          ...temporaryPackageInfo,
          ...fetchedPackageInfo.packageInfo,
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchStatus, fetchedPackageInfo, dispatch, selectedResourceId]);

  useEffect(() => {
    setErrorMessage('');
    setFetchedPackageInfo(undefined);
    setFetchStatus(FetchStatus.Idle);
  }, [props.url]);

  return {
    fetchStatus,
    errorMessage,
    fetchData,
  };
}

function DisabledFetchLicenseInformationButton(): ReactElement {
  const classes = useStyles();

  return (
    <IconButton
      tooltipTitle={FETCH_DATA_TOOLTIP}
      placement="right"
      disabled={false}
      onClick={doNothing}
      icon={<CachedIcon className={classes.disabledIcon} />}
    />
  );
}

function EnabledFetchLicenseInformationButton(
  props: LicenseFetchingInformation
): ReactElement {
  const classes = useStyles();
  const { fetchStatus, errorMessage, fetchData } = useFetchPackageInfo(props);

  function getIcon(): ReactElement {
    switch (fetchStatus) {
      case FetchStatus.InFlight:
        return (
          <CachedIcon
            className={clsx(classes.baseIcon, classes.spinningIcon)}
          />
        );
      case FetchStatus.Error:
        return (
          <ErrorOutlineIcon
            className={clsx(classes.baseIcon, classes.errorIcon)}
          />
        );
      case FetchStatus.Success:
        return (
          <CachedIcon
            className={clsx(classes.baseIcon, classes.successfulIcon)}
          />
        );
      default:
        return <CachedIcon className={classes.clickableIcon} />;
    }
  }

  function getTooltip(): string {
    switch (fetchStatus) {
      case FetchStatus.InFlight:
        return 'Fetching data';
      case FetchStatus.Error:
        return errorMessage;
      default:
        return FETCH_DATA_TOOLTIP;
    }
  }

  return (
    <IconButton
      tooltipTitle={getTooltip()}
      placement="right"
      onClick={fetchData}
      icon={getIcon()}
    />
  );
}

export function FetchLicenseInformationButton(props: {
  url?: string;
  isDisabled: boolean;
}): ReactElement {
  const licenseFetchingInformation = getLicenseFetchingInformation(props.url);
  return !props.isDisabled && licenseFetchingInformation ? (
    <EnabledFetchLicenseInformationButton
      url={licenseFetchingInformation.url}
      convertPayload={licenseFetchingInformation.convertPayload}
    />
  ) : (
    <DisabledFetchLicenseInformationButton />
  );
}
