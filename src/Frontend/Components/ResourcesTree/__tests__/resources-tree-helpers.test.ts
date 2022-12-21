// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Resources } from '../../../../shared/shared-types';
import {
  getResourcesFromResourcePaths,
  splitResourceIdsToCurrentAndOtherFolder,
} from '../resources-tree-helpers';

describe('splitResourceItToCurrentAndOtherFolder', () => {
  it('splits resource ids correctly', () => {
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

  const testResourcesList: string[] = [
    '/OpossumUI/DCO.md',
    '/OpossumUI/src/Frontend/test.txt',
    '/OpossumUI/src/Frontend/Components/file.tsx',
    '/OpossumUI/src/abc.test.tsx',
    '/OpossumUI/.idea/',
  ];

  const expectedResources: Resources = {
    OpossumUI: {
      ['.idea']: {},
      src: {
        Frontend: {
          ['test.txt']: 1,
          Components: {
            ['file.tsx']: 1,
          },
        },
        ['abc.test.tsx']: 1,
      },
      ['DCO.md']: 1,
    },
  };

  it('correctly converts a list of resource ids (paths) into a Resources object', () => {
    expect(getResourcesFromResourcePaths(testResourcesList)).toEqual(
      expectedResources
    );
  });
});

const testResourcesList: string[] = [
  '/OpossumUI/DCO.md',
  '/OpossumUI/src/Frontend/test.txt',
  '/OpossumUI/src/Frontend/Components/file.tsx',
  '/OpossumUI/src/abc.test.tsx',
  '/OpossumUI/.idea/',
];

const expectedResources: Resources = {
  OpossumUI: {
    ['.idea']: {},
    src: {
      Frontend: {
        ['test.txt']: 1,
        Components: {
          ['file.tsx']: 1,
        },
      },
      ['abc.test.tsx']: 1,
    },
    ['DCO.md']: 1,
  },
};

it('correctly converts a list of resource ids (paths) into a Resources object', () => {
  expect(getResourcesFromResourcePaths(testResourcesList)).toEqual(
    expectedResources
  );
});
