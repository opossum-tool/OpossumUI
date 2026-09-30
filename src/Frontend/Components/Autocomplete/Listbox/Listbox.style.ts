// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled, type SxProps } from '@mui/material';

import { OpossumColors, Sizing } from '../../../shared-styles';

export const GroupContainer = styled('div', {
  shouldForwardProp: (prop) => prop !== 'theme',
})(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(Sizing.SmallGap),
  // 2.5 units = 10px horizontal group padding
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  padding: theme.spacing(1, 2.5),
  backgroundColor: OpossumColors.lightBlue,
}));

export const styles = {
  overflowEllipsis: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  virtuoso: {
    maxHeight: '40vh',
    transition: 'height all 0.2s ease-out',
  },
} satisfies SxProps;
