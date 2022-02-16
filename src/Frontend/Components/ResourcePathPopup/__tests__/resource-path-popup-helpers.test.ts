// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { splitResourceIdsToCurrentAndOtherFolder } from '../resource-path-popup-helpers';

describe('splitResourceItToCurrentAndOtherFolder', () => {
  test('splits resource ids correctly', () => {
    const allResourceIds = [
      '/folder_1/',
      '/folder_1/resource_1',
      '/folder_2/resource_3',
    ];
    const folderPath = '/folder_1/';

    const expectedOtherFolderResourceIds = ['/folder_2/resource_3'];
    const expectedCurrentFolderResourceIds = [
      '/folder_1/',
      '/folder_1/resource_1',
    ];

    const { currentFolderResourceIds, otherFolderResourceIds } =
      splitResourceIdsToCurrentAndOtherFolder(allResourceIds, folderPath);

    expect(currentFolderResourceIds).toStrictEqual(
      expectedCurrentFolderResourceIds
    );
    expect(otherFolderResourceIds).toStrictEqual(
      expectedOtherFolderResourceIds
    );
  });
});
