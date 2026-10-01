// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { Theme } from '@mui/material/styles';

import { OpossumColors } from '../../../shared-styles';
import { Autocomplete } from '../../Autocomplete/Autocomplete';

const DISABLED_FILTER_OPACITY = 0.5;

interface Props {
  ariaLabel: string;
  disabled?: boolean;
  options: Array<string>;
  placeholder: string;
  getSelectedValueLabel?: (value: string) => string;
  inputRef?: React.Ref<HTMLInputElement>;
  inputReadOnly?: boolean;
  selectedValue: string;
  setSelectedValue: (value: string | null) => void;
  startAdornment: React.ReactNode;
}

export const ValueFilterAutocomplete: React.FC<Props> = ({
  ariaLabel,
  disabled,
  options,
  placeholder,
  getSelectedValueLabel,
  inputRef,
  inputReadOnly,
  selectedValue,
  setSelectedValue,
  startAdornment,
}) => {
  return (
    <Autocomplete<string, false, false, false>
      sx={{
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- 9.5 theme spacing units (= 38px; matches the menu item row height)
        height: ({ spacing }: Theme) => spacing(9.5),
        opacity: disabled ? DISABLED_FILTER_OPACITY : 1,
      }}
      background={selectedValue ? OpossumColors.lightestBlue : 'transparent'}
      disabled={disabled}
      variant={'filled'}
      placeholder={placeholder}
      options={selectedValue ? [selectedValue] : options}
      getOptionLabel={getSelectedValueLabel}
      optionText={{
        sx: {
          background: OpossumColors.lightestBlue,
          '&:hover': {
            background: OpossumColors.lightestBlueOnHover,
          },
        },
        primary: (option) => option,
      }}
      startAdornment={startAdornment}
      hidePopupIndicator={!!selectedValue}
      inputRef={inputRef}
      inputReadOnly={inputReadOnly}
      value={selectedValue || null}
      onChange={(_, value) => setSelectedValue(value)}
      blurOnSelect
      filterSelectedOptions
      aria-label={ariaLabel}
    />
  );
};
