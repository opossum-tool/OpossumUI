// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
        width: '20px',
        minWidth: '20px',
        height: '20px',
        minHeight: '20px',
        backgroundColor: OpossumColors.white,
        '&:hover': {
          backgroundColor: OpossumColors.lightestBlue,
        },
        transition: TRANSITION,
      }}
      onClick={onClick}
    >
      <ExpandMoreIcon
        fontSize={'small'}
        sx={{
          transition: TRANSITION,
          transform: invert ? 'rotate(180deg)' : undefined,
        }}
      />
    </MuiFab>
  );
};
