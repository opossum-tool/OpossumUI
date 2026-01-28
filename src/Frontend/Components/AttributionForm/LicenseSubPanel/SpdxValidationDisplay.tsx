// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTypography from '@mui/material/Typography';
import { Fragment } from 'react/jsx-runtime';

import { OpossumColors } from '../../../shared-styles';
import { SpdxExpressionValidationResult } from '../../../util/validate-spdx';
import { ValidationDisplay } from '../../ValidationDisplay/ValidationDisplay';

interface SpdxValidationDisplayProps {
  validationResult: SpdxExpressionValidationResult;
  onApplyFix: (newExpression: string) => void;
}

export const SpdxValidationDisplay: React.FC<SpdxValidationDisplayProps> = ({
  validationResult,
  onApplyFix,
}) => {
  switch (validationResult.type) {
    case 'valid':
      return <ValidationDisplay messages={[]} severity={'warning'} />;
    case 'syntax-error':
      return (
        <ValidationDisplay
          messages={['Invalid SPDX expression.']}
          severity={'error'}
        />
      );
    case 'uncapitalized-conjunctions':
      return (
        <ValidationDisplay
          messages={[
            <Fragment key="uncapitalized-conjunctions">
              AND, OR and WITH need to be{' '}
              <SuggestionLink onClick={() => onApplyFix(validationResult.fix)}>
                capitalized
              </SuggestionLink>
              .
            </Fragment>,
          ]}
          severity={'warning'}
        />
      );
    case 'unknown-licenses':
      return (
        <ValidationDisplay
          messages={validationResult.unknownLicenseIds
            .toSorted((a, b) => (a.suggestion ? 0 : 1) - (b.suggestion ? 0 : 1))
            .map(({ unknownId, suggestion, fix }) => (
              <Fragment key={unknownId}>
                <em style={{ wordBreak: 'break-all' }}>{unknownId}</em> is not a
                known license id.
                {suggestion && fix && (
                  <>
                    {' Did you mean '}
                    <SuggestionLink onClick={() => onApplyFix(fix)}>
                      {suggestion}
                    </SuggestionLink>
                    ?
                  </>
                )}
              </Fragment>
            ))}
          severity={'warning'}
        />
      );
  }
};

const SuggestionLink: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
}> = ({ onClick, children }) => {
  return (
    <MuiTypography
      component="span"
      variant="body2"
      onClick={onClick}
      sx={{
        color: OpossumColors.darkBlue,
        cursor: 'pointer',
        '&:hover': { textDecoration: 'underline' },
      }}
    >
      {children}
    </MuiTypography>
  );
};
