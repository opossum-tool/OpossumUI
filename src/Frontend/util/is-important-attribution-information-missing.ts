// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { AttributionInfo } from '../../shared/shared-types';

interface ExtendedAttributionInfo extends AttributionInfo {
  icons: unknown;
}
export function isImportantAttributionInformationMissing(
  attributionProperty: keyof AttributionInfo | 'icons',
  extendedAttributionInfo: Partial<ExtendedAttributionInfo>
): boolean {
  if (
    extendedAttributionInfo.excludeFromNotice ||
    extendedAttributionInfo.firstParty
  ) {
    return false;
  }
  switch (attributionProperty) {
    case 'copyright':
    case 'licenseName':
    case 'packageName':
    case 'packageVersion':
    case 'url':
      return !extendedAttributionInfo[attributionProperty];
    case 'attributionConfidence':
      return (
        !extendedAttributionInfo['attributionConfidence'] ||
        extendedAttributionInfo['attributionConfidence'] < 50
      );
    default:
      return false;
  }
}
