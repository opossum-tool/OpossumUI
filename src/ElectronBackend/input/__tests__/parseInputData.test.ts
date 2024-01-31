// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  AttributionsToResources,
  BaseUrlsForSources,
  Criticality,
  FrequentLicenses,
  RawAttributions,
  Resources,
  ResourcesToAttributions,
} from '../../../shared/shared-types';
import { faker } from '../../../testing/Faker';
import logger from '../../main/logger';
import { RawFrequentLicense } from '../../types/types';
import {
  cleanNonExistentAttributions,
  cleanNonExistentResolvedExternalAttributions,
  deserializeAttributions,
  getAllResourcePaths,
  parseFrequentLicenses,
  sanitizeRawBaseUrlsForSources,
  sanitizeResourcesToAttributions,
  serializeAttributions,
} from '../parseInputData';

jest.mock('../../main/logger');

describe('cleanNonExistentAttributions', () => {
  it('removes non-existent attributions', () => {
    const resourcesToAttributions: ResourcesToAttributions = {
      '/file1': ['attr1', 'attr2', 'attr3', 'attr4'],
      '/file2': ['attr3'],
      '/file3': ['attr4'],
      '/file4': ['attr5', 'attr6'],
    };
    const attributions: Attributions = {
      attr2: { id: 'attr2' },
      attr4: { id: 'attr4' },
    };
    const result = cleanNonExistentAttributions(
      resourcesToAttributions,
      attributions,
    );
    expect(result).toEqual({
      '/file1': ['attr2', 'attr4'],
      '/file3': ['attr4'],
    });
    const expectedNumberOfCalls = 3;
    expect(logger.info).toHaveBeenCalledTimes(expectedNumberOfCalls);
    expect(logger.info).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/file1'),
    );
    expect(logger.info).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/file2'),
    );
    expect(logger.info).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('/file4'),
    );
  });
});

describe('cleanNonExistentResolvedExternalAttributions', () => {
  it('removes non-existent resolved external attributions', () => {
    const resolvedExternalAttributions: Set<string> = new Set<string>()
      .add('attr2')
      .add('invalid');
    const externalAttributions: Attributions = {
      attr2: { id: 'attr2' },
      attr4: { id: 'attr4' },
    };
    const result = cleanNonExistentResolvedExternalAttributions(
      resolvedExternalAttributions,
      externalAttributions,
    );
    expect(result).toEqual(new Set<string>().add('attr2'));
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining(
        'WARNING: There was an abandoned resolved external attribution: invalid',
      ),
    );
  });
});

