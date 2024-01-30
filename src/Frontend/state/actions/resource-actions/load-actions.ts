// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ParsedFileContent } from '../../../../shared/shared-types';
import { AppThunkAction, AppThunkDispatch } from '../../types';
import {
  setAttributionBreakpoints,
  setBaseUrlsForSources,
  setExternalAttributionSources,
  setExternalData,
  setFilesWithChildren,
  setFrequentLicenses,
  setIsPreferenceFeatureEnabled,
  setManualData,
  setProjectMetadata,
  setResources,
} from './all-views-simple-actions';
import { addResolvedExternalAttribution } from './audit-view-simple-actions';

export function loadFromFile(
  parsedFileContent: ParsedFileContent,
): AppThunkAction {
  return (dispatch: AppThunkDispatch): void => {
    dispatch(setResources(parsedFileContent.resources));

    dispatch(
      setManualData(
        parsedFileContent.manualAttributions.attributions,
        parsedFileContent.manualAttributions.resourcesToAttributions,
      ),
    );

    dispatch(
      setExternalData(
        parsedFileContent.externalAttributions.attributions,
        parsedFileContent.externalAttributions.resourcesToAttributions,
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

    const fileContainsSourcesRelevantForPreferred = Object.values(
      parsedFileContent.externalAttributionSources,
    ).some((source) => source.isRelevantForPreferred);

    dispatch(
      setIsPreferenceFeatureEnabled(fileContainsSourcesRelevantForPreferred),
    );

    parsedFileContent.resolvedExternalAttributions.forEach((attribution) =>
      dispatch(addResolvedExternalAttribution(attribution)),
    );
  };
}
