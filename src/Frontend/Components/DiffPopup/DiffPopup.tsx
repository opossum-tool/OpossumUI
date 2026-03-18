// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';

import {
  areAttributionsEqual,
  FORM_ATTRIBUTES,
} from '../../../shared/attribution-comparison';
import type { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch } from '../../state/hooks';
import { AttributionForm } from '../AttributionForm/AttributionForm';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { DiffPopupContainer } from './DiffPopup.style';
import {
  stripLicenseInfoIfFirstParty,
  useAttributionFormConfigs,
} from './DiffPopup.util';

interface DiffPopupProps {
  original: PackageInfo;
  current: PackageInfo;
  isOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function DiffPopup({
  current,
  original,
  isOpen,
  setOpen,
}: DiffPopupProps) {
  const dispatch = useAppDispatch();
  const {
    originalFormConfig,
    bufferFormConfig,
    bufferPackageInfo,
    setBufferPackageInfo,
  } = useAttributionFormConfigs({
    original: stripLicenseInfoIfFirstParty(original),
    current: stripLicenseInfoIfFirstParty(current),
  });

  function handleApplyChanges({
    buffer,
    current,
  }: {
    current: PackageInfo;
    buffer: PackageInfo;
  }) {
    const restoreLicenseAndCopyright = current.firstParty && buffer.firstParty;
    dispatch(
      setTemporaryDisplayPackageInfo({
        ...buffer,
        ...(restoreLicenseAndCopyright && {
          copyright: current.copyright,
          licenseName: current.licenseName,
          licenseText: current.licenseText,
        }),
      }),
    );
    setOpen(false);
  }

  return (
    <NotificationPopup
      header={text.diffPopup.title}
      leftButtonConfig={{
        disabled: areAttributionsEqual(bufferPackageInfo, current),
        buttonText: text.diffPopup.applyChanges,
        onClick: () => {
          handleApplyChanges({ current, buffer: bufferPackageInfo });
        },
      }}
      centerRightButtonConfig={{
        disabled: areAttributionsEqual(bufferPackageInfo, original),
        buttonText: text.diffPopup.revertAll,
        onClick: () => {
          setBufferPackageInfo({
            ...bufferPackageInfo,
            ...FORM_ATTRIBUTES.reduce(
              (acc, attribute) => ({
                ...acc,
                [attribute]: original[attribute],
              }),
              {},
            ),
          });
        },
      }}
      rightButtonConfig={{
        buttonText: text.buttons.cancel,
        color: 'secondary',
        onClick: () => setOpen(false),
      }}
      isOpen={isOpen}
      background={'lightestBlue'}
      fullWidth={true}
      aria-label={'diff popup'}
    >
      {renderDiffView()}
    </NotificationPopup>
  );

  function renderDiffView() {
    return (
      <DiffPopupContainer>
        <AttributionForm
          packageInfo={stripLicenseInfoIfFirstParty(original)}
          variant={'diff-original'}
          label={'original'}
          config={originalFormConfig}
        />
        <MuiDivider
          variant={'middle'}
          flexItem={true}
          orientation={'vertical'}
        />
        <AttributionForm
          packageInfo={bufferPackageInfo}
          variant={'diff-current'}
          label={'current'}
          config={bufferFormConfig}
        />
      </DiffPopupContainer>
    );
  }
}
