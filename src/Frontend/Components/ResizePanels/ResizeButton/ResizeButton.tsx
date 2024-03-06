// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-magic-numbers */
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { alpha } from '@mui/material';
import MuiFab from '@mui/material/Fab';

import { OpossumColors, TRANSITION } from '../../../shared-styles';

interface ResizeButtonProps {
  onClick: () => void;
  invert: boolean;
  disabled?: boolean;
}

export const ResizeButton: React.FC<ResizeButtonProps> = ({
  onClick,
  invert,
  disabled,
}) => {
  return (
    <MuiFab
      size={'small'}
      disabled={disabled}
      sx={{
        boxShadow: 'none',
        width: '24px',
        minWidth: '24px',
        height: '24px',
        minHeight: '24px',
        backgroundColor: alpha(OpossumColors.white, 0.15),
        '&:hover': {
          backgroundColor: alpha(OpossumColors.white, 0.25),
        },
        transition: TRANSITION,
      }}
      onClick={onClick}
    >
      <ExpandMoreIcon
        aria-label={invert ? 'go up' : 'go down'}
        fontSize={'small'}
        color={'secondary'}
        sx={{
          transition: TRANSITION,
          transform: invert ? 'rotate(180deg)' : undefined,
        }}
      />
    </MuiFab>
  );
};
