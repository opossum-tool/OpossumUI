// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiAutocomplete, {
  AutocompleteProps as MuiAutocompleteProps,
} from '@mui/material/Autocomplete';
import { ChipTypeMap as MuiChipTypeMap } from '@mui/material/Chip';
import MuiListItemText from '@mui/material/ListItemText';
import MuiTypography from '@mui/material/Typography';
import { AutocompleteFreeSoloValueMapping as MuiAutocompleteFreeSoloValueMapping } from '@mui/material/useAutocomplete';
import { useState } from 'react';

import { Group, Input, styles } from './Autocomplete.style';

type AutocompleteProps<
  Value,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
  ChipComponent extends React.ElementType = MuiChipTypeMap['defaultComponent'],
> = Omit<
  MuiAutocompleteProps<
    Value,
    Multiple,
    DisableClearable,
    FreeSolo,
    ChipComponent
  >,
  | 'ListboxComponent'
  | 'onClose'
  | 'onOpen'
  | 'open'
  | 'renderGroup'
  | 'renderInput'
  | 'renderOption'
> & {
  highlight?: 'default' | 'dark';
  optionText: {
    primary: (
      option: Value | MuiAutocompleteFreeSoloValueMapping<FreeSolo>,
    ) => React.ReactNode;
    secondary?: (
      option: Value | MuiAutocompleteFreeSoloValueMapping<FreeSolo>,
    ) => React.ReactNode;
  };
  groupIcon?: React.ReactNode;
  endAdornment?: React.ReactNode;
  getOptionKey?: (
    option: Value | MuiAutocompleteFreeSoloValueMapping<FreeSolo>,
  ) => string;
  renderOptionStartIcon?: (
    option: Value,
    { closePopper }: { closePopper: () => void },
  ) => React.ReactNode;
  renderOptionEndIcon?: (
    option: Value,
    { closePopper }: { closePopper: () => void },
  ) => React.ReactNode;
};

export function Autocomplete<
  Value,
  Multiple extends boolean | undefined,
  DisableClearable extends boolean | undefined,
  FreeSolo extends boolean | undefined,
  ChipComponent extends React.ElementType = MuiChipTypeMap['defaultComponent'],
>({
  endAdornment,
  getOptionKey,
  groupIcon,
  highlight,
  optionText,
  renderOptionEndIcon,
  renderOptionStartIcon,
  sx,
  title,
  ...props
}: AutocompleteProps<
  Value,
  Multiple,
  DisableClearable,
  FreeSolo,
  ChipComponent
>) {
  const [open, setOpen] = useState(false);
  const closePopper = () => setOpen(false);

  return (
    <MuiAutocomplete<Value, Multiple, DisableClearable, FreeSolo, ChipComponent>
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      sx={{ ...sx, flex: 1 }}
      size={'small'}
      renderGroup={(params) => (
        <li key={params.key}>
          <Group>
            {groupIcon}
            <MuiTypography sx={{ paddingTop: '2px' }}>
              {params.group}
            </MuiTypography>
          </Group>
          <ul style={{ padding: 0 }}>{params.children}</ul>
        </li>
      )}
      renderOption={(
        props: React.HTMLAttributes<HTMLLIElement> & React.Attributes,
        option,
      ) => (
        <li {...props} key={getOptionKey?.(option) || props.key}>
          {renderOptionStartIcon?.(option, { closePopper })}
          <MuiListItemText
            primary={optionText.primary(option)}
            primaryTypographyProps={{ sx: styles.overflowEllipsis }}
            secondary={optionText.secondary?.(option)}
            secondaryTypographyProps={{
              variant: 'caption',
              sx: styles.overflowEllipsis,
            }}
          />
          {renderOptionEndIcon?.(option, { closePopper })}
        </li>
      )}
      disableListWrap
      renderInput={({ InputProps, ...params }) => (
        <Input
          {...params}
          label={title}
          highlight={highlight}
          size={'small'}
          InputProps={{
            ...InputProps,
            endAdornment: endAdornment || InputProps.endAdornment,
          }}
        />
      )}
      {...props}
    />
  );
}
