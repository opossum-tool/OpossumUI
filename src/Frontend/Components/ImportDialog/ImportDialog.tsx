// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { useState } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { FileFormatInfo, Log } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { getDotOpossumFilePath } from '../../../shared/write-file';
import { LoggingListener, useIpcRenderer } from '../../util/use-ipc-renderer';
import { FilePathInput } from '../FilePathInput/FilePathInput';
import { LogDisplay } from '../LogDisplay/LogDisplay';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export interface ImportDialogProps {
  fileFormat: FileFormatInfo;
  closeDialog: () => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
  fileFormat,
  closeDialog,
}) => {
  const [inputFilePath, setInputFilePath] = useState<string>('');
  const [opossumFilePath, setOpossumFilePath] = useState<string>('');

  const [currentLog, setCurrentLog] = useState<Log | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useIpcRenderer<LoggingListener>(
    AllowedFrontendChannels.Logging,
    (_, log) => setCurrentLog(log),
    [],
  );

  function selectInputFilePath(): void {
    window.electronAPI.importFileSelectInput(fileFormat).then(
      (filePath) => {
        if (filePath) {
          setInputFilePath(filePath);
          setCurrentLog(null);
        }
      },
      () => {},
    );
  }

  function selectOpossumFilePath(): void {
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

    window.electronAPI.importFileSelectSaveLocation(defaultPath).then(
      (filePath) => {
        if (filePath) {
          setOpossumFilePath(filePath);
          setCurrentLog(null);
        }
      },
      () => {},
    );
  }

  function onCancel(): void {
    closeDialog();
  }

  async function onConfirm(): Promise<void> {
    setIsLoading(true);

    const success = await window.electronAPI.importFileConvertAndLoad(
      inputFilePath,
      fileFormat.fileType,
      opossumFilePath,
    );

    if (success) {
      closeDialog();
    }

    setIsLoading(false);
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
      customAction={
        currentLog ? (
          <MuiBox
            sx={{
              display: 'flex',
              justifyContent: 'start',
              columnGap: '4px',
              width: '440px',
            }}
          >
            <LogDisplay
              log={currentLog}
              isInProgress={isLoading}
              showDate={false}
              useEllipsis={true}
            />
          </MuiBox>
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
