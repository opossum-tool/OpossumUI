// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AttachFileIcon from '@mui/icons-material/AttachFile';
import type { TooltipProps } from '@mui/material/Tooltip';
import MuiTypography from '@mui/material/Typography';

import { baseIcon } from '../../shared-styles';
import { TextBox, type TextBoxCustomInputProps } from '../TextBox/TextBox';

const CustomInput: React.FC<TextBoxCustomInputProps> = (props) => {
  return (
    <MuiTypography
      sx={{ ...props.sx, whiteSpace: 'nowrap', userSelect: 'none' }}
      aria-label={props['aria-label']}
      data-testid={props['data-testid']}
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
  disabled: boolean;
  testId?: string;
}

export const FilePathInput: React.FC<FilePathInputProps> = (props) => {
  const onActivate = (): void => {
    if (!props.disabled) {
      props.onClick();
    }
  };

  return (
    <TextBox
      rootDataTestId={props.testId}
      inputDataTestId={props.testId ? `${props.testId}-input` : undefined}
      title={props.label}
      text={props.text}
      onClick={props.disabled ? undefined : onActivate}
      startIcon={<AttachFileIcon sx={baseIcon} />}
      cursor={'pointer'}
      showTooltip={true}
      tooltipProps={props.tooltipProps}
      // using a custom input component allows us to disable a lot of TextField
      // behavior (e.g. horizontal text scrolling) that we don't want here
      inputComponent={CustomInput}
      disabled={props.disabled}
      sx={{ marginTop: '20px' }}
    />
  );
};
