// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Resources } from '../../../../shared/shared-types';
import {
  filterOutAttributedResourcesConsideringSiblings,
  removePathFromResources,
} from '../resource-browser-helpers';

describe('filterOutAttributedResourcesConsideringSiblings', () => {
  it('does not remove parent folder if children have unattributed sibling files', () => {
    const testResourcesToFilter: Resources = {
      folder1: { file1: 1, file2: 1 },
      folder2: { file3: 1 },
    };
    const testAttributedResourceIds = new Set(['/folder1/file1']);
    const expectedFilteredResources: Resources = {
      folder1: { file1: 1, file2: 1 },
      folder2: { file3: 1 },
    };
    const testFilteredResources =
      filterOutAttributedResourcesConsideringSiblings(
        testResourcesToFilter,
        testAttributedResourceIds
      );
    expect(testFilteredResources).toEqual(expectedFilteredResources);
  });

  it('does not remove parent folder if children have unattributed sibling folders', () => {
    const testResourcesToFilter: Resources = {
      folder1: { file1: 1, folder2: { file2: 1 } },
      folder3: { file3: 1 },
    };
    const testAttributedResourceIds = new Set(['/folder1/file1']);
    const expectedFilteredResources: Resources = {
      folder1: { file1: 1, folder2: { file2: 1 } },
      folder3: { file3: 1 },
    };
    const testFilteredResources =
      filterOutAttributedResourcesConsideringSiblings(
        testResourcesToFilter,
        testAttributedResourceIds
      );
    expect(testFilteredResources).toEqual(expectedFilteredResources);
  });

  it('removes parent folder if children are all attributed', () => {
    const testResourcesToFilter: Resources = {
      folder1: { file1: 1, file2: 1, folder2: { file3: 1 } },
      folder3: { file4: 1 },
    };
    const testAttributedResourceIds = new Set([
      '/folder1/file1',
      '/folder1/file2',
      '/folder1/folder2/file3',
    ]);
    const expectedFilteredResources: Resources = {
      folder3: { file4: 1 },
    };
    const testFilteredResources =
      filterOutAttributedResourcesConsideringSiblings(
        testResourcesToFilter,
        testAttributedResourceIds
      );
    expect(testFilteredResources).toEqual(expectedFilteredResources);
  });

  it('removes parent folder if single child is attributed', () => {
    const testResourcesToFilter: Resources = {
      folder1: { file1: 1, file2: 1 },
      folder2: { file3: 1 },
    };
    const testAttributedResourceIds = new Set(['/folder2/file3']);
    const expectedFilteredResources: Resources = {
      folder1: { file1: 1, file2: 1 },
    };
    const testFilteredResources =
      filterOutAttributedResourcesConsideringSiblings(
        testResourcesToFilter,
        testAttributedResourceIds
      );
    expect(testFilteredResources).toEqual(expectedFilteredResources);
  });

  it('removes parent folder if all descendant files are attributed', () => {
    const testResourcesToFilter: Resources = {
      folder1: {
        file1: 1,
        folder2: { folder3: { file2: 1, folder4: { folder5: { file3: 1 } } } },
      },
    };
    const testAttributedResourceIds = new Set([
      '/folder1/folder2/folder3/folder4/folder5/file3',
    ]);
    const expectedFilteredResources: Resources = {
      folder1: {
        file1: 1,
        folder2: { folder3: { file2: 1 } },
      },
    };
    const testFilteredResources =
      filterOutAttributedResourcesConsideringSiblings(
        testResourcesToFilter,
        testAttributedResourceIds
      );
    expect(testFilteredResources).toEqual(expectedFilteredResources);
  });

  it('removes folder if it is attributed, even if sibling files are unattributed', () => {
    const testResourcesToFilter: Resources = {
      folder1: { file1: 1, file2: 1, folder2: { file3: 1 } },
    };
    const testAttributedResourceIds = new Set(['/folder1/folder2/']);
    const expectedFilteredResources: Resources = {
      folder1: { file1: 1, file2: 1 },
    };
    const testFilteredResources =
      filterOutAttributedResourcesConsideringSiblings(
        testResourcesToFilter,
        testAttributedResourceIds
      );
    expect(testFilteredResources).toEqual(expectedFilteredResources);
  });

  it('removes an attributed folder in root directory', () => {
    const testResourcesToFilter: Resources = {
      folder1: { file1: 1, file2: 1 },
      folder2: { file3: 1 },
    };
    const testAttributedResourceIds = new Set(['/folder2/']);
    const expectedFilteredResources: Resources = {
      folder1: { file1: 1, file2: 1 },
    };
    const testFilteredResources =
      filterOutAttributedResourcesConsideringSiblings(
        testResourcesToFilter,
        testAttributedResourceIds
      );
    expect(testFilteredResources).toEqual(expectedFilteredResources);
  });

  it('removes an attributed sibling folder if its children are attributed, even if other siblings are unattributed', () => {
    const testResourcesToFilter: Resources = {
      folder1: { file1: 1, file2: 1, folder2: { file3: 1 } },
    };
    const testAttributedResourceIds = new Set(['/folder1/folder2/file3']);
    const expectedFilteredResources: Resources = {
      folder1: { file1: 1, file2: 1 },
    };
    const testFilteredResources =
      filterOutAttributedResourcesConsideringSiblings(
        testResourcesToFilter,
        testAttributedResourceIds
      );
    expect(testFilteredResources).toEqual(expectedFilteredResources);
  });
});