describe('deserializeAttributions', () => {
  it('converts follow-up string to boolean', () => {
    const rawAttributions: RawAttributions = {
      id: {
        followUp: 'FOLLOW_UP',
      },
    };
    const expectedAttributions: Attributions = {
      id: {
        id: 'id',
        followUp: true,
      },
    };

    expect(deserializeAttributions(rawAttributions)).toEqual(
      expectedAttributions,
    );
  });

  it('removes unknown strings from follow-up', () => {
    const rawAttributions: RawAttributions = {
      id: {
        followUp: 'UNKNOWN_STRING' as 'FOLLOW_UP',
      },
    };
    const expectedAttributions: Attributions = {
      id: { id: 'id' },
    };

    expect(deserializeAttributions(rawAttributions)).toEqual(
      expectedAttributions,
    );
  });

  it('leaves non-empty comment unchanged', () => {
    const rawAttributions: RawAttributions = {
      id: {
        comment: 'Test comment',
      },
    };
    const expectedAttributions: Attributions = {
      id: {
        id: 'id',
        comment: 'Test comment',
      },
    };

    expect(deserializeAttributions(rawAttributions)).toEqual(
      expectedAttributions,
    );
  });

  it('removes empty comment', () => {
    const rawAttributions: RawAttributions = {
      id: {
        comment: '',
      },
    };
    const expectedAttributions: Attributions = {
      id: { id: 'id' },
    };

    expect(deserializeAttributions(rawAttributions)).toEqual(
      expectedAttributions,
    );
  });

  it('leaves criticality unchanged', () => {
    const rawAttributions: RawAttributions = {
      id: {
        criticality: 'high' as Criticality,
      },
    };
    const expectedAttributions: Attributions = {
      id: {
        id: 'id',
        criticality: Criticality.High,
      },
    };

    expect(deserializeAttributions(rawAttributions)).toEqual(
      expectedAttributions,
    );
  });

  it('removes invalid criticality', () => {
    const rawAttributions: RawAttributions = {
      id: {
        criticality: 'invalid value' as Criticality,
      },
    };
    const expectedAttributions: Attributions = {
      id: { id: 'id' },
    };

    expect(deserializeAttributions(rawAttributions)).toEqual(
      expectedAttributions,
    );
  });

  it('merges originIds and originId if both exist', () => {
    const testRawAttributions: RawAttributions = {
      uuid: {
        originId: 'abc',
        originIds: ['def', 'ghi'],
      },
    };
    const expectedParsedRawAttributions: Attributions = {
      uuid: {
        originIds: ['def', 'ghi', 'abc'],
        id: 'uuid',
      },
    };

    expect(deserializeAttributions(testRawAttributions)).toEqual(
      expectedParsedRawAttributions,
    );
  });

  it('creates originIds and writes originId into it if originIds does not exist initially', () => {
    const testRawAttributions: RawAttributions = {
      uuid: {
        originId: 'abc',
      },
    };
    const expectedParsedRawAttributions: Attributions = {
      uuid: {
        originIds: ['abc'],
        id: 'uuid',
      },
    };

    expect(deserializeAttributions(testRawAttributions)).toEqual(
      expectedParsedRawAttributions,
    );
  });

  it('leaves originIds as it is if originId does not exist', () => {
    const testRawAttributions: RawAttributions = {
      uuid: {
        originIds: ['abc', 'cde'],
      },
    };
    const expectedParsedRawAttributions: Attributions = {
      uuid: {
        originIds: ['abc', 'cde'],
        id: 'uuid',
      },
    };

    expect(deserializeAttributions(testRawAttributions)).toEqual(
      expectedParsedRawAttributions,
    );
  });
});

describe('serializeAttributions', () => {
  it('removes source', () => {
    const attributions: Attributions = {
      id: {
        id: 'id',
        source: faker.opossum.source(),
      },
    };
    const rawAttributions: RawAttributions = {
      id: {},
    };

    expect(serializeAttributions(attributions)).toEqual<RawAttributions>(
      rawAttributions,
    );
  });
});

describe('sanitizeRawBaseUrlsForSources', () => {
  it('adds / to path', () => {
    const rawBaseUrlsForSources: BaseUrlsForSources = {
      'test/path': 'www.test.it',
    };
    const expectedBaseUrlsForSources: BaseUrlsForSources = {
      'test/path/': 'www.test.it',
    };

    expect(sanitizeRawBaseUrlsForSources(rawBaseUrlsForSources)).toEqual(
      expectedBaseUrlsForSources,
    );
  });

  it('works with undefined', () => {
    expect(sanitizeRawBaseUrlsForSources(undefined)).toEqual({});
  });
});

describe('parseFrequentLicenses', () => {
  it('handles undefined', () => {
    const rawFrequentLicenses = undefined;
    const expectedFrequentLicenses: FrequentLicenses = {
      nameOrder: [],
      texts: {},
    };

    expect(parseFrequentLicenses(rawFrequentLicenses)).toEqual(
      expectedFrequentLicenses,
    );
  });

  it('handles empty array', () => {
    const rawFrequentLicenses: Array<RawFrequentLicense> = [];
    const expectedFrequentLicenses: FrequentLicenses = {
      nameOrder: [],
      texts: {},
    };

    expect(parseFrequentLicenses(rawFrequentLicenses)).toEqual(
      expectedFrequentLicenses,
    );
  });

  it('handles non-empty array', () => {
    const rawFrequentLicenses: Array<RawFrequentLicense> = [
      {
        shortName: 'MIT',
        fullName: 'MIT license',
        defaultText: 'MIT license text',
      },
      {
        shortName: 'GPL',
        fullName: 'General Public License',
        defaultText: 'GPL license text',
      },
    ];
    const expectedFrequentLicenses: FrequentLicenses = {
      nameOrder: [
        { shortName: 'MIT', fullName: 'MIT license' },
        {
          shortName: 'GPL',
          fullName: 'General Public License',
        },
      ],
      texts: {
        MIT: 'MIT license text',
        'MIT license': 'MIT license text',
        GPL: 'GPL license text',
        'General Public License': 'GPL license text',
      },
    };

    expect(parseFrequentLicenses(rawFrequentLicenses)).toEqual(
      expectedFrequentLicenses,
    );
  });
});

