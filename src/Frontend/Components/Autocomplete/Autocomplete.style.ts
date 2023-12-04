// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { styled, SxProps } from '@mui/material';
import MuiTextField from '@mui/material/TextField';

import { OpossumColors } from '../../shared-styles';

export const Group = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  top: '-8px',
  position: 'sticky',
  padding: '4px 10px',
  zIndex: 1,
  backgroundColor: OpossumColors.lightBlue,
});

export const Input = styled(MuiTextField, {
  shouldForwardProp: (name) => name !== 'highlight',
})<{
  highlight: 'default' | 'dark' | undefined;
}>(({ highlight }) => ({
  '& .MuiInputLabel-root': {
    backgroundColor: highlight
      ? highlight === 'default'
        ? OpossumColors.lightOrange
        : OpossumColors.darkOrange
      : OpossumColors.white,
    padding: '1px 3px',
    fontSize: '13px',
  },
  '& .MuiInputBase-root': {
    backgroundColor: highlight
      ? highlight === 'default'
        ? OpossumColors.lightOrange
        : OpossumColors.darkOrange
      : OpossumColors.white,
    borderRadius: '0px',
  },
  '& legend': {
    '& span': {
      display: 'none',
    },
  },
}));

export const styles = {
  overflowEllipsis: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
} satisfies SxProps;
