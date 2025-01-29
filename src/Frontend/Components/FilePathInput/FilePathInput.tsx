// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Folder } from '@mui/icons-material';
import { FormControl, FormHelperText } from '@mui/material';
import MuiBox from '@mui/system/Box';

import { IconButton } from '../IconButton/IconButton';
import { TextBox } from '../TextBox/TextBox';

interface FilePathInputProps {
  label: string;
  text: string;
  buttonToolTip: string;
  onEdit: (filePath: string) => void;
  onBlur?: () => void;
  onButtonClick: () => void;
  errorMessage: string | null;
  warnMessage?: string | null;
}

export const FilePathInput: React.FC<FilePathInputProps> = (props) => {
  return (
    <FormControl sx={{ display: 'flex', flexDirection: 'column' }}>
      <MuiBox sx={{ display: 'flex', alignItems: 'center', pt: '10px' }}>
        <TextBox
          title={props.label}
          text={props.text}
          error={props.errorMessage !== null}
          handleChange={(event) => props.onEdit(event.target.value)}
          onBlur={props.onBlur}
          sx={{ width: 600, mr: '10px' }}
        />
        <IconButton
          icon={<Folder fontSize="medium" />}
          onClick={props.onButtonClick}
          tooltipTitle={props.buttonToolTip}
        />
      </MuiBox>
      <FormHelperText aria-label={'file path helper text'} error={true}>
        {props.errorMessage ?? props.warnMessage ?? ' '}
      </FormHelperText>
    </FormControl>
  );
};
