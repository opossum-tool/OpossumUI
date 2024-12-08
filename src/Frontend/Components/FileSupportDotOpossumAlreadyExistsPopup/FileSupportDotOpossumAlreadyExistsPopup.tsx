// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';

import { ButtonText } from '../../enums/enums';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { useAppDispatch } from '../../state/hooks';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

const HEADER = 'Warning: Outdated input file format';
const INFO_TEXT_PART_1 =
  'You are trying to open a file with an outdated extension (".json" or ".json.gz"). \
    OpossumUI now reads files with a ".opossum" extension by default.';
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

export const FileSupportDotOpossumAlreadyExistsPopup: React.FC = () => {
  const dispatch = useAppDispatch();

  function close(): void {
    dispatch(closePopup());
  }

  const handleOpenDotOpossumButtonClick = (): void => {
    window.electronAPI.openDotOpossumFile();
    close();
  };

  return (
    <NotificationPopup
      header={HEADER}
      rightButtonConfig={{
        onClick: handleOpenDotOpossumButtonClick,
        buttonText: ButtonText.OpenDotOpossumFile,
      }}
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
};
