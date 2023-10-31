// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { getAttributionBreakpointCheck } from '../is-attribution-breakpoint';

describe('getAttributionBreakpointCheck', () => {
  it('returns a function that correctly checks the path', () => {
    const isAttributionBreakpoint = getAttributionBreakpointCheck(
      new Set(['/path1', '/path2']),
    );
    expect(isAttributionBreakpoint('/path1')).toEqual(true);
    expect(isAttributionBreakpoint('/path3')).toEqual(false);
  });

  it('handles empty set correctly', () => {
    const isAttributionBreakpoint = getAttributionBreakpointCheck(new Set());
    expect(isAttributionBreakpoint('/path1')).toEqual(false);
    expect(isAttributionBreakpoint('/path3')).toEqual(false);
  });
});
