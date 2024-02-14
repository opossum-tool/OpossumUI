// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';

import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export const StyledNotificationPopup = styled(NotificationPopup)({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});
