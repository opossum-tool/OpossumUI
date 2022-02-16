// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  generatePurlAppendix,
  generatePurlFromPackageInfo,
  ParsedPurl,
  parsePurl,
} from '../handle-purl';
import { PackageURL } from 'packageurl-js';
import { PackageInfo } from '../../../shared/shared-types';

describe('parsePurl', () => {
  test('returns false for an invalid purl', () => {
    const testPurl = 'pkg:xxx';

    const parsePurlReturn: ParsedPurl = parsePurl(testPurl);
    expect(parsePurlReturn.isValid).toBe(false);
    expect(parsePurlReturn.purl).toBeUndefined();
  });

  test('returns true and packageUrl for a valid purl', () => {
    const testPurl = 'pkg:type/namespace/name@version?qualifiers=#subpath';
    const expectedPackageUrl: Partial<PackageInfo> = {
      packageName: 'name',
      packageNamespace: 'namespace',
      packageType: 'type',
      packagePURLAppendix: '?qualifiers=#subpath',
      packageVersion: 'version',
    };

    const parsePurlReturn: ParsedPurl = parsePurl(testPurl);
    expect(parsePurlReturn.isValid).toBe(true);
    expect(parsePurlReturn.purl).toEqual(expectedPackageUrl);
  });
});

describe('generatePurlFromPackageInfo', () => {
  test('generates a valid Purl', () => {
    const testPackageInfo: PackageInfo = {
      packageName: 'name',
      packageNamespace: 'namespace',
      packageType: 'type',
      packageVersion: 'version',
      packagePURLAppendix: '?appendix',
    };
    const expectedPurl = 'pkg:type/namespace/name@version?appendix';

    expect(generatePurlFromPackageInfo(testPackageInfo)).toBe(expectedPurl);
  });

  test('generates a valid Purl without appendix', () => {
    const testPackageInfo: PackageInfo = {
      packageName: 'name',
      packageNamespace: 'namespace',
      packageType: 'type',
      packageVersion: 'version',
    };
    const expectedPurl = 'pkg:type/namespace/name@version';

    expect(generatePurlFromPackageInfo(testPackageInfo)).toBe(expectedPurl);
  });

  test('returns undefined when no packageName is given', () => {
    const testPackageInfo: PackageInfo = {
      packageNamespace: 'namespace',
      packageType: 'type',
      packageVersion: 'version',
    };

    expect(generatePurlFromPackageInfo(testPackageInfo)).toBe('');
  });

  test('generates Purl with generic type when no packageType is given', () => {
    const testPackageInfo: PackageInfo = {
      packageName: 'name',
      packageNamespace: 'namespace',
      packageVersion: 'version',
    };
    const expectedPurl = 'pkg:generic/namespace/name@version';

    expect(generatePurlFromPackageInfo(testPackageInfo)).toBe(expectedPurl);
  });
});

describe('generatePurlAppendix', () => {
  test('return the purl appendix without subpath', () => {
    const testPackageUrl = new PackageURL(
      'type',
      'namespace',
      'name',
      'version',
      {
        qualifiers: '',
      },
      undefined
    );
    const expectedPurlAppendix = '?qualifiers';

    expect(
      generatePurlAppendix(
        testPackageUrl,
        'pkg:type/namespace/name@version?qualifiers'
      )
    ).toBe(expectedPurlAppendix);
  });

  test('return the purl appendix with subpath', () => {
    const testPackageUrl = new PackageURL(
      'type',
      'namespace',
      'name',
      'version',
      undefined,
      'subpath'
    );
    const expectedPurlAppendix = '#subpath';

    expect(
      generatePurlAppendix(
        testPackageUrl,
        'pkg:type/namespace/name@version?qualifiers'
      )
    ).toBe(expectedPurlAppendix);
  });

  test('return the purl appendix', () => {
    const testPackageUrl = new PackageURL(
      'type',
      'namespace',
      'name',
      'version',
      {
        key: 'value',
        key2: 'value2',
      },
      '/path/to/submodule'
    );
    const expectedPurlAppendix = '?key=value&key2=value2#/path/to/submodule';

    expect(
      generatePurlAppendix(
        testPackageUrl,
        'pkg:type/namespace/name@version?key=value&key2=value2#/path/to/submodule'
      )
    ).toBe(expectedPurlAppendix);
  });
});
