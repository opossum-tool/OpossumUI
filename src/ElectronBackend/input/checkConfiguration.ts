// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import chroma from 'chroma-js';

import { EMPTY_RAW_PROJECT_CONFIG } from '../../Frontend/shared-constants';
import { OpossumColors } from '../../Frontend/shared-styles';
import {
  Attributions,
  ClassificationEntry,
  Classifications,
  PackageInfo,
  ProjectConfig,
  RawClassifications,
  RawProjectConfig,
} from '../../shared/shared-types';
import logger from '../main/logger';

function interpolateBetweenRedAndWhite(
  numberOfClassifications: number,
  index: number,
) {
  return chroma
    .bezier(['red', 'white'])
    .scale()
    .correctLightness(true)
    .colors(numberOfClassifications)[index];
}

function getClassificationColor(
  classificationId: string,
  classifications: RawClassifications,
) {
  const configuredClassificationIds = Object.keys(classifications).toReversed();
  const numberOfClassifications = configuredClassificationIds.length;
  const index = configuredClassificationIds.indexOf(classificationId);
  return Number(classificationId) === 0
    ? OpossumColors.pastelLightGreen
    : interpolateBetweenRedAndWhite(numberOfClassifications, index);
}

function checkAndUpdateClassifications(
  config: RawProjectConfig,
  externalAttributions: Attributions,
) {
  const classifications = config.classifications;
  const configuredAttributionKeys = Object.keys(classifications).map(
    (configurationValue) => Number(configurationValue),
  );
  const containsUnconfiguredClassification = (packageInfo: PackageInfo) =>
    packageInfo.classification &&
    !configuredAttributionKeys.includes(packageInfo.classification);

  const unconfiguredClassifications = Object.values(externalAttributions)
    .filter(containsUnconfiguredClassification)
    .map<number | undefined>((packageInfo) => packageInfo.classification)
    .filter((classificationId) => classificationId !== undefined);
  if (unconfiguredClassifications.length) {
    logger.warn(
      `Detected configuration values without configuration: ${unconfiguredClassifications.join(', ')}`,
    );
    unconfiguredClassifications.forEach((unconfiguredClassificationId) => {
      classifications[unconfiguredClassificationId] =
        `not configured - ${unconfiguredClassificationId}`;
    });
  }
  return classifications;
}

export function checkAndConvertConfiguration(
  rawConfig: RawProjectConfig | undefined,
  externalAttributions: Attributions,
): ProjectConfig {
  const rawConfigOrDefault = rawConfig ?? EMPTY_RAW_PROJECT_CONFIG;
  rawConfigOrDefault.classifications = checkAndUpdateClassifications(
    rawConfigOrDefault,
    externalAttributions,
  );
  const classifications: Classifications =
    Object.fromEntries<ClassificationEntry>(
      Object.entries(rawConfigOrDefault.classifications).map(
        ([classificationId, classificationEntry]) => {
          return [
            classificationId,
            {
              description: classificationEntry,
              color: getClassificationColor(
                classificationId,
                rawConfigOrDefault.classifications,
              ),
            },
          ];
        },
      ),
    );
  return {
    classifications,
  };
}
