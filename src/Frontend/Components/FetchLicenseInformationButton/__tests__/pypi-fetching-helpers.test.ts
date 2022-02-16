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
  it('raises for invalid payload', async () => {
    const payload = {
      info: { packageName: 'test' },
    };
    const mockResponse = {
      json: (): typeof payload => payload,
    };

    await expect(
      convertPypiPayload(mockResponse as unknown as Response)
    ).rejects.toBeTruthy();
  });

  it('returns correct packageInfo', async () => {
    const payload = {
      info: { license: 'test', name: 'test package' },
    };
    const mockResponse = {
      json: (): typeof payload => payload,
    };

    const packageInfo = await convertPypiPayload(
      mockResponse as unknown as Response
    );
    expect(packageInfo).toStrictEqual({
      licenseName: 'test',
      packageName: 'test package',
      packageType: 'pypi',
      packageNamespace: undefined,
      packagePURLAppendix: undefined,
    });
  });
});
