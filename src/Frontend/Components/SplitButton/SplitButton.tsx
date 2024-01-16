// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import KeyboardUpDownIcon from '@mui/icons-material/KeyboardArrowUp';
import MuiButton, { ButtonProps as MuiButtonProps } from '@mui/material/Button';
import MuiButtonGroup from '@mui/material/ButtonGroup';
import MuiMenuItem from '@mui/material/MenuItem';
import MuiTypography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';

import { ButtonMenu } from '../ButtonMenu/ButtonMenu';

export interface SplitButtonOption {
  onClick(): void;
  buttonText: string;
  disabled?: boolean;
  hidden?: boolean;
}

export interface SplitButtonProps
  extends Pick<MuiButtonProps, 'startIcon' | 'color'> {
  options: Array<SplitButtonOption>;
  minWidth?: number;
  menuButtonProps?: Partial<MuiButtonProps>;
}

export const SplitButton: React.FC<SplitButtonProps> = ({
  options,
  color,
  startIcon,
  minWidth,
  menuButtonProps,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();
  const [selectedOption, setSelectedOption] = useState(() =>
    options.find(({ hidden }) => !hidden),
  );
  const visibleOptions = useMemo(
    () => options.filter(({ hidden }) => !hidden),
    [options],
  );
  const hasMultipleOptions = visibleOptions.length > 1;

  useEffect(() => {
    setSelectedOption(options.find(({ hidden }) => !hidden));
  }, [options]);

  if (!selectedOption) {
    return null;
  }

  return (
    <>
      <MuiButtonGroup color={color}>
        <MuiButton
          sx={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          startIcon={startIcon}
          onClick={selectedOption.onClick}
          variant={'contained'}
          disabled={selectedOption.disabled}
        >
          {selectedOption.buttonText}
        </MuiButton>
        {hasMultipleOptions && (
          <MuiButton
            aria-label={'menu button'}
            {...menuButtonProps}
            size={'small'}
            onClick={(event) => setAnchorEl(event.currentTarget)}
            variant={'contained'}
            disabled={selectedOption.disabled}
          >
            <KeyboardUpDownIcon sx={{ width: '20px', height: '20px' }} />
          </MuiButton>
        )}
      </MuiButtonGroup>
      {hasMultipleOptions && (
        <ButtonMenu
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClose={() => setAnchorEl(undefined)}
          minWidth={minWidth}
        >
          {visibleOptions.map(({ buttonText, disabled, hidden }) => (
            <MuiMenuItem
              disabled={disabled}
              key={buttonText}
              onClick={() => {
                setAnchorEl(undefined);
                setSelectedOption(
                  options.find((option) => option.buttonText === buttonText),
                );
              }}
              disableRipple
              hidden={hidden}
              selected={buttonText === selectedOption.buttonText}
            >
              <MuiTypography>{buttonText}</MuiTypography>
            </MuiMenuItem>
          ))}
        </ButtonMenu>
      )}
    </>
  );
};
