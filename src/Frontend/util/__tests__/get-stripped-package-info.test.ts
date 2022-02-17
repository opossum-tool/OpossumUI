// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackageInfo } from '../../../shared/shared-types';
import { getStrippedPackageInfo } from '../get-stripped-package-info';

describe('The getStrippedPackageInfo function', () => {
  test('strips falsy values', () => {
    const testPackageInfo: PackageInfo = {
      packageName: 'React',
      packageVersion: '',
    };

    expect(getStrippedPackageInfo(testPackageInfo)).toEqual({
      packageName: 'React',
    });
  });

  test('strips source ', () => {
    const testPackageInfo: PackageInfo = {
      packageName: 'React',
      source: {
        name: 'HC',
        documentConfidence: 10,
      },
    };

    expect(getStrippedPackageInfo(testPackageInfo)).toEqual({
      packageName: 'React',
    });
  });

  test('strips preSelected ', () => {
    const testPackageInfo: PackageInfo = {
      packageName: 'React',
      preSelected: true,
    };

    expect(getStrippedPackageInfo(testPackageInfo)).toEqual({
      packageName: 'React',
    });
  });

  test('strips excess values', () => {
    const testPackageInfo = {
      packageName: 'React',
      childrenWithAttributionCount: 0,
    };

    expect(getStrippedPackageInfo(testPackageInfo)).toEqual({
      packageName: 'React',
    });
  });
});
