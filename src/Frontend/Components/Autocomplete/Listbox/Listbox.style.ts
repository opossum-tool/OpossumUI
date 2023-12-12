// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled, SxProps } from '@mui/material';

import { OpossumColors } from '../../../shared-styles';

export const GroupContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '4px 10px',
  backgroundColor: OpossumColors.lightBlue,
});

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
