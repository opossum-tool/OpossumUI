// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiAlert from '@mui/material/Alert';
import MuiTypography from '@mui/material/Typography';

import { text } from '../../../shared/text';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { invalidateBackendQueries } from '../../util/backendClient';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export function ForceUnlockPopup() {
  const dispatch = useAppDispatch();

  async function forceUnlock(): Promise<void> {
    await window.electronAPI.forceUnlock();
    await invalidateBackendQueries();
    dispatch(closePopup());
  }

  return (
    <NotificationPopup
      header={text.forceUnlock.title}
      isOpen
      centerLeftButtonConfig={{
        buttonText: text.forceUnlock.confirm,
        color: 'error',
        onClick: forceUnlock,
      }}
      rightButtonConfig={{
        buttonText: text.buttons.cancel,
        onClick: () => dispatch(closePopup()),
      }}
      aria-label={'force unlock popup'}
    >
      <MuiTypography sx={{ marginBottom: 2 }}>
        {text.forceUnlock.description}
      </MuiTypography>
      <MuiAlert severity={'warning'}>{text.forceUnlock.warning}</MuiAlert>
    </NotificationPopup>
  );
}
