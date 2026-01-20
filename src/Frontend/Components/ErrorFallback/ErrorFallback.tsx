// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiButton from '@mui/material/Button';
import MuiButtonGroup from '@mui/material/ButtonGroup';
import MuiTypography from '@mui/material/Typography';
import { FallbackProps, getErrorMessage } from 'react-error-boundary';

import { text } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import { Container, TextContainer } from './ErrorFallback.style';

export const ErrorFallback: React.FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <Container>
      <TextContainer role="alert">
        <MuiTypography textAlign={'center'} variant={'h6'}>
          {text.errorBoundary.unexpectedError}
        </MuiTypography>
        <MuiTypography
          sx={{ fontFamily: 'monospace' }}
          color={OpossumColors.red}
        >
          {getErrorMessage(error)}
        </MuiTypography>
        <MuiButtonGroup fullWidth variant={'contained'}>
          <MuiButton
            color={'primary'}
            onClick={() => {
              resetErrorBoundary();
              window.electronAPI.relaunch();
            }}
          >
            {text.errorBoundary.relaunch}
          </MuiButton>
          <MuiButton
            color={'secondary'}
            onClick={() => {
              window.electronAPI.quit();
            }}
          >
            {text.errorBoundary.quit}
          </MuiButton>
        </MuiButtonGroup>
      </TextContainer>
    </Container>
  );
};
