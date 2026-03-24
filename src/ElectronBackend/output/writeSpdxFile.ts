// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import path from 'path';

import {
  type Attributions,
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

export function writeSpdxFile(args: {
  path: string;
  type: ExportType.SpdxDocumentYaml | ExportType.SpdxDocumentJson;
  attributions: Attributions;
}): void {
  const fileName = path.basename(args.path);
  const packageInfos = Object.values(args.attributions);
  const spdxDocument = getSpdxDocument(packageInfos, fileName);

  fs.mkdirSync(path.dirname(args.path), { recursive: true });

  if (args.type === ExportType.SpdxDocumentYaml) {
    fs.writeFileSync(args.path, createSpdxYaml(spdxDocument));
  } else if (args.type === ExportType.SpdxDocumentJson) {
    fs.writeFileSync(args.path, createSpdxJson(spdxDocument));
  }
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
