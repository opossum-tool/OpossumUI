// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled } from '@mui/material';
import type { Theme } from '@mui/material/styles';

import { Sizing } from '../../shared-styles';

const groupContainerVerticalPadding = Sizing.Tiny;

export const getGroupContainerHeight = (theme: Theme): number =>
  Number.parseFloat(theme.spacing(Sizing.Row)) +
  Number.parseFloat(theme.spacing(groupContainerVerticalPadding)) * 2;

export const GroupContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  height: theme.spacing(Sizing.Row),
  alignItems: 'center',
  gap: theme.spacing(Sizing.SmallGap),
  // 2.5 units = 10px horizontal group padding
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  padding: theme.spacing(groupContainerVerticalPadding, 2.5),
  backgroundColor: '#cacfdb',
}));
