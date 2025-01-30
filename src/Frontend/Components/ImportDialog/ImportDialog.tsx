// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTypography from '@mui/material/Typography';
import { useEffect, useMemo, useState } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { FileFormatInfo, FilePathValidity } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { getDotOpossumFilePath } from '../../../shared/write-file';
import {
  LoggingListener,
  ShowImportDialogListener,
  useIpcRenderer,
} from '../../util/use-ipc-renderer';
import { FilePathInput } from '../FilePathInput/FilePathInput';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { Spinner } from '../Spinner/Spinner';

export const ImportDialog: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [fileFormat, setFileFormat] = useState<FileFormatInfo>({
    name: '',
    extensions: [],
  });

  function resetState() {
    setInputFilePath('');
    setOpossumFilePath('');
    setOpossumFilePathEdited(false);
    setInputFilePathValidity(FilePathValidity.EMPTY_STRING);
    setOpossumFilePathValidity(FilePathValidity.EMPTY_STRING);
    setShowInputFilePathErrors(false);
    setShowOpossumFilePathErrors(false);
    setProcessInfo('');
  }

  useIpcRenderer<ShowImportDialogListener>(
    AllowedFrontendChannels.ImportFileShowDialog,
    (_, fileFormat) => {
      resetState();
      setFileFormat(fileFormat);
      setIsOpen(true);
    },
    [],
  );

  const [inputFilePath, setInputFilePath] = useState<string>('');
  const [opossumFilePath, setOpossumFilePath] = useState<string>('');
  const [opossumFilePathEdited, setOpossumFilePathEdited] =
    useState<boolean>(false);

  const [inputFilePathValidity, setInputFilePathValidity] =
    useState<FilePathValidity>(FilePathValidity.EMPTY_STRING);
  const [opossumFilePathValidity, setOpossumFilePathValidity] =
    useState<FilePathValidity>(FilePathValidity.EMPTY_STRING);

  const inputFilePathIsValid = inputFilePathValidity === FilePathValidity.VALID;
  const opossumFilePathIsValid =
    opossumFilePathValidity === FilePathValidity.VALID ||
    opossumFilePathValidity === FilePathValidity.OVERWRITE_WARNING;

  const [showInputFilePathErrors, setShowInputFilePathErrors] =
    useState<boolean>(false);
  const [showOpossumFilePathErrors, setShowOpossumFilePathErrors] =
    useState<boolean>(false);

  const [processInfo, setProcessInfo] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useIpcRenderer<LoggingListener>(
    AllowedFrontendChannels.Logging,
    (_, log) => setProcessInfo(log.message),
    [],
  );

  function validateFilePaths(): void {
    window.electronAPI
      .importFileValidatePaths(
        inputFilePath,
        fileFormat.extensions,
        opossumFilePath,
      )
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
        return `Invalid file extension, should be ${fileFormat.extensions.map((ext) => `.${ext}`).join(' or ')}`;
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
        fileFormat.extensions,
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

  function onCancel(): void {
    setIsOpen(false);
  }

  async function onConfirm(): Promise<void> {
    setIsLoading(true);

    setShowInputFilePathErrors(true);
    setShowOpossumFilePathErrors(true);

    if (inputFilePathIsValid && opossumFilePathIsValid) {
      const success = await window.electronAPI.importFileConvertAndLoad(
        inputFilePath,
        opossumFilePath,
      );

      if (success) {
        setIsOpen(false);
      } else {
        validateFilePaths();
      }
    }
    setIsLoading(false);
    setProcessInfo('');
  }

  return (
    <NotificationPopup
      header={text.importDialog.title(fileFormat)}
      content={
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <MuiTypography>{text.importDialog.explanationText[0]}</MuiTypography>
          <MuiTypography sx={{ marginBottom: '10px' }}>
            {text.importDialog.explanationText[1]}
          </MuiTypography>
          <FilePathInput
            label={text.importDialog.inputFilePath.textFieldLabel(fileFormat)}
            text={inputFilePath}
            buttonTooltip={text.importDialog.inputFilePath.buttonTooltip}
            onEdit={updateInputFilePath}
            onBlur={() => setShowInputFilePathErrors(true)}
            onButtonClick={selectInputFilePath}
            errorMessage={
              showInputFilePathErrors ? inputFilePathErrorMessage : null
            }
          />
          <FilePathInput
            label={text.importDialog.opossumFilePath.textFieldLabel}
            text={opossumFilePath}
            buttonTooltip={text.importDialog.opossumFilePath.buttonTooltip}
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
      isOpen={isOpen}
      customAction={
        isLoading ? (
          <>
            <Spinner sx={{ marginLeft: '20px' }} />
            <MuiTypography
              sx={{
                width: '430px',
                marginLeft: '10px',
                marginRight: '10px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {processInfo}
            </MuiTypography>
          </>
        ) : undefined
      }
      leftButtonConfig={{
        onClick: onConfirm,
        buttonText: text.buttons.import,
        disabled: isLoading,
      }}
      rightButtonConfig={{
        onClick: onCancel,
        buttonText: text.buttons.cancel,
        color: 'secondary',
        disabled: isLoading,
      }}
      aria-label={'import dialog'}
    />
  );
};
