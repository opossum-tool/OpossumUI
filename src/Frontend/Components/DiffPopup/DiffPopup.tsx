// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';

import {
  FORM_ATTRIBUTES,
  isEqualToExternalAttribution,
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
  onApply?: () => void;
  readOnly?: boolean;
  comparisonMode?: 'compare-to-original' | 'compare-attributions';
}

export function DiffPopup({
  current,
  original,
  isOpen,
  setOpen,
  onApply,
  readOnly,
  comparisonMode = 'compare-to-original',
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
    readOnly,
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
        // Preserve the current attribution's origin linkage: the compared
        // target might not be the actual original signal.
        originalAttributionId: current.originalAttributionId,
        originalAttributionSource: current.originalAttributionSource,
        originalAttributionWasPreferred:
          current.originalAttributionWasPreferred,
      }),
    );
    onApply?.();
    setOpen(false);
  }

  return (
    <NotificationPopup
      header={text.diffPopup.title}
      leftButtonConfig={
        comparisonMode === 'compare-attributions'
          ? undefined
          : {
              disabled:
                readOnly ||
                isEqualToExternalAttribution(bufferPackageInfo, current),
              buttonText: text.diffPopup.applyChanges,
              onClick: () => {
                handleApplyChanges({ current, buffer: bufferPackageInfo });
              },
            }
      }
      centerRightButtonConfig={
        comparisonMode === 'compare-attributions'
          ? undefined
          : {
              disabled:
                readOnly ||
                isEqualToExternalAttribution(bufferPackageInfo, original),
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
            }
      }
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
    const formSectionLabels =
      comparisonMode === 'compare-attributions'
        ? {
            original: {
              packageCoordinates:
                text.attributionColumn.comparedPackageCoordinates,
              legalInformation:
                text.attributionColumn.comparedLicenseInformation,
            },
            current: {
              packageCoordinates:
                text.attributionColumn.selectedPackageCoordinates,
              legalInformation:
                text.attributionColumn.selectedLicenseInformation,
            },
          }
        : undefined;

    return (
      <DiffPopupContainer>
        <AttributionForm
          packageInfo={stripLicenseInfoIfFirstParty(original)}
          variant={'diff-original'}
          label={'original'}
          config={originalFormConfig}
          sectionLabels={formSectionLabels?.original}
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
          sectionLabels={formSectionLabels?.current}
        />
      </DiffPopupContainer>
    );
  }
}
