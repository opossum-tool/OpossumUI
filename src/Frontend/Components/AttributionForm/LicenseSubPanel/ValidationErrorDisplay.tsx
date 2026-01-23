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

import { OpossumColors } from '../../../shared-styles';
import { SpdxExpressionValidationResult } from '../../../util/validateSpdx';

interface ValidationErrorDisplayProps {
  validationResult: SpdxExpressionValidationResult;
  onApplyFix: (newExpression: string) => void;
}

export function ValidationErrorDisplay({
  validationResult,
  onApplyFix,
}: ValidationErrorDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  const messages = getValidationMessages(validationResult, onApplyFix);

  if (expanded && messages.length <= 1) {
    setExpanded(false);
  }

  const severity =
    validationResult.type === 'syntax-error' ? 'error' : 'warning';

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
            {firstMessage}
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
              {restMessages}
            </MuiBox>
          </MuiCollapse>
        </MuiBox>
      </MuiBox>
    </MuiCollapse>
  );
}

function getValidationMessages(
  validationResult: SpdxExpressionValidationResult,
  onApplyFix: (fix: string) => void,
): Array<ReactNode> {
  if (validationResult.type === 'valid') {
    return [];
  }

  if (validationResult.type === 'syntax-error') {
    return [
      <ValidationMessage key="syntax-error">
        Invalid SPDX expression.
      </ValidationMessage>,
    ];
  }

  if (validationResult.type === 'uncapitalized-conjunctions') {
    return [
      <ValidationMessage key="uncapitalized">
        <span>
          AND, OR and WITH need to be{' '}
          <SuggestionLink onClick={() => onApplyFix(validationResult.fix)}>
            capitalized
          </SuggestionLink>
          .
        </span>
      </ValidationMessage>,
    ];
  }

  if (validationResult.type === 'unknown-licenses') {
    return validationResult.unknownLicenseIds
      .toSorted((a, b) => (a.suggestion ? 0 : 1) - (b.suggestion ? 0 : 1))
      .map(({ unknownId, suggestion, fix }) => (
        <ValidationMessage key={unknownId}>
          <span>
            <em>{unknownId}</em> is not a known license id.
            {suggestion && fix && (
              <>
                {' Did you mean '}
                <SuggestionLink onClick={() => onApplyFix(fix)}>
                  {suggestion}
                </SuggestionLink>
                ?
              </>
            )}
          </span>
        </ValidationMessage>
      ));
  }

  return [];
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

function SuggestionLink({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <MuiTypography
      component="span"
      variant="body2"
      onClick={onClick}
      sx={{
        color: 'primary.main',
        cursor: 'pointer',
        '&:hover': { textDecoration: 'underline' },
      }}
    >
      {children}
    </MuiTypography>
  );
}
