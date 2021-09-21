// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { removeTrailingSlashIfFileWithChildren } from '../remove-trailing-slash-if-file-with-children';

describe('removeTrailingSlashIfFileWithChildren', () => {
  test('removes last character', () => {
    expect(
      removeTrailingSlashIfFileWithChildren('/path1/', () => true)
    ).toEqual('/path1');
  });

  test('does no remove last character', () => {
    expect(
      removeTrailingSlashIfFileWithChildren('/path1/', () => false)
    ).toEqual('/path1/');
  });

  test('does nothing if last character is not /', () => {
    expect(
      removeTrailingSlashIfFileWithChildren('/path1/test', () => true)
    ).toEqual('/path1/test');
  });
});
