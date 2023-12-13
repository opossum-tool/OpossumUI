// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { convertGithubPayload } from '../github-fetching-helpers';
import { getLicenseFetchingInformation } from '../license-fetching-helpers';
import { convertNpmPayload } from '../npm-fetching-helpers';
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
      getLicenseFetchingInformation('https://pypi.org/project/numpy'),
    ).toMatchObject({
      url: 'https://pypi.org/pypi/numpy/json',
      convertPayload: convertPypiPayload,
    });
  });

  it('recognizes npm urls', () => {
    expect(
      getLicenseFetchingInformation('https://npmjs.com/package/react'),
    ).toMatchObject({
      url: 'https://registry.npmjs.org/react',
      convertPayload: convertNpmPayload,
    });
  });

  it('recognizes npm urls starting with www', () => {
    expect(
      getLicenseFetchingInformation('https://www.npmjs.com/package/react'),
    ).toMatchObject({
      url: 'https://registry.npmjs.org/react',
      convertPayload: convertNpmPayload,
    });
  });

  it('recognizes npm urls with complicated package names', () => {
    expect(
      getLicenseFetchingInformation(
        'https://npmjs.com/package/@angular/animations/',
      ),
    ).toMatchObject({
      url: 'https://registry.npmjs.org/@angular/animations',
      convertPayload: convertNpmPayload,
    });
  });

  it('rejects npm urls with version in url', () => {
    expect(
      getLicenseFetchingInformation(
        'https://npmjs.com/package/@angular/animations/1.0',
      ),
    ).toBeNull();
  });

  it('recognizes github urls consisting of namespace and name', () => {
    expect(
      getLicenseFetchingInformation(
        'https://github.com/opossum-tool/OpossumUI',
      ),
    ).toMatchObject({
      url: 'https://api.github.com/repos/opossum-tool/OpossumUI/license',
      convertPayload: convertGithubPayload,
    });
  });

  it('ignores github urls missing namespace or name', () => {
    expect(
      getLicenseFetchingInformation('https://github.com/opossum-tool/'),
    ).toBeNull();
  });
});
