// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiAlert from '@mui/material/Alert';
import MuiTypography from '@mui/material/Typography';
import { useEffect, useState } from 'react';

import { text } from '../../../shared/text';
import { FilePathInput } from '../FilePathInput/FilePathInput';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { MultiResourcePicker } from './MultiResourcePicker';

interface SplitDialogProps {
  onClose: () => void;
  open: boolean;
  resourcePath?: string;
}

export const SplitDialog: React.FC<SplitDialogProps> = ({
  onClose,
  open,
  resourcePath,
}) => {
  const [destinationPath, setDestinationPath] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>();
  const [splitInProgress, setSplitInProgress] = useState(false);
  const [splitSucceeded, setSplitSucceeded] = useState(false);
  const [selectedResourcePaths, setSelectedResourcePaths] = useState(() =>
    getInitialSelectedResourcePaths(resourcePath),
  );
  const [pickerInstance, setPickerInstance] = useState(0);

  useEffect(() => {
    if (open) {
      setSelectedResourcePaths(getInitialSelectedResourcePaths(resourcePath));
      setPickerInstance((currentPickerInstance) => currentPickerInstance + 1);
    } else {
      setDestinationPath('');
      setErrorMessage(undefined);
      setSplitInProgress(false);
      setSplitSucceeded(false);
    }
  }, [open, resourcePath]);

  async function selectDestinationPath(): Promise<void> {
    if (
      splitInProgress ||
      splitSucceeded ||
      selectedResourcePaths.length === 0
    ) {
      return;
    }

    const selectedPath = await window.electronAPI.selectSplitDestination(
      selectedResourcePaths,
    );
    if (selectedPath) {
      setDestinationPath(selectedPath);
      setErrorMessage(undefined);
    }
  }

  async function createSplit(): Promise<void> {
    setSplitInProgress(true);
    setErrorMessage(undefined);
    try {
      const result = await window.electronAPI.splitFile(
        selectedResourcePaths,
        destinationPath,
      );
      if (result.status === 'success') {
        setSplitSucceeded(true);
      } else if (result.status === 'error') {
        setErrorMessage(result.message);
      }
    } catch {
      setErrorMessage(
        'Unexpected internal error while creating the split archive',
      );
    }
    setSplitInProgress(false);
  }

  return (
    <NotificationPopup
      header={text.splitDialog.title}
      width={'80vw'}
      minWidth={'300px'}
      maxWidth={'700px'}
      isOpen={open}
      leftButtonConfig={
        splitSucceeded
          ? undefined
          : {
              onClick: createSplit,
              buttonText: text.splitDialog.create,
              disabled:
                !destinationPath ||
                selectedResourcePaths.length === 0 ||
                splitInProgress,
              loading: splitInProgress,
            }
      }
      rightButtonConfig={{
        onClick: onClose,
        buttonText: splitSucceeded ? text.buttons.close : text.buttons.cancel,
        color: 'secondary',
        disabled: splitInProgress,
      }}
      onBackdropClick={splitInProgress ? undefined : onClose}
      onEscapeKeyDown={splitInProgress ? undefined : onClose}
      aria-label={'split dialog'}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <MuiTypography>{text.splitDialog.explanationText}</MuiTypography>
        <MultiResourcePicker
          key={`${resourcePath}-${pickerInstance}`}
          initialSelectedPaths={getInitialSelectedResourcePaths(resourcePath)}
          open={open}
          onSelectionChange={setSelectedResourcePaths}
        />
        <FilePathInput
          label={text.splitDialog.destinationPath.textFieldLabel(
            Boolean(destinationPath),
          )}
          text={destinationPath}
          onClick={() => void selectDestinationPath()}
          testId={'split-destination-path'}
          disabled={
            splitInProgress ||
            splitSucceeded ||
            selectedResourcePaths.length === 0
          }
        />
        {splitSucceeded ? (
          <MuiAlert severity={'success'} sx={{ marginTop: '20px' }}>
            {text.splitDialog.success}
          </MuiAlert>
        ) : null}
        {errorMessage ? (
          <MuiAlert severity={'error'} sx={{ marginTop: '20px' }}>
            {errorMessage}
          </MuiAlert>
        ) : null}
      </div>
    </NotificationPopup>
  );
};

function getInitialSelectedResourcePaths(
  resourcePath: string | undefined,
): Array<string> {
  return resourcePath ? [resourcePath] : [];
}
