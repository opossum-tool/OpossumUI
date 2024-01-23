// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiDivider from '@mui/material/Divider';
import { useMemo } from 'react';

import {
  DisplayPackageInfo,
  PackageInfoCore,
} from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import { AttributionForm } from '../AttributionColumn/AttributionForm';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { DiffPopupContainer } from './DiffPopup.style';

interface DiffPopupProps {
  original: DisplayPackageInfo;
  current: DisplayPackageInfo;
  isOpen: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

type AttributionFormConfigBase = Pick<
  PackageInfoCore,
  'packageName' | 'packageVersion' | 'packageNamespace' | 'packageType' | 'url'
>;
type AttributionFormConfigThirdParty = Pick<
  PackageInfoCore,
  'copyright' | 'licenseName' | 'licenseText'
>;
export type AttributionFormConfig = AttributionFormConfigBase &
  AttributionFormConfigThirdParty & { isDiffView?: boolean };
export type AttributionFormConfigAttribute = {
  colorValue?: string;
};

function getAttributionFormConfigsForDiff(
  originalPackageInfo: DisplayPackageInfo,
  displayedPackageInfo: DisplayPackageInfo,
): [AttributionFormConfig, AttributionFormConfig] {
  const attributionFormConfigBaseOriginal: AttributionFormConfigBase = {
    packageName: OpossumColors.black,
    packageVersion: OpossumColors.black,
    packageNamespace: OpossumColors.black,
    packageType: OpossumColors.black,
    url: OpossumColors.black,
  };
  const attributionFormConfigThirdPartyOriginal: AttributionFormConfigThirdParty =
    {
      copyright: OpossumColors.black,
      licenseName: OpossumColors.black,
      licenseText: OpossumColors.black,
    };

  const attributionFormConfigBaseCurrent = {
    ...attributionFormConfigBaseOriginal,
  };
  const attributionFormConfigCurrentThirdParty = {
    ...attributionFormConfigThirdPartyOriginal,
  };
  for (const attribute of Object.keys(attributionFormConfigBaseOriginal)) {
    if (
      originalPackageInfo[attribute as keyof AttributionFormConfigBase] !==
      displayedPackageInfo[attribute as keyof AttributionFormConfigBase]
    ) {
      attributionFormConfigBaseOriginal[
        attribute as keyof AttributionFormConfigBase
      ] = OpossumColors.red;
      attributionFormConfigBaseCurrent[
        attribute as keyof AttributionFormConfigBase
      ] = OpossumColors.green;
    }
  }
  if (!originalPackageInfo.firstParty && !displayedPackageInfo.firstParty) {
    for (const attribute of Object.keys(
      attributionFormConfigThirdPartyOriginal,
    )) {
      if (
        originalPackageInfo[
          attribute as keyof AttributionFormConfigThirdParty
        ] !==
        displayedPackageInfo[attribute as keyof AttributionFormConfigThirdParty]
      ) {
        attributionFormConfigThirdPartyOriginal[
          attribute as keyof AttributionFormConfigThirdParty
        ] = OpossumColors.red;
        attributionFormConfigCurrentThirdParty[
          attribute as keyof AttributionFormConfigThirdParty
        ] = OpossumColors.green;
      }
    }
  }
  return [
    {
      ...attributionFormConfigBaseOriginal,
      ...attributionFormConfigThirdPartyOriginal,
      isDiffView: true,
    },
    {
      ...attributionFormConfigBaseCurrent,
      ...attributionFormConfigCurrentThirdParty,
      isDiffView: true,
    },
  ];
}

export function DiffPopup(props: DiffPopupProps): React.ReactElement {
  const [originalFormConfig, currentFormConfig] = useMemo(
    () => getAttributionFormConfigsForDiff(props.original, props.current),
    [props],
  );

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
          config={originalFormConfig}
          label={'original'}
        />
        <MuiDivider
          variant={'middle'}
          flexItem={true}
          orientation={'vertical'}
        />
        <AttributionForm
          packageInfo={props.current}
          config={currentFormConfig}
          label={'current'}
        />
      </DiffPopupContainer>
    );
  }
}
