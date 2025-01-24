// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { useMemo, useState } from 'react';

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
}

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

  function validateFilePath(
    filePath: string | null,
    expectedExtensions: Array<string>,
  ): FilePathValidity {
    if (filePath === null) {
      return FilePathValidity.NULL_VALUE;
    } else if (!filePath?.trim()) {
      return FilePathValidity.EMPTY_STRING;
    } else if (
      !expectedExtensions.some((extension) =>
        filePath.endsWith(`.${extension}`),
      )
    ) {
      return FilePathValidity.WRONG_EXTENSION;
    }

    return FilePathValidity.VALID;
  }

  const inputFilePathValidity = validateFilePath(inputFilePath, fileFormat[1]);

  const opossumFilePathValidity = validateFilePath(opossumFilePath, [
    'opossum',
  ]);

  const inputFilePathIsValid = inputFilePathValidity === FilePathValidity.VALID;

  const opossumFilePathIsValid =
    opossumFilePathValidity === FilePathValidity.VALID;

  const inputFilePathErrorMessage = useMemo(() => {
    switch (inputFilePathValidity) {
      case FilePathValidity.EMPTY_STRING:
        return 'No file selected';
      case FilePathValidity.WRONG_EXTENSION:
        return `Invalid file extension, should be ${fileFormat[1].map((ext) => `.${ext}`).join(' or ')}`;
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
      default:
        return null;
    }
  }, [opossumFilePathValidity]);

  function updateInputFilePath(filePath: string) {
    setInputFilePath(filePath);
    if (
      validateFilePath(filePath, fileFormat[1]) === FilePathValidity.VALID &&
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
          <FilePathInput
            label={'Input file'}
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
