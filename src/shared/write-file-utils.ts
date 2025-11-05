// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export const OPOSSUM_FILE_EXTENSION = '.opossum';
export const INPUT_FILE_NAME = 'input.json';
export const OUTPUT_FILE_NAME = 'output.json';

export function getDotOpossumFilePath(
  resourceFilePath: string,
  possibleExtensions: Array<string>,
): string {
  const fileExtensionLength = Math.max(
    ...possibleExtensions.map((extension) => {
      if (resourceFilePath.endsWith(`.${extension}`)) {
        return extension.length;
      }
      return 0;
    }),
  );

  const resourceFilePathWithoutFileExtension =
    fileExtensionLength === 0
      ? resourceFilePath
      : resourceFilePath.slice(0, -(fileExtensionLength + 1));

  return resourceFilePathWithoutFileExtension + OPOSSUM_FILE_EXTENSION;
}
