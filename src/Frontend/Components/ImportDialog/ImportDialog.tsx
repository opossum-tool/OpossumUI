// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTypography from '@mui/material/Typography';
import { useMemo, useState } from 'react';

import { FileFormatInfo } from '../../../shared/shared-types';
import { getDotOpossumFilePath } from '../../../shared/write-file';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { FilePathInput } from '../FilePathInput/FilePathInput';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

enum FilePathValidity {
  VALID,
  NULL_VALUE,
  EMPTY_STRING,
  WRONG_EXTENSION,
  PATH_DOESNT_EXIST,
}

const explanationTextLine1 =
  'OpossumUI will convert the selected file into a new opossum file.';

const explanationTextLine2 =
  'All changes made to the project in OpossumUI will be saved in this opossum file.';

interface ImportDialogProps {
  fileFormat: FileFormatInfo;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({ fileFormat }) => {
  const dispatch = useAppDispatch();

  function onCancel(): void {
    dispatch(closePopup());
  }

  async function onConfirm(): Promise<void> {
    if (inputFilePath && opossumFilePath) {
      const success = await window.electronAPI.importFileConvertAndLoad(
        inputFilePath,
        opossumFilePath,
      );

      if (success) {
        dispatch(closePopup());
      } else {
        checkPathsOnFS(inputFilePath, opossumFilePath);
      }
    }
  }

  const [inputFilePath, setInputFilePath] = useState<string | null>(null);
  const [opossumFilePath, setOpossumFilePath] = useState<string | null>(null);
  const [opossumFilePathEdited, setOpossumFilePathEdited] =
    useState<boolean>(false);

  const [inputFilePathExists, setInputFilePathExists] = useState<boolean>(true);
  const [opossumFileDirectoryExists, setOpossumFileDirectoryExists] =
    useState<boolean>(true);
  const [opossumFileAlreadyExists, setOpossumFileAlreadyExists] =
    useState<boolean>(false);

  // updates from the button are not processed correctly if value starts at null
  const displayedInputFilePath = inputFilePath || '';
  const displayedOpossumFilePath = opossumFilePath || '';

  function validateFilePath(
    filePath: string | null,
    expectedExtensions: Array<string>,
    filePathExists: boolean,
  ): FilePathValidity {
    if (filePath === null) {
      return FilePathValidity.NULL_VALUE;
    } else if (!filePath?.trim()) {
      return FilePathValidity.EMPTY_STRING;
    } else if (!filePathExists) {
      return FilePathValidity.PATH_DOESNT_EXIST;
    } else if (
      !expectedExtensions.some((extension) =>
        filePath.endsWith(`.${extension}`),
      )
    ) {
      return FilePathValidity.WRONG_EXTENSION;
    }

    return FilePathValidity.VALID;
  }

  const inputFilePathValidity = validateFilePath(
    inputFilePath,
    fileFormat[1],
    inputFilePathExists,
  );

  const opossumFilePathValidity = validateFilePath(
    opossumFilePath,
    ['opossum'],
    opossumFileDirectoryExists,
  );

  const inputFilePathIsValid = inputFilePathValidity === FilePathValidity.VALID;

  const opossumFilePathIsValid =
    opossumFilePathValidity === FilePathValidity.VALID;

  const inputFilePathErrorMessage = useMemo(() => {
    switch (inputFilePathValidity) {
      case FilePathValidity.EMPTY_STRING:
        return 'No file selected';
      case FilePathValidity.WRONG_EXTENSION:
        return `Invalid file extension, should be ${fileFormat[1].map((ext) => `.${ext}`).join(' or ')}`;
      case FilePathValidity.PATH_DOESNT_EXIST:
        return 'The specified file does not exist';
      default:
        return null;
    }
  }, [inputFilePathValidity, fileFormat]);

  const opossumFilePathErrorMessage = useMemo(() => {
    switch (opossumFilePathValidity) {
      case FilePathValidity.EMPTY_STRING:
        return 'No save location selected';
      case FilePathValidity.WRONG_EXTENSION:
        return 'File extension has to be .opossum';
      case FilePathValidity.PATH_DOESNT_EXIST:
        return 'The path contains a non-existent directory';
      default:
        return null;
    }
  }, [opossumFilePathValidity]);

  const opossumFilePathWarnMessage = opossumFileAlreadyExists
    ? 'Warning: A file already exists at this location. If you continue, the existing file will be overwritten!'
    : null;

  function updateInputFilePath(filePath: string) {
    setInputFilePath(filePath);
    if (
      // Setting the opossum file path even though the current input file doesn't exist is fine
      validateFilePath(filePath, fileFormat[1], true) ===
        FilePathValidity.VALID &&
      !opossumFilePathEdited
    ) {
      const derivedOpossumFilePath = getDotOpossumFilePath(
        filePath,
        fileFormat[1],
      );
      checkPathsOnFS(filePath, derivedOpossumFilePath);
      setOpossumFilePath(derivedOpossumFilePath);
    } else {
      checkPathsOnFS(filePath, opossumFilePath);
    }
  }

  function updateOpossumFilePath(filePath: string) {
    checkPathsOnFS(inputFilePath, filePath);
    setOpossumFilePath(filePath);
  }

  function editOpossumFilePath(filePath: string) {
    updateOpossumFilePath(filePath);
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

  function selectOpossumFilePath(): void {
    const defaultPath = opossumFilePath || 'imported.opossum';
    window.electronAPI.importFileSelectSaveLocation(defaultPath).then(
      (filePath) => {
        if (filePath) {
          editOpossumFilePath(filePath);
        }
      },
      () => {},
    );
  }

  function checkPathsOnFS(
    inputFilePath: string | null,
    opossumFilePath: string | null,
  ): void {
    window.electronAPI
      .importFileValidatePaths(inputFilePath ?? '', opossumFilePath ?? '')
      .then(
        (reply) => {
          if (reply) {
            const [
              inputFilePathExists,
              opossumFileDirectoryExists,
              opossumFileAlreadyExists,
            ] = reply;
            setInputFilePathExists(inputFilePathExists);
            setOpossumFileDirectoryExists(opossumFileDirectoryExists);
            setOpossumFileAlreadyExists(opossumFileAlreadyExists);
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
          <MuiTypography>{explanationTextLine1}</MuiTypography>
          <MuiTypography sx={{ mb: '10px' }}>
            {explanationTextLine2}
          </MuiTypography>
          <FilePathInput
            label={'File to import'}
            displayedFilePath={displayedInputFilePath}
            onEdit={updateInputFilePath}
            onButtonClick={selectInputFilePath}
            errorMessage={inputFilePathErrorMessage}
          />
          <FilePathInput
            label={'Opossum file save location'}
            displayedFilePath={displayedOpossumFilePath}
            onEdit={editOpossumFilePath}
            onButtonClick={selectOpossumFilePath}
            errorMessage={opossumFilePathErrorMessage}
            warnMessage={opossumFilePathWarnMessage}
          />
        </div>
      }
      isOpen={true}
      leftButtonConfig={{
        onClick: onConfirm,
        buttonText: 'Import',
        disabled: !inputFilePathIsValid || !opossumFilePathIsValid,
      }}
      rightButtonConfig={{
        onClick: onCancel,
        buttonText: 'Cancel',
        color: 'secondary',
      }}
    />
  );
};
