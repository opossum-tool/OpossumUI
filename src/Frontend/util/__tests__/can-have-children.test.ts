// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Resources } from '../../../shared/shared-types';
import {
  canResourceHaveChildren,
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
