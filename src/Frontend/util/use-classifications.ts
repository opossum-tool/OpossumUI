// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import chroma from 'chroma-js';
import { useMemo } from 'react';

import {
  type ClassificationEntry,
  type ClassificationsConfig,
  type RawClassificationsConfig,
} from '../../shared/shared-types';
import { OpossumColors } from '../shared-styles';
import { backend } from './backendClient';

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
  classifications: RawClassificationsConfig,
) {
  const configuredClassificationIds = Object.keys(classifications).toReversed();
  const numberOfClassifications = configuredClassificationIds.length;
  const index = configuredClassificationIds.indexOf(classificationId);
  return Number(classificationId) === 0
    ? OpossumColors.pastelLightGreen
    : interpolateBetweenRedAndWhite(numberOfClassifications, index);
}

function addColorsToClassifications(
  rawClassificationsConfig: RawClassificationsConfig,
): ClassificationsConfig {
  const classifications: ClassificationsConfig =
    Object.fromEntries<ClassificationEntry>(
      Object.entries(rawClassificationsConfig).map(
        ([classificationId, classificationEntry]) => {
          return [
            classificationId,
            {
              description: classificationEntry,
              color: getClassificationColor(
                classificationId,
                rawClassificationsConfig,
              ),
            },
          ];
        },
      ),
    );

  return classifications;
}

export function useClassifications(): ClassificationsConfig {
  const { data: rawClassifications } = backend.classifications.useQuery();

  return useMemo(() => {
    if (!rawClassifications) {
      return {};
    }

    return addColorsToClassifications(rawClassifications);
  }, [rawClassifications]);
}
