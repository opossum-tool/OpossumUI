// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
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
        height: '38px',
        opacity: disabled ? DISABLED_FILTER_OPACITY : 1,
      }}
      background={selectedValue ? OpossumColors.lightestBlue : 'transparent'}
      disabled={disabled}
      variant={'filled'}
      placeholder={placeholder}
      options={options}
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
