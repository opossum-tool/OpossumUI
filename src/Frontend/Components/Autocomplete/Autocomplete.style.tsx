// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Popper,
  PopperPlacementType,
  PopperProps,
  styled,
} from '@mui/material';
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
}>(({ background, color, numberOfEndAdornments }) => {
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
      padding: '0px 3px',
      fontSize: '13px',
      top: '1px',
    },
    '& .MuiInputBase-root': {
      backgroundColor: background || errorBackground,
      borderRadius: '0px',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: '8px',
      minHeight: '36.67px',
      paddingTop: '6px',
      paddingBottom: '6px',
      paddingLeft: '12px',
      paddingRight: `calc(12px + ${numberOfEndAdornments} * 28px)`,
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

export const EndAdornmentContainer = styled('div')({
  position: 'absolute',
  right: '14px',
  display: 'flex',
  height: '100%',
  alignItems: 'center',
});
