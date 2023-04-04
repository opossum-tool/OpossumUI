// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Attributions, PackageInfo } from '../../../shared/shared-types';
import { PackagePanelTitle } from '../../enums/enums';
import { PanelPackage } from '../../types/types';

export function getDisplayPackageInfo(
  selectedPackage: PanelPackage | null,
  temporaryPackageInfo: PackageInfo,
  manualAttributions: Attributions
): PackageInfo {
  let displayPackageInfo = {};

  if (!selectedPackage) {
    displayPackageInfo = temporaryPackageInfo;
  }

  switch (selectedPackage?.panel) {
    case PackagePanelTitle.ManualPackages:
    case PackagePanelTitle.ExternalPackages:
    case PackagePanelTitle.ContainedExternalPackages:
      displayPackageInfo = temporaryPackageInfo;
      break;
    case PackagePanelTitle.ContainedManualPackages:
    case PackagePanelTitle.AllAttributions:
      displayPackageInfo = manualAttributions[selectedPackage.attributionId];
      break;
  }

  return displayPackageInfo;
}
