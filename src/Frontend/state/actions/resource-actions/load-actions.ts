// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ParsedFileContent } from '../../../../shared/shared-types';
import { SimpleThunkAction, SimpleThunkDispatch } from '../types';
import {
  setAttributionBreakpoints,
  setBaseUrlsForSources,
  setExternalData,
  setFilesWithChildren,
  setFrequentLicences,
  setManualData,
  setProgressBarData,
  setProjectMetadata,
  setResources,
} from './all-views-simple-actions';
import { addResolvedExternalAttribution } from './audit-view-simple-actions';

export function loadFromFile(
  parsedFileContent: ParsedFileContent
): SimpleThunkAction {
  return (dispatch: SimpleThunkDispatch): void => {
    dispatch(setResources(parsedFileContent.resources));

    dispatch(
      setManualData(
        parsedFileContent.manualAttributions.attributions,
        parsedFileContent.manualAttributions.resourcesToAttributions
      )
    );

    dispatch(
      setExternalData(
        parsedFileContent.externalAttributions.attributions,
        parsedFileContent.externalAttributions.resourcesToAttributions
      )
    );

    dispatch(setFrequentLicences(parsedFileContent.frequentLicenses));

    dispatch(
      setAttributionBreakpoints(parsedFileContent.attributionBreakpoints)
    );

    dispatch(setFilesWithChildren(parsedFileContent.filesWithChildren));

    dispatch(setProjectMetadata(parsedFileContent.metadata));

    dispatch(setBaseUrlsForSources(parsedFileContent.baseUrlsForSources));

    parsedFileContent.resolvedExternalAttributions.forEach((attribution) =>
      dispatch(addResolvedExternalAttribution(attribution))
    );

    dispatch(
      setProgressBarData(
        parsedFileContent.resources,
        parsedFileContent.manualAttributions.attributions,
        parsedFileContent.manualAttributions.resourcesToAttributions,
        parsedFileContent.externalAttributions.resourcesToAttributions,
        parsedFileContent.resolvedExternalAttributions
      )
    );
  };
}
