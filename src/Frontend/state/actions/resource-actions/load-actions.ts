// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { ParsedFileContent } from '../../../../shared/shared-types';
import { AppThunkAction } from '../../types';
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
import { setResolvedExternalAttributions } from './audit-view-simple-actions';

export function loadFromFile(
  parsedFileContent: ParsedFileContent,
): AppThunkAction {
  return (dispatch) => {
    dispatch(setResources(parsedFileContent.resources));

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
