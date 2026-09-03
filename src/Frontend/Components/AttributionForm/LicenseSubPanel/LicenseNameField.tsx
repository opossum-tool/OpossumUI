// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import NotesIcon from '@mui/icons-material/Notes';
import { Badge, ToggleButton } from '@mui/material';
import MuiBox from '@mui/material/Box';

import { LicenseSubPanelAutocomplete } from './LicenseSubPanelAutocomplete';

interface LicenseNameFieldProps extends React.ComponentProps<
  typeof LicenseSubPanelAutocomplete
> {
  showLicenseText: boolean;
  onToggleLicenseText: () => void;
}

export function LicenseNameField({
  licenseText,
  showLicenseText,
  onToggleLicenseText,
  ...autocompleteProps
}: LicenseNameFieldProps) {
  return (
    <MuiBox
      sx={{
        display: 'flex',
        alignItems: 'start',
        gap: '8px',
      }}
    >
      <LicenseSubPanelAutocomplete
        licenseText={licenseText}
        {...autocompleteProps}
      />
      <ToggleButton
        value={'license-text'}
        selected={showLicenseText}
        onChange={onToggleLicenseText}
        size={'small'}
        aria-label={'license-text-toggle-button'}
        aria-expanded={showLicenseText}
      >
        <Badge
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          color={'info'}
          variant={'dot'}
          invisible={!licenseText}
        >
          <NotesIcon />
        </Badge>
      </ToggleButton>
    </MuiBox>
  );
}
