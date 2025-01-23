// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Folder } from '@mui/icons-material';
import { FormControl, FormHelperText, IconButton } from '@mui/material';
import MuiTextField from '@mui/material/TextField';
import MuiBox from '@mui/system/Box';
import { useState } from 'react';

import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

interface ImportDialogProps {
  fileFormat: [string, Array<string>];
}

export const ImportDialog: React.FC<ImportDialogProps> = ({ fileFormat }) => {
  const dispatch = useAppDispatch();

  function onCancel(): void {
    dispatch(closePopup());
  }

  function onConfirm(): void {
    console.log(`Selected input file: ${filePath}`);

    dispatch(closePopup());
  }

  const [filePath, setFilePath] = useState<string | null>(null);

  // updates from the button are not processed correctly if value starts at null
  const displayedFilePath = filePath || '';

  function updateFilePath(filePath: string) {
    setFilePath(filePath);
  }

  function onButtonClick(): void {
    window.electronAPI.importFileSelectInput(fileFormat).then(
      (filePath) => {
        if (filePath) {
          updateFilePath(filePath);
        }
      },
      () => {},
    );
  }

  // TODO: extract file input into reusable component FilePathInput
  return (
    <NotificationPopup
      header={`Import ${fileFormat[0]}`}
      content={
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <FormControl sx={{ display: 'flex', flexDirection: 'column' }}>
            <MuiBox sx={{ display: 'flex', alignItems: 'center', pt: '10px' }}>
              <MuiTextField
                label={'Path to input file'}
                value={displayedFilePath}
                error={filePath === ''}
                onChange={(event) => updateFilePath(event.target.value)}
                sx={{ width: 600 }}
              />
              <IconButton
                type="button"
                sx={{ p: '10px', ml: '10px' }}
                onClick={onButtonClick}
                size="large"
              >
                <Folder fontSize="inherit" />
              </IconButton>
            </MuiBox>
            <FormHelperText>
              {filePath === '' ? 'Path is empty' : ' '}
            </FormHelperText>
          </FormControl>
        </div>
      }
      isOpen={true}
      leftButtonConfig={{
        onClick: onCancel,
        buttonText: 'Cancel',
      }}
      rightButtonConfig={{
        onClick: onConfirm,
        buttonText: 'Ok',
      }}
    />
  );
};
