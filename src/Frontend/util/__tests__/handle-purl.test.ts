// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality, PackageInfo } from '../../../shared/shared-types';
import { faker } from '../../../testing/Faker';
import { generatePurl } from '../handle-purl';

describe('generatePurlFromPackageInfo', () => {
  it('generates a valid Purl', () => {
    const testDisplayPackageInfo: PackageInfo = {
      packageName: 'name',
      packageNamespace: 'namespace',
      packageType: 'type',
      packageVersion: 'version',
      packagePURLAppendix: '?appendix',
      criticality: Criticality.None,
      id: faker.string.uuid(),
    };
    const expectedPurl = 'pkg:type/namespace/name@version';

    expect(generatePurl(testDisplayPackageInfo)).toBe(expectedPurl);
  });

  it('generates a valid Purl without appendix', () => {
    const testDisplayPackageInfo: PackageInfo = {
      packageName: 'name',
      packageNamespace: 'namespace',
      packageType: 'type',
      packageVersion: 'version',
      criticality: Criticality.None,
      id: faker.string.uuid(),
    };
    const expectedPurl = 'pkg:type/namespace/name@version';

    expect(generatePurl(testDisplayPackageInfo)).toBe(expectedPurl);
  });

  it('returns undefined when no packageName is given', () => {
    const testDisplayPackageInfo: PackageInfo = {
      packageNamespace: 'namespace',
      packageType: 'type',
      packageVersion: 'version',
      criticality: Criticality.None,
      id: faker.string.uuid(),
    };

    expect(generatePurl(testDisplayPackageInfo)).toBe('');
  });
});
