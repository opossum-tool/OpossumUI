// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { DisplayPackageInfo } from '../../../shared/shared-types';
import { generatePurl } from '../handle-purl';

describe('generatePurlFromPackageInfo', () => {
  it('generates a valid Purl', () => {
    const testDisplayPackageInfo: DisplayPackageInfo = {
      packageName: 'name',
      packageNamespace: 'namespace',
      packageType: 'type',
      packageVersion: 'version',
      packagePURLAppendix: '?appendix',
      attributionIds: [],
    };
    const expectedPurl = 'pkg:type/namespace/name@version';

    expect(generatePurl(testDisplayPackageInfo)).toBe(expectedPurl);
  });

  it('generates a valid Purl without appendix', () => {
    const testDisplayPackageInfo: DisplayPackageInfo = {
      packageName: 'name',
      packageNamespace: 'namespace',
      packageType: 'type',
      packageVersion: 'version',
      attributionIds: [],
    };
    const expectedPurl = 'pkg:type/namespace/name@version';

    expect(generatePurl(testDisplayPackageInfo)).toBe(expectedPurl);
  });

  it('returns undefined when no packageName is given', () => {
    const testDisplayPackageInfo: DisplayPackageInfo = {
      packageNamespace: 'namespace',
      packageType: 'type',
      packageVersion: 'version',
      attributionIds: [],
    };

    expect(generatePurl(testDisplayPackageInfo)).toBe('');
  });
});
