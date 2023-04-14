// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { DisplayPackageInfo, PackageInfo } from '../../../shared/shared-types';
import {
  convertDisplayPackageInfoToPackageInfo,
  convertPackageInfoToDisplayPackageInfo,
} from '../convert-package-info';

describe('convertPackageInfoToDisplayPackageInfo', () => {
  it('returns correct PackageInfo', () => {
    const testPackageInfoA: PackageInfo = {
      packageName: 'react',
      comment: 'comment A',
    };
    const testPackageInfoB: PackageInfo = {
      packageName: 'react',
    };
    const testPackageInfoC: PackageInfo = {
      packageName: 'react',
      comment: 'comment C',
    };

    const testAttributionIdsA = ['uuid_A'];
    const testAttributionIdsB = ['uuid_B'];
    const testAttributionIdsC = ['uuid_A', 'uuid_B'];

    const expectedDisplayPackageInfoA: DisplayPackageInfo = {
      packageName: 'react',
      comments: ['comment A'],
      attributionIds: ['uuid_A'],
    };
    const expectedDisplayPackageInfoB: DisplayPackageInfo = {
      packageName: 'react',
      attributionIds: ['uuid_B'],
    };
    const expectedDisplayPackageInfoC: DisplayPackageInfo = {
      packageName: 'react',
      comments: ['comment C'],
      attributionIds: ['uuid_A', 'uuid_B'],
    };

    const testDisplayPackageInfoA = convertPackageInfoToDisplayPackageInfo(
      testPackageInfoA,
      testAttributionIdsA
    );
    const testDisplayPackageInfoB = convertPackageInfoToDisplayPackageInfo(
      testPackageInfoB,
      testAttributionIdsB
    );
    const testDisplayPackageInfoC = convertPackageInfoToDisplayPackageInfo(
      testPackageInfoC,
      testAttributionIdsC
    );

    expect(testDisplayPackageInfoA).toEqual(expectedDisplayPackageInfoA);
    expect(testDisplayPackageInfoB).toEqual(expectedDisplayPackageInfoB);
    expect(testDisplayPackageInfoC).toEqual(expectedDisplayPackageInfoC);
  });
});

describe('convertDisplayPackageInfoToPackageInfo', () => {
  it('returns correct PackageInfo', () => {
    const testDisplayPackageInfoA: DisplayPackageInfo = {
      packageName: 'react',
      comments: ['comment A', 'comment B'],
      attributionIds: ['123', '456'],
    };
    const testDisplayPackageInfoB: DisplayPackageInfo = {
      packageName: 'react',
      comments: ['comment'],
      attributionIds: ['123'],
    };
    const testDisplayPackageInfoC: DisplayPackageInfo = {
      packageName: 'react',
      comments: ['comment'],
      attributionIds: [],
    };
    const expectedPackageInfoA: PackageInfo = {
      packageName: 'react',
    };
    const expectedPackageInfoBC: PackageInfo = {
      packageName: 'react',
      comment: 'comment',
    };
    const testPackageInfoA = convertDisplayPackageInfoToPackageInfo(
      testDisplayPackageInfoA
    );
    const testPackageInfoB = convertDisplayPackageInfoToPackageInfo(
      testDisplayPackageInfoB
    );
    const testPackageInfoC = convertDisplayPackageInfoToPackageInfo(
      testDisplayPackageInfoC
    );
    expect(testPackageInfoA).toEqual(expectedPackageInfoA);
    expect(testPackageInfoB).toEqual(expectedPackageInfoBC);
    expect(testPackageInfoC).toEqual(expectedPackageInfoBC);
  });
});
