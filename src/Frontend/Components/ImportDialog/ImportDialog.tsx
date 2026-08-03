// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiFormControlLabel from '@mui/material/FormControlLabel';
import MuiSwitch from '@mui/material/Switch';
import MuiTypography from '@mui/material/Typography';
import { useState } from 'react';

import type { FileFormatInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { getDotOpossumFilePath } from '../../../shared/write-file-utils';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { useProcessingStatusUpdated } from '../../util/use-processing-status-updated';
import { DialogLogDisplay } from '../DialogLogDisplay/DialogLogDisplay.style';
import { FilePathInput } from '../FilePathInput/FilePathInput';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

interface ImportDialogProps {
  canImportIntoCurrentProject: boolean;
  fileFormat: FileFormatInfo;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
  canImportIntoCurrentProject,
  fileFormat,
}) => {
  const dispatch = useAppDispatch();

  const [inputFilePath, setInputFilePath] = useState<string>('');
  const [opossumFilePath, setOpossumFilePath] = useState<string>('');
  const [importInProgress, setImportInProgress] = useState<boolean>(false);
  const [importIntoCurrentProject, setImportIntoCurrentProject] = useState(
    canImportIntoCurrentProject,
  );

  const {
    processingStatusUpdatedEvents,
    resetProcessingStatusEvents,
    processing,
  } = useProcessingStatusUpdated();

  async function selectInputFilePath(): Promise<void> {
    if (importInProgress) {
      return;
    }

    const filePath = await window.electronAPI.selectFile(fileFormat);

    if (filePath) {
      setInputFilePath(filePath);
      resetProcessingStatusEvents();
    }
  }

  async function selectOpossumFilePath(): Promise<void> {
    if (importInProgress) {
      return;
    }

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

    const filePath = await window.electronAPI.selectSaveFile({
      defaultPath,
    });

    if (filePath) {
      setOpossumFilePath(filePath);
      resetProcessingStatusEvents();
    }
  }

  function onCancel(): void {
    dispatch(closePopup());
  }

  async function onConfirm(): Promise<void> {
    setImportInProgress(true);
    const success = importIntoCurrentProject
      ? await window.electronAPI.mergeFileAndLoad(
          inputFilePath,
          fileFormat.fileType,
        )
      : await window.electronAPI.importFileConvertAndLoad(
          inputFilePath,
          fileFormat.fileType,
          opossumFilePath,
        );

    if (success) {
      dispatch(closePopup());
    }
    setImportInProgress(false);
  }

  return (
    <NotificationPopup
      header={text.importDialog.title(fileFormat)}
      width={'80vw'}
      minWidth={'300px'}
      maxWidth={'700px'}
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
            sx={{ marginLeft: '10px' }}
          />
        ) : undefined
      }
      leftButtonConfig={{
        onClick: onConfirm,
        buttonText: text.buttons.import,
        disabled: processing,
      }}
      rightButtonConfig={{
        onClick: onCancel,
        buttonText: text.buttons.cancel,
        color: 'secondary',
        disabled: processing,
      }}
      aria-label={'import dialog'}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <MuiTypography>{text.importDialog.explanationText[0]}</MuiTypography>
        <MuiTypography sx={{ marginBottom: '10px' }}>
          {text.importDialog.explanationText[1]}
        </MuiTypography>
        {canImportIntoCurrentProject && (
          <MuiFormControlLabel
            control={
              <MuiSwitch
                checked={importIntoCurrentProject}
                onChange={(_, checked) => setImportIntoCurrentProject(checked)}
              />
            }
            label={text.importDialog.importIntoCurrentProject}
            sx={{ marginBottom: '10px' }}
          />
        )}
        {importIntoCurrentProject && (
          <MuiTypography sx={{ marginBottom: '10px' }}>
            {text.importDialog.currentProjectWarning}
          </MuiTypography>
        )}
        <FilePathInput
          label={
            inputFilePath
              ? text.importDialog.inputFilePath.label(fileFormat)
              : text.importDialog.inputFilePath.selectLabel(fileFormat)
          }
          text={inputFilePath}
          onClick={selectInputFilePath}
          testId={'import-input-file-path'}
          tooltipProps={{ placement: 'top' }}
          disabled={importInProgress}
        />
        {!importIntoCurrentProject && (
          <FilePathInput
            label={
              opossumFilePath
                ? text.importDialog.opossumFilePath.label
                : text.importDialog.opossumFilePath.selectLabel
            }
            text={opossumFilePath}
            onClick={selectOpossumFilePath}
            testId={'import-opossum-file-path'}
            disabled={importInProgress}
          />
        )}
      </div>
    </NotificationPopup>
  );
};
