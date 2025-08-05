// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Resources,
  ResourcesToAttributions,
} from '../../../shared/shared-types';
import {
  canResourceHaveChildren,
  correctFilePathsInResourcesMapping,
  isIdOfResourceWithChildren,
} from '../can-resource-have-children';

describe('canHaveChildren', () => {
  it('returns true for a folder', () => {
    const testResources: Resources = {};

    expect(canResourceHaveChildren(testResources)).toBe(true);
  });

  it('returns false for a file', () => {
    const testFileFromResources = 1;

    expect(canResourceHaveChildren(testFileFromResources)).toBe(false);
  });
});

describe('isIdOfResourceWithChildren', () => {
  it('returns true for a folder id', () => {
    const testFolderPath = '/some_folder/';

    expect(isIdOfResourceWithChildren(testFolderPath)).toBe(true);
  });

  it('returns false for a file id', () => {
    const testFilePath = '/some_folder/some_file';

    expect(isIdOfResourceWithChildren(testFilePath)).toBe(false);
  });
});

describe('correctFilePathsInResourcesMapping', () => {
  const testResourcesToAttributions: ResourcesToAttributions = {
    '/file': ['id1'],
    '/folder/': ['id2'],
    '/folder/file2': ['id2', 'id3'],
    '/fileWithChildren/': ['id4'],
    '/fileWithChildren/file3': ['id4', 'id5'],
  };
  it('does nothing to paths not in files with children', () => {
    const filesWithChildren = new Set<string>();
    expect(
      correctFilePathsInResourcesMapping(
        testResourcesToAttributions,
        filesWithChildren,
      ),
    ).toEqual(testResourcesToAttributions);
  });

  it('removes trailing slashes for files with children', () => {
    const filesWithChildren = new Set(['/fileWithChildren']);

    expect(
      correctFilePathsInResourcesMapping(
        testResourcesToAttributions,
        filesWithChildren,
      ),
    ).toEqual({
      '/file': ['id1'],
      '/folder/': ['id2'],
      '/folder/file2': ['id2', 'id3'],
      '/fileWithChildren': ['id4'],
      '/fileWithChildren/file3': ['id4', 'id5'],
    });
  });
});
