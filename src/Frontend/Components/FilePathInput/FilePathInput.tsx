// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { AttachFile } from '@mui/icons-material';

import { clickableIcon } from '../../shared-styles';
import { TextBox } from '../TextBox/TextBox';

interface FilePathInputProps {
  label: string;
  text: string;
  onClick: () => void;
}

export const FilePathInput: React.FC<FilePathInputProps> = (props) => {
  return (
    <TextBox
      title={props.label}
      text={props.text}
      onClick={props.onClick}
      startIcon={<AttachFile sx={clickableIcon} />}
      readOnly={true}
      cursor={'pointer'}
      showTooltip={true}
      sx={{ width: 600, marginTop: '20px' }}
    />
  );
};
