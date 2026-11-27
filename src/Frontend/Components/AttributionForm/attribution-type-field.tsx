// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiToggleButton from '@mui/material/ToggleButton';
import MuiToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { text } from '../../../shared/text';
import { AttributionType } from '../../enums/enums';

interface AttributionTypeFieldProps {
  value: boolean | undefined;
  disabled?: boolean;
  compact?: boolean;
  onChange: (value: boolean) => void;
}

export function AttributionTypeField({
  value,
  disabled = false,
  compact = false,
  onChange,
}: AttributionTypeFieldProps) {
  return (
    <MuiToggleButtonGroup
      value={value === true}
      exclusive
      onChange={(_, newValue: boolean | null) => {
        if (newValue !== null) {
          onChange(newValue);
        }
      }}
      size={'small'}
      fullWidth={!compact}
      sx={
        compact
          ? {
              '& .MuiToggleButton-root': {
                typography: 'caption',
                lineHeight: 'normal',
                py: 0,
                px: 2,
                textTransform: 'none',
                whiteSpace: 'nowrap',
              },
            }
          : undefined
      }
      disabled={disabled}
      aria-label={text.diffPopup.attributionType}
    >
      <MuiToggleButton value={false} disableRipple>
        {AttributionType.ThirdParty}
      </MuiToggleButton>
      <MuiToggleButton value={true} disableRipple>
        {AttributionType.FirstParty}
      </MuiToggleButton>
    </MuiToggleButtonGroup>
  );
}
