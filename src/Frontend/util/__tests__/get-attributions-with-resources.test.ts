// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  AttributionsToResources,
  Resources,
} from '../../../shared/shared-types';
import {
  getAttributionsWithAllChildResourcesWithoutFolders,
  getAttributionsWithResources,
  removeSlashesFromFilesWithChildren,
} from '../get-attributions-with-resources';

describe('getAttributionsWithResources', () => {
  it('returns attributions with resources', () => {
    const testAttributions: Attributions = {
      uuid1: { packageName: 'React', id: 'uuid1' },
      uuid2: { packageName: 'Redux', id: 'uuid2' },
      uuid3: { packageName: 'root package', id: 'uuid3' },
    };

    const testAttributionsToResources: AttributionsToResources = {
      uuid1: ['/some/path1/', '/some/path2/'],
      uuid2: ['/some/path1/'],
      uuid3: ['/'],
    };

    const expectedAttributionsWithResources: Attributions = {
      uuid1: {
        packageName: 'React',
        resources: ['/some/path1/', '/some/path2/'],
        id: 'uuid1',
      },
      uuid2: {
        packageName: 'Redux',
        resources: ['/some/path1/'],
        id: 'uuid2',
      },
      uuid3: {
        packageName: 'root package',
        resources: ['/'],
        id: 'uuid3',
      },
    };

    expect(
      getAttributionsWithResources(
        testAttributions,
        testAttributionsToResources,
      ),
    ).toEqual(expectedAttributionsWithResources);
  });

  it('returns attributions with resources for empty attributions', () => {
    expect(getAttributionsWithResources({}, {})).toEqual({});
  });
});

