// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';

import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

// Fixed-height resource-tree container, px
const TREE_CONTAINER_HEIGHT = '400px';

export const StyledConfirmAttributionActionPopup = styled(NotificationPopup)(
  ({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    height: TREE_CONTAINER_HEIGHT,
  }),
);
