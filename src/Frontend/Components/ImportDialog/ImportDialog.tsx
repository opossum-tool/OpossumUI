// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';

import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { FilePathInput } from '../FilePathInput/FilePathInput';
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
    if (filePath) {
      window.electronAPI.importFileConvertAndLoad(filePath);

      dispatch(closePopup());
    }
  }

  const [filePath, setFilePath] = useState<string | null>(null);

  // updates from the button are not processed correctly if value starts at null
  const displayedFilePath = filePath || '';

  const filePathIsInvalid = !filePath?.trim();

  const showError = filePathIsInvalid && filePath !== null;

  const errorMessage = showError ? 'Invalid file path' : null;

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

  return (
    <NotificationPopup
      header={`Import ${fileFormat[0]}`}
      content={
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <FilePathInput
            displayedFilePath={displayedFilePath}
            updateFilePath={updateFilePath}
            onButtonClick={onButtonClick}
            errorMessage={errorMessage}
          />
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
        disabled: filePathIsInvalid,
      }}
    />
  );
};
