// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality, PackageInfo } from '../../../shared/shared-types';
import { faker } from '../../../testing/Faker';
import { isImportantAttributionInformationMissing } from '../is-important-attribution-information-missing';

describe('isImportantAttributionInformationMissing', () => {
  it('returns true for a github purl without namespace', () => {
    const testAttributionInfo: PackageInfo = {
      packageType: 'github',
      criticality: Criticality.NonCritical,
      id: faker.string.uuid(),
    };
    expect(
      isImportantAttributionInformationMissing(
        'packageNamespace',
        testAttributionInfo,
      ),
    ).toBe(true);
  });

  it('returns false if exclude from notice', () => {
    const testAttributionInfo: PackageInfo = {
      excludeFromNotice: true,
      criticality: Criticality.NonCritical,
      id: faker.string.uuid(),
    };
    expect(
      isImportantAttributionInformationMissing(
        'excludeFromNotice',
        testAttributionInfo,
      ),
    ).toBe(false);
  });

  it('returns true if package name is missing', () => {
    const testAttributionInfo: PackageInfo = {
      criticality: Criticality.NonCritical,
      id: faker.string.uuid(),
    };
    expect(
      isImportantAttributionInformationMissing(
        'packageName',
        testAttributionInfo,
      ),
    ).toBe(true);
  });

  it('returns false if copyright is not missing', () => {
    const testAttributionInfo: PackageInfo = {
      copyright: 'test',
      criticality: Criticality.NonCritical,
      id: faker.string.uuid(),
    };
    expect(
      isImportantAttributionInformationMissing(
        'copyright',
        testAttributionInfo,
      ),
    ).toBe(false);
  });
});
