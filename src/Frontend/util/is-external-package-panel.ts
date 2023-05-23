// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackagePanelTitle } from '../enums/enums';

export function isExternalPackagePanel(panelTitle: PackagePanelTitle): boolean {
  const externalPackagePanelTitles = [
    PackagePanelTitle.ExternalPackages,
    PackagePanelTitle.ContainedExternalPackages,
  ];
  return externalPackagePanelTitles.includes(panelTitle);
}
