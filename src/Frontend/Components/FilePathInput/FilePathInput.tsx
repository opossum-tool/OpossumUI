// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Folder } from '@mui/icons-material';
import { FormControl, FormHelperText, IconButton } from '@mui/material';
import MuiTextField from '@mui/material/TextField';
import MuiBox from '@mui/system/Box';

interface FilePathInputProps {
  label: string;
  displayedFilePath: string;
  onEdit: (filePath: string) => void;
  onButtonClick: () => void;
  errorMessage: string | null;
}

export const FilePathInput: React.FC<FilePathInputProps> = (props) => {
  return (
    <FormControl sx={{ display: 'flex', flexDirection: 'column' }}>
      <MuiBox sx={{ display: 'flex', alignItems: 'center', pt: '10px' }}>
        <MuiTextField
          label={props.label}
          value={props.displayedFilePath}
          error={props.errorMessage !== null}
          onChange={(event) => props.onEdit(event.target.value)}
          sx={{ width: 600 }}
        />
        <IconButton
          type="button"
          sx={{ p: '10px', ml: '10px' }}
          onClick={props.onButtonClick}
          size="large"
        >
          <Folder fontSize="inherit" />
        </IconButton>
      </MuiBox>
      <FormHelperText error={true}>{props.errorMessage ?? ' '}</FormHelperText>
    </FormControl>
  );
};
