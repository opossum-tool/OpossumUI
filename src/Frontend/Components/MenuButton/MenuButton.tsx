// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import KeyboardUpDownIcon from '@mui/icons-material/KeyboardArrowUp';
import MuiButton, { ButtonProps as MuiButtonProps } from '@mui/material/Button';
import MuiMenuItem from '@mui/material/MenuItem';
import MuiTypography from '@mui/material/Typography';
import { useMemo, useState } from 'react';

import { ButtonMenu } from '../ButtonMenu/ButtonMenu';
import { ContextMenuItem } from '../ContextMenu/ContextMenu';

interface Props extends Pick<MuiButtonProps, 'disabled' | 'color'> {
  title: string;
  options: Array<ContextMenuItem>;
  minWidth?: number;
}

export const MenuButton: React.FC<Props> = ({
  title,
  options,
  disabled,
  color,
  minWidth,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();
  const visibleOptions = useMemo(
    () => options.filter(({ hidden }) => !hidden),
    [options],
  );

  const handleClose = () => {
    setAnchorEl(undefined);
  };

  if (!visibleOptions.length) {
    return null;
  }

  return (
    <>
      <MuiButton
        variant={'contained'}
        disabled={disabled}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        endIcon={<KeyboardUpDownIcon />}
        color={color}
        sx={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </MuiButton>
      <ButtonMenu
        minWidth={minWidth}
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={handleClose}
      >
        {visibleOptions.map(({ buttonText, disabled, onClick }) => (
          <MuiMenuItem
            disabled={disabled}
            key={buttonText}
            onClick={() => {
              handleClose();
              onClick?.();
            }}
            disableRipple
          >
            <MuiTypography>{buttonText}</MuiTypography>
          </MuiMenuItem>
        ))}
      </ButtonMenu>
    </>
  );
};
