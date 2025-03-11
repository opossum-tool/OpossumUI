// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { EMPTY_PROJECT_CONFIG } from '../../../Frontend/shared-constants';
import {
  Attributions,
  Classifications,
  PackageInfo,
  ProjectConfig,
} from '../../../shared/shared-types';
import { faker } from '../../../testing/Faker';
import { checkAndUpdateConfiguration } from '../checkConfiguration';

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

function fakeConfigWithClassificationIds(...classificationIds: Array<number>) {
  const classifications: Classifications = {};
  classificationIds.forEach((classificationId) => {
    classifications[classificationId] = faker.word.words();
  });
  const configuration: ProjectConfig = { classifications };
  return configuration;
}

describe('check and update configuration', () => {
  it('returns configuration with empty classifications if no configuration set', () => {
    const result = checkAndUpdateConfiguration(undefined, {});

    expect(result).toEqual(EMPTY_PROJECT_CONFIG);
  });

  it('does not change the configuration if all classifications are correctly set', () => {
    const configuration = fakeConfigWithClassificationIds(0, 1);
    const expectedConfiguration = { ...configuration };
    const externalAttributions = fakePackagesWithClassifications(1, 0, 1, 0);

    const result = checkAndUpdateConfiguration(
      configuration,
      externalAttributions,
    );

    expect(result).toEqual(expectedConfiguration);
  });

  it('does updates the classification set on unknown classifications found', () => {
    const configuration = fakeConfigWithClassificationIds(0, 1);
    const copiedClassifications = { ...configuration.classifications };

    const externalAttributions = fakePackagesWithClassifications(0, 1, 22);

    const result = checkAndUpdateConfiguration(
      configuration,
      externalAttributions,
    );

    const expectedConfiguration = {
      classifications: {
        ...copiedClassifications,
        22: 'not configured - 22',
      },
    };

    expect(result).toEqual(expectedConfiguration);
  });
});
