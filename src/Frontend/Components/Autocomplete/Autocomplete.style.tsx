/* eslint-disable @typescript-eslint/no-magic-numbers */
// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Popper,
  type PopperPlacementType,
  type PopperProps,
  styled,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import MuiTextField from '@mui/material/TextField';

import { OpossumColors } from '../../shared-styles';

export const Container = styled('div')({
  flex: 1,
});

export const Input = styled(MuiTextField, {
  shouldForwardProp: (name: string) =>
    !['color', 'numberOfEndAdornments', 'background'].includes(name),
})<{
  background?: string;
  color?: 'error' | 'warning';
  numberOfEndAdornments: number;
}>(({ theme, background, color, numberOfEndAdornments }) => {
  const errorBackground = (() => {
    switch (color) {
      case 'error':
        return OpossumColors.darkOrange;
      case 'warning':
        return OpossumColors.lightOrange;
      default:
        return OpossumColors.white;
    }
  })();
  return {
    '& .MuiInputLabel-root': {
      backgroundColor: background || errorBackground,
      padding: theme.spacing(0, 0.75),
      fontSize: (theme: Theme) => theme.typography.body3.fontSize,
      top: theme.spacing(0.25),
    },
    '& .MuiInputBase-root': {
      backgroundColor: background || errorBackground,
      borderRadius: '0px',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: theme.spacing(2),
      minHeight: theme.spacing(9.1675),
      paddingTop: theme.spacing(1.5),
      paddingBottom: theme.spacing(1.5),
      paddingLeft: theme.spacing(3),
      paddingRight: `calc(${theme.spacing(3)} + ${numberOfEndAdornments} * ${theme.spacing(7)})`,
    },
    '& .MuiInputBase-root.Mui-disabled': {
      backgroundColor: background || errorBackground,
    },
    '& .MuiInputBase-input.Mui-disabled': {
      color: OpossumColors.black,
      WebkitTextFillColor: OpossumColors.black,
    },
    '& .MuiInputBase-input.Mui-disabled::placeholder': {
      color: OpossumColors.black,
      WebkitTextFillColor: OpossumColors.black,
    },
    '& .MuiInputBase-input': {
      flex: 1,
      padding: 0,
    },
    '& legend': {
      '& span': {
        display: 'none',
      },
    },
    '& .Mui-readOnly:hover:not(.Mui-focused) fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.23)',
    },
    '& .Mui-readOnly.Mui-focused fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.23)',
      borderWidth: theme.spacing(0.25),
    },
  };
});

export const StyledPopper = styled(
  (props: PopperProps & { forcePlacement?: PopperPlacementType }) => {
    const { forcePlacement, ...rest } = props;
    return (
      <Popper
        placement={forcePlacement ?? 'auto'}
        {...rest}
        modifiers={[
          {
            name: 'preventOverflow',
            enabled: true,
          },
          {
            name: 'flip',
            enabled: !forcePlacement,
            options: {
              padding: 64,
              allowedAutoPlacements: ['top', 'bottom'],
            },
          },
        ]}
      />
    );
  },
)(({ theme, anchorEl }) => ({
  width: (anchorEl as HTMLElement | null)?.clientWidth,
  zIndex: theme.zIndex.modal,
}));

export const EndAdornmentContainer = styled('div')(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(3.5),
  display: 'flex',
  height: '100%',
  alignItems: 'center',
}));
