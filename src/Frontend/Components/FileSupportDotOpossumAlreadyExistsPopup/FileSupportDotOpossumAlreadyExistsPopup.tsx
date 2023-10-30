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
  'A ".opossum" file with the same name of the current input file \
  was found. This file will be opened instead.';

const classes = {
  content: {
    display: 'flex',
    gap: '25px',
    flexDirection: 'column',
    width: '520px',
  },
};

export function FileSupportDotOpossumAlreadyExistsPopup(): ReactElement {
  const dispatch = useAppDispatch();

  function close(): void {
    dispatch(closePopup());
  }

  const handleOpenDotOpossumButtonClick = (): void => {
    window.electronAPI.openDotOpossumFile();
    close();
  };

  const OpenDotOpossumButtonConfig: ButtonConfig = {
    onClick: handleOpenDotOpossumButtonClick,
    buttonText: ButtonText.OpenDotOpossumFile,
    isDark: true,
  };

  return (
    <NotificationPopup
      header={HEADER}
      rightButtonConfig={OpenDotOpossumButtonConfig}
      isOpen={true}
      content={
        <MuiBox sx={classes.content}>
          <MuiTypography>{INFO_TEXT_PART_1}</MuiTypography>
          <MuiTypography>{INFO_TEXT_PART_2}</MuiTypography>
        </MuiBox>
      }
      onBackdropClick={close}
      onEscapeKeyDown={close}
    />
  );
}
