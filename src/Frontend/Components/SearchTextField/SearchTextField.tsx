// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { InputAdornment, SxProps } from '@mui/material';

import { text } from '../../../shared/text';
import { ClearButton } from '../ClearButton/ClearButton';
import { Input } from './SearchTextField.style';

interface SearchTextFieldProps {
  className?: string;
  onInputChange(search: string): void;
  placeholder?: string;
  search: string;
  sx?: SxProps;
}

export function SearchTextField({
  className,
  onInputChange,
  placeholder = text.buttons.search,
  search,
  sx,
}: SearchTextFieldProps) {
  return (
    <Input
      placeholder={placeholder}
      className={className}
      type={'search'}
      size={'small'}
      value={search}
      fullWidth
      onChange={(event) => onInputChange(event.target.value)}
      endAdornment={
        search ? (
          <InputAdornment position="end">
            <ClearButton
              onClick={() => onInputChange('')}
              aria-label={'clear search'}
            />
          </InputAdornment>
        ) : undefined
      }
      sx={sx}
    />
  );
}
