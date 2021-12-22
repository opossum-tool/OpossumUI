// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { getLicenseFetchingInformation } from '../license-fetching-helpers';
import { convertPypiPayload } from '../pypi-fetching-helpers';
import { convertNpmPayload } from '../npm-fetching-helpers';
import { convertGithubPayload } from '../github-fetching-helpers';

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

  it('recognizes npm urls', () => {
    expect(
      getLicenseFetchingInformation('https://npmjs.com/package/react')
    ).toMatchObject({
      url: 'https://registry.npmjs.org/react',
      convertPayload: convertNpmPayload,
    });
  });

  it('recognizes npm urls with complicated package names', () => {
    expect(
      getLicenseFetchingInformation(
        'https://npmjs.com/package/@angular/animations/'
      )
    ).toMatchObject({
      url: 'https://registry.npmjs.org/@angular/animations',
      convertPayload: convertNpmPayload,
    });
  });

  it('rejects npm urls with version in url', () => {
    expect(
      getLicenseFetchingInformation(
        'https://npmjs.com/package/@angular/animations/1.0'
      )
    ).toBeNull();
  });

  it('recognizes github urls', () => {
    expect(
      getLicenseFetchingInformation('https://github.com/opossum-tool/OpossumUI')
    ).toMatchObject({
      url: 'https://api.github.com/repos/opossum-tool/OpossumUI/license',
      convertPayload: convertGithubPayload,
    });
  });
});
