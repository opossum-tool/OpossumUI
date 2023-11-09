// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { ReactElement } from 'react';

import { ButtonText } from '../../enums/enums';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { ButtonConfig } from '../../types/types';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

const HEADER = 'Warning: Outdated input file format';
const INFO_TEXT_PART_1 =
  'You are trying to open a file with an outdated extension (".json" or ".json.gz"). \
    OpossumUI now reads files with a ".opossum" extension by default. \
    However, older file formats can still be opened but support may be \
    discontinued in the future.';
const INFO_TEXT_PART_2 =
  'Would you like to create a new file with a ".opossum" extension from the current \
    input file and proceed (recommended), or keep working with the old format?';

const classes = {
  content: {
    display: 'flex',
    gap: '25px',
    flexDirection: 'column',
    width: '520px',
  },
};

export function FileSupportPopup(): ReactElement {
  const dispatch = useAppDispatch();

  function close(): void {
    dispatch(closePopup());
  }

  const handleCreateAndProceedButtonClick = (): void => {
    window.electronAPI.convertInputFileToDotOpossum();
    close();
  };
  const handleKeepButtonClick = (): void => {
    window.electronAPI.useOutdatedInputFileFormat();
    close();
  };

  const createAndProceedButtonConfig: ButtonConfig = {
    onClick: handleCreateAndProceedButtonClick,
    buttonText: ButtonText.CreateAndProceed,
    isDark: true,
  };
  const keepButtonConfig: ButtonConfig = {
    onClick: handleKeepButtonClick,
    buttonText: ButtonText.Keep,
  };

  return (
    <NotificationPopup
      header={HEADER}
      leftButtonConfig={createAndProceedButtonConfig}
      rightButtonConfig={keepButtonConfig}
      isOpen={true}
      content={
        <MuiBox sx={classes.content}>
          <MuiTypography>{INFO_TEXT_PART_1}</MuiTypography>
          <MuiTypography>{INFO_TEXT_PART_2}</MuiTypography>
        </MuiBox>
      }
      onBackdropClick={close}
      onEscapeKeyDown={close}
      aria-label={'file support'}
    />
  );
}
