// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTypography from '@mui/material/Typography';

import { SpdxExpressionValidationResult } from '../../../util/validateSpdx';
import { ValidationErrorDisplay } from '../../ValidationErrorDisplay/ValidationErrorDisplay';

interface SpdxValidationErrorDisplayProps {
  validationResult: SpdxExpressionValidationResult;
  onApplyFix: (newExpression: string) => void;
}

export const SpdxValidationErrorDisplay: React.FC<
  SpdxValidationErrorDisplayProps
> = ({ validationResult, onApplyFix }) => {
  switch (validationResult.type) {
    case 'syntax-error':
      return (
        <ValidationErrorDisplay
          messages={['Invalid SPDX expression.']}
          severity={'error'}
        />
      );

    case 'uncapitalized-conjunctions':
      return (
        <ValidationErrorDisplay
          messages={[
            <span key="uncapitalized-conjunctions">
              AND, OR and WITH need to be{' '}
              <SuggestionLink onClick={() => onApplyFix(validationResult.fix)}>
                capitalized
              </SuggestionLink>
              .
            </span>,
          ]}
          severity={'warning'}
        />
      );

    case 'unknown-licenses':
      return (
        <ValidationErrorDisplay
          messages={validationResult.unknownLicenseIds
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
            ))}
          severity={'warning'}
        />
      );

    default:
      return <ValidationErrorDisplay messages={[]} severity={'warning'} />;
  }
};

function SuggestionLink({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
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
