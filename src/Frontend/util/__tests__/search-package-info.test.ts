// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PackageInfo } from '../../../shared/shared-types';
import { packageInfoContainsSearchTerm } from '../search-package-info';

describe('packageInfoContainsSearchTerm', () => {
  it('searches by package name', () => {
    const testPackageInfo: PackageInfo = {
      packageName: 'Search_term package',
      id: 'uuid1',
    };

    expect(packageInfoContainsSearchTerm(testPackageInfo, 'SeArCh_TeRm')).toBe(
      true,
    );
  });

  it('searches by copyright', () => {
    const testPackageInfo: PackageInfo = {
      copyright: '(c) Search_term 2022',
      id: 'uuid2',
    };

    expect(packageInfoContainsSearchTerm(testPackageInfo, 'SeArCh_TeRm')).toBe(
      true,
    );
  });

  it('searches by package version', () => {
    const testPackageInfo: PackageInfo = {
      packageVersion: 'version search_term',
      id: 'uuid4',
    };

    expect(packageInfoContainsSearchTerm(testPackageInfo, 'SeArCh_TeRm')).toBe(
      true,
    );
  });

  it('ignores other fields', () => {
    const testPackageInfo: PackageInfo = {
      licenseText: 'text search_term',
      url: 'www.search_term.com',
      id: 'uuid5',
    };

    expect(packageInfoContainsSearchTerm(testPackageInfo, 'SeArCh_TeRm')).toBe(
      false,
    );
  });
});
