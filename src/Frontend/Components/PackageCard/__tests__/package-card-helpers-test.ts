// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  addFirstLineOfPackageLabelFromAttribute,
  addPreambleToCopyright,
  addSecondLineOfPackageLabelFromAttribute,
  getCardLabels,
} from '../package-card-helpers';
import { ListCardContent } from '../../../types/types';

describe('Test getPackageLabel', () => {
  const testProps: ListCardContent = {
    name: 'Test package name',
    packageVersion: '1.2',
    copyright: '(c) Test copyright',
    licenseText: 'Test license text',
    comment: 'Test comment',
    url: 'Test url',
    licenseName: 'Test license name',
  };
  const testPropsWithoutVersion: ListCardContent = {
    name: 'Test package name',
    copyright: 'Test copyright',
    licenseText: 'Test license text',
    comment: 'Test comment',
    url: 'Test url',
    licenseName: 'Test license name',
  };
  const testPropsWithUndefinedName: ListCardContent = {
    name: undefined,
    copyright: 'Test copyright',
    licenseText: 'Test license text',
    comment: 'Test comment',
    url: 'Test url',
    licenseName: 'Test license name',
  };
  const testPropsWithoutName: ListCardContent = {
    copyright: 'Test copyright',
    licenseText: 'Test license text',
    comment: 'Test comment',
    url: 'Test url',
    licenseName: 'Test license name',
  };
  const testPropsCopyrightLicenseTextAndComment: ListCardContent = {
    copyright: 'Test copyright',
    licenseText: 'Test license text',
    comment: 'Test comment',
  };
  const testPropsWithLicenseTextAndComment: ListCardContent = {
    licenseText: 'Test license text',
    comment: 'Test comment',
  };
  const testPropsJustComment: ListCardContent = {
    comment: 'Test comment',
  };
  const testPropsJustUrlAndCopyright: ListCardContent = {
    copyright: 'Test copyright',
    url: 'Test url',
  };

  test('finds label for package', () => {
    expect(getCardLabels(testProps)).toEqual([
      'Test package name, 1.2',
      '(c) Test copyright',
    ]);
  });
  test('finds label for package without version', () => {
    expect(getCardLabels(testPropsWithoutVersion)).toEqual([
      'Test package name',
      '(c) Test copyright',
    ]);
  });
  test('finds label for package with undefined name', () => {
    expect(getCardLabels(testPropsWithUndefinedName)).toEqual([
      'Test url',
      '(c) Test copyright',
    ]);
  });
  test('finds label for package without name', () => {
    expect(getCardLabels(testPropsWithoutName)).toEqual([
      'Test url',
      '(c) Test copyright',
    ]);
  });
  test('finds label for package with only copyright, licenseText and comment', () => {
    expect(getCardLabels(testPropsCopyrightLicenseTextAndComment)).toEqual([
      '(c) Test copyright',
      'Test license text',
    ]);
  });
  test('finds label for package with license text and comment', () => {
    expect(getCardLabels(testPropsWithLicenseTextAndComment)).toEqual([
      'Test license text',
      'Test comment',
    ]);
  });
  test('finds label for package with just comment', () => {
    expect(getCardLabels(testPropsJustComment)).toEqual(['Test comment']);
  });
  test('finds label for empty package', () => {
    expect(getCardLabels({})).toEqual([]);
  });
  test('finds label for package with just url and copyright', () => {
    expect(getCardLabels(testPropsJustUrlAndCopyright)).toEqual([
      'Test url',
      '(c) Test copyright',
    ]);
  });
});

describe('Test addFirstLineOfPackageLabelFromAttribute', () => {
  const testProps: ListCardContent = {
    name: 'Test package name',
    packageVersion: '1.2',
    copyright: 'Test copyright',
    licenseText: 'Test license text',
    comment: 'Test comment',
    url: 'Test url',
    licenseName: 'Test license name',
  };
  const testPropsWithoutVersion: ListCardContent = {
    name: 'Test package name',
    copyright: 'Test copyright',
    licenseText: 'Test license text',
    comment: 'Test comment',
    url: 'Test url',
    licenseName: 'Test license name',
  };

  test('adds name and version', () => {
    const testPackageLabels: Array<string> = [];
    addFirstLineOfPackageLabelFromAttribute(
      'name',
      testProps,
      testPackageLabels
    );
    expect(testPackageLabels).toEqual(['Test package name, 1.2']);
  });
  test('adds name without version', () => {
    const testPackageLabels: Array<string> = [];
    addFirstLineOfPackageLabelFromAttribute(
      'name',
      testPropsWithoutVersion,
      testPackageLabels
    );
    expect(testPackageLabels).toEqual(['Test package name']);
  });
  test('adds copyright', () => {
    const testPackageLabels: Array<string> = [];
    addFirstLineOfPackageLabelFromAttribute(
      'copyright',
      testProps,
      testPackageLabels
    );
    expect(testPackageLabels).toEqual(['(c) Test copyright']);
  });
  test('adds url', () => {
    const testPackageLabels: Array<string> = [];
    addFirstLineOfPackageLabelFromAttribute(
      'url',
      testProps,
      testPackageLabels
    );
    expect(testPackageLabels).toEqual(['Test url']);
  });
});

describe('Test addSecondLineOfPackageLabelFromAttribute', () => {
  const testProps: ListCardContent = {
    name: 'Test package name',
    packageVersion: '1.2',
    copyright: 'Test copyright',
    licenseText: 'Test license text',
    comment: 'Test comment',
    url: 'Test url',
    licenseName: 'Test license name',
  };
  test('adds copyright', () => {
    const testPackageLabels: Array<string> = ['Test package name'];
    addSecondLineOfPackageLabelFromAttribute(
      'copyright',
      testProps,
      testPackageLabels
    );
    expect(testPackageLabels).toEqual([
      'Test package name',
      '(c) Test copyright',
    ]);
  });
  test('does not add url if already in first line', () => {
    const testPackageLabels: Array<string> = ['Test url'];
    addSecondLineOfPackageLabelFromAttribute(
      'url',
      testProps,
      testPackageLabels
    );
    expect(testPackageLabels).toEqual(['Test url']);
  });
});

describe('Test addPreambleToCopyright', () => {
  test('adds preamble to copyright', () => {
    expect(addPreambleToCopyright('Test copyright without preamble')).toEqual(
      '(c) Test copyright without preamble'
    );
  });
  test('does not add preamble to copyright', () => {
    expect(
      addPreambleToCopyright('(C)Test copyright without preamble')
    ).toEqual('(C)Test copyright without preamble');
    expect(
      addPreambleToCopyright('(c)Test copyright without preamble')
    ).toEqual('(c)Test copyright without preamble');
    expect(
      addPreambleToCopyright('Copyright Test copyright without preamble')
    ).toEqual('Copyright Test copyright without preamble');
  });
});
