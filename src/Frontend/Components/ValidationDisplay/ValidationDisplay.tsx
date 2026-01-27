// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ExpandMore } from '@mui/icons-material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MuiBox from '@mui/material/Box';
import MuiCollapse from '@mui/material/Collapse';
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
          minHeight: 24,
          mt: 0.75,
          pl: 1,
          display: 'flex',
          gap: 0.75,
          color,
        }}
      >
        <WarningAmberIcon
          sx={{
            fontSize: 16,
            flexShrink: 0,
          }}
        />
        <MuiBox sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <MuiBox sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <ValidationMessage>{firstMessage}</ValidationMessage>
            {remainingMessages.length > 0 && (
              <ExpandMore
                aria-label="expand messages"
                onClick={() => setExpanded(!expanded)}
                sx={{
                  rotate: expanded ? '180deg' : '0deg',
                  transition: 'rotate 0.3s ease',
                  cursor: 'pointer',
                  height: '18px',
                  width: '18px',
                }}
              />
            )}
          </MuiBox>
          <MuiCollapse in={expanded}>
            <MuiBox sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {remainingMessages.map((message, index) => (
                <ValidationMessage key={index}>{message}</ValidationMessage>
              ))}
            </MuiBox>
          </MuiCollapse>
        </MuiBox>
      </MuiBox>
    </MuiCollapse>
  );
};

const ValidationMessage: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <MuiTypography variant="body2">{children}</MuiTypography>;
};
