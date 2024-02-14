// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  PackageInfo,
  ResourcesToAttributions,
} from '../../../shared/shared-types';
import {
  getClosestParentAttributions,
  getClosestParentWithAttributions,
} from '../get-closest-parent-attributions';

const expectedPackageUuid = '8ef8dff4-8e9d-4cab-b70b-44fa498957a9';
const otherPackageUuid = 'd8ff89ae-34d0-4899-9519-7f736e7fd7da';
const expectedPackage: PackageInfo = {
  packageName: 'right',
  id: expectedPackageUuid,
};
const otherPackage: PackageInfo = {
  packageName: 'wrong',
  id: otherPackageUuid,
};
const testManualAttributions: Attributions = {
  [expectedPackageUuid]: expectedPackage,
  [otherPackageUuid]: otherPackage,
};
const expectedAttributions: Attributions = {
  [expectedPackageUuid]: expectedPackage,
};

describe('The helper getClosestParentAttribution', () => {
  it.each([
    [
      '/f1/f2/f3/',
      {
        '/f1/': [expectedPackageUuid],
        '/f1/f4': [otherPackageUuid],
        '/f1/f2/f3/f4': [otherPackageUuid],
      },
    ],
    [
      '/f1/f2/f3/',
      {
        '/': [otherPackageUuid],
        '/f1/': [otherPackageUuid],
        '/f1/f2/': [expectedPackageUuid],
      },
    ],
    [
      '/f1/f2/f3/',
      {
        '/': [expectedPackageUuid],
        '/f1/f2/f3/f4': [otherPackageUuid],
      },
    ],
    [
      '/f1/f2/',
      {
        '/f1/': [expectedPackageUuid],
      },
    ],
    [
      '/f1/f2/f3/f4/f5/f6/f7/f8',
      {
        '/f1/': [expectedPackageUuid],
        '/f9': [otherPackageUuid],
        '/f1/f10': [otherPackageUuid],
        '/f1/f3': [otherPackageUuid],
      },
    ],
  ] satisfies Array<[string, ResourcesToAttributions]>)(
    'finds the closest parent package if one exists',
    (path, resourcesToManualAttributions) => {
      const closest = getClosestParentAttributions(
        path,
        testManualAttributions,
        resourcesToManualAttributions,
        new Set(),
      );
      expect(closest).toStrictEqual(expectedAttributions);
    },
  );

  it.each([
    [
      '/f1/f2/f3',
      {
        '/f1/f4': [otherPackageUuid],
        '/f5/': [otherPackageUuid],
      },
    ],
    [
      '/f1',
      {
        '/f1': [otherPackageUuid],
      },
    ],
    [
      '/f1/f2',
      {
        '/ff1': [otherPackageUuid],
        '/f2': [otherPackageUuid],
        '/ef1': [otherPackageUuid],
        '/f 1 ': [otherPackageUuid],
      },
    ],
  ] satisfies Array<[string, ResourcesToAttributions]>)(
    'returns null if there is no parent package',
    (path, resourcesToManualAttributions) => {
      const closest = getClosestParentAttributions(
        path,
        testManualAttributions,
        resourcesToManualAttributions,
        new Set(),
      );
      expect(closest).toBeNull();
    },
  );

  it('returns null for root folder', () => {
    const closest = getClosestParentAttributions(
      '/',
      {
        [otherPackageUuid]: otherPackage,
      },
      { '/': [otherPackageUuid] },
      new Set(),
    );
    expect(closest).toBeNull();
  });
});

describe('getClosestParentWithAttributions', () => {
  it('returns the id of the closest parent with attributions', () => {
    const childId = '/parent1/parent2/parent3/child';
    const resourcesToAttributions: ResourcesToAttributions = {
      '/parent1/parent2/': ['uuid1'],
      '/parent1/': ['uuid1'],
    };

    expect(
      getClosestParentWithAttributions(
        childId,
        resourcesToAttributions,
        new Set(),
      ),
    ).toBe('/parent1/parent2/');
  });

  it('respects breakpoints', () => {
    const childId = '/parent1/parent2/parent3/child';
    const resourcesToAttributions: ResourcesToAttributions = {
      '/parent1/parent2/': ['uuid1'],
      '/parent1/': ['uuid1'],
    };

    expect(
      getClosestParentWithAttributions(
        childId,
        resourcesToAttributions,
        new Set(['/parent1/parent2/parent3/']),
      ),
    ).toBeNull();
  });
});
