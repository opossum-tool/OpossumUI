// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  licenseNameContainsSearchTerm,
  packageInfoContainsSearchTerm,
} from '../search-package-info';

describe('packageInfoContainsSearchTerm', () => {
  it('searches by package name', () => {
    const testPackageInfo = {
      packageName: 'Search_term package',
      attributionIds: ['uuid1'],
    };

    expect(packageInfoContainsSearchTerm(testPackageInfo, 'SeArCh_TeRm')).toBe(
      true,
    );
  });

  it('searches by copyright', () => {
    const testPackageInfo = {
      copyright: '(c) Search_term 2022',
      attributionIds: ['uuid2'],
    };

    expect(
      packageInfoContainsSearchTerm(testPackageInfo, 'SeArCh_TeRm'),
    ).toEqual(true);
  });

  it('searches by license name', () => {
    const testPackageInfo = {
      licenseName: 'Search_term licence',
      attributionIds: ['uuid3'],
    };

    expect(
      packageInfoContainsSearchTerm(testPackageInfo, 'SeArCh_TeRm'),
    ).toEqual(true);
  });

  it('searches by package version', () => {
    const testPackageInfo = {
      packageVersion: 'version search_term',
      attributionIds: ['uuid4'],
    };

    expect(
      packageInfoContainsSearchTerm(testPackageInfo, 'SeArCh_TeRm'),
    ).toEqual(true);
  });

  it('ignores other fields', () => {
    const testPackageInfo = {
      comments: ['comment search_term'],
      licenseText: 'text search_term',
      url: 'www.search_term.com',
      attributionIds: ['uuid5'],
    };

    expect(
      packageInfoContainsSearchTerm(testPackageInfo, 'SeArCh_TeRm'),
    ).toEqual(false);
  });
});

describe('licenseNameContainsSearchTerm', () => {
  it('searches by license name', () => {
    const testPackageInfo = {
      licenseName: 'Search_term licence',
      attributionIds: ['uuid3'],
    };

    expect(
      licenseNameContainsSearchTerm(testPackageInfo, 'SeArCh_TeRm'),
    ).toEqual(true);
  });
});
