// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  insertHeaderForOtherFolderResourceIds,
  splitResourceItToCurrentAndOtherFolder,
} from '../resource-path-popup-helpers';

describe('insertHeaderForOtherFolderResourceIds', () => {
  test('inserts headers if resources in other folders present', () => {
    const currentFolderResourceIds = ['resource_1'];
    const otherFolderResourceIds = ['resource_2', 'resource_3'];

    const headerIndices = insertHeaderForOtherFolderResourceIds(
      currentFolderResourceIds,
      otherFolderResourceIds
    );

    expect(headerIndices).toStrictEqual([1, 2]);
    expect(currentFolderResourceIds).toStrictEqual([
      'resource_1',
      '',
      'Resources in Other Folders',
    ]);
    expect(otherFolderResourceIds).toStrictEqual(['resource_2', 'resource_3']);
  });

  test('inserts no headers if no resources in other folders present', () => {
    const currentFolderResourceIds = ['resource_1'];
    const otherFolderResourceIds: string[] = [];

    const headerIndices = insertHeaderForOtherFolderResourceIds(
      currentFolderResourceIds,
      otherFolderResourceIds
    );

    expect(headerIndices).toStrictEqual([]);
    expect(currentFolderResourceIds).toStrictEqual(['resource_1']);
    expect(otherFolderResourceIds).toStrictEqual([]);
  });
});

describe('splitResourceItToCurrentAndOtherFolder', () => {
  test('splits resource ids correctly', () => {
    const allResourceIds = [
      '/folder_1/',
      '/folder_1/resource_1',
      '/folder_2/resource_3',
    ];
    const folderPath = '/folder_1/';

    const [currentFolderResourceIds, otherFolderResourceIds] =
      splitResourceItToCurrentAndOtherFolder(allResourceIds, folderPath);

    expect(currentFolderResourceIds).toStrictEqual([
      '/folder_1/',
      '/folder_1/resource_1',
    ]);
    expect(otherFolderResourceIds).toStrictEqual(['/folder_2/resource_3']);
  });

  test('handles undefined allResourceIds correctly', () => {
    const allResourceIds = undefined;
    const folderPath = '/folder_1/';

    const [currentFolderResourceIds, otherFolderResourceIds] =
      // @ts-ignore
      splitResourceItToCurrentAndOtherFolder(allResourceIds, folderPath);

    expect(currentFolderResourceIds).toStrictEqual([]);
    expect(otherFolderResourceIds).toStrictEqual([]);
  });
});
