// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';

import { getDotOpossumFilePath } from '../../../shared/write-file';
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
    if (inputFilePath) {
      window.electronAPI.importFileConvertAndLoad(inputFilePath);

      dispatch(closePopup());
    }
  }

  const [inputFilePath, setInputFilePath] = useState<string | null>(null);
  const [opossumFilePath, setOpossumFilePath] = useState<string | null>(null);
  const [opossumFilePathEdited, setOpossumFilePathEdited] =
    useState<boolean>(false);

  // updates from the button are not processed correctly if value starts at null
  const displayedInputFilePath = inputFilePath || '';
  const displayedOpossumFilePath = opossumFilePath || '';

  const inputFilePathIsInvalid = !inputFilePath?.trim();
  const opossumFilePathIsInvalid = !opossumFilePath?.trim();

  const inputFilePathErrorMessage =
    inputFilePathIsInvalid && inputFilePath !== null
      ? 'Invalid file path'
      : null;

  const opossumFilePathErrorMessage =
    opossumFilePathIsInvalid && opossumFilePath !== null
      ? 'Invalid file path'
      : null;

  function updateInputFilePath(filePath: string) {
    setInputFilePath(filePath);
    if (
      fileFormat[1].some((extension) => filePath.endsWith(extension)) &&
      !opossumFilePathEdited
    ) {
      const opossumFilePath = getDotOpossumFilePath(filePath, fileFormat[1]);
      setOpossumFilePath(opossumFilePath);
    }
  }

  function editOpossumFilePath(filePath: string) {
    setOpossumFilePath(filePath);
    if (filePath) {
      setOpossumFilePathEdited(true);
    } else {
      setOpossumFilePathEdited(false);
    }
  }

  function selectInputFilePath(): void {
    window.electronAPI.importFileSelectInput(fileFormat).then(
      (filePath) => {
        if (filePath) {
          updateInputFilePath(filePath);
        }
      },
      () => {},
    );
  }

  function selectOpossumFilePath(): void {}

  return (
    <NotificationPopup
      header={`Import ${fileFormat[0]}`}
      content={
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <FilePathInput
            label={'Location of input file'}
            displayedFilePath={displayedInputFilePath}
            onEdit={updateInputFilePath}
            onButtonClick={selectInputFilePath}
            errorMessage={inputFilePathErrorMessage}
          />
          <FilePathInput
            label={'Location of newly created opossum file'}
            displayedFilePath={displayedOpossumFilePath}
            onEdit={editOpossumFilePath}
            onButtonClick={selectOpossumFilePath}
            errorMessage={opossumFilePathErrorMessage}
          />
        </div>
      }
      isOpen={true}
      leftButtonConfig={{
        onClick: onConfirm,
        buttonText: 'Import',
        disabled: inputFilePathIsInvalid || opossumFilePathIsInvalid,
      }}
      rightButtonConfig={{
        onClick: onCancel,
        buttonText: 'Cancel',
        color: 'secondary',
      }}
    />
  );
};
