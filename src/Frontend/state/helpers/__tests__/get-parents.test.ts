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
      new Set(['/first/']),
    );
    expect(result).toEqual(['/first/second/', '/first/second/third/']);

    result = getParentsUpToNextAttributionBreakpoint(
      testResource,
      new Set(['/first/', '/first/second/']),
    );
    expect(result).toEqual(['/first/second/third/']);

    result = getParentsUpToNextAttributionBreakpoint(
      testResource,
      new Set(['/']),
    );
    expect(result).toEqual([
      '/first/',
      '/first/second/',
      '/first/second/third/',
    ]);

    result = getParentsUpToNextAttributionBreakpoint(
      testResource,
      new Set(['/first/second/third/fifth/']),
    );
    expect(result).toEqual([
      '/',
      '/first/',
      '/first/second/',
      '/first/second/third/',
    ]);

    result = getParentsUpToNextAttributionBreakpoint(testResource, new Set());
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
      new Set(['/some/deep/folder/']),
    );
    expect(result).toEqual([]);
  });
});
