// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTypography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';

import { FileFormatInfo, FilePathValidity } from '../../../shared/shared-types';
import { getDotOpossumFilePath } from '../../../shared/write-file';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { FilePathInput } from '../FilePathInput/FilePathInput';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

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
    setShowInputFilePathErrors(true);
    setShowOpossumFilePathErrors(true);

    if (inputFilePath && opossumFilePath) {
      const success = await window.electronAPI.importFileConvertAndLoad(
        inputFilePath,
        opossumFilePath,
      );

      if (success) {
        dispatch(closePopup());
      } else {
        validateFilePaths();
      }
    }
  }

  const [inputFilePath, setInputFilePath] = useState<string | null>(null);
  const [opossumFilePath, setOpossumFilePath] = useState<string | null>(null);
  const [opossumFilePathEdited, setOpossumFilePathEdited] =
    useState<boolean>(false);

  const [inputFilePathValidity, setInputFilePathValidity] =
    useState<FilePathValidity>(FilePathValidity.NULL_VALUE);
  const [opossumFilePathValidity, setOpossumFilePathValidity] =
    useState<FilePathValidity>(FilePathValidity.NULL_VALUE);

  const [showInputFilePathErrors, setShowInputFilePathErrors] =
    useState<boolean>(false);
  const [showOpossumFilePathErrors, setShowOpossumFilePathErrors] =
    useState<boolean>(false);

  // updates from the button are not processed correctly if value starts at null
  const displayedInputFilePath = inputFilePath || '';
  const displayedOpossumFilePath = opossumFilePath || '';

  function validateFilePaths(): void {
    window.electronAPI
      .importFileValidatePaths(inputFilePath, fileFormat[1], opossumFilePath)
      .then(
        (validationResult) => {
          if (validationResult) {
            setInputFilePathValidity(validationResult[0]);
            setOpossumFilePathValidity(validationResult[1]);
          } else {
            setInputFilePathValidity(FilePathValidity.VALIDATION_FAILED);
            setOpossumFilePathValidity(FilePathValidity.VALIDATION_FAILED);
          }
        },
        () => {},
      );
  }

  useEffect(validateFilePaths, [inputFilePath, fileFormat, opossumFilePath]);

  const inputFilePathErrorMessage = useMemo(() => {
    switch (inputFilePathValidity) {
      case FilePathValidity.EMPTY_STRING:
        return 'No file selected';
      case FilePathValidity.WRONG_EXTENSION:
        return `Invalid file extension, should be ${fileFormat[1].map((ext) => `.${ext}`).join(' or ')}`;
      case FilePathValidity.PATH_DOESNT_EXIST:
        return 'The specified file does not exist';
      case FilePathValidity.VALIDATION_FAILED:
        return 'Invalid file path';
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
      case FilePathValidity.VALIDATION_FAILED:
        return 'Invalid file path';
      default:
        return null;
    }
  }, [opossumFilePathValidity]);

  const opossumFilePathWarnMessage =
    opossumFilePathValidity === FilePathValidity.OVERWRITE_WARNING
      ? 'Warning: A file already exists at this location. If you continue, the existing file will be overwritten!'
      : null;

  function updateInputFilePath(filePath: string) {
    setInputFilePath(filePath);
    if (!opossumFilePathEdited) {
      const derivedOpossumFilePath = getDotOpossumFilePath(
        filePath,
        fileFormat[1],
      );
      setOpossumFilePath(derivedOpossumFilePath);
    }
  }

  function updateOpossumFilePath(filePath: string) {
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
            label={`File to import (${fileFormat[1].map((ext) => `.${ext}`).join('/')})`}
            displayedFilePath={displayedInputFilePath}
            buttonToolTip="Select file"
            onEdit={updateInputFilePath}
            onBlur={() => setShowInputFilePathErrors(true)}
            onButtonClick={selectInputFilePath}
            errorMessage={
              showInputFilePathErrors ? inputFilePathErrorMessage : null
            }
          />
          <FilePathInput
            label="Opossum file save location"
            displayedFilePath={displayedOpossumFilePath}
            buttonToolTip="Select save location"
            onEdit={editOpossumFilePath}
            onBlur={() => setShowOpossumFilePathErrors(true)}
            onButtonClick={selectOpossumFilePath}
            errorMessage={
              showOpossumFilePathErrors ? opossumFilePathErrorMessage : null
            }
            warnMessage={opossumFilePathWarnMessage}
          />
        </div>
      }
      isOpen={true}
      leftButtonConfig={{
        onClick: onConfirm,
        buttonText: 'Import',
      }}
      rightButtonConfig={{
        onClick: onCancel,
        buttonText: 'Cancel',
        color: 'secondary',
      }}
    />
  );
};
