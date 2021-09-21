// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import path from 'path';
import {
  createSpdxDocument,
  createSpdxJson,
  createSpdxPackage,
  createSpdxYaml,
} from 'spdx-tools-ts';
import fs from 'fs';
import {
  ExportSpdxDocumentJsonArgs,
  ExportSpdxDocumentYamlArgs,
  ExportType,
  PackageInfo,
} from '../../shared/shared-types';
import { SpdxDocument } from 'spdx-tools-ts/build/types';

const CREATOR_TOOL = 'Opossum';

export function writeSpdxFile(
  filePath: string,
  args: ExportSpdxDocumentYamlArgs | ExportSpdxDocumentJsonArgs
): void {
  const fileName = path.basename(filePath);
  const packageInfos = Object.values(args.spdxAttributions);
  const spdxDocument = getSpdxDocument(packageInfos, fileName);

  if (args.type === ExportType.SpdxDocumentYaml) {
    fs.writeFileSync(filePath, createSpdxYaml(spdxDocument));
  } else if (args.type === ExportType.SpdxDocumentJson) {
    fs.writeFileSync(filePath, createSpdxJson(spdxDocument));
  }
}

function getSpdxDocument(
  packageInfos: Array<PackageInfo>,
  fileName: string
): SpdxDocument {
  const packages = packageInfos.map((packageInfo) =>
    createSpdxPackage(
      [],
      packageInfo.copyright,
      packageInfo.licenseName,
      packageInfo.licenseText,
      packageInfo.packageName,
      packageInfo.packageVersion,
      packageInfo.packageNamespace,
      packageInfo.packageType,
      packageInfo.packagePURLAppendix,
      packageInfo.url,
      packageInfo.comment
    )
  );

  const rootPackage = createSpdxPackage(packages);
  return createSpdxDocument(CREATOR_TOOL, rootPackage, fileName);
}
