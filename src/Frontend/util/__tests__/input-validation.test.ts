// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker } from '../../../testing/Faker';
import { isPackageIncomplete, isPackageInvalid } from '../input-validation';

describe('isPackageIncomplete', () => {
  it('returns true if package name is missing', () => {
    const packageInfo = faker.opossum.packageInfo({
      packageName: '',
    });
    expect(isPackageIncomplete(packageInfo)).toBe(true);
  });

  it('ignores incompleteness if excluded from notice', () => {
    const packageInfo = faker.opossum.packageInfo({
      packageName: '',
      excludeFromNotice: true,
    });
    expect(isPackageIncomplete(packageInfo)).toBe(false);
  });

  it('ignores incompleteness if first party', () => {
    const packageInfo = faker.opossum.packageInfo({
      packageName: '',
      firstParty: true,
    });
    expect(isPackageIncomplete(packageInfo)).toBe(false);
  });

  it('returns true for a github purl without namespace', () => {
    const packageInfo = faker.opossum.packageInfo({
      packageType: 'github',
      packageNamespace: '',
    });
    expect(isPackageIncomplete(packageInfo)).toBe(true);
  });
});

describe('isPackageInvalid', () => {
  it('returns true for invalid package types', () => {
    const packageInfo = faker.opossum.packageInfo({
      packageType: ';github',
    });
    expect(isPackageInvalid(packageInfo)).toBe(true);
  });

  it('returns false for valid package types', () => {
    const packageInfo = faker.opossum.packageInfo({
      packageType: 'github',
    });
    expect(isPackageInvalid(packageInfo)).toBe(false);
  });

  describe('URL validation', () => {
    it('returns false for URLs with ports', () => {
      const packageInfo = faker.opossum.packageInfo({
        url: 'http://example.com:8080/repo',
      });
      expect(isPackageInvalid(packageInfo)).toBe(false);
    });

    it('returns false for valid URLs with https protocol', () => {
      const packageInfo = faker.opossum.packageInfo({
        url: 'https://github.com/example/repo',
      });
      expect(isPackageInvalid(packageInfo)).toBe(false);
    });

    it('returns false for valid URLs with http protocol', () => {
      const packageInfo = faker.opossum.packageInfo({
        url: 'http://example.com',
      });
      expect(isPackageInvalid(packageInfo)).toBe(false);
    });

    it('returns false for valid URLs without protocol', () => {
      const packageInfo = faker.opossum.packageInfo({
        url: 'github.com/example/repo',
      });
      expect(isPackageInvalid(packageInfo)).toBe(false);
    });

    it('returns false for URLs with subdomains', () => {
      const packageInfo = faker.opossum.packageInfo({
        url: 'https://api.github.com/repos',
      });
      expect(isPackageInvalid(packageInfo)).toBe(false);
    });

    it('returns false for URLs with paths and query params', () => {
      const packageInfo = faker.opossum.packageInfo({
        url: 'https://example.com/path/to/resource?param=value',
      });
      expect(isPackageInvalid(packageInfo)).toBe(false);
    });

    it('returns false for empty URL', () => {
      const packageInfo = faker.opossum.packageInfo({
        url: '',
      });
      expect(isPackageInvalid(packageInfo)).toBe(false);
    });

    it('returns true for URLs with spaces', () => {
      const packageInfo = faker.opossum.packageInfo({
        url: 'https://example .com',
      });
      expect(isPackageInvalid(packageInfo)).toBe(true);
    });

    it('returns true for URLs with invalid characters', () => {
      const packageInfo = faker.opossum.packageInfo({
        url: 'https://example<>.com',
      });
      expect(isPackageInvalid(packageInfo)).toBe(true);
    });

    it('returns true for localhost URLs', () => {
      const packageInfo = faker.opossum.packageInfo({
        url: 'http://localhost:3000',
      });
      expect(isPackageInvalid(packageInfo)).toBe(true);
    });

    it('returns true for URLs with non-http/https protocols', () => {
      const packageInfo = faker.opossum.packageInfo({
        url: 'ftp://example.com/repo',
      });
      expect(isPackageInvalid(packageInfo)).toBe(true);
    });

    it('returns true for git protocol URLs', () => {
      const packageInfo = faker.opossum.packageInfo({
        url: 'git://example.com/repo.git',
      });
      expect(isPackageInvalid(packageInfo)).toBe(true);
    });

    it('returns true for file protocol URLs', () => {
      const packageInfo = faker.opossum.packageInfo({
        url: 'file:///path/to/repo',
      });
      expect(isPackageInvalid(packageInfo)).toBe(true);
    });

    it('returns true for IP addresses', () => {
      const packageInfo = faker.opossum.packageInfo({
        url: 'http://192.168.1.1/repo',
      });
      expect(isPackageInvalid(packageInfo)).toBe(true);
    });

    it('returns true for IPv6 addresses', () => {
      const packageInfo = faker.opossum.packageInfo({
        url: 'http://[2001:db8::1]/repo',
      });
      expect(isPackageInvalid(packageInfo)).toBe(true);
    });

    it('returns true for URLs without domain extension', () => {
      const packageInfo = faker.opossum.packageInfo({
        url: 'https://example',
      });
      expect(isPackageInvalid(packageInfo)).toBe(true);
    });

    it('returns true for invalid URL format', () => {
      const packageInfo = faker.opossum.packageInfo({
        url: 'not a url at all',
      });
      expect(isPackageInvalid(packageInfo)).toBe(true);
    });

    it('returns true for URLs with only protocol', () => {
      const packageInfo = faker.opossum.packageInfo({
        url: 'https://',
      });
      expect(isPackageInvalid(packageInfo)).toBe(true);
    });
  });
});
