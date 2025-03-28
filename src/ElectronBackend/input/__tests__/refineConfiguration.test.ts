// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { EMPTY_PROJECT_CONFIG } from '../../../Frontend/shared-constants';
import {
  Attributions,
  PackageInfo,
  RawClassificationsConfig,
  RawProjectConfig,
} from '../../../shared/shared-types';
import { faker } from '../../../testing/Faker';
import { ProcessingStatusUpdater } from '../../main/ProcessingStatusUpdater';
import { refineConfiguration } from '../refineConfiguration';

function fakePackagesWithClassifications(
  ...classificationIds: Array<number>
): Attributions {
  const attributions: Attributions = {};
  classificationIds
    .map((classificationId) =>
      faker.opossum.packageInfo({ classification: classificationId }),
    )
    .forEach((packageInfo: PackageInfo, index: number) => {
      attributions[`id${index}`] = packageInfo;
    });
  return attributions;
}

function fakeConfigWithClassificationIds(
  ...classificationIds: Array<number>
): RawProjectConfig {
  const classifications: RawClassificationsConfig = {};
  classificationIds.forEach((classificationId) => {
    classifications[classificationId] = faker.word.words();
  });
  return { classifications };
}

function fakeProcessingStatusUpdater(): ProcessingStatusUpdater {
  return {
    warn: () => {},
    info: () => {},
    error: () => {},
  } as unknown as ProcessingStatusUpdater;
}

describe('check and update configuration', () => {
  it('returns configuration with empty classifications if no configuration set', () => {
    const result = refineConfiguration(
      undefined,
      {},
      fakeProcessingStatusUpdater(),
    );

    expect(result).toEqual(EMPTY_PROJECT_CONFIG);
  });

  it('does not modify the configuration if all classifications are correctly set', () => {
    const configuration = fakeConfigWithClassificationIds(0, 1);
    const expectedConfiguration: RawProjectConfig = { ...configuration };
    const externalAttributions = fakePackagesWithClassifications(1, 0, 1, 0);

    const result = refineConfiguration(
      configuration,
      externalAttributions,
      fakeProcessingStatusUpdater(),
    );

    expect(result).toEqual(expectedConfiguration);
  });

  it('does updates the classification set on unknown classifications found', () => {
    const configuration = fakeConfigWithClassificationIds(0, 1);

    const externalAttributions = fakePackagesWithClassifications(0, 1, 22);

    const result = refineConfiguration(
      configuration,
      externalAttributions,
      fakeProcessingStatusUpdater(),
    );

    const expectedConfiguration: RawProjectConfig = {
      classifications: {
        ...configuration.classifications,
        22: 'not configured - 22',
      },
    };

    expect(result).toEqual(expectedConfiguration);
  });
});
