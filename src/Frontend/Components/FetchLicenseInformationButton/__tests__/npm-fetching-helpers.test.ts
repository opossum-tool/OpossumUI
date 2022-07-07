// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { convertNpmPayload, getNpmAPIUrl } from '../npm-fetching-helpers';

describe('getNpmAPIUrl', () => {
  it('handles a simple package name', () => {
    expect(getNpmAPIUrl('https://npmjs.com/package/react')).toBe(
      'https://registry.npmjs.org/react'
    );
  });

  it('handles a simple package name without package in the url', () => {
    expect(getNpmAPIUrl('https://npmjs.com/react')).toBe(
      'https://registry.npmjs.org/react'
    );
  });

  it('handles a simple package name with version', () => {
    expect(getNpmAPIUrl('https://npmjs.com/package/react', '1.0')).toBe(
      'https://registry.npmjs.org/react/1.0'
    );
  });

  it('handles a simple package name with trailing slash', () => {
    expect(getNpmAPIUrl('https://npmjs.com/package/react/', '1.0')).toBe(
      'https://registry.npmjs.org/react/1.0'
    );
  });

  it('handles a complicated package name', () => {
    expect(getNpmAPIUrl('https://npmjs.com/package/@angular/animation')).toBe(
      'https://registry.npmjs.org/@angular/animation'
    );
  });

  it('handles a complicated package name with version', () => {
    expect(
      getNpmAPIUrl('https://npmjs.com/package/@angular/animation', '1.0')
    ).toBe('https://registry.npmjs.org/@angular/animation/1.0');
  });
});

describe('convertNpmPayload', () => {
  it('raises error for invalid payload', () => {
    const payload = { name: 'test' };

    expect(() => convertNpmPayload(payload as unknown as Response)).toThrow(
      'requires property "license"'
    );
  });

  it('parses payload correctly', () => {
    const payload = { name: 'test', license: 'MIT' };

    const packageInfo = convertNpmPayload(payload as unknown as Response);
    expect(packageInfo).toStrictEqual({
      licenseName: 'MIT',
      packageName: 'test',
      packageType: 'npm',
      packageNamespace: undefined,
      packagePURLAppendix: undefined,
    });
  });
});
