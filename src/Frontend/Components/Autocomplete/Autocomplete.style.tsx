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
import MuiTextField from '@mui/material/TextField';

import { borderThin, OpossumColors, Sizing } from '../../shared-styles';

// Viewport inset at which the Popper flip modifier is allowed to flip
const FLIP_PADDING = 64;

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
      // 0.75 units = 3px horizontal label padding
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      padding: theme.spacing(0, 0.75),
      fontSize: theme.typography.body3.fontSize,
      // 0.25 units = 1px label nudge
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      top: theme.spacing(0.25),
    },
    '& .MuiInputBase-root': {
      backgroundColor: background || errorBackground,
      borderRadius: '0px',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: theme.spacing(Sizing.SmallGap),
      // 9.1675 units = 36.67px input base minimum height
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      minHeight: theme.spacing(9.1675),
      // 1.5 units = 6px vertical input padding
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      paddingTop: theme.spacing(1.5),
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      paddingBottom: theme.spacing(1.5),
      paddingLeft: theme.spacing(Sizing.MediumPad),
      // 3/7 units = 12/28px left/right padding + per-adornment offset
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
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
      borderWidth: borderThin,
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
              padding: FLIP_PADDING,
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
  // 3.5 units = 14px offset for the end adornment
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  right: theme.spacing(3.5),
  display: 'flex',
  height: '100%',
  alignItems: 'center',
}));
