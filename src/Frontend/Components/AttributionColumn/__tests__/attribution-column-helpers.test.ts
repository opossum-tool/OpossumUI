// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { PackagePanelTitle, View } from '../../../enums/enums';
import {
  getLicenseTextMaxRows,
  selectedPackageIsResolved,
} from '../attribution-column-helpers';

describe('The AttributionColumn helpers', () => {
  test('getLicenseTextMaxRows in audit view', () => {
    expect(getLicenseTextMaxRows(1080, View.Audit)).toEqual(35);
  });

  test('getLicenseTextMaxRows in attribution view', () => {
    expect(getLicenseTextMaxRows(1080, View.Attribution)).toEqual(37);
  });

  test('selectedPackageIsResolved returns true', () => {
    expect(
      selectedPackageIsResolved(
        {
          panel: PackagePanelTitle.AllAttributions,
          attributionId: '123',
        },
        new Set<string>().add('123')
      )
    ).toEqual(true);
  });

  test('selectedPackageIsResolved returns false if no selectedpackage', () => {
    expect(
      selectedPackageIsResolved(null, new Set<string>().add('123'))
    ).toEqual(false);
  });

  test('selectedPackageIsResolved returns false if id does not match', () => {
    expect(
      selectedPackageIsResolved(
        {
          panel: PackagePanelTitle.AllAttributions,
          attributionId: '123',
        },
        new Set<string>().add('321')
      )
    ).toEqual(false);
  });
});
