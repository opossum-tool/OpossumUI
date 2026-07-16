// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import CopyrightIcon from '@mui/icons-material/Copyright';
import type { Ref } from 'react';

import { text } from '../../../../shared/text';
import { baseIcon, OpossumColors } from '../../../shared-styles';
import { ValueFilterAutocomplete } from '../ValueFilterAutocomplete/ValueFilterAutocomplete';

interface Props {
  inputRef?: Ref<HTMLInputElement>;
  licenses: Array<string>;
  selectedLicense: string;
  setSelectedLicense: (license: string | null) => void;
}

export const LicenseAutocomplete = ({
  inputRef,
  licenses,
  selectedLicense,
  setSelectedLicense,
}: Props) => {
  return (
    <ValueFilterAutocomplete
      ariaLabel={'license names'}
      disabled={licenses.length === 0 && !selectedLicense}
      options={licenses}
      placeholder={text.packageLists.selectLicense}
      startAdornment={
        <CopyrightIcon sx={{ ...baseIcon, color: OpossumColors.green }} />
      }
      selectedValue={selectedLicense}
      setSelectedValue={setSelectedLicense}
      inputRef={inputRef}
    />
  );
};
