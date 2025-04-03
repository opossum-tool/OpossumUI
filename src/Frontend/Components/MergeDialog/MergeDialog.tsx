// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTypography from '@mui/material/Typography';
import { useState } from 'react';

import { FileFormatInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { useProcessingStatusUpdated } from '../../util/use-processing-status-updated';
import { DialogLogDisplay } from '../DialogLogDisplay/DialogLogDisplay.style';
import { FilePathInput } from '../FilePathInput/FilePathInput';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

interface MergeDialogProps {
  fileFormat: FileFormatInfo;
}

export const MergeDialog: React.FC<MergeDialogProps> = ({ fileFormat }) => {
  const dispatch = useAppDispatch();

  const [inputFilePath, setInputFilePath] = useState<string>('');

  const {
    processingStatusUpdatedEvents,
    resetProcessingStatusEvents,
    processing,
  } = useProcessingStatusUpdated();

  async function selectInputFilePath(): Promise<void> {
    const filePath = await window.electronAPI.selectFile(fileFormat);

    if (filePath) {
      setInputFilePath(filePath);
      resetProcessingStatusEvents();
    }
  }

  function onCancel(): void {
    dispatch(closePopup());
  }

  async function onConfirm(): Promise<void> {
    const success = await window.electronAPI.mergeFileAndLoad(
      inputFilePath,
      fileFormat.fileType,
    );

    if (success) {
      dispatch(closePopup());
    }
  }

  return (
    <NotificationPopup
      header={text.mergeDialog.title(fileFormat)}
      width={'80vw'}
      minWidth={'300px'}
      maxWidth={'730px'}
      content={
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <MuiTypography>{text.mergeDialog.explanationText}</MuiTypography>
          <MuiTypography>{text.mergeDialog.warningText}</MuiTypography>
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
      customAction={
        processingStatusUpdatedEvents.length ? (
          <DialogLogDisplay
            log={
              processingStatusUpdatedEvents[
                processingStatusUpdatedEvents.length - 1
              ]
            }
            isInProgress={processing}
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
        buttonText: text.buttons.merge,
        disabled: processing,
      }}
      rightButtonConfig={{
        onClick: onCancel,
        buttonText: text.buttons.cancel,
        color: 'secondary',
        disabled: processing,
      }}
      aria-label={'merge dialog'}
    />
  );
};
