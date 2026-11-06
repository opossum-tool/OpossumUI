// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { ComparisonItem } from '../Frontend/Components/DiffPopup/DiffPopup.util';
import { Criticality, type PackageInfo } from '../shared/shared-types';

export function makeComparisonPackageInfo(
  overrides: Partial<PackageInfo> = {},
): PackageInfo {
  return {
    id: 'package',
    attributionConfidence: 50,
    criticality: Criticality.None,
    packageName: 'react',
    packageType: 'npm',
    licenseName: 'MIT',
    licenseText: 'MIT License',
    comment: 'opening comment',
    ...overrides,
  };
}

export function makeComparisonItem(
  overrides: Partial<ComparisonItem> = {},
): ComparisonItem {
  return {
    isExternal: false,
    label: 'attribution',
    packageInfo: makeComparisonPackageInfo(),
    ...overrides,
  };
}
