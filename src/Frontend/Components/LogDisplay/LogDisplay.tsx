// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CheckIcon from '@mui/icons-material/Check';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { SxProps } from '@mui/system';
import dayjs from 'dayjs';
import { useMemo } from 'react';

import { Log } from '../../../shared/shared-types';
import { baseIcon } from '../../shared-styles';
import { Spinner } from '../Spinner/Spinner';
import { BreakableTypography, EllipsisTypography } from './LogDisplay.style';

const icons: Record<Log['level'], React.ReactNode> = {
  error: (
    <ErrorIcon sx={{ ...baseIcon, color: 'red' }} data-testid="ErrorIcon" />
  ),
  warn: <WarningIcon sx={{ ...baseIcon, color: 'orange' }} />,
  info: <CheckIcon sx={{ ...baseIcon, color: 'green' }} />,
};

interface LogDisplayProps {
  log: Log;
  isInProgress: boolean;
  showDate: boolean;
  useEllipsis?: boolean;
  sx?: SxProps;
  className?: string;
}

export function LogDisplay(props: LogDisplayProps) {
  const { log, isInProgress, showDate, useEllipsis, sx, className } = props;

  const icon = useMemo(() => {
    return isInProgress ? (
      <Spinner sx={{ marginTop: '1px' }} />
    ) : (
      icons[log.level]
    );
  }, [log, isInProgress]);

  return (
    <MuiBox sx={sx} className={className}>
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
    </MuiBox>
  );
}
