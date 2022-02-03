// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Attributions, PackageInfo } from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
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
