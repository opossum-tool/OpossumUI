// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ClearIcon from '@mui/icons-material/Clear';
import MuiAlert from '@mui/material/Alert';
import MuiIconButton from '@mui/material/IconButton';
import MuiList from '@mui/material/List';
import MuiListItem from '@mui/material/ListItem';
import MuiListItemText from '@mui/material/ListItemText';
import MuiPaper from '@mui/material/Paper';
import MuiTypography from '@mui/material/Typography';
import { uniq } from 'lodash-es';
import { useState } from 'react';

import { OPOSSUM_FILE_FORMAT } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { mergeOpossumFilesIntoCurrentFile } from '../../state/actions/popup-actions/popup-actions';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { FilePathInput } from '../FilePathInput/FilePathInput';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

interface MergeOpossumFilesDialogProps {
  currentFilePath?: string;
  mergeIntoCurrentFile: boolean;
}

export const MergeOpossumFilesDialog: React.FC<
  MergeOpossumFilesDialogProps
> = ({ currentFilePath, mergeIntoCurrentFile }) => {
  const dispatch = useAppDispatch();
  const [inputFilePaths, setInputFilePaths] = useState<Array<string>>([]);
  const [outputFilePath, setOutputFilePath] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>();
  const [mergeInProgress, setMergeInProgress] = useState(false);

  const mergeEnabled = mergeIntoCurrentFile
    ? inputFilePaths.length > 0
    : inputFilePaths.length >= 2 && Boolean(outputFilePath);

  async function addInputFilePaths(): Promise<void> {
    const selectedPaths =
      await window.electronAPI.selectFiles(OPOSSUM_FILE_FORMAT);
    if (selectedPaths.length > 0) {
      setErrorMessage(undefined);
      setInputFilePaths((currentPaths) =>
        uniq(
          [...currentPaths, ...selectedPaths].filter(
            (selectedPath) => selectedPath !== currentFilePath,
          ),
        ),
      );
    }
  }

  async function selectOutputFilePath(): Promise<void> {
    const selectedPath = await window.electronAPI.selectSaveFile({
      defaultPath: outputFilePath || 'merged.opossum',
      filter: OPOSSUM_FILE_FORMAT,
    });
    if (selectedPath) {
      setErrorMessage(undefined);
      setOutputFilePath(selectedPath);
    }
  }

  async function mergeFiles(): Promise<void> {
    setMergeInProgress(true);
    setErrorMessage(undefined);

    try {
      if (mergeIntoCurrentFile) {
        await dispatch(mergeOpossumFilesIntoCurrentFile(inputFilePaths, false));
      } else {
        await window.electronAPI.mergeOpossumFilesFromPaths(
          inputFilePaths,
          outputFilePath,
          false,
        );
      }
      dispatch(closePopup());
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unexpected internal error while merging Opossum files',
      );
    } finally {
      setMergeInProgress(false);
    }
  }

  return (
    <NotificationPopup
      header={text.mergeOpossumFilesDialog.title(mergeIntoCurrentFile)}
      width={'80vw'}
      minWidth={'300px'}
      maxWidth={'700px'}
      isOpen={true}
      rightButtonConfig={{
        onClick: () => dispatch(closePopup()),
        buttonText: text.buttons.cancel,
        color: 'secondary',
        disabled: mergeInProgress,
      }}
      leftButtonConfig={{
        onClick: () => void mergeFiles(),
        buttonText: text.buttons.merge,
        disabled: !mergeEnabled || mergeInProgress,
        loading: mergeInProgress,
      }}
      aria-label={'merge split Opossum files dialog'}
    >
      <MuiTypography>
        {text.mergeOpossumFilesDialog.explanationText(mergeIntoCurrentFile)}
      </MuiTypography>
      <MuiTypography sx={{ marginTop: '20px' }}>
        {text.mergeOpossumFilesDialog.filesToMerge}
      </MuiTypography>
      {mergeIntoCurrentFile || inputFilePaths.length > 0 ? (
        <MuiPaper variant={'outlined'} sx={{ marginTop: '10px' }}>
          <MuiList dense>
            {mergeIntoCurrentFile && currentFilePath ? (
              <MuiListItem>
                <MuiListItemText
                  primary={currentFilePath}
                  secondary={text.mergeOpossumFilesDialog.currentFile}
                />
              </MuiListItem>
            ) : null}
            {inputFilePaths.map((filePath) => (
              <MuiListItem
                key={filePath}
                secondaryAction={
                  <MuiIconButton
                    aria-label={text.mergeOpossumFilesDialog.removeSplitFile(
                      filePath,
                    )}
                    onClick={() =>
                      setInputFilePaths((currentPaths) =>
                        currentPaths.filter((path) => path !== filePath),
                      )
                    }
                    disabled={mergeInProgress}
                  >
                    <ClearIcon />
                  </MuiIconButton>
                }
              >
                <MuiListItemText primary={filePath} />
              </MuiListItem>
            ))}
          </MuiList>
        </MuiPaper>
      ) : null}
      <FilePathInput
        label={text.mergeOpossumFilesDialog.addSplitFiles}
        text={''}
        onClick={() => void addInputFilePaths()}
        testId={'merge-opossum-files-input-paths'}
        disabled={mergeInProgress}
      />
      {!mergeIntoCurrentFile ? (
        <FilePathInput
          label={text.mergeOpossumFilesDialog.outputFilePath.textFieldLabel(
            Boolean(outputFilePath),
          )}
          text={outputFilePath}
          onClick={() => void selectOutputFilePath()}
          testId={'merge-opossum-files-output-path'}
          disabled={mergeInProgress}
        />
      ) : null}
      {errorMessage ? (
        <MuiAlert severity={'error'} sx={{ marginTop: '20px' }}>
          {errorMessage}
        </MuiAlert>
      ) : null}
    </NotificationPopup>
  );
};
