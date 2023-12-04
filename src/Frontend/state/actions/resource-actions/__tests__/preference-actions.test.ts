// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { faker } from '../../../../../shared/Faker';
import { Resources } from '../../../../../shared/shared-types';
import { getOriginIdsToPreferOver } from '../preference-actions';

describe('getOriginIdsToPreferOver', () => {
  it('finds all external attributions in the subtree', () => {
    const testSource = { name: 'testSource', documentConfidence: 100 };
    const resources: Resources = {
      folder: { subfolder: { file1: 1 }, file2: 1 },
    };
    const pathToRootResource = '/folder/';
    const resourcesToExternalAttributions = {
      '/folder/': ['uuid0'],
      '/folder/subfolder/file1': ['uuid1'],
      '/folder/file2': ['uuid2'],
      '/': ['uuid3'],
    };
    const resourcesToManualAttributions = {};
    const externalAttributions = {
      uuid0: { originIds: ['originUuid0'], source: testSource },
      uuid1: { originIds: ['originUuid1'], source: testSource },
      uuid2: { originIds: ['originUuid2'], source: testSource },
      uuid3: { originIds: ['originUuid3'], source: testSource },
    };
    const externalAttributionsSources = {
      testSource: {
        name: 'Test Source',
        priority: 0,
        isRelevantForPreferred: true,
      },
    };

    const actualOriginUuids = getOriginIdsToPreferOver(
      pathToRootResource,
      resources,
      resourcesToExternalAttributions,
      resourcesToManualAttributions,
      externalAttributions,
      externalAttributionsSources,
    );

    const expectedOriginUuids = ['originUuid0', 'originUuid1', 'originUuid2'];
    expect(actualOriginUuids).toEqual(expectedOriginUuids);
  });

  it('combines and deduplicates origin ids', () => {
    const testSource = { name: 'testSource', documentConfidence: 100 };
    const resources: Resources = { file1: 1, file2: 1 };
    const pathToRootResource = '/';
    const resourcesToExternalAttributions = {
      '/file1': ['uuid1', 'uuid2'],
      '/file2': ['uuid2', 'uuid3'],
    };
    const resourcesToManualAttributions = {};
    const externalAttributions = {
      uuid1: { originIds: ['originUuid1'], source: testSource },
      uuid2: { originIds: ['originUuid2', 'originUuid3'], source: testSource },
      uuid3: { originIds: ['originUuid3', 'originUuid4'], source: testSource },
    };
    const externalAttributionsSources = {
      testSource: {
        name: 'Test Source',
        priority: 0,
        isRelevantForPreferred: true,
      },
    };

    const actualOriginUuids = getOriginIdsToPreferOver(
      pathToRootResource,
      resources,
      resourcesToExternalAttributions,
      resourcesToManualAttributions,
      externalAttributions,
      externalAttributionsSources,
    );

    const expectedOriginUuids = [
      'originUuid1',
      'originUuid2',
      'originUuid3',
      'originUuid4',
    ];
    expect(actualOriginUuids).toEqual(expectedOriginUuids);
  });

  it('breaks on manual attributions', () => {
    const testSource = { name: 'testSource', documentConfidence: 100 };
    const resources: Resources = { folder: { file1: 1 } };
    const pathToRootResource = '/';
    const resourcesToExternalAttributions = {
      '/folder/': ['uuid0'],
      '/folder/file1': ['uuid1'],
    };
    const resourcesToManualAttributions = { '/folder/file1': ['uuid2'] };
    const externalAttributions = {
      uuid0: { originIds: ['originUuid0'], source: testSource },
      uuid1: { originIds: ['originUuid1'], source: testSource },
    };
    const externalAttributionsSources = {
      testSource: {
        name: 'Test Source',
        priority: 0,
        isRelevantForPreferred: true,
      },
    };

    const actualOriginUuids = getOriginIdsToPreferOver(
      pathToRootResource,
      resources,
      resourcesToExternalAttributions,
      resourcesToManualAttributions,
      externalAttributions,
      externalAttributionsSources,
    );

    const expectedOriginUuids = ['originUuid0'];
    expect(actualOriginUuids).toEqual(expectedOriginUuids);
  });

  it('only returns origin ids with sources relevant for preferred', () => {
    const relevantSource = { name: 'relevantSource', documentConfidence: 100 };
    const otherSource = { name: 'otherSource', documentConfidence: 100 };
    const resources: Resources = { file1: 1, file2: 1 };
    const pathToRootResource = '/';
    const resourcesToExternalAttributions = {
      '/file1': ['uuid1'],
      '/file2': ['uuid2'],
    };
    const resourcesToManualAttributions = {};
    const externalAttributions = {
      uuid1: { originIds: ['originUuid1'], source: relevantSource },
      uuid2: { originIds: ['originUuid2'], source: otherSource },
    };
    const externalAttributionsSources = {
      relevantSource: {
        name: 'Relevant Source',
        priority: 0,
        isRelevantForPreferred: true,
      },
      otherSource: { name: 'Other Source', priority: 0 },
    };

    const actualOriginUuids = getOriginIdsToPreferOver(
      pathToRootResource,
      resources,
      resourcesToExternalAttributions,
      resourcesToManualAttributions,
      externalAttributions,
      externalAttributionsSources,
    );

    const expectedOriginUuids = ['originUuid1'];
    expect(actualOriginUuids).toEqual(expectedOriginUuids);
  });

  it('finds all origin ids for attribution with multiple root resources', () => {
    const testSource = faker.opossum.source();
    const file1 = faker.opossum.resourceName();
    const file2 = faker.opossum.resourceName();
    const pathFile1 = `/${file1}`;
    const pathFile2 = `/${file2}`;
    const uuid1 = faker.string.uuid();
    const uuid2 = faker.string.uuid();
    const resources: Resources = faker.opossum.resources({
      [file1]: 1,
      [file2]: 1,
    });
    const pathsToRootResources = [pathFile1, pathFile2];
    const resourcesToExternalAttributions =
      faker.opossum.resourcesToAttributions({
        [pathFile1]: [uuid1],
        [pathFile2]: [uuid2],
      });

    const originUuid1 = faker.string.uuid();
    const originUuid2 = faker.string.uuid();
    const externalAttributions = faker.opossum.externalAttributions({
      [uuid1]: { originIds: [originUuid1], source: testSource },
      [uuid2]: { originIds: [originUuid2], source: testSource },
    });

    const externalAttributionSource = faker.opossum.externalAttributionSource({
      isRelevantForPreferred: true,
    });
    const externalAttributionsSources =
      faker.opossum.externalAttributionSources({
        [testSource.name]: externalAttributionSource,
      });

    const resourcesToManualAttributions = {};

    const actualOriginUuids = getOriginIdsToPreferOver(
      pathsToRootResources,
      resources,
      resourcesToExternalAttributions,
      resourcesToManualAttributions,
      externalAttributions,
      externalAttributionsSources,
    );

    const expectedOriginUuids = [originUuid1, originUuid2];
    expect(actualOriginUuids).toEqual(expectedOriginUuids);
  });
});
