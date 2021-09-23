// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export function insertHeaderForOtherFolderResourceIds(
  currentFolderResourceIds: string[],
  otherFolderResourceIds: string[]
): number[] {
  const headerIndices: number[] = [];
  const otherFolderResourceIdsHeader = 'Resources in Other Folders';

  if (otherFolderResourceIds.length > 0) {
    headerIndices.push(
      currentFolderResourceIds.length,
      currentFolderResourceIds.length + 1
    );

    currentFolderResourceIds.push('', otherFolderResourceIdsHeader);
    otherFolderResourceIds.sort();
  }
  return headerIndices;
}

export function splitResourceItToCurrentAndOtherFolder(
  allResourceIds: string[],
  folderPath: string
): [string[], string[]] {
  const currentFolderResourceIds: string[] = [];
  const otherFolderResourceIds: string[] = [];

  (allResourceIds ?? []).forEach((resourceId) => {
    resourceId.startsWith(folderPath)
      ? currentFolderResourceIds.push(resourceId)
      : otherFolderResourceIds.push(resourceId);
  });
  currentFolderResourceIds.sort();
  return [currentFolderResourceIds, otherFolderResourceIds];
}

export function mergeCurrentAndOtherFolderResourceIds(
  currentFolderResourceIds: string[],
  otherFolderResourceIds: string[]
): string[] {
  const allResourceIds = [];
  for (const resourceId of currentFolderResourceIds)
    allResourceIds.push(resourceId);

  for (const resourceId of otherFolderResourceIds)
    allResourceIds.push(resourceId);
  return allResourceIds;
}
