// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { Attributions, PackageInfo } from '../../../shared/shared-types';
import { getFilteredAttributionsById } from '../get-filtered-attributions-by-id';

describe('The helper getFilteredAttributionsById', () => {
  const firstExpectedPackage: PackageInfo = { packageName: 'first' };
  const secondExpectedPackage: PackageInfo = { packageName: 'second' };
  const otherPackage: PackageInfo = { packageName: 'wrong' };
  const firstExpectedPackageUuid = 'f1388bc0-12d0-11eb-adc1-0242ac120002';
  const secondExpectedPackageUuid = 'f1388f3a-12d0-11eb-adc1-0242ac120002';
  const otherPackageUuid = 'f1389084-12d0-11eb-adc1-0242ac120002';
  const testManualAttributions: Attributions = {
    [firstExpectedPackageUuid]: firstExpectedPackage,
    [otherPackageUuid]: otherPackage,
    [secondExpectedPackageUuid]: secondExpectedPackage,
  };
  const expectedAttributions: Attributions = {
    [firstExpectedPackageUuid]: firstExpectedPackage,
    [secondExpectedPackageUuid]: secondExpectedPackage,
  };

  test('return correct attributions', () => {
    const filteredAttributions = getFilteredAttributionsById(
      [firstExpectedPackageUuid, secondExpectedPackageUuid],
      testManualAttributions
    );

    expect(filteredAttributions).toStrictEqual(expectedAttributions);
  });
});
