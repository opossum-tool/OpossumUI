// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTypography from '@mui/material/Typography';
import { ReactNode } from 'react';

import { SpdxExpressionValidationResult } from '../../../util/validateSpdx';
import { ValidationErrorDisplay } from '../../ValidationErrorDisplay/ValidationErrorDisplay';

interface SpdxValidationErrorDisplayProps {
  validationResult: SpdxExpressionValidationResult;
  onApplyFix: (newExpression: string) => void;
}

export function SpdxValidationErrorDisplay({
  validationResult,
  onApplyFix,
}: SpdxValidationErrorDisplayProps) {
  const messages = getSpdxValidationMessages(validationResult, onApplyFix);
  const severity =
    validationResult.type === 'syntax-error' ? 'error' : 'warning';

  return <ValidationErrorDisplay messages={messages} severity={severity} />;
}

function getSpdxValidationMessages(
  validationResult: SpdxExpressionValidationResult,
  onApplyFix: (fix: string) => void,
): Array<ReactNode> {
  if (validationResult.type === 'valid') {
    return [];
  }

  if (validationResult.type === 'syntax-error') {
    return ['Invalid SPDX expression.'];
  }

  if (validationResult.type === 'uncapitalized-conjunctions') {
    return [
      <span key="uncapitalized-conjunctions">
        AND, OR and WITH need to be{' '}
        <SuggestionLink onClick={() => onApplyFix(validationResult.fix)}>
          capitalized
        </SuggestionLink>
        .
      </span>,
    ];
  }

  if (validationResult.type === 'unknown-licenses') {
    return validationResult.unknownLicenseIds
      .toSorted((a, b) => (a.suggestion ? 0 : 1) - (b.suggestion ? 0 : 1))
      .map(({ unknownId, suggestion, fix }) => (
        <span key={unknownId}>
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
      ));
  }

  return [];
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
