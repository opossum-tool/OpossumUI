// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { selectedPackagesAreResolved } from '../AttributionColumn.util';

describe('The AttributionColumn helpers', () => {
  it('selectedPackageIsResolved returns true', () => {
    expect(
      selectedPackagesAreResolved(['123'], new Set<string>().add('123')),
    ).toBe(true);
  });

  it('selectedPackageIsResolved returns false if empty attributionId', () => {
    expect(
      selectedPackagesAreResolved([''], new Set<string>().add('123')),
    ).toBe(false);
  });

  it('selectedPackageIsResolved returns false if empty array of attributionIds', () => {
    expect(selectedPackagesAreResolved([], new Set<string>().add('123'))).toBe(
      false,
    );
  });

  it('selectedPackageIsResolved returns false if id does not match', () => {
    expect(
      selectedPackagesAreResolved(['123'], new Set<string>().add('321')),
    ).toBe(false);
  });

  it('selectedPackageIsResolved returns false if only a subset matches', () => {
    expect(
      selectedPackagesAreResolved(['123', '456'], new Set<string>().add('123')),
    ).toBe(false);
  });
});
