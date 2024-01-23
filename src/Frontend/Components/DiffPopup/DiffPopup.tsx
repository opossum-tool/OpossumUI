// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';

import { DisplayPackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { AttributionForm } from '../AttributionColumn/AttributionForm';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { DiffPopupContainer } from './DiffPopup.style';

interface DiffPopupProps {
  original: DisplayPackageInfo;
  current: DisplayPackageInfo;
  isOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function DiffPopup(props: DiffPopupProps): React.ReactElement {
  return (
    <NotificationPopup
      header={text.diffPopup.title}
      content={renderDiffView()}
      leftButtonConfig={{
        disabled: true,
        buttonText: text.buttons.diffPopup.applyChanges,
      }}
      centerRightButtonConfig={{
        disabled: true,
        buttonText: text.buttons.diffPopup.revertAll,
      }}
      rightButtonConfig={{
        onClick: () => props.setOpen(false),
        buttonText: text.buttons.cancel,
        color: 'secondary',
      }}
      isOpen={props.isOpen}
      background={'lightestBlue'}
      fullWidth={true}
      aria-label={'diff popup'}
    />
  );

  function renderDiffView() {
    return (
      <DiffPopupContainer>
        <AttributionForm
          packageInfo={props.original}
          variant={'diff'}
          label={'original'}
        />
        <MuiDivider
          variant={'middle'}
          flexItem={true}
          orientation={'vertical'}
        />
        <AttributionForm
          packageInfo={props.current}
          variant={'diff'}
          label={'current'}
        />
      </DiffPopupContainer>
    );
  }
}
