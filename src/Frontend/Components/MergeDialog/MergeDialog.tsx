// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTypography from '@mui/material/Typography';
import { useState } from 'react';

import { FileFormatInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import {
  clearLogMessage,
  closePopup,
} from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { FilePathInput } from '../FilePathInput/FilePathInput';
import { LogDisplayForDialog } from '../LogDisplay/LogDisplayForDialog';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export interface MergeDialogProps {
  fileFormat: FileFormatInfo;
}

export const MergeDialog: React.FC<MergeDialogProps> = ({ fileFormat }) => {
  const dispatch = useAppDispatch();

  const [inputFilePath, setInputFilePath] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);

  function selectInputFilePath(): void {
    window.electronAPI.selectFile(fileFormat).then(
      (filePath) => {
        if (filePath) {
          setInputFilePath(filePath);
          dispatch(clearLogMessage());
        }
      },
      () => {},
    );
  }

  function onCancel(): void {
    dispatch(closePopup());
  }

  async function onConfirm(): Promise<void> {
    setIsLoading(true);

    const success = await window.electronAPI.mergeFileAndLoad(
      inputFilePath,
      fileFormat.fileType,
    );

    if (success) {
      dispatch(closePopup());
    }

    setIsLoading(false);
  }

  return (
    <NotificationPopup
      header={text.mergeDialog.title(fileFormat)}
      width={'80vw'}
      minWidth={'300px'}
      maxWidth={'700px'}
      content={
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <MuiTypography>{text.mergeDialog.explanationText[0]}</MuiTypography>
          <MuiTypography sx={{ marginBottom: '10px' }}>
            {text.mergeDialog.explanationText[1]}
          </MuiTypography>
          <FilePathInput
            label={text.mergeDialog.inputFilePath.textFieldLabel(
              fileFormat,
              !!inputFilePath,
            )}
            text={inputFilePath}
            onClick={selectInputFilePath}
          />
        </div>
      }
      isOpen={true}
      customAction={<LogDisplayForDialog isLoading={isLoading} />}
      leftButtonConfig={{
        onClick: onConfirm,
        buttonText: text.buttons.merge,
        disabled: isLoading,
      }}
      rightButtonConfig={{
        onClick: onCancel,
        buttonText: text.buttons.cancel,
        color: 'secondary',
        disabled: isLoading,
      }}
      aria-label={'merge dialog'}
    />
  );
};
