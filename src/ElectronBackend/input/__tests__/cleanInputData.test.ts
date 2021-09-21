// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { WebContents } from 'electron';
import {
  Attributions,
  FollowUp,
  FrequentLicences,
  ResourcesToAttributions,
} from '../../../shared/shared-types';
import {
  cleanNonExistentAttributions,
  cleanNonExistentResolvedExternalSignals,
  parseFrequentLicenses,
  sanitizeRawAttributions,
  sanitizeRawBaseUrlsForSources,
} from '../cleanInputData';
import {
  RawAttributions,
  RawBaseUrlsForSources,
  RawFrequentLicense,
} from '../../types/types';

const mockCallback = jest.fn();
const webContents = { send: mockCallback as unknown } as WebContents;

describe('cleanNonExistentAttributions', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('removes non-existent attributions', () => {
    const resourcesToAttributions: ResourcesToAttributions = {
      '/file1': ['attr1', 'attr2', 'attr3', 'attr4'],
      '/file2': ['attr3'],
      '/file3': ['attr4'],
      '/file4': ['attr5', 'attr6'],
    };
    const attributions: Attributions = { attr2: {}, attr4: {} };
    const result = cleanNonExistentAttributions(
      webContents,
      resourcesToAttributions,
      attributions
    );
    expect(result).toEqual({
      '/file1': ['attr2', 'attr4'],
      '/file3': ['attr4'],
    });
    expect(mockCallback.mock.calls.length).toBe(3);
    expect(mockCallback.mock.calls[0][1]).toContain('/file1');
    expect(mockCallback.mock.calls[1][1]).toContain('/file2');
    expect(mockCallback.mock.calls[2][1]).toContain('/file4');
  });
});

describe('cleanNonExistentResolvedExternalSignals', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('removes non-existent resolved external attributions', () => {
    const resolvedExternalAttributions: Set<string> = new Set<string>()
      .add('attr2')
      .add('invalid');
    const externalAttributions: Attributions = { attr2: {}, attr4: {} };
    const result = cleanNonExistentResolvedExternalSignals(
      webContents,
      resolvedExternalAttributions,
      externalAttributions
    );
    expect(result).toEqual(new Set<string>().add('attr2'));
    expect(mockCallback.mock.calls.length).toBe(1);
    expect(mockCallback.mock.calls[0][1]).toContain(
      'WARNING: There was an abandoned resolved external attribution: invalid'
    );
  });
});

describe('sanitizeRawAttributions', () => {
  test('leaves FollowUp as followUp', () => {
    const rawAttributions: RawAttributions = {
      id: {
        followUp: FollowUp,
      },
    };
    const expectedAttributions: Attributions = {
      id: {
        followUp: FollowUp,
      },
    };

    expect(sanitizeRawAttributions(rawAttributions)).toEqual(
      expectedAttributions
    );
  });

  test('removes unknown strings from followUp', () => {
    const rawAttributions: RawAttributions = {
      id: {
        followUp: 'UNKNOWN_STRING',
      },
    };
    const expectedAttributions: Attributions = {
      id: {},
    };

    expect(sanitizeRawAttributions(rawAttributions)).toEqual(
      expectedAttributions
    );
  });
});

describe('sanitizeRawBaseUrlsForSources', () => {
  test('adds / to path', () => {
    const rawBaseUrlsForSources: RawBaseUrlsForSources = {
      'test/path': 'www.test.it',
    };
    const expectedBaseUrlsForSources: RawBaseUrlsForSources = {
      'test/path/': 'www.test.it',
    };

    expect(sanitizeRawBaseUrlsForSources(rawBaseUrlsForSources)).toEqual(
      expectedBaseUrlsForSources
    );
  });

  test('works with undefined', () => {
    expect(sanitizeRawBaseUrlsForSources(undefined)).toEqual({});
  });
});

describe('parseFrequentLicenses', () => {
  test('handles undefined', () => {
    const rawFrequentLicenses = undefined;
    const expectedFrequentLicenses: FrequentLicences = {
      nameOrder: [],
      texts: {},
    };

    expect(parseFrequentLicenses(rawFrequentLicenses)).toEqual(
      expectedFrequentLicenses
    );
  });

  test('handles empty array', () => {
    const rawFrequentLicenses: Array<RawFrequentLicense> = [];
    const expectedFrequentLicenses: FrequentLicences = {
      nameOrder: [],
      texts: {},
    };

    expect(parseFrequentLicenses(rawFrequentLicenses)).toEqual(
      expectedFrequentLicenses
    );
  });

  test('handles non-empty array', () => {
    const rawFrequentLicenses: Array<RawFrequentLicense> = [
      {
        shortName: 'MIT',
        fullName: 'MIT license',
        defaultText: 'MIT license text',
      },
      {
        shortName: 'GPL',
        fullName: 'GPL license',
        defaultText: 'GPL license text',
      },
    ];
    const expectedFrequentLicenses: FrequentLicences = {
      nameOrder: ['MIT', 'GPL'],
      texts: {
        MIT: 'MIT license text',
        GPL: 'GPL license text',
      },
    };

    expect(parseFrequentLicenses(rawFrequentLicenses)).toEqual(
      expectedFrequentLicenses
    );
  });
});
