// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality, PackageInfo } from '../../../shared/shared-types';
import { faker } from '../../../testing/Faker';
import { getStrippedPackageInfo } from '../get-stripped-package-info';

describe('getStrippedPackageInfo', () => {
  it('strips falsy values', () => {
    const testPackageInfo: PackageInfo = {
      packageName: 'React',
      packageVersion: '',
      criticality: Criticality.None,
      id: faker.string.uuid(),
    };

    expect(getStrippedPackageInfo(testPackageInfo)).toEqual<
      Partial<PackageInfo>
    >({
      packageName: 'React',
    });
  });

  it('strips source', () => {
    const testPackageInfo: PackageInfo = {
      packageName: 'React',
      source: {
        name: 'HC',
        documentConfidence: 10,
      },
      criticality: Criticality.None,
      id: faker.string.uuid(),
    };

    expect(getStrippedPackageInfo(testPackageInfo)).toEqual<
      Partial<PackageInfo>
    >({
      packageName: 'React',
    });
  });

  it('strips preSelected', () => {
    const testPackageInfo: PackageInfo = {
      packageName: 'React',
      preSelected: true,
      criticality: Criticality.None,
      id: faker.string.uuid(),
    };

    expect(getStrippedPackageInfo(testPackageInfo)).toEqual<
      Partial<PackageInfo>
    >({
      packageName: 'React',
    });
  });

  it('strips criticality', () => {
    const testPackageInfo: PackageInfo = {
      packageName: 'React',
      criticality: Criticality.High,
      id: faker.string.uuid(),
    };

    expect(getStrippedPackageInfo(testPackageInfo)).toEqual<
      Partial<PackageInfo>
    >({
      packageName: 'React',
    });
  });

  it('strips excess values', () => {
    const testPackageInfo = {
      packageName: 'React',
      foo: 0,
      criticality: Criticality.None,
      id: faker.string.uuid(),
    };

    expect(getStrippedPackageInfo(testPackageInfo)).toEqual<
      Partial<PackageInfo>
    >({
      packageName: 'React',
    });
  });
});
