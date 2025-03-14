// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import chroma from 'chroma-js';

import {
  ClassificationEntry,
  ClassificationsConfig,
  ParsedFileContent,
  ProjectConfig,
  RawClassificationsConfig,
  RawProjectConfig,
} from '../../../../shared/shared-types';
import { OpossumColors } from '../../../shared-styles';
import { AppThunkAction } from '../../types';
import {
  setAttributionBreakpoints,
  setBaseUrlsForSources,
  setConfig,
  setExternalAttributionSources,
  setExternalData,
  setFilesWithChildren,
  setFrequentLicenses,
  setIsPreferenceFeatureEnabled,
  setManualData,
  setProjectMetadata,
  setResources,
} from './all-views-simple-actions';
import { setResolvedExternalAttributions } from './audit-view-simple-actions';

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
  parsedFileContent: ParsedFileContent,
): AppThunkAction {
  return (dispatch) => {
    dispatch(setResources(parsedFileContent.resources));

    dispatch(setConfig(addColorsToClassifications(parsedFileContent.config)));

    dispatch(
      setManualData(
        parsedFileContent.manualAttributions.attributions,
        parsedFileContent.manualAttributions.resourcesToAttributions,
        parsedFileContent.manualAttributions.attributionsToResources,
      ),
    );

    dispatch(
      setExternalData(
        parsedFileContent.externalAttributions.attributions,
        parsedFileContent.externalAttributions.resourcesToAttributions,
        parsedFileContent.externalAttributions.attributionsToResources,
        parsedFileContent.resolvedExternalAttributions,
      ),
    );

    dispatch(
      setResolvedExternalAttributions(
        parsedFileContent.resolvedExternalAttributions,
      ),
    );

    dispatch(setFrequentLicenses(parsedFileContent.frequentLicenses));

    dispatch(
      setAttributionBreakpoints(parsedFileContent.attributionBreakpoints),
    );

    dispatch(setFilesWithChildren(parsedFileContent.filesWithChildren));

    dispatch(setProjectMetadata(parsedFileContent.metadata));

    dispatch(setBaseUrlsForSources(parsedFileContent.baseUrlsForSources));

    dispatch(
      setExternalAttributionSources(
        parsedFileContent.externalAttributionSources,
      ),
    );

    dispatch(
      setIsPreferenceFeatureEnabled(
        Object.values(parsedFileContent.externalAttributionSources).some(
          (source) => source.isRelevantForPreferred,
        ),
      ),
    );
  };
}