describe('getAttributionsWithAllChildResources', () => {
  it('returns attributions with resources recursively', () => {
    const testAttributions: Attributions = {
      uuid1: { packageName: 'React', id: 'uuid1' },
      uuid2: { packageName: 'Redux', id: 'uuid2' },
      uuid3: { packageName: 'JQuery', id: 'uuid3' },
      uuid4: { packageName: 'root package', id: 'uuid4' },
    };

    const testAttributionsToResources: AttributionsToResources = {
      uuid1: ['/some/path1/', '/some/file1'],
      uuid2: ['/some/path1/'],
      uuid3: ['/some/path3/some_other_thing.js'],
      uuid4: ['/some/'],
    };

    const testResourcesToAttributions: AttributionsToResources = {
      '/some/path1/': ['uuid1', 'uuid2'],
      '/some/file1': ['uuid1'],
      '/some/path3/some_other_thing.js': ['uuid3'],
      '/some/': ['uuid4'],
    };

    const expectedAttributionsWithResources: Attributions = {
      uuid1: {
        packageName: 'React',
        resources: ['/some/path1/something.js', '/some/file1'],
        id: 'uuid1',
      },
      uuid2: {
        packageName: 'Redux',
        resources: ['/some/path1/something.js'],
        id: 'uuid2',
      },
      uuid3: {
        packageName: 'JQuery',
        resources: ['/some/path3/some_other_thing.js'],
        id: 'uuid3',
      },
      uuid4: {
        packageName: 'root package',
        resources: [],
        id: 'uuid4',
      },
    };

    const resources: Resources = {
      some: {
        path1: {
          'something.js': 1,
        },
        file1: 1,
        path3: { 'some_other_thing.js': 1 },
      },
      bla: 1,
    };

    expect(
      getAttributionsWithAllChildResourcesWithoutFolders(
        testAttributions,
        testAttributionsToResources,
        testResourcesToAttributions,
        resources,
        new Set(),
        new Set(),
      ),
    ).toEqual(expectedAttributionsWithResources);
  });

  it('returns attributions with resources recursively in the edge case of same folder names', () => {
    const testAttributions: Attributions = {
      uuid1: { packageName: 'React', id: 'uuid1' },
    };

    const testAttributionsToResources: AttributionsToResources = {
      uuid1: ['/foo/'],
    };

    const testResourcesToAttributions: AttributionsToResources = {
      '/foo/': ['uuid1'],
    };

    const resources: Resources = {
      foo: {
        foo: {
          foo: 1,
        },
      },
    };

    const expectedAttributionsWithResources: Attributions = {
      uuid1: {
        packageName: 'React',
        resources: ['/foo/foo/foo'],
        id: 'uuid1',
      },
    };

    expect(
      getAttributionsWithAllChildResourcesWithoutFolders(
        testAttributions,
        testAttributionsToResources,
        testResourcesToAttributions,
        resources,
        new Set(),
        new Set(),
      ),
    ).toEqual(expectedAttributionsWithResources);
  });

  it('returns attributions with resources recursively for a deep file tree', () => {
    const testAttributions: Attributions = {
      uuid1: { packageName: 'React', id: 'uuid1' },
    };

    const testAttributionsToResources: AttributionsToResources = {
      uuid1: ['/folder/folder/', '/folder/folder2/', '/folder/file'],
    };

    const testResourcesToAttributions: AttributionsToResources = {
      '/folder/folder/': ['uuid1'],
      '/folder/folder2/': ['uuid1'],
      '/folder/file': ['uuid1'],
    };

    const resources: Resources = {
      folder: {
        folder: {
          folder: {
            folder: {
              file: 1,
            },
            file: 1,
          },
          file: 1,
        },
        folder2: {
          emptyFolder: {},
          file: 1,
        },
        folder3: {
          folder: {
            file: 1,
          },
          file: 1,
        },
        file: 1,
      },
      file: 1,
    };

    const expectedAttributionsWithResources: Attributions = {
      uuid1: {
        packageName: 'React',
        resources: [
          '/folder/folder/folder/folder/file',
          '/folder/folder/folder/file',
          '/folder/folder/file',
          '/folder/folder2/file',
          '/folder/file',
        ],
        id: 'uuid1',
      },
    };

    expect(
      getAttributionsWithAllChildResourcesWithoutFolders(
        testAttributions,
        testAttributionsToResources,
        testResourcesToAttributions,
        resources,
        new Set(),
        new Set(),
      ),
    ).toEqual(expectedAttributionsWithResources);
  });

  it('returns attributions with resources for empty attributions recursively', () => {
    expect(
      getAttributionsWithAllChildResourcesWithoutFolders(
        {},
        {},
        {},
        {},
        new Set(),
        new Set(),
      ),
    ).toEqual({});
  });

  it('does not return resources inside a breakpoint', () => {
    const testAttributions: Attributions = {
      uuid1: { packageName: 'React', id: 'uuid1' },
      uuid2: { packageName: 'Vue', id: 'uuid2' },
    };

    const testAttributionsToResources: AttributionsToResources = {
      uuid1: ['/folder/folder/'],
      uuid2: ['/folder/folder/folder/folder/'],
    };

    const testResourcesToAttributions: AttributionsToResources = {
      '/folder/folder/': ['uuid1'],
      '/folder/folder/folder/folder/': ['uuid2'],
    };

    const resources: Resources = {
      folder: {
        folder: {
          folder: {
            folder: {
              file: 1,
            },
            file: 1,
          },
          file: 1,
        },
      },
      file: 1,
    };

    const expectedAttributionsWithResources: Attributions = {
      uuid1: {
        packageName: 'React',
        resources: ['/folder/folder/file'],
        id: 'uuid1',
      },
      uuid2: {
        packageName: 'Vue',
        resources: ['/folder/folder/folder/folder/file'],
        id: 'uuid2',
      },
    };

    expect(
      getAttributionsWithAllChildResourcesWithoutFolders(
        testAttributions,
        testAttributionsToResources,
        testResourcesToAttributions,
        resources,
        new Set(['/folder/folder/folder/']),
        new Set(),
      ),
    ).toEqual(expectedAttributionsWithResources);
  });

  it('does return resources that are files with children', () => {
    const testAttributions: Attributions = {
      uuid1: { packageName: 'React', id: 'uuid1' },
      uuid2: { packageName: 'Vue', id: 'uuid2' },
    };

    const testAttributionsToResources: AttributionsToResources = {
      uuid1: ['/fileWithChildren/folder/'],
      uuid2: ['/fileWithChildren/'],
    };

    const testResourcesToAttributions: AttributionsToResources = {
      '/fileWithChildren/folder/': ['uuid1'],
      '/fileWithChildren/': ['uuid2'],
    };

    const resources: Resources = {
      fileWithChildren: {
        folder: {
          file: 1,
        },
      },
      file: 1,
    };

    const expectedAttributionsWithResources: Attributions = {
      uuid1: {
        packageName: 'React',
        resources: ['/fileWithChildren/folder/file'],
        id: 'uuid1',
      },
      uuid2: {
        packageName: 'Vue',
        resources: ['/fileWithChildren/'],
        id: 'uuid2',
      },
    };

    expect(
      getAttributionsWithAllChildResourcesWithoutFolders(
        testAttributions,
        testAttributionsToResources,
        testResourcesToAttributions,
        resources,
        new Set(),
        new Set(['/fileWithChildren/']),
      ),
    ).toEqual(expectedAttributionsWithResources);
  });

  it('does return resources that are files with children if it has inferred attributions', () => {
    const testAttributions: Attributions = {
      uuid2: { packageName: 'Vue', id: 'uuid2' },
    };

    const testAttributionsToResources: AttributionsToResources = {
      uuid2: ['/root/'],
    };

    const testResourcesToAttributions: AttributionsToResources = {
      '/root/': ['uuid2'],
    };

    const resources: Resources = {
      root: {
        fileWithChildren: {
          folder: {
            file: 1,
          },
        },
        file: 1,
      },
    };

    const expectedAttributionsWithResources: Attributions = {
      uuid2: {
        packageName: 'Vue',
        resources: [
          '/root/fileWithChildren/folder/file',
          '/root/fileWithChildren/',
          '/root/file',
        ],
        id: 'uuid2',
      },
    };

    expect(
      getAttributionsWithAllChildResourcesWithoutFolders(
        testAttributions,
        testAttributionsToResources,
        testResourcesToAttributions,
        resources,
        new Set(),
        new Set(['/root/fileWithChildren/']),
      ),
    ).toEqual(expectedAttributionsWithResources);
  });
});

describe('removeSlashesFromFilesWithChildren', () => {
  it('formats files with children', () => {
    const testAttributionsWithResources: Attributions = {
      uuid1: {
        packageName: 'React',
        resources: ['/some/path1/', '/some/path2/'],
        id: 'uuid1',
      },
      uuid2: {
        packageName: 'Redux',
        resources: ['/some/path3/'],
        id: 'uuid2',
      },
      uuid3: {
        packageName: 'root package',
        resources: ['/'],
        id: 'uuid3',
      },
    };
    const expectedAttributionsWithResources: Attributions = {
      ...testAttributionsWithResources,
      uuid2: {
        ...testAttributionsWithResources.uuid2,
        resources: ['/some/path3'],
      },
    };

    expect(
      removeSlashesFromFilesWithChildren(
        testAttributionsWithResources,
        new Set(['/some/path3/']),
      ),
    ).toEqual(expectedAttributionsWithResources);
  });
});
