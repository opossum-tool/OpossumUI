// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { getLicenseFetchingInformation } from '../license-fetching-helpers';
import { convertPypiPayload } from '../pypi-fetching-helpers';

describe('getLicenseFetchingInformation', () => {
  it('returns null for undefined as input', () => {
    expect(getLicenseFetchingInformation()).toBeNull();
  });

  it('returns null for no match', () => {
    expect(getLicenseFetchingInformation('https://unknown-url.com')).toBeNull();
  });

  it('recognizes pypi urls', () => {
    expect(
      getLicenseFetchingInformation('https://pypi.org/project/numpy')
    ).toMatchObject({
      url: 'https://pypi.org/pypi/numpy/json',
      convertPayload: convertPypiPayload,
    });
  });
});
