// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
/* eslint-disable @typescript-eslint/no-magic-numbers -- theme spacing unit values (6 = 24px row, 4 = 16px warning icon, 4.5 = 18px expand icon) */
import { ExpandMore } from '@mui/icons-material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MuiBox from '@mui/material/Box';
import MuiCollapse from '@mui/material/Collapse';
import type { Theme } from '@mui/material/styles';
import MuiTypography from '@mui/material/Typography';
import { useState } from 'react';

import { OpossumColors } from '../../shared-styles';

interface ValidationErrorDisplayProps {
  messages: Array<React.ReactNode>;
  severity: 'error' | 'warning';
}

export const ValidationDisplay: React.FC<ValidationErrorDisplayProps> = ({
  messages,
  severity,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (expanded && messages.length <= 1) {
    setExpanded(false);
  }

  const color = severity === 'error' ? OpossumColors.red : OpossumColors.brown;
  const [firstMessage, ...remainingMessages] = messages;

  return (
    <MuiCollapse in={messages.length > 0}>
      <MuiBox
        data-testid="validation-display"
        sx={{
          minHeight: ({ spacing }: Theme) => spacing(6),
          mt: 1.5,
          pl: 2,
          display: 'flex',
          gap: 1.5,
          color,
        }}
      >
        <WarningAmberIcon
          sx={{
            fontSize: ({ spacing }: Theme) => spacing(4),
            flexShrink: 0,
          }}
        />
        <MuiBox sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <MuiBox sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <MuiTypography variant="body2">{firstMessage}</MuiTypography>
            {remainingMessages.length > 0 && (
              <ExpandMore
                aria-label="expand messages"
                onClick={() => setExpanded(!expanded)}
                sx={{
                  rotate: expanded ? '180deg' : '0deg',
                  transition: 'rotate 0.3s ease',
                  cursor: 'pointer',
                  height: ({ spacing }: Theme) => spacing(4.5),
                  width: ({ spacing }: Theme) => spacing(4.5),
                }}
              />
            )}
          </MuiBox>
          <MuiCollapse in={expanded}>
            <MuiBox sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {remainingMessages.map((message, index) => (
                <MuiTypography variant="body2" key={index}>
                  {message}
                </MuiTypography>
              ))}
            </MuiBox>
          </MuiCollapse>
        </MuiBox>
      </MuiBox>
    </MuiCollapse>
  );
};
