// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import {
  convertGithubPayload,
  getGithubAPIUrl,
} from '../github-fetching-helpers';

describe('getGithubAPIUrl', () => {
  it('handles a normal github url', () => {
    expect(getGithubAPIUrl('https://github.com/opossum-tool/OpossumUI')).toBe(
      'https://api.github.com/repos/opossum-tool/OpossumUI/license'
    );
  });

  it('handles a trailing slash', () => {
    expect(getGithubAPIUrl('https://github.com/opossum-tool/OpossumUI/')).toBe(
      'https://api.github.com/repos/opossum-tool/OpossumUI/license'
    );
  });

  it('handles additional parts at the end of the url', () => {
    expect(
      getGithubAPIUrl(
        'https://github.com/opossum-tool/OpossumUI/some/more/suffixes'
      )
    ).toBe('https://api.github.com/repos/opossum-tool/OpossumUI/license');
  });
});

describe('convertGithubPayload', () => {
  it('raises for invalid payload', async () => {
    const payload = { license: {} };
    const mockResponse = {
      json: (): typeof payload => payload,
    };

    await expect(
      convertGithubPayload(mockResponse as unknown as Response)
    ).rejects.toBeTruthy();
  });

  it('parses payload correctly', async () => {
    const payload = {
      license: { spdx_id: 'Apache-2.0' },
      content: 'TGljZW5zZSBUZXh0', // "License Text" in base64
      html_url: 'https://github.com/opossum-tool/OpossumUI/blob/main/LICENSE',
    };
    const mockResponse = {
      json: (): typeof payload => payload,
    };

    const packageInfo = await convertGithubPayload(
      mockResponse as unknown as Response
    );
    expect(packageInfo).toStrictEqual({
      licenseName: 'Apache-2.0',
      licenseText: 'License Text',
      packageType: 'github',
      packageNamespace: 'opossum-tool',
      packageName: 'OpossumUI',
      packagePURLAppendix: undefined,
    });
  });

  it('handles non existing license text correctly', async () => {
    const payload = {
      license: { spdx_id: 'Apache-2.0' },
      html_url: 'https://github.com/opossum-tool/OpossumUI/blob/main/LICENSE',
    };
    const mockResponse = {
      json: (): typeof payload => payload,
    };

    const packageInfo = await convertGithubPayload(
      mockResponse as unknown as Response
    );
    expect(packageInfo).toStrictEqual({
      licenseName: 'Apache-2.0',
      packageType: 'github',
      licenseText: undefined,
      packageNamespace: 'opossum-tool',
      packageName: 'OpossumUI',
      packagePURLAppendix: undefined,
    });
  });

  it('handles empty license text correctly', async () => {
    const payload = {
      license: { spdx_id: 'Apache-2.0' },
      content: '',
      html_url: 'https://github.com/opossum-tool/OpossumUI/blob/main/LICENSE',
    };
    const mockResponse = {
      json: (): typeof payload => payload,
    };

    const packageInfo = await convertGithubPayload(
      mockResponse as unknown as Response
    );
    expect(packageInfo).toStrictEqual({
      licenseName: 'Apache-2.0',
      packageType: 'github',
      licenseText: undefined,
      packageNamespace: 'opossum-tool',
      packageName: 'OpossumUI',
      packagePURLAppendix: undefined,
    });
  });
});
