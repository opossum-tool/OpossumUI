// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { getParents } from '../get-parents';

describe('Test getParents', () => {
  const testResource = '/first/second/third/fourth';

  it('get parents of test string', () => {
    const result = getParents(testResource);
    expect(result).toEqual([
      '/',
      '/first/',
      '/first/second/',
      '/first/second/third/',
    ]);
  });
});
