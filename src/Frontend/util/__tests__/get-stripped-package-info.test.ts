// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Criticality,
  DisplayPackageInfo,
  PackageInfo,
} from '../../../shared/shared-types';
import {
  getStrippedDisplayPackageInfo,
  getStrippedPackageInfo,
} from '../get-stripped-package-info';

describe('The getStrippedPackageInfo function', () => {
  it('strips falsy values', () => {
    const testPackageInfo: PackageInfo = {
      packageName: 'React',
      packageVersion: '',
    };

    expect(getStrippedPackageInfo(testPackageInfo)).toEqual({
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
    };

    expect(getStrippedPackageInfo(testPackageInfo)).toEqual({
      packageName: 'React',
    });
  });

  it('strips preSelected', () => {
    const testPackageInfo: PackageInfo = {
      packageName: 'React',
      preSelected: true,
    };

    expect(getStrippedPackageInfo(testPackageInfo)).toEqual({
      packageName: 'React',
    });
  });

  it('strips criticality', () => {
    const testPackageInfo: PackageInfo = {
      packageName: 'React',
      criticality: Criticality.High,
    };

    expect(getStrippedPackageInfo(testPackageInfo)).toEqual({
      packageName: 'React',
    });
  });

  it('strips excess values', () => {
    const testPackageInfo = {
      packageName: 'React',
      count: 0,
    };

    expect(getStrippedPackageInfo(testPackageInfo)).toEqual({
      packageName: 'React',
    });
  });
});

describe('The getStrippedDisplayPackageInfo function', () => {
  it('strips falsy values', () => {
    const testDisplayPackageInfo: DisplayPackageInfo = {
      packageName: 'React',
      packageVersion: '',
      attributionIds: [],
    };

    expect(getStrippedDisplayPackageInfo(testDisplayPackageInfo)).toEqual({
      packageName: 'React',
      attributionIds: [],
    });
  });

  it('strips source', () => {
    const testDisplayPackageInfo: DisplayPackageInfo = {
      packageName: 'React',
      source: {
        name: 'HC',
        documentConfidence: 10,
      },
      attributionIds: [],
    };

    expect(getStrippedDisplayPackageInfo(testDisplayPackageInfo)).toEqual({
      packageName: 'React',
      attributionIds: [],
    });
  });

  it('strips preSelected', () => {
    const testDisplayPackageInfo: DisplayPackageInfo = {
      packageName: 'React',
      preSelected: true,
      attributionIds: [],
    };

    expect(getStrippedDisplayPackageInfo(testDisplayPackageInfo)).toEqual({
      packageName: 'React',
      attributionIds: [],
    });
  });

  it('strips criticality', () => {
    const testDisplayPackageInfo: DisplayPackageInfo = {
      packageName: 'React',
      criticality: Criticality.High,
      attributionIds: [],
    };

    expect(getStrippedDisplayPackageInfo(testDisplayPackageInfo)).toEqual({
      packageName: 'React',
      attributionIds: [],
    });
  });

  it('strips excess values', () => {
    const testDisplayPackageInfo = {
      packageName: 'React',
      count: 0,
      attributionIds: [],
    };

    expect(getStrippedDisplayPackageInfo(testDisplayPackageInfo)).toEqual({
      packageName: 'React',
      attributionIds: [],
    });
  });
});
