// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Folder } from '@mui/icons-material';
import { FormControl } from '@mui/material';
import MuiBox from '@mui/system/Box';

import { IconButton } from '../IconButton/IconButton';
import { TextBox } from '../TextBox/TextBox';

interface FilePathInputProps {
  label: string;
  text: string;
  buttonTooltip: string;
  onButtonClick: () => void;
}

export const FilePathInput: React.FC<FilePathInputProps> = (props) => {
  return (
    <FormControl
      sx={{ display: 'flex', flexDirection: 'column', marginTop: '10px' }}
    >
      <MuiBox
        sx={{ display: 'flex', alignItems: 'center', paddingTop: '10px' }}
      >
        <TextBox
          title={props.label}
          text={props.text}
          sx={{ width: 600, marginRight: '10px' }}
        />
        <IconButton
          icon={<Folder fontSize="medium" />}
          onClick={props.onButtonClick}
          tooltipTitle={props.buttonTooltip}
        />
      </MuiBox>
    </FormControl>
  );
};
