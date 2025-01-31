// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CheckIcon from '@mui/icons-material/Check';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import { SvgIconProps } from '@mui/material/SvgIcon';
import MuiTypography from '@mui/material/Typography';
import dayjs from 'dayjs';
import { Fragment, useMemo } from 'react';

import { Log } from '../../../shared/shared-types';
import { baseIcon } from '../../shared-styles';
import { Spinner } from '../Spinner/Spinner';
import { BreakableTypography, EllipsisTypography } from './LogDisplay.style';

const icons: Record<
  Log['level'],
  { Component: React.FC<SvgIconProps>; color: string }
> = {
  error: { Component: ErrorIcon, color: 'red' },
  warn: { Component: WarningIcon, color: 'orange' },
  info: { Component: CheckIcon, color: 'green' },
};

interface LogDisplayProps {
  log: Log;
  isActive: boolean;
  showDate: boolean;
  useEllipsis?: boolean;
}

export function LogDisplay(props: LogDisplayProps) {
  const { log, isActive, showDate, useEllipsis } = props;

  const icon = useMemo(() => {
    const { color, Component } = icons[log.level];
    return isActive ? (
      <Spinner sx={{ marginTop: '1px' }} />
    ) : (
      <Component sx={{ ...baseIcon, color }} />
    );
  }, [log, isActive]);

  return (
    <Fragment>
      {icon}
      {showDate ? (
        <MuiTypography color={'darkblue'}>
          {dayjs(log.date).format('HH:mm:ss.SSS')}
        </MuiTypography>
      ) : undefined}
      {useEllipsis ? (
        <EllipsisTypography>{log.message}</EllipsisTypography>
      ) : (
        <BreakableTypography>{log.message}</BreakableTypography>
      )}
    </Fragment>
  );
}
