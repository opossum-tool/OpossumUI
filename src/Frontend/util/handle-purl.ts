// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PackageURL } from 'packageurl-js';

import { DisplayPackageInfo, PackageInfo } from '../../shared/shared-types';
import { text } from '../../shared/text';

export function parsePurl(purl: string): PackageURL | undefined {
  try {
    return PackageURL.fromString(purl);
  } catch {
    return undefined;
  }
}

export function generatePurl(
  packageInfo: PackageInfo | DisplayPackageInfo,
): string {
  try {
    return packageInfo.packageType?.trim() && packageInfo.packageName?.trim()
      ? new PackageURL(
          packageInfo.packageType.trim(),
          packageInfo?.packageNamespace?.trim(),
          packageInfo.packageName.trim(),
          packageInfo?.packageVersion?.trim(),
          undefined,
          undefined,
        ).toString()
      : '';
  } catch (error) {
    return text.attributionColumn.invalidPurl;
  }
}
