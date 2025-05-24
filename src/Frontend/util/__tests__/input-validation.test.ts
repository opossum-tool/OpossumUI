// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker } from '../../../testing/Faker';
import { isPackageIncomplete, isPackageInvalid } from '../input-validation';

describe('isPackageIncomplete', () => {
  it('returns true if package name is missing', () => {
    const packageInfo = faker.opossum.packageInfo({
      packageName: '',
    });
    expect(isPackageIncomplete(packageInfo)).toBe(true);
  });

  it('ignores incompleteness if excluded from notice', () => {
    const packageInfo = faker.opossum.packageInfo({
      packageName: '',
      excludeFromNotice: true,
    });
    expect(isPackageIncomplete(packageInfo)).toBe(false);
  });

  it('ignores incompleteness if first party', () => {
    const packageInfo = faker.opossum.packageInfo({
      packageName: '',
      firstParty: true,
    });
    expect(isPackageIncomplete(packageInfo)).toBe(false);
  });

  it('returns true for a github purl without namespace', () => {
    const packageInfo = faker.opossum.packageInfo({
      packageType: 'github',
      packageNamespace: '',
    });
    expect(isPackageIncomplete(packageInfo)).toBe(true);
  });
});

describe('isPackageInvalid', () => {
  it('returns true for invalid package types', () => {
    const packageInfo = faker.opossum.packageInfo({
      packageType: ';github',
    });
    expect(isPackageInvalid(packageInfo)).toBe(true);
  });

  it('returns false for valid package types', () => {
    const packageInfo = faker.opossum.packageInfo({
      packageType: 'github',
    });
    expect(isPackageInvalid(packageInfo)).toBe(false);
  });
});
