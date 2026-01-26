// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ExpandMore } from '@mui/icons-material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MuiBox from '@mui/material/Box';
import MuiCollapse from '@mui/material/Collapse';
import MuiTypography from '@mui/material/Typography';
import { ReactNode, useState } from 'react';

import { OpossumColors } from '../../shared-styles';

interface ValidationErrorDisplayProps {
  messages: Array<ReactNode>;
  severity: 'error' | 'warning';
}

export function ValidationErrorDisplay({
  messages,
  severity,
}: ValidationErrorDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  if (expanded && messages.length <= 1) {
    setExpanded(false);
  }

  const color = severity === 'error' ? OpossumColors.red : OpossumColors.brown;
  const [firstMessage, ...restMessages] = messages;
  const hiddenCount = restMessages.length;

  return (
    <MuiCollapse in={messages.length > 0}>
      <MuiBox
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
            {hiddenCount > 0 && (
              <ExpandMore
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
              {restMessages.map((message) => (
                <ValidationMessage key={message?.toString()}>
                  {message}
                </ValidationMessage>
              ))}
            </MuiBox>
          </MuiCollapse>
        </MuiBox>
      </MuiBox>
    </MuiCollapse>
  );
}

function ValidationMessage({ children }: { children: ReactNode }) {
  return (
    <MuiTypography
      variant="body2"
      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
    >
      {children}
    </MuiTypography>
  );
}
