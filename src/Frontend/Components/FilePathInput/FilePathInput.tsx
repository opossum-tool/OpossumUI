// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { AttachFile } from '@mui/icons-material';
import { TooltipProps } from '@mui/material/Tooltip';
import MuiTypography from '@mui/material/Typography';

import { baseIcon } from '../../shared-styles';
import { TextBox, TextBoxCustomInputProps } from '../TextBox/TextBox';

const CustomInput: React.FC<TextBoxCustomInputProps> = (props) => {
  return (
    <MuiTypography
      sx={{ ...props.sx, whiteSpace: 'nowrap', userSelect: 'none' }}
      aria-label={props['aria-label']}
    >
      {props.value}
    </MuiTypography>
  );
};

interface FilePathInputProps {
  label: string;
  text: string;
  onClick: () => void;
  tooltipProps?: Partial<TooltipProps>;
}

export const FilePathInput: React.FC<FilePathInputProps> = (props) => {
  return (
    <TextBox
      title={props.label}
      text={props.text}
      onClick={props.onClick}
      startIcon={<AttachFile sx={baseIcon} />}
      cursor={'pointer'}
      showTooltip={true}
      tooltipProps={props.tooltipProps}
      // using a custom input component allows us to disable a lot of TextField
      // behavior (e.g. horizontal text scrolling) that we don't want here
      inputComponent={CustomInput}
      sx={{ marginTop: '20px' }}
    />
  );
};