describe('getAllResourcePaths', () => {
  it('calculates correctly for only base path', () => {
    const resources: Resources = {};
    expect(getAllResourcePaths(resources)).toStrictEqual(new Set(['/']));
  });

  it('calculates correctly for files on top level', () => {
    const resources: Resources = {
      file1: 1,
      file2: 1,
    };
    expect(getAllResourcePaths(resources)).toStrictEqual(
      new Set(['/', '/file1', '/file2']),
    );
  });

  it('calculates correctly for nested files', () => {
    const resources: Resources = {
      file1: 1,
      folder1: {},
      folder2: {
        subfolder2_1: {
          file2: 1,
          subfolder2_1_1: {},
        },
      },
    };
    expect(getAllResourcePaths(resources)).toStrictEqual(
      new Set([
        '/',
        '/file1',
        '/folder1/',
        '/folder2/',
        '/folder2/subfolder2_1/',
        '/folder2/subfolder2_1/file2',
        '/folder2/subfolder2_1/subfolder2_1_1/',
      ]),
    );
  });
});

describe('sanitizeResourcesToAttributions', () => {
  it('handles empty object', () => {
    const resources: Resources = {};
    const attributionsToResources: AttributionsToResources = {};

    expect(
      sanitizeResourcesToAttributions(resources, attributionsToResources),
    ).toStrictEqual({});
  });

  it('includes root path', () => {
    const resources: Resources = {};
    const attributionsToResources: AttributionsToResources = {
      '/': ['uuid1'],
    };

    expect(
      sanitizeResourcesToAttributions(resources, attributionsToResources),
    ).toStrictEqual(attributionsToResources);
  });

  it('includes correctly matching path', () => {
    const resources: Resources = {
      file1: 1,
      folder1: {
        file2: 1,
      },
    };
    const attributionsToResources: AttributionsToResources = {
      '/file1': ['uuid1'],
      '/folder1/': ['uuid2', 'uuid3'],
      '/folder1/file2': ['uuid1'],
    };

    expect(
      sanitizeResourcesToAttributions(resources, attributionsToResources),
    ).toStrictEqual(attributionsToResources);
  });

  it('includes path with missing slashes', () => {
    const resources: Resources = {
      file1: 1,
      folder1: {
        file2: 1,
      },
    };
    const attributionsToResources: AttributionsToResources = {
      '/file1': ['uuid1'],
      '/folder1': ['uuid2', 'uuid3'],
      '/folder1/file2': ['uuid1'],
    };

    expect(
      sanitizeResourcesToAttributions(resources, attributionsToResources),
    ).toStrictEqual({
      '/file1': ['uuid1'],
      '/folder1/': ['uuid2', 'uuid3'],
      '/folder1/file2': ['uuid1'],
    });
  });

  it('ignores absent path', () => {
    const resources: Resources = {
      file1: 1,
      folder1: {
        file2: 1,
      },
    };
    const attributionsToResources: AttributionsToResources = {
      '/file1': ['uuid1'],
      '/folder1/': ['uuid2', 'uuid3'],
      '/folder1/file2': ['uuid1'],
      '/folder2/': ['uuid4'],
    };

    expect(
      sanitizeResourcesToAttributions(resources, attributionsToResources),
    ).toStrictEqual({
      '/file1': ['uuid1'],
      '/folder1/': ['uuid2', 'uuid3'],
      '/folder1/file2': ['uuid1'],
    });
  });
});
