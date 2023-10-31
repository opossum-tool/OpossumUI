// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import {
  Attributions,
  Resources,
  ResourcesToAttributions,
} from '../../shared/shared-types';
import { getUpdatedProgressBarData } from '../state/helpers/progress-bar-data-helpers';
import { ProgressBarDataAndResourceId } from '../types/types';

let cachedResources: Resources | null = null;
let cachedExternalAttributions: Attributions | null = null;
let cachedResourcesToExternalAttributions: ResourcesToAttributions | null =
  null;
let cachedAttributionBreakpoints: Set<string> | null = null;
let cachedFilesWithChildren: Set<string> | null = null;
let cachedManualAttributions: Attributions | null = null;
let cachedResourcesToManualAttributions: ResourcesToAttributions | null = null;
let cachedResolvedExternalAttributions: Set<string> | null = null;

self.onmessage = ({
  data: {
    isCacheInitializationMessage,
    resources,
    resourceId,
    manualAttributions,
    externalAttributions,
    resourcesToManualAttributions,
    resourcesToExternalAttributions,
    resolvedExternalAttributions,
    attributionBreakpoints,
    filesWithChildren,
  },
}): void => {
  if (
    manualAttributions !== undefined &&
    resourcesToManualAttributions !== undefined &&
    resolvedExternalAttributions !== undefined
  ) {
    cachedManualAttributions = manualAttributions;
    cachedResourcesToManualAttributions = resourcesToManualAttributions;
    cachedResolvedExternalAttributions = resolvedExternalAttributions;
  }

  if (isCacheInitializationMessage) {
    cachedResources = resources;
    cachedExternalAttributions = externalAttributions;
    cachedResourcesToExternalAttributions = resourcesToExternalAttributions;
    cachedAttributionBreakpoints = attributionBreakpoints;
    cachedFilesWithChildren = filesWithChildren;
  }

  if (
    cachedManualAttributions &&
    cachedExternalAttributions &&
    cachedResourcesToManualAttributions &&
    cachedResolvedExternalAttributions &&
    cachedResources &&
    cachedResourcesToExternalAttributions &&
    cachedAttributionBreakpoints &&
    cachedFilesWithChildren
  ) {
    const progressBarData = getUpdatedProgressBarData({
      resources: cachedResources,
      resourceId,
      manualAttributions: cachedManualAttributions,
      externalAttributions: cachedExternalAttributions,
      resourcesToManualAttributions: cachedResourcesToManualAttributions,
      resourcesToExternalAttributions: cachedResourcesToExternalAttributions,
      resolvedExternalAttributions: cachedResolvedExternalAttributions,
      attributionBreakpoints: cachedAttributionBreakpoints,
      filesWithChildren: cachedFilesWithChildren,
    });

    const output: ProgressBarDataAndResourceId = {
      progressBarData,
      resourceId,
    };

    self.postMessage({
      output,
    });
  }
};
