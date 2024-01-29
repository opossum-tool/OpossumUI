// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';

import { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { AttributionForm } from '../AttributionColumn/AttributionForm';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { DiffPopupContainer } from './DiffPopup.style';
import { useAttributionFormConfigs } from './DiffPopup.util';

interface DiffPopupProps {
  original: PackageInfo;
  current: PackageInfo;
  isOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function DiffPopup({
  current,
  isOpen,
  original,
  setOpen,
}: DiffPopupProps) {
  const [originalFormConfig, currentFormConfig] = useAttributionFormConfigs({
    current,
    original,
  });

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
        onClick: () => setOpen(false),
        buttonText: text.buttons.cancel,
        color: 'secondary',
      }}
      isOpen={isOpen}
      background={'lightestBlue'}
      fullWidth={true}
      aria-label={'diff popup'}
    />
  );

  function renderDiffView() {
    return (
      <DiffPopupContainer>
        <AttributionForm
          packageInfo={original}
          variant={'diff'}
          label={'original'}
          config={originalFormConfig}
        />
        <MuiDivider
          variant={'middle'}
          flexItem={true}
          orientation={'vertical'}
        />
        <AttributionForm
          packageInfo={current}
          variant={'diff'}
          label={'current'}
          config={currentFormConfig}
        />
      </DiffPopupContainer>
    );
  }
}
