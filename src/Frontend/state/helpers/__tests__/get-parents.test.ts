// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  getParents,
  getParentsUpToNextAttributionBreakpoint,
} from '../get-parents';

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

  it('get parents with breakpoints', () => {
    let result = getParentsUpToNextAttributionBreakpoint(
      testResource,
      (path) => path === '/first/'
    );
    expect(result).toEqual(['/first/second/', '/first/second/third/']);

    result = getParentsUpToNextAttributionBreakpoint(
      testResource,
      (path) => path === '/first/' || path === '/first/second/'
    );
    expect(result).toEqual(['/first/second/third/']);

    result = getParentsUpToNextAttributionBreakpoint(
      testResource,
      (path) => path === '/'
    );
    expect(result).toEqual([
      '/first/',
      '/first/second/',
      '/first/second/third/',
    ]);

    result = getParentsUpToNextAttributionBreakpoint(
      testResource,
      (path) => path === '/first/second/third/fifth/'
    );
    expect(result).toEqual([
      '/',
      '/first/',
      '/first/second/',
      '/first/second/third/',
    ]);

    result = getParentsUpToNextAttributionBreakpoint(testResource, () => false);
    expect(result).toEqual([
      '/',
      '/first/',
      '/first/second/',
      '/first/second/third/',
    ]);
  });

  it('get parents with breakpoints, resource itself is breakpoint', () => {
    const result = getParentsUpToNextAttributionBreakpoint(
      '/some/deep/folder/',
      (path) => path === '/some/deep/folder/'
    );
    expect(result).toEqual([]);
  });
});
