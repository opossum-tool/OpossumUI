// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';

import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export const StyledConfirmAttributionActionPopup = styled(NotificationPopup)(
  ({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    height: '400px',
  }),
);
