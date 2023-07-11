// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { convertPypiPayload, getPypiAPIUrl } from '../pypi-fetching-helpers';

describe('getPypiAPIUrl', () => {
  const EXPECTED_URL = 'https://pypi.org/pypi/numpy/json';

  it('appends /json', () => {
    expect(getPypiAPIUrl('https://pypi.org/pypi/numpy')).toBe(EXPECTED_URL);
  });

  it('appends json', () => {
    expect(getPypiAPIUrl('https://pypi.org/pypi/numpy/')).toBe(EXPECTED_URL);
  });

  it('replaces project by pypi', () => {
    expect(getPypiAPIUrl('https://pypi.org/project/numpy')).toBe(EXPECTED_URL);
  });
});

describe('convertPypiPayload', () => {
  it('raises for invalid payload', () => {
    const payload = {
      info: { packageName: 'test' },
    };
    expect(() => convertPypiPayload(payload)).toThrow(
      'requires property "license"',
    );
  });

  it('returns correct packageInfo', () => {
    const payload = {
      info: { license: 'test', name: 'test package' },
    };

    const packageInfo = convertPypiPayload(payload);
    expect(packageInfo).toStrictEqual({
      licenseName: 'test',
      packageName: 'test package',
      packageType: 'pypi',
      packageNamespace: undefined,
      packagePURLAppendix: undefined,
    });
  });
});
