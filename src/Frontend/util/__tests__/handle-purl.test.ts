// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { PackageURL } from 'packageurl-js';

import { DisplayPackageInfo, PackageInfo } from '../../../shared/shared-types';
import {
  generatePurlAppendix,
  generatePurlFromDisplayPackageInfo,
  ParsedPurl,
  parsePurl,
} from '../handle-purl';

describe('parsePurl', () => {
  it('returns false for an invalid purl', () => {
    const testPurl = 'pkg:xxx';

    const parsePurlReturn: ParsedPurl = parsePurl(testPurl);
    expect(parsePurlReturn.isValid).toBe(false);
    expect(parsePurlReturn.purl).toBeUndefined();
  });

  it('returns true and packageUrl for a valid purl', () => {
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
  it('generates a valid Purl', () => {
    const testDisplayPackageInfo: DisplayPackageInfo = {
      packageName: 'name',
      packageNamespace: 'namespace',
      packageType: 'type',
      packageVersion: 'version',
      packagePURLAppendix: '?appendix',
      attributionIds: [],
    };
    const expectedPurl = 'pkg:type/namespace/name@version?appendix';

    expect(generatePurlFromDisplayPackageInfo(testDisplayPackageInfo)).toBe(
      expectedPurl,
    );
  });

  it('generates a valid Purl without appendix', () => {
    const testDisplayPackageInfo: DisplayPackageInfo = {
      packageName: 'name',
      packageNamespace: 'namespace',
      packageType: 'type',
      packageVersion: 'version',
      attributionIds: [],
    };
    const expectedPurl = 'pkg:type/namespace/name@version';

    expect(generatePurlFromDisplayPackageInfo(testDisplayPackageInfo)).toBe(
      expectedPurl,
    );
  });

  it('returns undefined when no packageName is given', () => {
    const testDisplayPackageInfo: DisplayPackageInfo = {
      packageNamespace: 'namespace',
      packageType: 'type',
      packageVersion: 'version',
      attributionIds: [],
    };

    expect(generatePurlFromDisplayPackageInfo(testDisplayPackageInfo)).toBe('');
  });

  it('generates Purl with generic type when no packageType is given', () => {
    const testDisplayPackageInfo: DisplayPackageInfo = {
      packageName: 'name',
      packageNamespace: 'namespace',
      packageVersion: 'version',
      attributionIds: [],
    };
    const expectedPurl = 'pkg:generic/namespace/name@version';

    expect(generatePurlFromDisplayPackageInfo(testDisplayPackageInfo)).toBe(
      expectedPurl,
    );
  });
});

describe('generatePurlAppendix', () => {
  it('return the purl appendix without subpath', () => {
    const testPackageUrl = new PackageURL(
      'type',
      'namespace',
      'name',
      'version',
      {
        qualifiers: '',
      },
      undefined,
    );
    const expectedPurlAppendix = '?qualifiers';

    expect(
      generatePurlAppendix(
        testPackageUrl,
        'pkg:type/namespace/name@version?qualifiers',
      ),
    ).toBe(expectedPurlAppendix);
  });

  it('return the purl appendix with subpath', () => {
    const testPackageUrl = new PackageURL(
      'type',
      'namespace',
      'name',
      'version',
      undefined,
      'subpath',
    );
    const expectedPurlAppendix = '#subpath';

    expect(
      generatePurlAppendix(
        testPackageUrl,
        'pkg:type/namespace/name@version?qualifiers',
      ),
    ).toBe(expectedPurlAppendix);
  });

  it('return the purl appendix', () => {
    const testPackageUrl = new PackageURL(
      'type',
      'namespace',
      'name',
      'version',
      {
        key: 'value',
        key2: 'value2',
      },
      '/path/to/submodule',
    );
    const expectedPurlAppendix = '?key=value&key2=value2#/path/to/submodule';

    expect(
      generatePurlAppendix(
        testPackageUrl,
        'pkg:type/namespace/name@version?key=value&key2=value2#/path/to/submodule',
      ),
    ).toBe(expectedPurlAppendix);
  });
});