describe('removePathFromResources', () => {
  it('removes a non-empty folder', () => {
    const testResources: Resources = {
      folder1: { file1: 1, folder2: { file2: 1 } },
    };
    const testResourcePathToRemove = '/folder1/folder2/';
    const expectedResourcesWithRemovedPath: Resources = {
      folder1: { file1: 1 },
    };
    removePathFromResources(testResourcePathToRemove, testResources);
    expect(testResources).toEqual(expectedResourcesWithRemovedPath);
  });

  it('removes an empty folder', () => {
    const testResources: Resources = {
      folder1: { file1: 1, folder2: {} },
    };
    const testResourcePathToRemove = '/folder1/folder2/';
    const expectedResourcesWithRemovedPath: Resources = {
      folder1: { file1: 1 },
    };
    removePathFromResources(testResourcePathToRemove, testResources);
    expect(testResources).toEqual(expectedResourcesWithRemovedPath);
  });

  it('removes a folder in root direcotry', () => {
    const testResources: Resources = {
      folder1: { file1: 1, folder2: { file2: 1 } },
    };
    const testResourcePathToRemove = '/folder1/';
    const expectedResourcesWithRemovedPath: Resources = {};
    removePathFromResources(testResourcePathToRemove, testResources);
    expect(testResources).toEqual(expectedResourcesWithRemovedPath);
  });

  it('removes a file', () => {
    const testResources: Resources = {
      folder1: { file1: 1, folder2: { file2: 1 } },
    };
    const testResourcePathToRemove = '/folder1/file1';
    const expectedResourcesWithRemovedPath: Resources = {
      folder1: { folder2: { file2: 1 } },
    };
    removePathFromResources(testResourcePathToRemove, testResources);
    expect(testResources).toEqual(expectedResourcesWithRemovedPath);
  });

  it('removes nothing if resources do not contain the path to delete', () => {
    const testResources: Resources = {
      folder1: { file1: 1, folder2: { file2: 1 } },
    };
    const testResourcePathToRemove = '/folder3/file1';
    const expectedResourcesWithRemovedPath: Resources = {
      folder1: { file1: 1, folder2: { file2: 1 } },
    };
    removePathFromResources(testResourcePathToRemove, testResources);
    expect(testResources).toEqual(expectedResourcesWithRemovedPath);
  });

  it('removes nothing if path to delete is empty', () => {
    const testResources: Resources = {
      folder1: { file1: 1, folder2: { file2: 1 } },
    };
    const testResourcePathToRemove = '';
    const expectedResourcesWithRemovedPath: Resources = {
      folder1: { file1: 1, folder2: { file2: 1 } },
    };
    removePathFromResources(testResourcePathToRemove, testResources);
    expect(testResources).toEqual(expectedResourcesWithRemovedPath);
  });
});
