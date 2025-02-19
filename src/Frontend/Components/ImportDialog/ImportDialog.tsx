// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTypography from '@mui/material/Typography';
import { useState } from 'react';

import { FileFormatInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { getDotOpossumFilePath } from '../../../shared/write-file';
import {
  clearLogMessage,
  closePopup,
} from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { FilePathInput } from '../FilePathInput/FilePathInput';
import { LogDisplayForDialog } from '../LogDisplay/LogDisplayForDialog';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export interface ImportDialogProps {
  fileFormat: FileFormatInfo;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({ fileFormat }) => {
  const dispatch = useAppDispatch();

  const [inputFilePath, setInputFilePath] = useState<string>('');
  const [opossumFilePath, setOpossumFilePath] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function selectInputFilePath(): Promise<void> {
    const filePath = await window.electronAPI.selectFile(fileFormat);

    if (filePath) {
      setInputFilePath(filePath);
      dispatch(clearLogMessage());
    }
  }

  async function selectOpossumFilePath(): Promise<void> {
    let defaultPath = 'imported.opossum';
    const derivedPath = getDotOpossumFilePath(
      inputFilePath,
      fileFormat.extensions,
    );

    if (opossumFilePath) {
      defaultPath = opossumFilePath;
    } else if (derivedPath && derivedPath !== '.opossum') {
      defaultPath = derivedPath;
    }

    const filePath =
      await window.electronAPI.importFileSelectSaveLocation(defaultPath);

    if (filePath) {
      setOpossumFilePath(filePath);
      dispatch(clearLogMessage());
    }
  }

  function onCancel(): void {
    dispatch(closePopup());
  }

  async function onConfirm(): Promise<void> {
    setIsLoading(true);

    const success = await window.electronAPI.importFileConvertAndLoad(
      inputFilePath,
      fileFormat.fileType,
      opossumFilePath,
    );

    if (success) {
      dispatch(closePopup());
    }

    // NOTE: without a tiny delay, isLoading is sometimes set to false before the
    // final log message is processed by LogDisplayForDialog, causing it to be
    // missed. This seems to only happen when running the app with yarn start
    await new Promise((resolve) => setTimeout(resolve, 1));
    setIsLoading(false);
  }

  return (
    <NotificationPopup
      header={text.importDialog.title(fileFormat)}
      width={'80vw'}
      minWidth={'300px'}
      maxWidth={'700px'}
      content={
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <MuiTypography>{text.importDialog.explanationText[0]}</MuiTypography>
          <MuiTypography sx={{ marginBottom: '10px' }}>
            {text.importDialog.explanationText[1]}
          </MuiTypography>
          <FilePathInput
            label={text.importDialog.inputFilePath.textFieldLabel(
              fileFormat,
              !!inputFilePath,
            )}
            text={inputFilePath}
            onClick={selectInputFilePath}
            tooltipProps={{ placement: 'top' }}
          />
          <FilePathInput
            label={text.importDialog.opossumFilePath.textFieldLabel(
              !!opossumFilePath,
            )}
            text={opossumFilePath}
            onClick={selectOpossumFilePath}
          />
        </div>
      }
      isOpen={true}
      customAction={<LogDisplayForDialog isLoading={isLoading} />}
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
