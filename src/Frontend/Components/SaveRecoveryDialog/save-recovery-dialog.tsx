// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiCircularProgress from '@mui/material/CircularProgress';
import MuiTypography from '@mui/material/Typography';
import { visuallyHidden } from '@mui/utils';
import { useRef, useState, useSyncExternalStore } from 'react';

import type { SaveResult } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { buttonSpinnerSize } from '../../shared-styles';
import {
  closeSaveRecovery,
  getSaveRecovery,
  resumeSaveRecovery,
  subscribeToSaveRecovery,
  updateSaveRecoveryFailure,
} from '../../util/save-recovery';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { toast } from '../Toaster';

export function SaveRecoveryDialog(): React.ReactNode {
  const request = useSyncExternalStore(
    subscribeToSaveRecovery,
    getSaveRecovery,
  );
  const [busy, setBusy] = useState(false);
  const [announcedFailureId, setAnnouncedFailureId] = useState<
    string | undefined
  >(undefined);
  const pendingRef = useRef(false);
  if (!request) {
    return null;
  }
  const current = request;
  async function decide(decision: 'retry' | 'leave') {
    if (pendingRef.current) {
      return;
    }
    pendingRef.current = true;
    setBusy(true);
    try {
      if (decision === 'retry') {
        setAnnouncedFailureId(undefined);
        let result: SaveResult;
        try {
          result = await window.electronAPI.saveFile();
        } catch (error) {
          result = {
            status: 'failed',
            failure: {
              id: crypto.randomUUID(),
              fileName: current.failure.fileName,
              message: error instanceof Error ? error.message : String(error),
            },
          };
        }
        if (result.status === 'failed') {
          updateSaveRecoveryFailure(current, result.failure);
          setAnnouncedFailureId(result.failure.id);
          return;
        }
      }
      if (getSaveRecovery() !== current) {
        return;
      }
      const result = await resumeSaveRecovery(
        current,
        decision === 'leave' ? current.failure.id : undefined,
      );
      if (result?.status === 'blocked') {
        setAnnouncedFailureId(result.failure.id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      pendingRef.current = false;
      setBusy(false);
    }
  }
  const stay = closeSaveRecovery;
  return (
    <NotificationPopup
      isOpen
      maxWidth="640px"
      sx={{ overflowWrap: 'anywhere' }}
      actionsSx={{ borderTop: 1, borderColor: 'divider' }}
      header={text.saveError.heading}
      aria-label="save recovery dialog"
      onEscapeKeyDown={busy ? undefined : stay}
      onBackdropClick={busy ? undefined : stay}
      leftButtonConfig={{
        buttonText: text.saveError.retry,
        onClick: () => void decide('retry'),
        disabled: busy,
        loading: busy,
        loadingIndicator: (
          <MuiCircularProgress size={buttonSpinnerSize} color="inherit" />
        ),
      }}
      centerLeftButtonConfig={{
        buttonText: text.saveError.stay,
        color: 'secondary',
        onClick: stay,
        disabled: busy,
      }}
      rightButtonConfig={
        request.action === 'open' || request.action === 'quit'
          ? {
              buttonText:
                request.action === 'quit'
                  ? text.saveError.quitWithoutSaving
                  : text.saveError.openWithoutSaving,
              color: 'error',
              variant: 'outlined',
              onClick: () => void decide('leave'),
              disabled: busy,
            }
          : undefined
      }
    >
      <MuiTypography
        key={`reason-${request.failure.id}`}
        data-failure-id={request.failure.id}
        variant="body2"
        component="div"
        sx={{ overflowWrap: 'anywhere' }}
      >
        {request.failure.message}
      </MuiTypography>
      {announcedFailureId === request.failure.id && (
        <span
          key={`announcement-${request.failure.id}`}
          data-failure-id={request.failure.id}
          role="status"
          aria-live="polite"
          style={visuallyHidden}
        >
          {`${text.saveError.retryFailed}: ${request.failure.message}`}
        </span>
      )}
    </NotificationPopup>
  );
}
