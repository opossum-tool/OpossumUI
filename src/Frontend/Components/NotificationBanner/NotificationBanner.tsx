// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CloseIcon from '@mui/icons-material/Close';
import MuiAlert, { type AlertColor } from '@mui/material/Alert';
import MuiIconButton from '@mui/material/IconButton';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

export function NotificationBanner({
  children,
  severity,
  onDismiss,
  dismissLabel,
  icon,
  sx = [],
}: {
  children: ReactNode;
  severity: AlertColor;
  onDismiss?: () => void;
  dismissLabel?: string;
  icon?: ReactNode;
  sx?: SxProps<Theme>;
}): React.ReactNode {
  return (
    <MuiAlert
      severity={severity}
      variant={'standard'}
      icon={icon}
      action={
        onDismiss && (
          <MuiIconButton
            aria-label={dismissLabel}
            color={'inherit'}
            size={'small'}
            onClick={onDismiss}
            sx={{ alignSelf: 'center' }}
          >
            <CloseIcon fontSize={'small'} />
          </MuiIconButton>
        )
      }
      sx={[
        {
          flexShrink: 0,
          borderRadius: 0,
          borderBottom: 1,
          borderColor: 'divider',
          px: 4,
          py: 2,
          alignItems: 'center',
          '& .MuiAlert-icon': { alignItems: 'center', py: 0 },
          '& .MuiAlert-message': {
            flex: 1,
            minWidth: 0,
            overflowWrap: 'anywhere',
          },
          '& .MuiAlert-action': {
            alignItems: 'center',
            m: 0,
            ml: 4,
            p: 0,
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </MuiAlert>
  );
}
