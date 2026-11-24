// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CloseIcon from '@mui/icons-material/Close';
import MuiButton from '@mui/material/Button';
import MuiCircularProgress from '@mui/material/CircularProgress';
import MuiIconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import MuiTypography from '@mui/material/Typography';
import { visuallyHidden } from '@mui/utils';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import type { SaveFailure } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { buttonSpinnerSize } from '../../shared-styles';
import {
  shouldHideSaveWarning,
  subscribeToSaveRecovery,
} from '../../util/save-recovery';
import { toast } from '../Toaster';

const SAVE_ERROR_TOAST_ID = 'project-save-error';

const SaveErrorContentLayout = styled('div')(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'center',
  columnGap: theme.spacing(2),
  minWidth: 0,
  width: '100%',
  '& > div:first-of-type': {
    minWidth: 0,
    overflowWrap: 'anywhere',
  },
  '& > div:nth-of-type(2)': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    justifySelf: 'end',
  },
  [theme.breakpoints.down('sm')]: {
    gridTemplateColumns: 'minmax(0, 1fr)',
    rowGap: theme.spacing(1),
    '& > div:nth-of-type(2)': {
      justifySelf: 'end',
    },
  },
}));

export function SaveErrorNotification(): null {
  const [failure, setFailure] = useState<SaveFailure | undefined>();
  const hideWarning = useSyncExternalStore(subscribeToSaveRecovery, () =>
    shouldHideSaveWarning(failure?.id),
  );

  useEffect(() => {
    const unsubscribe = window.electronAPI.on(
      AllowedFrontendChannels.SaveFailureChanged,
      (_, nextFailure: SaveFailure | undefined) => setFailure(nextFailure),
    );
    return () => {
      unsubscribe();
      toast.dismiss(SAVE_ERROR_TOAST_ID);
    };
  }, []);

  useEffect(() => {
    if (hideWarning) {
      toast.remove(SAVE_ERROR_TOAST_ID);
      return;
    }
    if (!failure) {
      toast.dismiss(SAVE_ERROR_TOAST_ID);
      return;
    }
    toast.error(() => <SaveErrorToastContent failure={failure} />, {
      id: SAVE_ERROR_TOAST_ID,
      duration: Infinity,
      style: {
        width: '480px',
        maxWidth: 'calc(100vw - 32px)',
      },
    });
  }, [failure, hideWarning]);

  return null;
}

function SaveErrorToastContent({ failure }: { failure: SaveFailure }) {
  const [retrying, setRetrying] = useState(false);
  const [retryFailure, setRetryFailure] = useState<SaveFailure | undefined>();
  const [requestError, setRequestError] = useState<string | undefined>();
  const pendingRef = useRef(false);

  async function retry() {
    if (pendingRef.current) {
      return;
    }
    pendingRef.current = true;
    setRetrying(true);
    setRetryFailure(undefined);
    setRequestError(undefined);
    try {
      const retryResult = await window.electronAPI.saveFile();
      if (retryResult.status === 'failed') {
        setRetryFailure(retryResult.failure);
      }
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : String(error));
    } finally {
      pendingRef.current = false;
      setRetrying(false);
    }
  }
  return (
    <SaveErrorContentLayout>
      <div>
        <MuiTypography
          component="strong"
          variant="body2"
          sx={{ fontWeight: 'bold' }}
        >
          {text.saveError.heading}
        </MuiTypography>
        <MuiTypography
          component="div"
          variant="body2"
          data-failure-id={failure.id}
          sx={{ minWidth: 0, overflowWrap: 'anywhere' }}
        >
          {failure.message}
        </MuiTypography>
      </div>
      <div>
        <MuiButton
          size="small"
          loading={retrying}
          loadingIndicator={
            <MuiCircularProgress size={buttonSpinnerSize} color="inherit" />
          }
          disabled={retrying}
          onClick={() => void retry()}
        >
          {text.saveError.retry}
        </MuiButton>
        <MuiIconButton
          aria-label={text.saveError.dismiss}
          size="small"
          onClick={() => toast.dismiss(SAVE_ERROR_TOAST_ID)}
        >
          <CloseIcon fontSize="small" />
        </MuiIconButton>
      </div>
      {retryFailure?.id === failure.id && (
        <span
          key={`announcement-${retryFailure.id}`}
          data-failure-id={retryFailure.id}
          role="status"
          aria-live="polite"
          style={visuallyHidden}
        >
          {`${text.saveError.retryFailed}: ${retryFailure.message}`}
        </span>
      )}
      {requestError && (
        <span role="status" aria-live="polite" style={visuallyHidden}>
          {`${text.saveError.retryFailed}: ${requestError}`}
        </span>
      )}
    </SaveErrorContentLayout>
  );
}
