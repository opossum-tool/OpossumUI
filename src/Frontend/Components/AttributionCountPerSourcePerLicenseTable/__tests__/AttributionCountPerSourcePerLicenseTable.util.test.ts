// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { Criticality } from '../../../../shared/shared-types';
import { LicenseCounts } from '../../../types/types';
import {
  orderLicenseNames,
  SingleColumn,
} from '../AttributionCountPerSourcePerLicenseTable.util';

describe('orderLicenseNames', () => {
  const licenseNamesWithCriticality = {
    a: Criticality.High,
    b: Criticality.High,
    c: Criticality.Medium,
    d: Criticality.Medium,
    e: Criticality.None,
    f: Criticality.None,
  };

  const licenseNamesWithClassifications = {
    a: 0,
    b: 3,
    c: 1,
    d: 1,
    e: 2,
    f: 0,
  };

  const licenseCounts: LicenseCounts = {
    attributionCountPerSourcePerLicense: {
      a: { source1: 3, source2: 7 },
      b: { source1: 5, source2: 8 },
      c: { source1: 0, source2: 5 },
      d: { source1: 1, source2: 1 },
      e: { source1: 5, source2: 5 },
      f: { source1: 4, source2: 6 },
    },
    totalAttributionsPerLicense: {
      a: 10,
      b: 13,
      c: 5,
      d: 2,
      e: 10,
      f: 10,
    },
    totalAttributionsPerSource: {},
  };

  it('orders by license name', () => {
    const expectedOrder = ['a', 'b', 'c', 'd', 'e', 'f'];

    const actualOrder = orderLicenseNames(
      licenseNamesWithCriticality,
      licenseNamesWithClassifications,
      licenseCounts,
      'asc',
      SingleColumn.NAME,
    );

    expect(actualOrder).toEqual(expectedOrder);
  });

  it('orders by criticality', () => {
    const expectedOrder = ['e', 'f', 'c', 'd', 'a', 'b'];

    const actualOrder = orderLicenseNames(
      licenseNamesWithCriticality,
      licenseNamesWithClassifications,
      licenseCounts,
      'asc',
      SingleColumn.CRITICALITY,
    );

    expect(actualOrder).toEqual(expectedOrder);
  });

  it('orders by classification', () => {
    const expectedOrder = ['a', 'f', 'c', 'd', 'e', 'b'];

    const actualOrder = orderLicenseNames(
      licenseNamesWithCriticality,
      licenseNamesWithClassifications,
      licenseCounts,
      'asc',
      SingleColumn.CLASSIFICATION,
    );

    expect(actualOrder).toEqual(expectedOrder);
  });

  it('orders by total count', () => {
    const expectedOrder = ['d', 'c', 'a', 'e', 'f', 'b'];

    const actualOrder = orderLicenseNames(
      licenseNamesWithCriticality,
      licenseNamesWithClassifications,
      licenseCounts,
      'asc',
      SingleColumn.TOTAL,
    );

    expect(actualOrder).toEqual(expectedOrder);
  });

  it('orders by count for selected source', () => {
    const expectedOrder = ['c', 'd', 'a', 'f', 'b', 'e'];

    const actualOrder = orderLicenseNames(
      licenseNamesWithCriticality,
      licenseNamesWithClassifications,
      licenseCounts,
      'asc',
      { sourceName: 'source1' },
    );

    expect(actualOrder).toEqual(expectedOrder);
  });
});
