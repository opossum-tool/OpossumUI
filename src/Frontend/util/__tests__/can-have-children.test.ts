// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import type { Resources } from '../../../shared/shared-types';
import { canResourceHaveChildren } from '../can-resource-have-children';

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
