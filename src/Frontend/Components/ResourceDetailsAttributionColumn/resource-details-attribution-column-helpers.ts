// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ChangeEvent } from 'react';
import { Attributions, PackageInfo } from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
import { AppThunkDispatch } from '../../state/types';
import { setTemporaryPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { PanelPackage } from '../../types/types';

export function getDisplayPackageInfo(
  selectedPackage: PanelPackage | null,
  temporaryPackageInfo: PackageInfo,
  manualAttributions: Attributions,
  externalAttributions: Attributions
): PackageInfo {
  if (
    !selectedPackage ||
    selectedPackage.panel === PackagePanelTitle.ManualPackages
  ) {
    return temporaryPackageInfo;
  }

  let displayPackageInfo = {};

  switch (selectedPackage?.panel) {
    case PackagePanelTitle.ExternalPackages:
    case PackagePanelTitle.ContainedExternalPackages:
      displayPackageInfo = externalAttributions[selectedPackage.attributionId];
      break;
    case PackagePanelTitle.ContainedManualPackages:
    case PackagePanelTitle.AllAttributions:
      displayPackageInfo = manualAttributions[selectedPackage.attributionId];
      break;
  }

  return displayPackageInfo;
}

export function setUpdateTemporaryPackageInfoForCreator(
  dispatch: AppThunkDispatch,
  temporaryPackageInfo: PackageInfo
) {
  return (propertyToUpdate: string) => {
    return (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ): void => {
      const newValue =
        event.target.type === 'number'
          ? parseInt(event.target.value)
          : event.target.value;
      dispatch(
        setTemporaryPackageInfo({
          ...temporaryPackageInfo,
          [propertyToUpdate]: newValue,
        })
      );
    };
  };
}
