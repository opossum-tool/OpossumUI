// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { doNothing } from '../../util/do-nothing';
import { OpossumColors } from '../../shared-styles';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { ButtonText } from '../../enums/enums';
import { useAppDispatch } from '../../state/hooks';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { PathBar } from '../PathBar/PathBar';

// TODO: const POPUP_CONTENT_PADDING = 48; monitored in upcoming tickets
const attributionWizardPopupHeader = 'Attribution Wizard';

const classes = {
  dialogContent: {
    // TODO: required later
  },
  dialogHeader: {
    whiteSpace: 'nowrap',
    // TODO: width: `calc(100% - ${POPUP_CONTENT_PADDING}px)`,  monitored in upcoming tickets
  },

  mainContent: {
    borderRadius: 2,
    paddingTop: '0px',
    background: OpossumColors.white,
  },
  mainContentBox: {
    padding: '4px',
    borderRadius: 2,
    marginTop: '8px',
    background: OpossumColors.lightBlue,
  },
  pathBar: {
    paddingLeft: '5px',
    paddingRight: '5px',
    paddingTop: '1px',
    paddingBottom: '1px',
  },
  pathBarBox: {
    padding: '4px',
    background: OpossumColors.lightBlue,
  },
};

export function AttributionWizardPopup(): ReactElement {
  const dispatch = useAppDispatch();

  function closeAttributionWizardPopup(): void {
    dispatch(closePopup());
  }

  // TODO: const selectedAttributionId = useAppSelector(getPopupAttributionId);  for later
  // TODO: const selectedResourceId = useSelector(getSelectedResourceId);  for later
  const nextButtonConfig = {
    buttonText: ButtonText.Next,
    onClick: doNothing,
    isDisabled: true,
  };
  const closeButtonConfig = {
    buttonText: ButtonText.Cancel,
    onClick: closeAttributionWizardPopup,
    isDisabled: false,
  };

  const testContent = (
    <MuiBox style={classes.dialogContent}>
      <MuiBox sx={classes.pathBarBox}>
        <PathBar sx={classes.pathBar} />
      </MuiBox>
      <MuiBox sx={classes.mainContentBox}>
        <MuiBox sx={classes.mainContent}>
          <MuiTypography
            sx={{
              textAlign: 'center',
              width: '300px',
              height: '300px',
            }}
          >
            Content dummy
          </MuiTypography>
        </MuiBox>
      </MuiBox>
    </MuiBox>
  );
  return (
    <NotificationPopup
      header={attributionWizardPopupHeader}
      leftButtonConfig={nextButtonConfig}
      rightButtonConfig={closeButtonConfig}
      onBackdropClick={closeAttributionWizardPopup}
      onEscapeKeyDown={closeAttributionWizardPopup}
      isOpen={true}
      fullWidth={false}
      headerSx={classes.dialogHeader}
      content={testContent}
    />
  );
}
