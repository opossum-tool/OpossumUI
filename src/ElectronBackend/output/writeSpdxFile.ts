// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { shell } from 'electron';
import fs from 'fs';
import path from 'path';

import {
  type ExportSpdxDocumentJsonArgs,
  type ExportSpdxDocumentYamlArgs,
  ExportType,
  type PackageInfo,
} from '../../shared/shared-types';
import {
  createSpdxDocument,
  createSpdxJson,
  createSpdxPackage,
  createSpdxYaml,
} from '../spdxTools/spdxTools';
import { type SpdxDocument } from '../spdxTools/types';

const CREATOR_TOOL = 'Opossum';

export function writeSpdxFile(
  filePath: string,
  args: ExportSpdxDocumentYamlArgs | ExportSpdxDocumentJsonArgs,
): void {
  const fileName = path.basename(filePath);
  const packageInfos = Object.values(args.spdxAttributions);
  const spdxDocument = getSpdxDocument(packageInfos, fileName);

  if (args.type === ExportType.SpdxDocumentYaml) {
    fs.writeFileSync(filePath, createSpdxYaml(spdxDocument));
  } else if (args.type === ExportType.SpdxDocumentJson) {
    fs.writeFileSync(filePath, createSpdxJson(spdxDocument));
  }
  shell.showItemInFolder(filePath);
}

function getSpdxDocument(
  packageInfos: Array<PackageInfo>,
  fileName: string,
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
      packageInfo.comment,
    ),
  );

  const rootPackage = createSpdxPackage(packages);
  return createSpdxDocument(CREATOR_TOOL, rootPackage, fileName);
}
