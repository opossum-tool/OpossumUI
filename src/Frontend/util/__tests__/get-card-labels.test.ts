// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { faker } from '../../../testing/Faker';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../shared-constants';
import {
  addFirstLineOfPackageLabelFromAttribute,
  addPreambleToCopyright,
  addSecondLineOfPackageLabelFromAttribute,
  getCardLabels,
} from '../get-card-labels';

describe('Test getPackageLabel', () => {
  const testProps: PackageInfo = {
    packageName: 'Test package name',
    packageVersion: '1.2',
    copyright: '(c) Test copyright',
    licenseText: 'Test license text',
    comment: 'Test comment',
    url: 'Test url',
    licenseName: 'Test license name',
    id: faker.string.uuid(),
  };
  const testPropsWithoutVersion: PackageInfo = {
    packageName: 'Test package name',
    copyright: 'Test copyright',
    licenseText: 'Test license text',
    comment: 'Test comment',
    url: 'Test url',
    licenseName: 'Test license name',
    id: faker.string.uuid(),
  };
  const testPropsWithUndefinedName: PackageInfo = {
    packageName: undefined,
    copyright: 'Test copyright',
    licenseText: 'Test license text',
    comment: 'Test comment',
    url: 'Test url',
    licenseName: 'Test license name',
    id: faker.string.uuid(),
  };
  const testPropsWithoutName: PackageInfo = {
    copyright: 'Test copyright',
    licenseText: 'Test license text',
    comment: 'Test comment',
    url: 'Test url',
    licenseName: 'Test license name',
    id: faker.string.uuid(),
  };
  const testPropsCopyrightLicenseTextAndComment: PackageInfo = {
    copyright: 'Test copyright',
    licenseText: 'Test license text',
    comment: 'Test comment',
    id: faker.string.uuid(),
  };
  const testPropsWithLicenseTextAndComment: PackageInfo = {
    licenseText: 'Test license text',
    comment: 'Test comment',
    id: faker.string.uuid(),
  };
  const testPropsJustComment: PackageInfo = {
    comment: 'Test comment',
    id: faker.string.uuid(),
  };
  const testPropsJustUrlAndCopyright: PackageInfo = {
    copyright: 'Test copyright',
    url: 'Test url',
    id: faker.string.uuid(),
  };
  const testPropsJustFirstParty: PackageInfo = {
    firstParty: true,
    id: faker.string.uuid(),
  };

  it('finds label for package', () => {
    expect(getCardLabels(testProps)).toEqual([
      'Test package name, 1.2',
      'Test license name',
    ]);
  });

  it('finds label for package without version', () => {
    expect(getCardLabels(testPropsWithoutVersion)).toEqual([
      'Test package name',
      'Test license name',
    ]);
  });

  it('finds label for package with undefined name', () => {
    expect(getCardLabels(testPropsWithUndefinedName)).toEqual([
      'Test url',
      'Test license name',
    ]);
  });

  it('finds label for package without name', () => {
    expect(getCardLabels(testPropsWithoutName)).toEqual([
      'Test url',
      'Test license name',
    ]);
  });

  it('finds label for package with only copyright, licenseText and comment', () => {
    expect(getCardLabels(testPropsCopyrightLicenseTextAndComment)).toEqual([
      '(c) Test copyright',
      'Test license text',
    ]);
  });

  it('finds label for package with license text and comment', () => {
    expect(getCardLabels(testPropsWithLicenseTextAndComment)).toEqual([
      'Test license text',
      'Test comment',
    ]);
  });

  it('finds label for package with just comment', () => {
    expect(getCardLabels(testPropsJustComment)).toEqual(['Test comment']);
  });

  it('finds label for empty package', () => {
    expect(getCardLabels(EMPTY_DISPLAY_PACKAGE_INFO)).toEqual([]);
  });

  it('finds label for package with just url and copyright', () => {
    expect(getCardLabels(testPropsJustUrlAndCopyright)).toEqual([
      'Test url',
      '(c) Test copyright',
    ]);
  });

  it('finds label for package with just first party', () => {
    expect(getCardLabels(testPropsJustFirstParty)).toEqual([
      text.packageLists.firstParty,
    ]);
  });
});

describe('Test addFirstLineOfPackageLabelFromAttribute', () => {
  const testProps: PackageInfo = {
    packageName: 'Test package name',
    packageVersion: '1.2',
    copyright: 'Test copyright',
    licenseText: 'Test license text',
    comment: 'Test comment',
    url: 'Test url',
    licenseName: 'Test license name',
    id: faker.string.uuid(),
  };
  const testPropsWithoutVersion: PackageInfo = {
    packageName: 'Test package name',
    copyright: 'Test copyright',
    licenseText: 'Test license text',
    comment: 'Test comment',
    url: 'Test url',
    licenseName: 'Test license name',
    id: faker.string.uuid(),
  };

  it('adds name and version', () => {
    const testPackageLabels: Array<string> = [];
    addFirstLineOfPackageLabelFromAttribute(
      'packageName',
      testProps,
      testPackageLabels,
    );
    expect(testPackageLabels).toEqual(['Test package name, 1.2']);
  });

  it('adds name without version', () => {
    const testPackageLabels: Array<string> = [];
    addFirstLineOfPackageLabelFromAttribute(
      'packageName',
      testPropsWithoutVersion,
      testPackageLabels,
    );
    expect(testPackageLabels).toEqual(['Test package name']);
  });

  it('adds copyright', () => {
    const testPackageLabels: Array<string> = [];
    addFirstLineOfPackageLabelFromAttribute(
      'copyright',
      testProps,
      testPackageLabels,
    );
    expect(testPackageLabels).toEqual(['(c) Test copyright']);
  });

  it('adds url', () => {
    const testPackageLabels: Array<string> = [];
    addFirstLineOfPackageLabelFromAttribute(
      'url',
      testProps,
      testPackageLabels,
    );
    expect(testPackageLabels).toEqual(['Test url']);
  });
});

describe('Test addSecondLineOfPackageLabelFromAttribute', () => {
  const testProps: PackageInfo = {
    packageName: 'Test package name',
    packageVersion: '1.2',
    copyright: 'Test copyright',
    licenseText: 'Test license text',
    comment: 'Test comment',
    url: 'Test url',
    licenseName: 'Test license name',
    id: faker.string.uuid(),
  };
  it('adds copyright', () => {
    const testPackageLabels: Array<string> = ['Test package name'];
    addSecondLineOfPackageLabelFromAttribute(
      'copyright',
      testProps,
      testPackageLabels,
    );
    expect(testPackageLabels).toEqual([
      'Test package name',
      '(c) Test copyright',
    ]);
  });
  it('does not add url if already in first line', () => {
    const testPackageLabels: Array<string> = ['Test url'];
    addSecondLineOfPackageLabelFromAttribute(
      'url',
      testProps,
      testPackageLabels,
    );
    expect(testPackageLabels).toEqual(['Test url']);
  });
});

describe('Test addPreambleToCopyright', () => {
  it('adds preamble to copyright', () => {
    expect(addPreambleToCopyright('Test copyright without preamble')).toBe(
      '(c) Test copyright without preamble',
    );
  });
  it('does not add preamble to copyright', () => {
    expect(addPreambleToCopyright('(C)Test copyright without preamble')).toBe(
      '(C)Test copyright without preamble',
    );
    expect(addPreambleToCopyright('(c)Test copyright without preamble')).toBe(
      '(c)Test copyright without preamble',
    );
    expect(
      addPreambleToCopyright('Copyright Test copyright without preamble'),
    ).toBe('Copyright Test copyright without preamble');
  });
});
