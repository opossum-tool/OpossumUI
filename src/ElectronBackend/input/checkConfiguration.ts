// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { EMPTY_PROJECT_CONFIG } from '../../Frontend/shared-constants';
import {
  Attributions,
  PackageInfo,
  ProjectConfig,
} from '../../shared/shared-types';
import logger from '../main/logger';

function checkAndUpdateClassifications(
  config: ProjectConfig,
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

export function checkAndUpdateConfiguration(
  rawConfig: ProjectConfig | undefined,
  externalAttributions: Attributions,
) {
  const config = rawConfig ?? EMPTY_PROJECT_CONFIG;
  config.classifications = checkAndUpdateClassifications(
    config,
    externalAttributions,
  );
  return config;
}
