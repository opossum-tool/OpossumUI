// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CopyrightIcon from '@mui/icons-material/Copyright';

import { text } from '../../../../shared/text';
import { baseIcon, OpossumColors } from '../../../shared-styles';
import { Autocomplete } from '../../Autocomplete/Autocomplete';

interface Props {
  licenses: Array<string>;
  selectedLicense: string;
  setSelectedLicense: (license: string | null) => void;
}

export const LicenseAutocomplete: React.FC<Props> = ({
  licenses,
  selectedLicense,
  setSelectedLicense,
}) => {
  return (
    <Autocomplete<string, false, false, true>
      sx={{ height: '38px' }}
      background={'transparent'}
      variant={'filled'}
      hidePopupIndicator={!!selectedLicense}
      placeholder={text.packageLists.selectLicense}
      options={licenses}
      optionText={{
        sx: {
          background: OpossumColors.lightestBlue,
          '&:hover': {
            background: OpossumColors.lightestBlueOnHover,
          },
        },
        primary: (option) => option,
      }}
      startAdornment={
        <CopyrightIcon sx={{ ...baseIcon, color: OpossumColors.green }} />
      }
      value={selectedLicense || null}
      onChange={(_, license) => {
        setSelectedLicense(license);
      }}
      filterSelectedOptions
      aria-label={'license names'}
    />
  );
};
