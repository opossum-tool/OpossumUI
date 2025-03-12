// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { EMPTY_RAW_PROJECT_CONFIG } from '../../Frontend/shared-constants';
import {
  Attributions,
  PackageInfo,
  RawClassifications,
  RawProjectConfig,
} from '../../shared/shared-types';
import logger from '../main/logger';

function addUnconfiguredClassifications(
  classifications: RawClassifications,
  externalAttributions: Attributions,
) {
  const configuredAttributionKeys = Object.keys(classifications).map(Number);
  const getUnconfiguredClassification = (packageInfo: PackageInfo) =>
    packageInfo.classification &&
    !configuredAttributionKeys.includes(packageInfo.classification)
      ? [packageInfo.classification]
      : [];

  const unconfiguredClassifications = Object.values(
    externalAttributions,
  ).flatMap(getUnconfiguredClassification);

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

export function refineConfiguration(
  rawConfig: RawProjectConfig = EMPTY_RAW_PROJECT_CONFIG,
  externalAttributions: Attributions,
): RawProjectConfig {
  rawConfig.classifications = addUnconfiguredClassifications(
    rawConfig.classifications,
    externalAttributions,
  );

  return rawConfig;
}
