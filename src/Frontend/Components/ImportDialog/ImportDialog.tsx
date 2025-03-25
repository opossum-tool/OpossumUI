// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTypography from '@mui/material/Typography';
import { useState } from 'react';

import { AllowedFrontendChannels } from '../../../shared/ipc-channels';
import { FileFormatInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { getDotOpossumFilePath } from '../../../shared/write-file';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { useDataLoadEvents } from '../../util/use-data-load-events';
import { IsLoadingListener, useIpcRenderer } from '../../util/use-ipc-renderer';
import { DialogLogDisplay } from '../DialogLogDisplay/DialogLogDisplay.style';
import { FilePathInput } from '../FilePathInput/FilePathInput';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

export interface ImportDialogProps {
  fileFormat: FileFormatInfo;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({ fileFormat }) => {
  const dispatch = useAppDispatch();

  const [inputFilePath, setInputFilePath] = useState<string>('');
  const [opossumFilePath, setOpossumFilePath] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);

  useIpcRenderer<IsLoadingListener>(
    AllowedFrontendChannels.FileLoading,
    (_, { isLoading }) => setIsLoading(isLoading),
    [],
  );

  const [dataLoadEvents, reset] = useDataLoadEvents();

  async function selectInputFilePath(): Promise<void> {
    const filePath = await window.electronAPI.selectFile(fileFormat);

    if (filePath) {
      setInputFilePath(filePath);
      reset();
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
      reset();
    }
  }

  function onCancel(): void {
    dispatch(closePopup());
  }

  async function onConfirm(): Promise<void> {
    const success = await window.electronAPI.importFileConvertAndLoad(
      inputFilePath,
      fileFormat.fileType,
      opossumFilePath,
    );

    if (success) {
      dispatch(closePopup());
    }
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
      customAction={
        dataLoadEvents.length ? (
          <DialogLogDisplay
            log={dataLoadEvents[dataLoadEvents.length - 1]}
            isInProgress={isLoading}
            showDate={false}
            useEllipsis={true}
            sx={{
              marginLeft: '10px',
            }}
          />
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
