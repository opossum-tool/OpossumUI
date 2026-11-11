// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiAlert from '@mui/material/Alert';
import MuiTypography from '@mui/material/Typography';
import { useState } from 'react';

import { text } from '../../../shared/text';
import { invalidateBackendQueries } from '../../util/backendClient';
import { useCloseGlobalPopup } from '../GlobalPopup/popup-close-context';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export function ForceUnlockPopup() {
  const close = useCloseGlobalPopup();
  const [forceUnlockInProgress, setForceUnlockInProgress] = useState(false);

  async function forceUnlock(): Promise<void> {
    setForceUnlockInProgress(true);
    try {
      await window.electronAPI.forceUnlock();
      await invalidateBackendQueries();
      close();
    } finally {
      setForceUnlockInProgress(false);
    }
  }

  return (
    <NotificationPopup
      header={text.forceUnlock.title}
      isOpen
      centerLeftButtonConfig={{
        buttonText: text.forceUnlock.confirm,
        color: 'error',
        onClick: forceUnlock,
        disabled: forceUnlockInProgress,
        loading: forceUnlockInProgress,
      }}
      rightButtonConfig={{
        buttonText: text.buttons.cancel,
        disabled: forceUnlockInProgress,
        onClick: close,
      }}
      aria-label={'force unlock popup'}
    >
      <MuiTypography sx={{ marginBottom: 4 }}>
        {text.forceUnlock.description}
      </MuiTypography>
      <MuiAlert severity={'warning'}>{text.forceUnlock.warning}</MuiAlert>
    </NotificationPopup>
  );
}
