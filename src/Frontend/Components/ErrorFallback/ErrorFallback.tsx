// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiButton from '@mui/material/Button';
import MuiButtonGroup from '@mui/material/ButtonGroup';
import MuiTypography from '@mui/material/Typography';
import { useEffect } from 'react';
import { type FallbackProps, getErrorMessage } from 'react-error-boundary';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { text } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import { attemptToLeave } from '../../util/save-recovery';
import { SaveRecoveryDialog } from '../SaveRecoveryDialog/save-recovery-dialog';
import { Container, TextContainer } from './ErrorFallback.style';

function quit() {
  void attemptToLeave('quit', (failureId) =>
    window.electronAPI.confirmQuit(
      failureId === undefined ? undefined : { discardUnsavedChanges: true },
    ),
  ).catch((error: unknown) => console.error('Could not quit', error));
}

export const ErrorFallback: React.FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  useEffect(
    () =>
      window.electronAPI.on(AllowedFrontendChannels.RequestQuitApproval, () => {
        window.electronAPI.quitRequestHandled();
        quit();
      }),
    [],
  );
  return (
    <Container>
      <SaveRecoveryDialog />
      <TextContainer role="alert">
        <MuiTypography sx={{ textAlign: 'center' }} variant={'h6'}>
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
          <MuiButton color={'secondary'} onClick={quit}>
            {text.errorBoundary.quit}
          </MuiButton>
        </MuiButtonGroup>
      </TextContainer>
    </Container>
  );
};
