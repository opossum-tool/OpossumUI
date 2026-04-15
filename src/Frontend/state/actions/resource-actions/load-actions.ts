// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import chroma from 'chroma-js';

import {
  type ClassificationEntry,
  type ClassificationsConfig,
  type ParsedFrontendFileContent,
  type ProjectConfig,
  type RawClassificationsConfig,
  type RawProjectConfig,
} from '../../../../shared/shared-types';
import { OpossumColors } from '../../../shared-styles';
import { type AppThunkAction } from '../../types';
import { setConfig, setProjectMetadata } from './all-views-simple-actions';

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
  rawProjectConfig: RawProjectConfig,
): ProjectConfig {
  const classifications: ClassificationsConfig =
    Object.fromEntries<ClassificationEntry>(
      Object.entries(rawProjectConfig.classifications).map(
        ([classificationId, classificationEntry]) => {
          return [
            classificationId,
            {
              description: classificationEntry,
              color: getClassificationColor(
                classificationId,
                rawProjectConfig.classifications,
              ),
            },
          ];
        },
      ),
    );

  return {
    ...rawProjectConfig,
    classifications,
  };
}

export function loadFromFile(
  parsedFileContent: ParsedFrontendFileContent,
): AppThunkAction {
  return (dispatch) => {
    dispatch(setConfig(addColorsToClassifications(parsedFileContent.config)));
    dispatch(setProjectMetadata(parsedFileContent.metadata));
  };
}
