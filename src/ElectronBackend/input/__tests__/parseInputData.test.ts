// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { pickBy } from 'lodash';

import {
  Attributions,
  AttributionsToResources,
  BaseUrlsForSources,
  Criticality,
  FrequentLicenses,
  RawAttributions,
  RawCriticality,
  Resources,
  ResourcesToAttributions,
} from '../../../shared/shared-types';
import { faker } from '../../../testing/Faker';
import { RawFrequentLicense } from '../../types/types';
import {
  deserializeAttributions,
  getAllResourcePaths,
  HASH_EXCLUDE_KEYS,
  mergeAttributions,
  mergePackageInfos,
  parseFrequentLicenses,
  sanitizeRawBaseUrlsForSources,
  sanitizeResourcesToAttributions,
  serializeAttributions,
} from '../parseInputData';

describe('deserializeAttributions', () => {
  it('converts follow-up string to boolean', () => {
    const rawAttributions: RawAttributions = {
      id: {
        followUp: 'FOLLOW_UP',
      },
    };

    expect(deserializeAttributions(rawAttributions)).toEqual<Attributions>({
      id: {
        id: 'id',
        criticality: Criticality.None,
        followUp: true,
        originalAttributionId: 'id',
        originalAttributionSource: undefined,
        originalAttributionWasPreferred: undefined,
      },
    });
  });

  it('removes unknown strings from follow-up', () => {
    const rawAttributions: RawAttributions = {
      id: {
        followUp: 'UNKNOWN_STRING' as 'FOLLOW_UP',
      },
    };

    expect(deserializeAttributions(rawAttributions)).toEqual<Attributions>({
      id: {
        id: 'id',
        criticality: Criticality.None,
        originalAttributionId: 'id',
        originalAttributionSource: undefined,
        originalAttributionWasPreferred: undefined,
      },
    });
  });

  it('leaves non-empty comment unchanged', () => {
    const rawAttributions: RawAttributions = {
      id: {
        comment: 'Test comment',
      },
    };

    expect(deserializeAttributions(rawAttributions)).toEqual<Attributions>({
      id: {
        id: 'id',
        criticality: Criticality.None,
        comment: 'Test comment',
        originalAttributionId: 'id',
        originalAttributionSource: undefined,
        originalAttributionWasPreferred: undefined,
      },
    });
  });

  it('removes empty comment', () => {
    const rawAttributions: RawAttributions = {
      id: {
        comment: '',
      },
    };

    expect(deserializeAttributions(rawAttributions)).toEqual<Attributions>({
      id: {
        id: 'id',
        criticality: Criticality.None,
        originalAttributionId: 'id',
        originalAttributionSource: undefined,
        originalAttributionWasPreferred: undefined,
      },
    });
  });

  it('leaves criticality unchanged', () => {
    const rawAttributions: RawAttributions = {
      id: {
        criticality: RawCriticality[Criticality.High],
      },
    };

    expect(deserializeAttributions(rawAttributions)).toEqual<Attributions>({
      id: {
        id: 'id',
        criticality: Criticality.High,
        originalAttributionId: 'id',
        originalAttributionSource: undefined,
        originalAttributionWasPreferred: undefined,
      },
    });
  });

  it('removes invalid criticality', () => {
    const rawAttributions: RawAttributions = {
      id: {
        criticality: 'invalid value',
      },
    };

    expect(deserializeAttributions(rawAttributions)).toEqual<Attributions>({
      id: {
        id: 'id',
        originalAttributionId: 'id',
        originalAttributionSource: undefined,
        originalAttributionWasPreferred: undefined,
        criticality: Criticality.None,
      },
    });
  });

  it('merges originIds and originId if both exist', () => {
    const rawAttributions: RawAttributions = {
      uuid: {
        originId: 'abc',
        originIds: ['def', 'ghi'],
      },
    };

    expect(deserializeAttributions(rawAttributions)).toEqual({
      uuid: {
        originIds: ['def', 'ghi', 'abc'],
        criticality: Criticality.None,
        id: 'uuid',
        originalAttributionId: 'uuid',
        originalAttributionSource: undefined,
        originalAttributionWasPreferred: undefined,
      },
    });
  });

  it('creates originIds and writes originId into it if originIds does not exist initially', () => {
    const rawAttributions: RawAttributions = {
      uuid: {
        originId: 'abc',
      },
    };

    expect(deserializeAttributions(rawAttributions)).toEqual<Attributions>({
      uuid: {
        originIds: ['abc'],
        id: 'uuid',
        criticality: Criticality.None,
        originalAttributionId: 'uuid',
        originalAttributionSource: undefined,
        originalAttributionWasPreferred: undefined,
      },
    });
  });

  it('leaves originIds as it is if originId does not exist', () => {
    const rawAttributions: RawAttributions = {
      uuid: {
        originIds: ['abc', 'cde'],
      },
    };

    expect(deserializeAttributions(rawAttributions)).toEqual<Attributions>({
      uuid: {
        originIds: ['abc', 'cde'],
        id: 'uuid',
        criticality: Criticality.None,
        originalAttributionId: 'uuid',
        originalAttributionSource: undefined,
        originalAttributionWasPreferred: undefined,
      },
    });
  });

  it('writes original attribution properties correctly', () => {
    const attributionId = faker.string.uuid();
    const originalAttributionId = faker.string.uuid();
    const originId = faker.string.uuid();
    const rawAttributions: RawAttributions = {
      [attributionId]: {
        packageName: faker.word.noun(),
        originIds: [originId],
      },
    };
    const originalAttributions: Attributions = {
      [originalAttributionId]: {
        packageName: faker.word.noun(),
        wasPreferred: true,
        originIds: [originId, faker.string.uuid()],
        source: faker.opossum.source(),
        id: originalAttributionId,
        criticality: Criticality.None,
      },
    };

    expect(
      deserializeAttributions(rawAttributions, originalAttributions),
    ).toEqual<Attributions>({
      [attributionId]: {
        packageName: rawAttributions[attributionId].packageName,
        originIds: [originId],
        originalAttributionId,
        originalAttributionSource:
          originalAttributions[originalAttributionId].source,
        originalAttributionWasPreferred:
          originalAttributions[originalAttributionId].wasPreferred,
        id: attributionId,
        criticality: Criticality.None,
      },
    });
  });
});

