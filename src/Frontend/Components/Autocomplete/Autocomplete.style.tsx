// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Popper, PopperProps, styled, SxProps } from '@mui/material';
import MuiTextField from '@mui/material/TextField';

import { OpossumColors } from '../../shared-styles';

export const Container = styled('div')({
  flex: 1,
});

export const TagsContainer = styled('div')({
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
});

export const Input = styled(MuiTextField, {
  shouldForwardProp: (name: string) =>
    !['error', 'numberOfEndAdornments', 'background'].includes(name),
})<{
  background?: string;
  error?: boolean;
  numberOfEndAdornments: number;
}>(({ background, error, numberOfEndAdornments }) => ({
  '& .MuiInputLabel-root': {
    backgroundColor:
      background || (error ? OpossumColors.lightOrange : OpossumColors.white),
    padding: '0px 3px',
    fontSize: '13px',
    top: '1px',
  },
  '& .MuiInputBase-root': {
    backgroundColor:
      background || (error ? OpossumColors.lightOrange : OpossumColors.white),
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
}));

export const StyledPopper = styled((props: PopperProps) => (
  <Popper
    {...props}
    placement={'auto'}
    modifiers={[
      {
        name: 'preventOverflow',
        enabled: true,
      },
      {
        name: 'flip',
        options: {
          padding: 64,
          allowedAutoPlacements: ['top', 'bottom'],
        },
      },
    ]}
  />
))(({ theme, anchorEl }) => ({
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

export const styles = {
  overflowEllipsis: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
} satisfies SxProps;
