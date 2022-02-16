// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { getFileWithChildrenCheck } from '../is-file-with-children';

describe('getFileWithChildrenCheck', () => {
  test('returns a function that correctly checks the path', () => {
    const isFileWithChildren = getFileWithChildrenCheck(
      new Set(['/path1', '/path2'])
    );
    expect(isFileWithChildren('/path1')).toEqual(true);
    expect(isFileWithChildren('/path3')).toEqual(false);
  });

  test('handles empty set correctly', () => {
    const isFileWithChildren = getFileWithChildrenCheck(new Set());
    expect(isFileWithChildren('/path1')).toEqual(false);
    expect(isFileWithChildren('/path3')).toEqual(false);
  });
});
