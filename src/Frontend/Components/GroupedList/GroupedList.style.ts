// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';

import { Sizing } from '../../shared-styles';

export const GroupContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  height: theme.spacing(Sizing.Row),
  alignItems: 'center',
  gap: theme.spacing(Sizing.SmallGap),
  // 2.5 units = 10px horizontal group padding
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  padding: theme.spacing(1, 2.5),
  backgroundColor: '#cacfdb',
}));
