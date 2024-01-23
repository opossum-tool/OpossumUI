// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiDivider from '@mui/material/Divider';
import { ReactElement } from 'react';

import { DisplayPackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { ButtonText } from '../../enums/enums';
import { AttributionForm } from '../AttributionColumn/AttributionForm';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';

const classes = {
  viewContainer: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    padding: '6px',
    gap: '12px',
    overflow: 'hidden auto',
  },
};

interface DiffViewProps {
  currentDisplayPackageInfo: DisplayPackageInfo;
  originDisplayPackageInfo: DisplayPackageInfo;
}

interface DiffPopupProps {
  packagesForDiff: DiffViewProps;
  isOpen: boolean;
  setDisplayState: React.Dispatch<React.SetStateAction<boolean>>; // TODO is this the way to do it? I mean way to change state and the typing
}

function DiffView(props: DiffViewProps): ReactElement {
  return (
    <MuiBox sx={classes.viewContainer}>
      <AttributionForm
        packageInfo={props.originDisplayPackageInfo}
        isEditable={false}
        isDiffView={true}
      />
      <MuiDivider variant={'middle'} flexItem={true} orientation={'vertical'} />
      <AttributionForm
        packageInfo={props.currentDisplayPackageInfo}
        isEditable={false}
        isDiffView={true}
      />
    </MuiBox>
  );
}

export function DiffPopup(props: DiffPopupProps): ReactElement {
  return (
    <NotificationPopup
      header={text.diffPopup.title}
      content={
        <DiffView
          originDisplayPackageInfo={
            props.packagesForDiff.originDisplayPackageInfo
          }
          currentDisplayPackageInfo={
            props.packagesForDiff.currentDisplayPackageInfo
          }
        />
      }
      leftButtonConfig={{
        disabled: true,
        buttonText: ButtonText.ApplyChanges,
      }}
      centerRightButtonConfig={{
        disabled: true,
        buttonText: ButtonText.RevertAll,
      }}
      rightButtonConfig={{
        onClick: () => props.setDisplayState(false),
        buttonText: ButtonText.Cancel,
        color: 'secondary',
      }}
      isOpen={props.isOpen}
      background={'lightestBlue'}
      aria-label={'diff popup'}
    />
  );
}