describe('serializeAttributions', () => {
  it('removes source', () => {
    const attributions: Attributions = {
      id: {
        id: 'id',
        source: faker.opossum.source(),
        criticality: Criticality.None,
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

describe('mergeAttributions', () => {
  it('merges attributions that are similar and attached to the same resources', () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo({
      ...packageInfo1,
      attributionConfidence: faker.number.int(100),
      comment: faker.lorem.sentence(),
      id: faker.string.uuid(),
      originIds: [faker.string.uuid()],
      preSelected: !packageInfo1.preSelected,
      wasPreferred: !packageInfo1.wasPreferred,
    });
    const filePath = faker.system.filePath();
    const attributionsToResources = faker.opossum.attributionsToResources({
      [packageInfo1.id]: [filePath],
      [packageInfo2.id]: [filePath],
    });
    const resourcesToAttributions = faker.opossum.resourcesToAttributions({
      [filePath]: [packageInfo1.id, packageInfo2.id],
    });
    const attributions = faker.opossum.attributions({
      [packageInfo1.id]: packageInfo1,
      [packageInfo2.id]: packageInfo2,
    });

    const mergedAttributions = mergeAttributions({
      attributions,
      attributionsToResources,
      resourcesToAttributions,
    });

    expect(mergedAttributions).toEqual<[Attributions, ResourcesToAttributions]>(
      [
        {
          [packageInfo1.id]: mergePackageInfos(packageInfo1, packageInfo2),
        },
        {
          [filePath]: [packageInfo1.id],
        },
      ],
    );
  });

  it('does not merge attributions that are similar but attached to different resources', () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo({
      ...packageInfo1,
      attributionConfidence: faker.number.int(100),
      comment: faker.lorem.sentence(),
      id: faker.string.uuid(),
      originIds: [faker.string.uuid()],
      preSelected: !packageInfo1.preSelected,
      wasPreferred: !packageInfo1.wasPreferred,
    });
    const filePath1 = faker.system.filePath();
    const filePath2 = faker.system.filePath();
    const attributionsToResources = faker.opossum.attributionsToResources({
      [packageInfo1.id]: [filePath1],
      [packageInfo2.id]: [filePath2],
    });
    const resourcesToAttributions = faker.opossum.resourcesToAttributions({
      [filePath1]: [packageInfo1.id],
      [filePath2]: [packageInfo2.id],
    });
    const attributions = faker.opossum.attributions({
      [packageInfo1.id]: packageInfo1,
      [packageInfo2.id]: packageInfo2,
    });

    const mergedAttributions = mergeAttributions({
      attributions,
      attributionsToResources,
      resourcesToAttributions,
    });

    expect(mergedAttributions).toEqual<[Attributions, ResourcesToAttributions]>(
      [attributions, resourcesToAttributions],
    );
  });

  it('does not merge attributions that are not similar but attached to the same resources', () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();
    const filePath = faker.system.filePath();
    const attributionsToResources = faker.opossum.attributionsToResources({
      [packageInfo1.id]: [filePath],
      [packageInfo2.id]: [filePath],
    });
    const resourcesToAttributions = faker.opossum.resourcesToAttributions({
      [filePath]: [packageInfo1.id, packageInfo2.id],
    });
    const attributions = faker.opossum.attributions({
      [packageInfo1.id]: packageInfo1,
      [packageInfo2.id]: packageInfo2,
    });

    const mergedAttributions = mergeAttributions({
      attributions,
      attributionsToResources,
      resourcesToAttributions,
    });

    expect(mergedAttributions).toEqual<[Attributions, ResourcesToAttributions]>(
      [attributions, resourcesToAttributions],
    );
  });
});

describe('mergePackageInfos', () => {
  it('chooses lower confidence', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      attributionConfidence: faker.number.int(100),
    });
    const packageInfo2 = faker.opossum.packageInfo({
      attributionConfidence: packageInfo1.attributionConfidence! + 1,
    });

    expect(
      mergePackageInfos(packageInfo1, packageInfo2).attributionConfidence,
    ).toBe(packageInfo1.attributionConfidence);
  });

  it('handles undefined confidence', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      attributionConfidence: undefined,
    });
    const packageInfo2 = faker.opossum.packageInfo({
      attributionConfidence: faker.number.int(100),
    });

    expect(
      mergePackageInfos(packageInfo1, packageInfo2).attributionConfidence,
    ).toBe(packageInfo2.attributionConfidence);
  });

  it('concatenates comments', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      comment: faker.lorem.sentence(),
    });
    const packageInfo2 = faker.opossum.packageInfo({
      comment: faker.lorem.sentence(),
    });

    expect(mergePackageInfos(packageInfo1, packageInfo2).comment).toBe(
      `${packageInfo1.comment}\n\n${packageInfo2.comment}`,
    );
  });

  it('concatenates origin IDs', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      originIds: [faker.string.uuid()],
    });
    const packageInfo2 = faker.opossum.packageInfo({
      originIds: [faker.string.uuid()],
    });

    expect(mergePackageInfos(packageInfo1, packageInfo2).originIds).toEqual([
      ...packageInfo1.originIds!,
      ...packageInfo2.originIds!,
    ]);
  });

  it('deduplicates origin IDs', () => {
    const originId = faker.string.uuid();
    const packageInfo1 = faker.opossum.packageInfo({
      originIds: [originId],
    });
    const packageInfo2 = faker.opossum.packageInfo({
      originIds: [originId],
    });

    expect(mergePackageInfos(packageInfo1, packageInfo2).originIds).toEqual([
      originId,
    ]);
  });

  it('handles undefined origin IDs', () => {
    const originId = faker.string.uuid();
    const packageInfo1 = faker.opossum.packageInfo({
      originIds: undefined,
    });
    const packageInfo2 = faker.opossum.packageInfo({
      originIds: [originId],
    });

    expect(mergePackageInfos(packageInfo1, packageInfo2).originIds).toEqual([
      originId,
    ]);
  });

  it('makes merged package info pre-selected if at least one input package info is pre-selected', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      preSelected: true,
    });
    const packageInfo2 = faker.opossum.packageInfo({
      preSelected: false,
    });

    expect(mergePackageInfos(packageInfo1, packageInfo2).preSelected).toBe(
      true,
    );
  });

  it('does not make merged package info pre-selected if no input package info is pre-selected', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      preSelected: undefined,
    });
    const packageInfo2 = faker.opossum.packageInfo({
      preSelected: false,
    });

    expect(mergePackageInfos(packageInfo1, packageInfo2).preSelected).toBe(
      false,
    );
  });

  it('makes merged package info previously-preferred if at least one input package info is previously-preferred', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      wasPreferred: true,
    });
    const packageInfo2 = faker.opossum.packageInfo({
      wasPreferred: false,
    });

    expect(mergePackageInfos(packageInfo1, packageInfo2).wasPreferred).toBe(
      true,
    );
  });

  it('does not make merged package info previously-preferred if no input package info is previously-preferred', () => {
    const packageInfo1 = faker.opossum.packageInfo({
      wasPreferred: undefined,
    });
    const packageInfo2 = faker.opossum.packageInfo({
      wasPreferred: false,
    });

    expect(mergePackageInfos(packageInfo1, packageInfo2).wasPreferred).toBe(
      false,
    );
  });

  it('takes attribute value from first candidate for all keys that are relevant for uniqueness', () => {
    const packageInfo1 = faker.opossum.packageInfo();
    const packageInfo2 = faker.opossum.packageInfo();

    expect(
      pickBy(
        mergePackageInfos(packageInfo1, packageInfo2),
        (_, key) => !HASH_EXCLUDE_KEYS.some((excludeKey) => excludeKey === key),
      ),
    ).toEqual(
      pickBy(
        packageInfo1,
        (_, key) => !HASH_EXCLUDE_KEYS.some((excludeKey) => excludeKey === key),
      ),
    );
  });
});
