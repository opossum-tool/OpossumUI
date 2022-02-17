// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export function splitResourceIdsToCurrentAndOtherFolder(
  allResourceIds: Array<string>,
  folderPath: string
): {
  currentFolderResourceIds: Array<string>;
  otherFolderResourceIds: Array<string>;
} {
  const currentFolderResourceIds: Array<string> = [];
  const otherFolderResourceIds: Array<string> = [];

  allResourceIds.forEach((resourceId) => {
    resourceId.startsWith(folderPath)
      ? currentFolderResourceIds.push(resourceId)
      : otherFolderResourceIds.push(resourceId);
  });
  return {
    currentFolderResourceIds,
    otherFolderResourceIds,
  };
}
