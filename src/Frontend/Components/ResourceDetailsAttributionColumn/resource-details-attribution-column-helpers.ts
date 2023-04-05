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
  manualAttributions: Attributions,
  externalAttributions: Attributions
): PackageInfo {
  const panelsWhereToShowTemporaryPackageInfos: Array<PackagePanelTitle> = [
    PackagePanelTitle.ManualPackages,
    PackagePanelTitle.ExternalPackages,
    // TODO: PackagePanelTitle.ContainedExternalPackages should use the same logic
  ];

  if (
    !selectedPackage ||
    panelsWhereToShowTemporaryPackageInfos.includes(selectedPackage.panel)
  ) {
    return temporaryPackageInfo;
  }

  let displayPackageInfo = {};

  switch (selectedPackage?.panel) {
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
