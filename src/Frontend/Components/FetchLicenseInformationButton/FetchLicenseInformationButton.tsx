// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CachedIcon from '@mui/icons-material/Cached';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import axios from 'axios';
import { ReactElement, useEffect, useState } from 'react';

import { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import {
  baseIcon,
  clickableIcon,
  disabledIcon,
  OpossumColors,
} from '../../shared-styles';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getTemporaryDisplayPackageInfo } from '../../state/selectors/all-views-resource-selectors';
import { getSelectedResourceId } from '../../state/selectors/audit-view-resource-selectors';
import { doNothing } from '../../util/do-nothing';
import { IconButton } from '../IconButton/IconButton';
import {
  getLicenseFetchingInformation,
  LicenseFetchingInformation,
} from './license-fetching-helpers';

const classes = {
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
};

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
  const temporaryDisplayPackageInfo = useAppSelector(
    getTemporaryDisplayPackageInfo,
  );
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>(FetchStatus.Idle);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fetchedPackageInfo, setFetchedPackageInfo] = useState<{
    selectedResourceId: string;
    packageInfo: PackageInfo;
  }>();

  function fetchData(): void {
    setFetchStatus(FetchStatus.InFlight);
    axios
      .get(props.url)
      .then((res) => {
        setFetchedPackageInfo({
          selectedResourceId,
          packageInfo: props.convertPayload(res.data),
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
        setTemporaryDisplayPackageInfo({
          ...temporaryDisplayPackageInfo,
          ...fetchedPackageInfo.packageInfo,
        }),
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

interface DisabledFetchLicenseInformationButtonProps {
  tooltipText: string;
}
function DisabledFetchLicenseInformationButton(
  props: DisabledFetchLicenseInformationButtonProps,
): ReactElement {
  return (
    <IconButton
      tooltipTitle={props.tooltipText}
      tooltipPlacement="right"
      disabled={true}
      onClick={doNothing}
      icon={<CachedIcon sx={classes.disabledIcon} />}
    />
  );
}

export function EnabledFetchLicenseInformationButton(
  props: LicenseFetchingInformation,
): ReactElement {
  const { fetchStatus, errorMessage, fetchData } = useFetchPackageInfo(props);

  function getIcon(): ReactElement {
    switch (fetchStatus) {
      case FetchStatus.InFlight:
        return (
          <CachedIcon sx={{ ...classes.baseIcon, ...classes.spinningIcon }} />
        );
      case FetchStatus.Error:
        return (
          <ErrorOutlineIcon
            sx={{ ...classes.baseIcon, ...classes.errorIcon }}
          />
        );
      case FetchStatus.Success:
        return (
          <CachedIcon sx={{ ...classes.baseIcon, ...classes.successfulIcon }} />
        );
      default:
        return <CachedIcon sx={classes.clickableIcon} />;
    }
  }

  function getTooltip(): string {
    switch (fetchStatus) {
      case FetchStatus.InFlight:
        return text.attributionColumn.packageSubPanel.fetching;
      case FetchStatus.Error:
        return errorMessage;
      default:
        return text.attributionColumn.packageSubPanel.fetchPackageInfo;
    }
  }

  return (
    <IconButton
      tooltipTitle={getTooltip()}
      tooltipPlacement="right"
      onClick={fetchData}
      icon={getIcon()}
    />
  );
}

export function FetchLicenseInformationButton(props: {
  url?: string;
  version?: string;
  disabled: boolean;
}): React.ReactNode {
  if (props.disabled) {
    return null;
  }

  const licenseFetchingInformation = getLicenseFetchingInformation(
    props.url,
    props.version,
  );
  return licenseFetchingInformation ? (
    <EnabledFetchLicenseInformationButton
      url={licenseFetchingInformation.url}
      convertPayload={licenseFetchingInformation.convertPayload}
    />
  ) : (
    <DisabledFetchLicenseInformationButton
      tooltipText={
        text.attributionColumn.packageSubPanel.fetchPackageInfoNotPossible
      }
    />
  );
}
