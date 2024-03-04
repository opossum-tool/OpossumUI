// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';
import { isEqual } from 'lodash';

import {
  COMPARABLE_ATTRIBUTES,
  getComparableAttributes,
} from '../../../shared/get-comparable-attributes';
import { PackageInfo } from '../../../shared/shared-types';
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
    original,
  }: {
    original: PackageInfo;
    current: PackageInfo;
    buffer: PackageInfo;
  }) {
    const markAsWasPreferred =
      isEqual(
        getComparableAttributes(buffer),
        getComparableAttributes(original),
      ) && original.wasPreferred;
    const restoreLicenseAndCopyright = current.firstParty && buffer.firstParty;
    dispatch(
      setTemporaryDisplayPackageInfo({
        ...buffer,
        ...(markAsWasPreferred && { wasPreferred: true }),
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
      content={renderDiffView()}
      leftButtonConfig={{
        disabled: isEqual(
          getComparableAttributes(bufferPackageInfo),
          getComparableAttributes(current),
        ),
        buttonText: text.diffPopup.applyChanges,
        onClick: () => {
          handleApplyChanges({ original, current, buffer: bufferPackageInfo });
        },
      }}
      centerRightButtonConfig={{
        disabled: isEqual(
          getComparableAttributes(bufferPackageInfo),
          getComparableAttributes(original),
        ),
        buttonText: text.diffPopup.revertAll,
        onClick: () => {
          setBufferPackageInfo({
            ...bufferPackageInfo,
            ...COMPARABLE_ATTRIBUTES.reduce(
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
    />
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
