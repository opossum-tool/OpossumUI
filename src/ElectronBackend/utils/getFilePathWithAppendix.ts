// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import fs from 'fs';
import path from 'path';
import upath from 'upath';

export function getFilePathWithAppendix(
  resourceFilePath: fs.PathLike,
  appendix: string,
): string {
  const { baseFileName, basePath } = getBasePaths(resourceFilePath);

  const fileNameWithAppendix = baseFileName.concat(appendix);
  return basePath.concat(fileNameWithAppendix);
}

function getBasePaths(resourceFilePath: fs.PathLike): {
  baseFileName: string;
  basePath: string;
} {
  const baseFileName: string = path.basename(
    resourceFilePath.toString(),
    getFileExtension(resourceFilePath),
  );
  const parent_folder = path.dirname(resourceFilePath.toString());
  const basePath = path.join(upath.toUnix(parent_folder), '/');
  return { baseFileName, basePath };
}

function getFileExtension(resourceFilePath: fs.PathLike): string {
  const gzipFileExtension = '.gz';
  const fileIsGziped =
    path.extname(resourceFilePath.toString()) === gzipFileExtension;

  return fileIsGziped
    ? path.extname(
        path.basename(resourceFilePath.toString(), gzipFileExtension),
      ) + gzipFileExtension
    : path.extname(resourceFilePath.toString());
}
