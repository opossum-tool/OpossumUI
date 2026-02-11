// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  AttributionData,
  Criticality,
  PackageInfo,
} from '../../../../shared/shared-types';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { createTestStore } from '../../../test-helpers/render';
import { getCalculatePreferredOverOriginIds } from '../../actions/resource-actions/preference-actions';
import { getManualData } from '../../selectors/resource-selectors';
import { updateManualAttribution } from '../save-action-helpers';

describe('The updateManualAttribution function', () => {
  it('sets a preferred flag to the manual attribution', async () => {
    const testStore = await createTestStore(
      getParsedInputFileEnrichedWithTestData({
        resources: { folder: { child: 1 } },
        resourcesToExternalAttributions: {
          '/folder/child': ['externalUuid'],
        },
        externalAttributions: {
          externalUuid: {
            source: { name: 'testSource', documentConfidence: 0 },
            originIds: ['originId'],
            criticality: Criticality.None,
            id: 'externalUuid',
          },
        },
        externalAttributionSources: {
          testSource: {
            name: 'Test source',
            priority: 0,
            isRelevantForPreferred: true,
          },
        },
        manualAttributions: {
          manualUuid2: {
            criticality: Criticality.None,
            id: 'manualUuid2',
          },
        },
        resourcesToManualAttributions: {
          '/folder/': ['manualUuid2'],
        },
      }),
    );
    const resourceState = testStore.getState().resourceState;
    const testManualData = getManualData(testStore.getState());
    const testTemporaryDisplayPackageInfo: PackageInfo = {
      id: 'manualUuid2',
      preferred: true,
      criticality: Criticality.None,
    };

    const newManualData: AttributionData = updateManualAttribution(
      'manualUuid2',
      testManualData,
      testTemporaryDisplayPackageInfo,
      '/folder/child',
      getCalculatePreferredOverOriginIds(resourceState),
    );

    const changedAttribution = newManualData.attributions['manualUuid2'];
    expect(changedAttribution.preferred).toBe(true);
    expect(changedAttribution.preferredOverOriginIds).toEqual(['originId']);
  });

  it('does not set preferred over origin ids if the isRelevantForPreferred flag is false', async () => {
    const testStore = await createTestStore(
      getParsedInputFileEnrichedWithTestData({
        resources: { folder: { child: 1 } },
        resourcesToExternalAttributions: {
          '/folder/child': ['externalUuid'],
        },
        externalAttributions: {
          externalUuid: {
            source: { name: 'testSource', documentConfidence: 0 },
            originIds: ['originId'],
            criticality: Criticality.None,
            id: 'externalUuid',
          },
        },
        externalAttributionSources: {
          testSource: {
            name: 'Test source',
            priority: 0,
            isRelevantForPreferred: false,
          },
        },
        manualAttributions: {
          manualUuid2: {
            criticality: Criticality.None,
            id: 'manualUuid2',
          },
        },
        resourcesToManualAttributions: {
          '/folder/': ['manualUuid2'],
        },
      }),
    );
    const resourceState = testStore.getState().resourceState;
    const testManualData = getManualData(testStore.getState());
    const testTemporaryDisplayPackageInfo: PackageInfo = {
      id: 'manualUuid2',
      preferred: true,
      criticality: Criticality.None,
    };

    const newManualData: AttributionData = updateManualAttribution(
      'manualUuid2',
      testManualData,
      testTemporaryDisplayPackageInfo,
      '/folder/child',
      getCalculatePreferredOverOriginIds(resourceState),
    );

    const changedAttribution = newManualData.attributions['manualUuid2'];
    expect(changedAttribution.preferred).toBe(true);
    expect(changedAttribution.preferredOverOriginIds).toHaveLength(0);
  });

  it('sets preferred over origin ids over the manual attribution of the selected element', async () => {
    const testStore = await createTestStore(
      getParsedInputFileEnrichedWithTestData({
        resources: { folder: { child: 1 } },
        resourcesToExternalAttributions: {
          '/folder/child': ['externalUuid'],
        },
        externalAttributions: {
          externalUuid: {
            source: { name: 'testSource', documentConfidence: 0 },
            originIds: ['originId'],
            criticality: Criticality.None,
            id: 'externalUuid',
          },
        },
        externalAttributionSources: {
          testSource: {
            name: 'Test source',
            priority: 0,
            isRelevantForPreferred: true,
          },
        },
        manualAttributions: {
          manualUuid2: {
            criticality: Criticality.None,
            id: 'manualUuid2',
          },
        },
        resourcesToManualAttributions: {
          '/folder/child': ['manualUuid2'],
        },
      }),
    );
    const resourceState = testStore.getState().resourceState;
    const testManualData = getManualData(testStore.getState());
    const testTemporaryDisplayPackageInfo: PackageInfo = {
      id: 'manualUuid2',
      preferred: true,
      criticality: Criticality.None,
    };

    const newManualData: AttributionData = updateManualAttribution(
      'manualUuid2',
      testManualData,
      testTemporaryDisplayPackageInfo,
      '/folder/child',
      getCalculatePreferredOverOriginIds(resourceState),
    );

    const changedAttribution = newManualData.attributions['manualUuid2'];
    expect(changedAttribution.preferred).toBe(true);
    expect(changedAttribution.preferredOverOriginIds).toEqual(['originId']);
  });

  it('takes the preferred over origin ids only from the higher manual attribution', async () => {
    const testStore = await createTestStore(
      getParsedInputFileEnrichedWithTestData({
        resources: {
          folder: {
            file: 1,
            folder2: {
              child: 1,
            },
          },
        },
        resourcesToExternalAttributions: {
          '/folder/folder2/child': ['externalUuid'],
          '/folder/file': ['externalUuid1'],
        },
        externalAttributions: {
          externalUuid: {
            source: { name: 'testSource', documentConfidence: 0 },
            originIds: ['originId'],
            criticality: Criticality.None,
            id: 'externalUuid',
          },
          externalUuid1: {
            source: { name: 'testSource1', documentConfidence: 0 },
            originIds: ['originId1'],
            criticality: Criticality.None,
            id: 'externalUuid1',
          },
        },
        externalAttributionSources: {
          testSource: {
            name: 'testSource',
            priority: 0,
            isRelevantForPreferred: true,
          },
          testSource1: {
            name: 'testSource1',
            priority: 0,
            isRelevantForPreferred: true,
          },
        },
        manualAttributions: {
          manualUuid2: {
            criticality: Criticality.None,
            id: 'manualUuid2',
          },
          manualUuid1: {
            criticality: Criticality.None,
            id: 'manualUuid1',
            preferred: true,
          },
        },
        resourcesToManualAttributions: {
          '/folder/': ['manualUuid1'],
          '/folder/folder2/': ['manualUuid2'],
        },
      }),
    );
    const resourceState = testStore.getState().resourceState;
    const testManualData = getManualData(testStore.getState());
    const testTemporaryDisplayPackageInfo: PackageInfo = {
      id: 'manualUuid2',
      preferred: true,
      criticality: Criticality.None,
    };

    const newManualData: AttributionData = updateManualAttribution(
      'manualUuid2',
      testManualData,
      testTemporaryDisplayPackageInfo,
      '/folder/folder2/child',
      getCalculatePreferredOverOriginIds(resourceState),
    );

    const changedAttribution = newManualData.attributions['manualUuid2'];
    expect(changedAttribution.preferred).toBe(true);
    expect(changedAttribution.preferredOverOriginIds).toEqual(['originId']);
    const unchangedAttribution = newManualData.attributions['manualUuid1'];
    expect(unchangedAttribution.preferredOverOriginIds).toHaveLength(2);
    expect(unchangedAttribution.preferredOverOriginIds).toEqual([
      'originId1',
      'originId',
    ]);
    expect(unchangedAttribution.preferred).toBe(true);
  });
});
